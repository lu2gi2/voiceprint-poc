from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class StudentRegister(BaseModel):
    roll_number: str = Field(min_length=1, max_length=32)
    email: str = Field(min_length=1, max_length=320)
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=200)


class LoginRequest(BaseModel):
    role: Literal["student", "admin"]
    username: str = Field(min_length=1, max_length=320)  # roll_number for a student, username for an admin
    password: str = Field(min_length=1, max_length=200)


class AccountOut(BaseModel):
    """One shape for both roles - unused identity fields are null rather
    than modeling two response types the frontend would have to branch on."""

    id: int
    role: Literal["student", "admin"]
    name: str
    roll_number: str | None = None
    email: str | None = None
    username: str | None = None


class DimensionScoreOut(BaseModel):
    dimension: str
    value: int
    session_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentHistoryOut(BaseModel):
    student_id: int
    scores: list[DimensionScoreOut]


class SessionCreate(BaseModel):
    student_id: int
    assessment_id: str = Field(min_length=1, max_length=64)
    assessment_title: str = Field(min_length=1, max_length=160)


class AnswerOut(BaseModel):
    id: int
    question_index: int
    prompt: str
    target_seconds: int
    status: str
    error: str | None = None
    duration_seconds: float | None = None
    transcript: str | None = None
    measurements: dict[str, Any] | None = None
    scores: list[dict[str, Any]] | None = None
    llm_note: str | None = None
    engagement_signals: dict[str, Any] | None = None

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: int
    assessment_id: str
    assessment_title: str
    status: str
    created_at: datetime
    answers: list[AnswerOut] = []

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    question_index: int
    prompt: str
    target_seconds: int
    audio_key: str | None = None

    model_config = {"from_attributes": True}


class ResumeOut(BaseModel):
    status: str
    reject_reason: str | None = None
    heuristic_score: int | None = None

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    """Session-level rollup: the per-dimension average across answers that
    finished, plus what is still being worked on."""

    session_id: int
    answers_total: int
    answers_ready: int
    answers_failed: int
    processing: bool
    total_seconds: float
    dimensions: list[dict[str, Any]] = []
