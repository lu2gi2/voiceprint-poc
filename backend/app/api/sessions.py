from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession

from ..db import get_db
from ..models import Answer, AssessmentCatalog, InterviewSession, Student
from ..pipeline import process_answer
from ..schemas import AnswerOut, SessionCreate, SessionOut, SessionSummary, StudentIn
from ..storage import audio_store

router = APIRouter(prefix="/api", tags=["sessions"])

# What the browser can hand us, and the extension to store it under. Chrome
# records webm/opus, Safari mp4/aac.
SUFFIX_FOR = {
    "audio/webm": ".webm",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # ~25 minutes of opus; a single answer is far less


def _suffix(mime: str) -> str:
    return SUFFIX_FOR.get((mime or "").split(";")[0].strip(), ".webm")


@router.get("/assessments")
def list_assessments(db: DbSession = Depends(get_db)) -> list[dict]:
    """Return the persisted assessment catalogue and question definitions."""
    rows = db.query(AssessmentCatalog).order_by(AssessmentCatalog.id).all()
    return [
        {
            "id": row.id,
            "title": row.title,
            "kind": row.kind,
            "desc": row.description,
            "icon": row.icon,
            "status": row.status,
            "soonWhy": row.soon_reason,
            "measures": row.measures,
            "questions": row.questions,
        }
        for row in rows
    ]


@router.post("/students", status_code=201)
def upsert_student(payload: StudentIn, db: DbSession = Depends(get_db)) -> dict:
    """Create or update the demo student's persisted profile."""
    email = payload.email.strip()
    name = payload.name.strip()

    student = db.query(Student).filter(Student.email == email).one_or_none()
    if student is None:
        student = Student(email=email, name=name)
        db.add(student)
    else:
        student.name = name
    db.commit()
    db.refresh(student)
    return {"id": student.id, "email": student.email, "name": student.name, "created_at": student.created_at}


@router.post("/sessions", response_model=SessionOut, status_code=201)
def create_session(payload: SessionCreate, db: DbSession = Depends(get_db)) -> InterviewSession:
    """Open a session. The student is upserted on email — v1 has no real auth,
    so this is identity by assertion, and deliberately the only place that
    assumption lives."""
    student = db.query(Student).filter(Student.email == payload.student.email).one_or_none()
    if student is None:
        student = Student(email=payload.student.email, name=payload.student.name)
        db.add(student)
        db.flush()
    elif student.name != payload.student.name:
        student.name = payload.student.name

    session = InterviewSession(
        student_id=student.id,
        assessment_id=payload.assessment_id,
        assessment_title=payload.assessment_title,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/{session_id}/answers", status_code=202)
async def upload_answer(
    session_id: int,
    background: BackgroundTasks,
    question_index: int = Form(...),
    prompt: str = Form(...),
    target_seconds: int = Form(...),
    audio: UploadFile = File(...),
    db: DbSession = Depends(get_db),
) -> dict:
    """Accept one recorded answer and queue it for analysis.

    202, not 200: transcription takes seconds to tens of seconds, so the
    request returns as soon as the bytes are safe and the client polls the
    session for the result. BackgroundTasks is the right size for a POC —
    swap in a real queue when a lost job on restart starts to matter.
    """
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(404, "session not found")

    data = await audio.read()
    if not data:
        raise HTTPException(400, "empty audio upload")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "audio too large")

    import io

    key = audio_store.put(io.BytesIO(data), suffix=_suffix(audio.content_type))

    answer = Answer(
        session_id=session.id,
        question_index=question_index,
        prompt=prompt,
        target_seconds=target_seconds,
        audio_key=key,
        audio_mime=audio.content_type or "audio/webm",
    )
    db.add(answer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        audio_store.delete(key)
        raise HTTPException(409, "an answer for this question already exists") from None
    db.refresh(answer)

    background.add_task(process_answer, answer.id)
    return {"answer_id": answer.id, "status": answer.status, "bytes": len(data)}


@router.get("/answers/{answer_id}", response_model=AnswerOut)
def get_answer(answer_id: int, db: DbSession = Depends(get_db)) -> Answer:
    """One answer on its own, so the session screen can poll for the transcript
    of the question just answered without refetching the whole session."""
    answer = db.get(Answer, answer_id)
    if answer is None:
        raise HTTPException(404, "answer not found")
    return answer


@router.get("/students/{email}/dashboard")
def get_student_dashboard(email: str, db: DbSession = Depends(get_db)) -> dict:
    """Return dashboard data derived from persisted student/session records."""
    student = db.query(Student).filter(Student.email == email).one_or_none()
    if student is None:
        raise HTTPException(404, "student not found")

    sessions = sorted(student.sessions, key=lambda item: item.created_at, reverse=True)
    dimension_values: dict[str, list[int]] = defaultdict(list)
    score_records = []
    growth = []
    recent = []
    for session in sessions:
        ready_answers = [answer for answer in session.answers if answer.status == "ready"]
        for answer in ready_answers:
            for score in answer.scores or []:
                dimension_values[score["dimension"]].append(score["value"])
                score_records.append({
                    **score,
                    "session_id": session.id,
                    "answer_id": answer.id,
                    "created_at": answer.created_at,
                })
        session_values = [score["value"] for answer in ready_answers for score in answer.scores or []]
        if session_values:
            growth.append({
                "label": str(len(growth) + 1),
                "score": round(sum(session_values) / len(session_values)),
                "created_at": session.created_at,
            })
        recent.append({
            "id": session.id,
            "title": session.assessment_title,
            "assessment_id": session.assessment_id,
            "created_at": session.created_at,
            "answers": len(session.answers),
            "duration_seconds": round(sum(a.duration_seconds or 0 for a in session.answers), 1),
            "status": session.status,
        })

    dimensions = [
        {"name": name, "score": round(sum(values) / len(values)), "count": len(values)}
        for name, values in sorted(dimension_values.items())
    ]
    dimensions.sort(key=lambda item: item["score"])
    weakest = dimensions[0] if dimensions else None
    return {
        "student": {
            "id": student.id,
            "email": student.email,
            "name": student.name,
            "created_at": student.created_at,
        },
        "practice_count": len(sessions),
        "recent": recent[:10],
        "dimensions": dimensions,
        "scores": score_records,
        "growth": growth[-6:],
        "readiness": round(sum(item["score"] for item in dimensions) / len(dimensions)) if dimensions else None,
        "focus": weakest["name"] if weakest else None,
    }


@router.post("/sessions/{session_id}/complete", response_model=SessionOut)
def complete_session(session_id: int, db: DbSession = Depends(get_db)) -> InterviewSession:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(404, "session not found")
    session.status = "complete"
    session.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(session_id: int, db: DbSession = Depends(get_db)) -> InterviewSession:
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(404, "session not found")
    return session


@router.get("/sessions/{session_id}/summary", response_model=SessionSummary)
def get_summary(session_id: int, db: DbSession = Depends(get_db)) -> SessionSummary:
    """Per-dimension rollup across the session — what the results screen shows.

    Averaged over answers that finished, so a session is readable while the
    tail is still transcribing rather than blank until everything lands.
    """
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(404, "session not found")

    buckets: dict[str, list[dict]] = defaultdict(list)
    ready = failed = 0
    total_seconds = 0.0

    for a in session.answers:
        if a.status == "ready":
            ready += 1
            total_seconds += a.duration_seconds or 0.0
            for s in a.scores or []:
                buckets[s["dimension"]].append(s)
        elif a.status == "failed":
            failed += 1

    dimensions = []
    for name, scores in buckets.items():
        values = [s["value"] for s in scores]
        # Surface the weakest answer's advice, not the first: that is the one
        # worth acting on, and it keeps the summary consistent with the
        # coaching model the rest of the product uses.
        worst = min(scores, key=lambda s: s["value"])
        dimensions.append({
            "dimension": name,
            "value": round(sum(values) / len(values)),
            "best": max(values),
            "worst": min(values),
            "recommendation": worst["recommendation"],
            "confidence": "low" if any(s["confidence"] == "low" for s in scores) else "high",
            "evidence": worst["evidence"],
        })
    dimensions.sort(key=lambda d: d["value"])

    return SessionSummary(
        session_id=session.id,
        answers_total=len(session.answers),
        answers_ready=ready,
        answers_failed=failed,
        processing=any(a.status in ("queued", "processing") for a in session.answers),
        total_seconds=round(total_seconds, 1),
        dimensions=dimensions,
    )
