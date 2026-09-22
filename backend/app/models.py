from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text
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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    sessions: Mapped[list["InterviewSession"]] = relationship(
        back_populates="student", cascade="all, delete-orphan"
    )


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

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    session: Mapped[InterviewSession] = relationship(back_populates="answers")
