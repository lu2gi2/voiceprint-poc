from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session as DbSession

from ..auth import create_token, hash_password, verify_password
from ..config import get_settings
from ..db import get_db
from ..models import Admin, Student
from ..schemas import AccountOut, LoginRequest, StudentRegister

router = APIRouter(prefix="/api/auth", tags=["auth"])

# One message for "no such account" and "wrong password" - telling them
# apart lets someone enumerate real roll numbers/usernames from the error
# text alone. Same reasoning AuthPage.jsx already documents client-side;
# this is what actually enforces it now that a real backend exists.
BAD_CREDENTIALS = "That username and password do not match an account."


@router.post("/register", response_model=AccountOut, status_code=201)
async def register_student(request: Request, db: DbSession = Depends(get_db)) -> AccountOut:
    # Body parsed manually rather than via `payload: StudentRegister` — see
    # create_session's docstring in api/sessions.py for why (Catalyst AppSail
    # CORS preflight workaround).
    payload = StudentRegister.model_validate_json(await request.body())
    if db.query(Student).filter(Student.roll_number == payload.roll_number).one_or_none() is not None:
        raise HTTPException(409, "That roll number is already registered.")
    if db.query(Student).filter(Student.email == payload.email).one_or_none() is not None:
        raise HTTPException(409, "That email is already registered.")

    student = Student(
        roll_number=payload.roll_number,
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    token = create_token(student.id, "student", get_settings().secret_key)
    return AccountOut(
        id=student.id, role="student", name=student.name,
        roll_number=student.roll_number, email=student.email, token=token,
    )


@router.post("/login", response_model=AccountOut)
async def login(request: Request, db: DbSession = Depends(get_db)) -> AccountOut:
    payload = LoginRequest.model_validate_json(await request.body())
    if payload.role == "student":
        student = db.query(Student).filter(Student.roll_number == payload.username).one_or_none()
        if student is None or not verify_password(payload.password, student.password_hash):
            raise HTTPException(401, BAD_CREDENTIALS)
        token = create_token(student.id, "student", get_settings().secret_key)
        return AccountOut(
            id=student.id, role="student", name=student.name,
            roll_number=student.roll_number, email=student.email, token=token,
        )

    admin = db.query(Admin).filter(Admin.username == payload.username).one_or_none()
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(401, BAD_CREDENTIALS)
    token = create_token(admin.id, "admin", get_settings().secret_key)
    return AccountOut(id=admin.id, role="admin", name=admin.name, username=admin.username, token=token)
