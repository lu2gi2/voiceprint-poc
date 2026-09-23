import json
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as DbSession

from ..db import get_db
from ..deps import CurrentAccount, get_current_account, require_answer_owner, require_session_owner
from ..llm.tracks import TRACKS
from ..models import Answer, InterviewSession, Resume, SessionQuestion, Student, StudentResume
from ..pipeline import process_answer
from ..resume import ExtractError, check_resume_shape, extract_text
from ..resume.pipeline import generate_session_report, process_resume
from ..schemas import AnswerOut, QuestionOut, ResumeOut, SessionCreate, SessionOut, SessionSummary
from ..storage import audio_store
from ..student_resume import process_student_resume

router = APIRouter(prefix="/api", tags=["sessions"])

RESUME_SUFFIXES = {".pdf", ".docx"}
MAX_RESUME_BYTES = 10 * 1024 * 1024

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


@router.post("/sessions", response_model=SessionOut, status_code=201)
async def create_session(
    request: Request,
    db: DbSession = Depends(get_db),
    account: CurrentAccount = Depends(get_current_account),
) -> InterviewSession:
    """Open a session for an already-registered, already-authenticated
    student (see api/auth.py). Used to upsert a Student from whatever name/
    email the request body claimed - identity by assertion, no password
    involved - now that real accounts exist, session creation requires the
    caller's own token and checks it matches the student_id in the body
    (see deps.py) rather than trusting either alone.

    Body parsed manually rather than via `payload: SessionCreate` directly —
    FastAPI's automatic JSON parsing keys off `Content-Type: application/
    json`, but the client deliberately omits that header so the browser
    sends this as a CORS "simple request" (no preflight OPTIONS). Catalyst
    AppSail's gateway swallows preflight OPTIONS requests before they reach
    the container, so avoiding preflight entirely is the workaround. The
    session token travels the same way, as a `?token=...` query param
    rather than an Authorization header, which would force a preflight too.
    """
    payload = SessionCreate.model_validate_json(await request.body())
    if account.role != "student" or account.id != payload.student_id:
        raise HTTPException(403, "not authorized to create a session for this student")
    if db.get(Student, payload.student_id) is None:
        raise HTTPException(404, "student not found")

    session = InterviewSession(
        student_id=payload.student_id,
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
    engagement_signals: str | None = Form(None),
    db: DbSession = Depends(get_db),
    session: InterviewSession = Depends(require_session_owner),
) -> dict:
    """Accept one recorded answer and queue it for analysis.

    202, not 200: transcription takes seconds to tens of seconds, so the
    request returns as soon as the bytes are safe and the client polls the
    session for the result. BackgroundTasks is the right size for a POC —
    swap in a real queue when a lost job on restart starts to matter.

    engagement_signals is HR/behavioral-track-only, client-computed camera
    telemetry (face_in_frame_ratio, gaze_forward_ratio, head_pose_stability;
    see useEngagementSignals.js) sent as a JSON string form field — no video
    ever reaches the backend. Absent for every other track.
    """
    data = await audio.read()
    if not data:
        raise HTTPException(400, "empty audio upload")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "audio too large")

    parsed_engagement_signals = None
    if engagement_signals:
        try:
            parsed_engagement_signals = json.loads(engagement_signals)
        except ValueError:
            raise HTTPException(400, "engagement_signals must be valid JSON")

    import io

    key = audio_store.put(io.BytesIO(data), suffix=_suffix(audio.content_type))

    answer = Answer(
        session_id=session.id,
        question_index=question_index,
        prompt=prompt,
        target_seconds=target_seconds,
        audio_key=key,
        audio_mime=audio.content_type or "audio/webm",
        engagement_signals=parsed_engagement_signals,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    background.add_task(process_answer, answer.id)
    return {"answer_id": answer.id, "status": answer.status, "bytes": len(data)}


@router.post("/sessions/{session_id}/resume", response_model=ResumeOut, status_code=202)
async def upload_resume(
    session_id: int,
    background: BackgroundTasks,
    resume: UploadFile = File(...),
    db: DbSession = Depends(get_db),
    session: InterviewSession = Depends(require_session_owner),
) -> Resume:
    """Upload a resume for a resume-driven track — and, in the same call,
    save it as this student's profile resume (StudentResume) so later
    sessions can reuse it via POST .../resume/from-profile instead of
    asking for another upload. A re-upload here replaces the profile
    resume too, same as replacing it from ProfileDrawer.jsx would.

    Local checks (extract, heuristic) run synchronously since they are
    fast; a pass queues process_resume as a background task — the DeepSeek
    call and per-question TTS pre-render take real seconds, the same reason
    /answers is async. 'processing' means "passed local checks, generating
    questions"; poll GET .../resume for 'ready' | 'rejected' | 'failed'.

    The original file is never written to persistent storage — it is parsed
    from a temp file and discarded; only the extracted text is kept, since
    that (redacted) is what the question-generation call needs.
    """
    suffix = Path(resume.filename or "").suffix.lower()
    if suffix not in RESUME_SUFFIXES:
        raise HTTPException(400, f"unsupported file type: {suffix or '(none)'} — upload a PDF or docx")

    data = await resume.read()
    if not data:
        raise HTTPException(400, "empty upload")
    if len(data) > MAX_RESUME_BYTES:
        raise HTTPException(413, "resume too large")

    tmp_path = Path(tempfile.mkstemp(suffix=suffix)[1])
    try:
        tmp_path.write_bytes(data)
        try:
            text = extract_text(tmp_path)
        except ExtractError as exc:
            _save_resume(db, session, resume.filename or "resume", "rejected", str(exc))
            raise HTTPException(422, str(exc)) from None
    finally:
        tmp_path.unlink(missing_ok=True)

    if not text:
        reason = "could not find readable text — please upload a text-based PDF or docx, not a scanned image"
        _save_resume(db, session, resume.filename or "resume", "rejected", reason)
        raise HTTPException(422, reason)

    result = check_resume_shape(text)
    if not result.passed:
        _save_resume(
            db, session, resume.filename or "resume", "rejected", result.reason,
            extracted_text=text, heuristic_score=result.score,
        )
        raise HTTPException(422, result.reason)

    record = _save_resume(
        db, session, resume.filename or "resume", "processing", None,
        extracted_text=text, heuristic_score=result.score,
    )
    background.add_task(process_resume, record.id)

    _save_profile_resume(db, session.student_id, resume.filename or "resume", text)
    background.add_task(process_student_resume, _get_profile_resume_id(db, session.student_id))

    return record


def _save_profile_resume(db: DbSession, student_id: int, filename: str, text: str) -> None:
    profile = db.query(StudentResume).filter(StudentResume.student_id == student_id).one_or_none()
    if profile is None:
        profile = StudentResume(student_id=student_id, original_filename=filename)
        db.add(profile)
    profile.original_filename = filename
    profile.status = "processing"
    profile.reject_reason = None
    profile.extracted_text = text
    profile.notes = None
    db.commit()


def _get_profile_resume_id(db: DbSession, student_id: int) -> int:
    return db.query(StudentResume).filter(StudentResume.student_id == student_id).one().id


@router.post("/sessions/{session_id}/resume/from-profile", response_model=ResumeOut, status_code=202)
def use_profile_resume(
    session_id: int,
    background: BackgroundTasks,
    db: DbSession = Depends(get_db),
    session: InterviewSession = Depends(require_session_owner),
) -> Resume:
    """Skip the upload entirely and reuse this student's existing profile
    resume (StudentResume) for this session — the "you already have one on
    file" path. 404 if there is no ready profile resume; the frontend falls
    back to the normal upload flow in that case."""
    profile = db.query(StudentResume).filter(StudentResume.student_id == session.student_id).one_or_none()
    if profile is None or profile.status != "ready":
        raise HTTPException(404, "no profile resume on file")

    record = _save_resume(
        db, session, profile.original_filename, "processing", None,
        extracted_text=profile.extracted_text,
    )
    background.add_task(process_resume, record.id)
    return record


@router.get("/sessions/{session_id}/resume", response_model=ResumeOut)
def get_resume(
    session_id: int, db: DbSession = Depends(get_db), session: InterviewSession = Depends(require_session_owner)
) -> Resume:
    resume = db.query(Resume).filter(Resume.session_id == session_id).one_or_none()
    if resume is None:
        raise HTTPException(404, "no resume uploaded for this session")
    return resume


@router.get("/sessions/{session_id}/questions", response_model=list[QuestionOut])
def get_questions(
    session_id: int, db: DbSession = Depends(get_db), session: InterviewSession = Depends(require_session_owner)
) -> list[SessionQuestion]:
    return session.questions


@router.get("/sessions/{session_id}/questions/{index}/audio")
def get_question_audio(
    session_id: int,
    index: int,
    db: DbSession = Depends(get_db),
    session: InterviewSession = Depends(require_session_owner),
) -> FileResponse:
    q = (
        db.query(SessionQuestion)
        .filter(SessionQuestion.session_id == session_id, SessionQuestion.question_index == index)
        .one_or_none()
    )
    if q is None or not q.audio_key:
        raise HTTPException(404, "audio not found")
    return FileResponse(audio_store.path(q.audio_key), media_type="audio/wav")


def _save_resume(
    db: DbSession,
    session: InterviewSession,
    filename: str,
    status: str,
    reject_reason: str | None,
    extracted_text: str | None = None,
    heuristic_score: int | None = None,
) -> Resume:
    """Upsert the one resume a session can have — a re-upload replaces it."""
    existing = db.query(Resume).filter(Resume.session_id == session.id).one_or_none()
    if existing is None:
        existing = Resume(session_id=session.id, original_filename=filename)
        db.add(existing)
    existing.original_filename = filename
    existing.status = status
    existing.reject_reason = reject_reason
    existing.extracted_text = extracted_text
    existing.heuristic_score = heuristic_score
    db.commit()
    db.refresh(existing)
    return existing


@router.get("/answers/{answer_id}", response_model=AnswerOut)
def get_answer(answer_id: int, answer: Answer = Depends(require_answer_owner)) -> Answer:
    """One answer on its own, so the session screen can poll for the transcript
    of the question just answered without refetching the whole session."""
    return answer


@router.post("/sessions/{session_id}/complete", response_model=SessionOut)
def complete_session(
    session_id: int,
    background: BackgroundTasks,
    db: DbSession = Depends(get_db),
    session: InterviewSession = Depends(require_session_owner),
) -> InterviewSession:
    session.status = "complete"
    session.completed_at = datetime.now(timezone.utc)

    # Only tracks with a report defined get one at all (generate_session_report
    # is a no-op otherwise - e.g. Impromptu Speaking, by design). Resume-driven
    # tracks additionally need the resume to have cleared setup; fixed-script
    # tracks (no Resume row) don't. Setting report_status here, synchronously,
    # before the response returns, closes a real race: without this,
    # report_status stays None until the background task actually starts, and
    # a poll landing in that gap sees "not processing" with the report not yet
    # generated - reproduced and confirmed against a real session (#15).
    track_config = TRACKS.get(session.assessment_id)
    if track_config is not None:
        if track_config.get("needs_resume", True):
            resume = db.query(Resume).filter(Resume.session_id == session_id).one_or_none()
            if resume is not None and resume.status == "ready":
                session.report_status = "processing"
        else:
            session.report_status = "processing"

    db.commit()
    db.refresh(session)
    background.add_task(generate_session_report, session_id)
    return session


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(session_id: int, session: InterviewSession = Depends(require_session_owner)) -> InterviewSession:
    return session


@router.get("/sessions/{session_id}/summary", response_model=SessionSummary)
def get_summary(
    session_id: int, session: InterviewSession = Depends(require_session_owner)
) -> SessionSummary:
    """Per-dimension rollup across the session — what the results screen shows.

    Averaged over answers that finished, so a session is readable while the
    tail is still transcribing rather than blank until everything lands.
    """
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
    # The LLM-judged dimensions (Relevance, Technical Knowledge, Clarity) -
    # generated once, after completion, over the whole transcript. Merged in
    # alongside the deterministic per-answer ones above; report_status stays
    # None for scripted tracks and sessions not yet completed, so this is a
    # no-op for them. best/worst are the same as value here - this is one
    # session-level judgment, not an aggregate across several answers like
    # the rule-based dimensions above, but the results screen expects both.
    for d in session.report_dimensions or []:
        dimensions.append({**d, "best": d["value"], "worst": d["value"]})
    dimensions.sort(key=lambda d: d["value"])

    return SessionSummary(
        session_id=session.id,
        answers_total=len(session.answers),
        answers_ready=ready,
        answers_failed=failed,
        processing=(
            any(a.status in ("queued", "processing") for a in session.answers)
            or session.report_status == "processing"
        ),
        total_seconds=round(total_seconds, 1),
        dimensions=dimensions,
    )
