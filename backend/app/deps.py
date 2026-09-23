"""Request-scoped authorization: who is calling, and are they allowed to
touch the resource in the URL.

Every route that reads or writes one student's data (or the admin portal)
depends on one of these instead of trusting an id/role taken straight from
the path or body — see the IDOR gap fixed alongside this module.

Tokens travel as `?token=...` (or a `token` field in the manually-parsed
POST bodies — see api/auth.py, api/sessions.py) rather than an
`Authorization` header: a custom header forces a CORS preflight regardless
of Content-Type, and Catalyst AppSail's gateway drops preflight OPTIONS
requests before they reach the container. Query param dodges that the same
way the existing body-parsing workaround does.
"""

from dataclasses import dataclass

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session as DbSession

from .auth import TokenError, decode_token
from .config import get_settings
from .db import get_db
from .models import Answer, InterviewSession


@dataclass
class CurrentAccount:
    id: int
    role: str


def get_current_account(token: str = Query(...)) -> CurrentAccount:
    try:
        payload = decode_token(token, get_settings().secret_key)
    except TokenError:
        raise HTTPException(401, "invalid or expired session") from None
    return CurrentAccount(id=payload["id"], role=payload["role"])


def require_admin(account: CurrentAccount = Depends(get_current_account)) -> CurrentAccount:
    if account.role != "admin":
        raise HTTPException(403, "admin access required")
    return account


def require_self_or_admin(
    student_id: int, account: CurrentAccount = Depends(get_current_account)
) -> CurrentAccount:
    """For routes shaped .../students/{student_id}/... — the caller must be
    that student, or an admin."""
    if account.role == "admin":
        return account
    if account.role != "student" or account.id != student_id:
        raise HTTPException(403, "not authorized for this student")
    return account


def require_session_owner(
    session_id: int,
    db: DbSession = Depends(get_db),
    account: CurrentAccount = Depends(get_current_account),
) -> InterviewSession:
    """For routes shaped .../sessions/{session_id}/... — the caller must be
    the student the session belongs to. Returns the loaded session so route
    handlers don't need a second lookup."""
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(404, "session not found")
    if account.role != "student" or account.id != session.student_id:
        raise HTTPException(403, "not authorized for this session")
    return session


def require_answer_owner(
    answer_id: int,
    db: DbSession = Depends(get_db),
    account: CurrentAccount = Depends(get_current_account),
) -> Answer:
    answer = db.get(Answer, answer_id)
    if answer is None:
        raise HTTPException(404, "answer not found")
    if account.role != "student" or account.id != answer.session.student_id:
        raise HTTPException(403, "not authorized for this answer")
    return answer
