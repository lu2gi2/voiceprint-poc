from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Student(Base):
    """Real account now — password_hash replaces the frontend's old
    DEMO_PASSWORD-in-the-bundle scheme (see auth.py). roll_number is the
    login identifier AuthPage.jsx already asks for; email stays because
    create_session's upsert-by-email flow depends on it."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    roll_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    sessions: Mapped[list["InterviewSession"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )
    dimension_scores: Mapped[list["StudentDimensionScore"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", order_by="StudentDimensionScore.created_at"
    )


class Admin(Base):
    """Staff account for the placement-cell portal. One row for now (see
    AuthPage.jsx's ADMIN_COPY - "Admin accounts are issued, not
    self-served") - the model exists so login is real, not the 1240-student
    roster/department-stats rework, which is separate, larger work."""

    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class StudentDimensionScore(Base):
    """One row per dimension judged in one session's report - the real
    longitudinal history behind StatsPage's user.history, which today is
    entirely fixture data (src/data/students.js). Written once, from
    update_student_score() right after a session's report goes ready
    (resume/pipeline.py); Fluency/Conciseness never land here since those
    are deterministic and already live on Answer, not part of the LLM
    report this hangs off of."""

    __tablename__ = "student_dimension_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"), index=True)
    dimension: Mapped[str] = mapped_column(String(80), index=True)
    value: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    student: Mapped[Student] = relationship(back_populates="dimension_scores")


class InterviewSession(Base):
    """One run of one assessment track."""

    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    assessment_id: Mapped[str] = mapped_column(String(64))       # 'behavioral', 'hr', …
    assessment_title: Mapped[str] = mapped_column(String(160))
    status: Mapped[str] = mapped_column(String(24), default="open")  # open | complete
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # The final holistic report (Relevance, Technical Knowledge, Clarity) -
    # one DeepSeek call over the whole transcript, generated once after
    # completion. None until completion is requested; the deterministic
    # Fluency/Conciseness scores (score.py) never touch this and are ready
    # immediately per-answer regardless of report status.
    report_status: Mapped[str | None] = mapped_column(String(24), default=None)  # processing | ready | failed
    report_dimensions: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=None)

    student: Mapped[Student] = relationship(back_populates="sessions")
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="Answer.id"
    )
    questions: Mapped[list["SessionQuestion"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="SessionQuestion.question_index"
    )
    resume: Mapped["Resume | None"] = relationship(
        back_populates="session", cascade="all, delete-orphan", uselist=False
    )


class SessionQuestion(Base):
    """One question in a session's script, however it was produced.

    Decouples "what will be asked" from "what was answered" (Answer). A
    scripted track (behavioral, HR) and a resume-driven technical track both
    write rows here the same way, so the recording/transcription/scoring
    pipeline never has to know which track it is running.
    """

    __tablename__ = "session_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"), index=True)

    question_index: Mapped[int] = mapped_column(Integer)
    prompt: Mapped[str] = mapped_column(Text)
    target_seconds: Mapped[int] = mapped_column(Integer)

    # Set once TTS has been pre-rendered for this question; null until then.
    # Nothing reads this yet — it is the hook the Kokoro pre-render step and
    # the live loop use once they land.
    audio_key: Mapped[str | None] = mapped_column(String(255), default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped[InterviewSession] = relationship(back_populates="questions")


class Resume(Base):
    """One uploaded resume, and what the local checks made of it.

    The original file is never persisted — it is parsed on upload and
    discarded (see the API layer); only the extracted text sticks around,
    since that is what the question-generation call needs. status is
    'rejected' the moment either local check (extraction, heuristic) or the
    DeepSeek content check fails, 'processing' once local checks pass and
    question generation is running, 'ready' once question 1 exists (not all
    questions — they are generated one at a time, chained off each answer),
    or 'failed' if question generation itself errored.
    """

    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"), unique=True, index=True)

    original_filename: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(24), default="rejected")  # rejected | processing | ready | failed
    reject_reason: Mapped[str | None] = mapped_column(Text, default=None)

    extracted_text: Mapped[str | None] = mapped_column(Text, default=None)
    heuristic_score: Mapped[int | None] = mapped_column(Integer, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    session: Mapped[InterviewSession] = relationship(back_populates="resume")


class Answer(Base):
    """One recorded answer, plus everything derived from it.

    Transcript, measurements and scores live here as JSON rather than in wide
    columns: the measurement set is still moving, and v1 should not force a
    migration every time the pipeline learns to count something new. They move
    into real columns once the shape settles.
    """

    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"), index=True)

    question_index: Mapped[int] = mapped_column(Integer)
    prompt: Mapped[str] = mapped_column(Text)
    target_seconds: Mapped[int] = mapped_column(Integer)

    audio_key: Mapped[str] = mapped_column(String(255))
    audio_mime: Mapped[str] = mapped_column(String(64), default="audio/webm")
    duration_seconds: Mapped[float | None] = mapped_column(Float, default=None)

    # queued -> processing -> ready | failed
    status: Mapped[str] = mapped_column(String(24), default="queued", index=True)
    error: Mapped[str | None] = mapped_column(Text, default=None)

    transcript: Mapped[str | None] = mapped_column(Text, default=None)
    words: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=None)
    measurements: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)
    scores: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=None)

    # Resume-driven track only: a correction/note the next-question call made
    # about this specific answer. Never shown during the interview - only in
    # the final report, per the plan on issue #4.
    llm_note: Mapped[str | None] = mapped_column(Text, default=None)

    # HR/behavioral track only: client-side camera telemetry for this answer
    # (face_in_frame_ratio, gaze_forward_ratio, head_pose_stability). Raw
    # observations only, never a score — see useEngagementSignals.js. No
    # video/frames are ever received by the backend, only these ratios.
    engagement_signals: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    session: Mapped[InterviewSession] = relationship(back_populates="answers")
