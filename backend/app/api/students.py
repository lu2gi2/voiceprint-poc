from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..db import get_db
from ..models import Student, StudentDimensionScore
from ..schemas import StudentHistoryOut

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/{student_id}/history", response_model=StudentHistoryOut)
def get_student_history(student_id: int, db: DbSession = Depends(get_db)) -> StudentHistoryOut:
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
