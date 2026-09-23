import tempfile
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session as DbSession

from ..db import get_db
from ..deps import require_self_or_admin
from ..models import InterviewSession, Student, StudentDimensionScore, StudentResume
from ..resume import ExtractError, check_resume_shape, extract_text
from ..schemas import SessionListItemOut, StudentHistoryOut, StudentProfileOut, StudentResumeOut
from ..student_resume import process_student_resume

router = APIRouter(prefix="/api/students", tags=["students"])

RESUME_SUFFIXES = {".pdf", ".docx"}
MAX_RESUME_BYTES = 10 * 1024 * 1024


@router.get("/{student_id}", response_model=StudentProfileOut)
def get_student_profile(
    student_id: int, db: DbSession = Depends(get_db), _=Depends(require_self_or_admin)
) -> StudentProfileOut:
    """The core profile fields StudentIntro.jsx/ProfileDrawer.jsx read -
    previously always src/data/fixtures.js's single hardcoded `student`
    object regardless of who was actually signed in."""
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(404, "student not found")

    completed = (
        db.query(InterviewSession)
        .filter(InterviewSession.student_id == student_id, InterviewSession.status == "complete")
        .count()
    )
    return StudentProfileOut(
        id=student.id,
        name=student.name,
        roll_number=student.roll_number,
        email=student.email,
        department=student.department,
        year=student.year,
        sessions_completed=completed,
    )


@router.get("/{student_id}/sessions", response_model=list[SessionListItemOut])
def get_student_sessions(
    student_id: int, limit: int = 10, db: DbSession = Depends(get_db), _=Depends(require_self_or_admin)
) -> list[SessionListItemOut]:
    """Real recent-activity feed behind JourneyPage's RECENT fixture list.
    Newest first; total_seconds/answers_count are computed here rather than
    stored, since they are cheap and would otherwise need to stay in sync
    with Answer rows on every write."""
    if db.get(Student, student_id) is None:
        raise HTTPException(404, "student not found")

    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.student_id == student_id)
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        SessionListItemOut(
            id=s.id,
            assessment_id=s.assessment_id,
            assessment_title=s.assessment_title,
            status=s.status,
            created_at=s.created_at,
            completed_at=s.completed_at,
            total_seconds=sum(a.duration_seconds or 0.0 for a in s.answers),
            answers_count=len(s.answers),
        )
        for s in sessions
    ]


@router.get("/{student_id}/history", response_model=StudentHistoryOut)
def get_student_history(
    student_id: int, db: DbSession = Depends(get_db), _=Depends(require_self_or_admin)
) -> StudentHistoryOut:
    """Real per-dimension history behind StatsPage's user.history, which is
    fixture data today (src/data/students.js). One row per dimension per
    completed session's report - see update_student_score() in
    resume/pipeline.py for where these get written."""
    if db.get(Student, student_id) is None:
        raise HTTPException(404, "student not found")

    scores = (
        db.query(StudentDimensionScore)
        .filter(StudentDimensionScore.student_id == student_id)
        .order_by(StudentDimensionScore.created_at)
        .all()
    )
    return StudentHistoryOut(student_id=student_id, scores=scores)


@router.post("/{student_id}/resume", response_model=StudentResumeOut, status_code=202)
async def upload_student_resume(
    student_id: int,
    background: BackgroundTasks,
    resume: UploadFile = File(...),
    db: DbSession = Depends(get_db),
    _=Depends(require_self_or_admin),
) -> StudentResume:
    """One resume per student profile, replacing any previous upload -
    backs ProfileDrawer.jsx's resume manager (previously localStorage-only)
    and, once analysis completes, StickyWall.jsx's note wall (previously
    hardcoded fixture NOTES with no connection to any uploaded resume at
    all). Same local-checks-then-background-DeepSeek-call shape as the
    per-session resume upload in api/sessions.py."""
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(404, "student not found")

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
            raise HTTPException(422, str(exc)) from None
    finally:
        tmp_path.unlink(missing_ok=True)

    if not text:
        raise HTTPException(422, "could not find readable text — please upload a text-based PDF or docx, not a scanned image")

    result = check_resume_shape(text)
    if not result.passed:
        raise HTTPException(422, result.reason)

    existing = db.query(StudentResume).filter(StudentResume.student_id == student_id).one_or_none()
    if existing is None:
        existing = StudentResume(student_id=student_id, original_filename=resume.filename or "resume")
        db.add(existing)
    existing.original_filename = resume.filename or "resume"
    existing.status = "processing"
    existing.reject_reason = None
    existing.extracted_text = text
    existing.notes = None
    db.commit()
    db.refresh(existing)

    background.add_task(process_student_resume, existing.id)
    return existing


@router.get("/{student_id}/resume", response_model=StudentResumeOut)
def get_student_resume(
    student_id: int, db: DbSession = Depends(get_db), _=Depends(require_self_or_admin)
) -> StudentResume:
    resume = db.query(StudentResume).filter(StudentResume.student_id == student_id).one_or_none()
    if resume is None:
        raise HTTPException(404, "no resume uploaded for this student")
    return resume


@router.delete("/{student_id}/resume")
def delete_student_resume(
    student_id: int, db: DbSession = Depends(get_db), _=Depends(require_self_or_admin)
) -> dict:
    # 200 + {}, not 204 - the frontend's req() helper always parses a JSON
    # body, and a 204 has none.
    resume = db.query(StudentResume).filter(StudentResume.student_id == student_id).one_or_none()
    if resume is None:
        raise HTTPException(404, "no resume uploaded for this student")
    db.delete(resume)
    db.commit()
    return {}
