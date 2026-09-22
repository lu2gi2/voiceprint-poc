"""Seed clearly labeled development data through SQLAlchemy.

This is for local demos only. It is idempotent and never deletes existing rows.
Production data should come from the application APIs and real recordings.
"""
from datetime import datetime, timezone

from app.db import SessionLocal
from app.models import Answer, AnswerScore, Cohort, Department, InterviewSession, Student

DEMO_EMAIL = "database-demo-student@example.com"


def seed() -> None:
    with SessionLocal.begin() as db:
        department = db.query(Department).filter_by(code="DEMO-CS").one_or_none()
        if department is None:
            department = Department(code="DEMO-CS", name="Development Computer Science")
            db.add(department)
            db.flush()

        cohort = db.query(Cohort).filter_by(name="Development 2026", department_id=department.id).one_or_none()
        if cohort is None:
            cohort = Cohort(name="Development 2026", department_id=department.id)
            db.add(cohort)
            db.flush()

        student = db.query(Student).filter_by(email=DEMO_EMAIL).one_or_none()
        if student is None:
            student = Student(
                email=DEMO_EMAIL,
                name="Database Demo Student",
                department_id=department.id,
                cohort_id=cohort.id,
            )
            db.add(student)
            db.flush()
        else:
            student.department_id = department.id
            student.cohort_id = cohort.id

        existing = db.query(InterviewSession).filter_by(student_id=student.id).count()
        if existing:
            print(f"Demo data already exists for {DEMO_EMAIL}; no rows added.")
            return

        now = datetime.now(timezone.utc)
        sessions = [
            InterviewSession(
                student_id=student.id,
                assessment_id="hr",
                assessment_title="HR Interview",
                status="complete",
                created_at=now,
                completed_at=now,
            ),
            InterviewSession(
                student_id=student.id,
                assessment_id="behavioral",
                assessment_title="Behavioural Round",
                status="complete",
                created_at=now,
                completed_at=now,
            ),
            InterviewSession(
                student_id=student.id,
                assessment_id="technical",
                assessment_title="Technical Interview",
                status="open",
                created_at=now,
            ),
        ]
        db.add_all(sessions)
        db.flush()

        score_sets = [
            [("Fluency", 78), ("Conciseness", 68)],
            [("Fluency", 84), ("Conciseness", 74)],
        ]
        for session, scores in zip(sessions[:2], score_sets):
            for question_index, (dimension, value) in enumerate(scores):
                answer = Answer(
                    session_id=session.id,
                    question_index=question_index,
                    prompt=f"Development seed answer for {dimension}.",
                    target_seconds=90,
                    audio_key=None,
                    audio_mime="application/x-development-seed",
                    duration_seconds=48 + question_index * 12,
                    status="ready",
                    transcript=f"Development seed transcript demonstrating {dimension.lower()} data.",
                    words=[],
                    measurements={"source": "development_seed", "dimension": dimension},
                    scores=[{
                        "dimension": dimension,
                        "value": value,
                        "evidence": [{"label": "Source", "value": "Development seed data"}],
                        "recommendation": f"Development recommendation for {dimension.lower()}.",
                        "confidence": "low",
                    }],
                    created_at=now,
                    processed_at=now,
                )
                db.add(answer)
                db.flush()
                db.add(AnswerScore(
                    answer_id=answer.id,
                    dimension=dimension,
                    value=value,
                    recommendation=f"Development recommendation for {dimension.lower()}.",
                    confidence="low",
                    evidence=[{"label": "Source", "value": "Development seed data"}],
                ))

        print(f"Seeded demo data for {DEMO_EMAIL}: 1 student, 3 sessions, 4 answers.")


if __name__ == "__main__":
    seed()
