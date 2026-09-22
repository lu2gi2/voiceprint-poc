from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Student(Base):
    """Minimal for v1 — the front end's auth does not authenticate anything
    yet, so this exists to hang sessions off and to make the longitudinal
    profile (PRD §9) possible later without a migration."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), index=True, default=None)
    cohort_id: Mapped[int | None] = mapped_column(ForeignKey("cohorts.id"), index=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    department: Mapped["Department | None"] = relationship(back_populates="students")
    cohort: Mapped["Cohort | None"] = relationship(back_populates="students")
    sessions: Mapped[list["InterviewSession"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)

    students: Mapped[list[Student]] = relationship(back_populates="department")


class Cohort(Base):
    __tablename__ = "cohorts"
    __table_args__ = (UniqueConstraint("name", "department_id", name="uq_cohorts_name_department"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), index=True, default=None)

    students: Mapped[list[Student]] = relationship(back_populates="cohort")


class AssessmentCatalog(Base):
    __tablename__ = "assessment_catalog"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(48))
    status: Mapped[str] = mapped_column(String(24), index=True)
    soon_reason: Mapped[str | None] = mapped_column(Text, default=None)
    measures: Mapped[list[str]] = mapped_column(JSON)
    questions: Mapped[list[dict[str, Any]]] = mapped_column(JSON)


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

    student: Mapped[Student] = relationship(back_populates="sessions")
    answers: Mapped[list["Answer"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="Answer.id"
    )


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

    audio_key: Mapped[str | None] = mapped_column(String(255), default=None)
    audio_mime: Mapped[str] = mapped_column(String(64), default="audio/webm")
    duration_seconds: Mapped[float | None] = mapped_column(Float, default=None)

    # queued -> processing -> ready | failed
    status: Mapped[str] = mapped_column(String(24), default="queued", index=True)
    error: Mapped[str | None] = mapped_column(Text, default=None)

    transcript: Mapped[str | None] = mapped_column(Text, default=None)
    words: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=None)
    measurements: Mapped[dict[str, Any] | None] = mapped_column(JSON, default=None)
    scores: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, default=None)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    processing_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    audio_deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    session: Mapped[InterviewSession] = relationship(back_populates="answers")
    answer_scores: Mapped[list["AnswerScore"]] = relationship(
        back_populates="answer", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("session_id", "question_index", name="uq_answers_session_question"),
    )


class AnswerScore(Base):
    __tablename__ = "answer_scores"
    __table_args__ = (
        UniqueConstraint("answer_id", "dimension", name="uq_answer_scores_answer_dimension"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    answer_id: Mapped[int] = mapped_column(ForeignKey("answers.id", ondelete="CASCADE"), index=True)
    dimension: Mapped[str] = mapped_column(String(80), index=True)
    value: Mapped[int] = mapped_column(Integer, index=True)
    recommendation: Mapped[str] = mapped_column(Text)
    confidence: Mapped[str] = mapped_column(String(16))
    evidence: Mapped[list[dict[str, Any]]] = mapped_column(JSON)

    answer: Mapped[Answer] = relationship(back_populates="answer_scores")
