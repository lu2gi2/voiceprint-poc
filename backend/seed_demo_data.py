"""Seeds demo accounts through SQLAlchemy: a handful of named accounts for
manual testing, plus a larger admin-portal cohort with real session/
dimension-score history so AdminPage.jsx's aggregates have something real
to compute over.

Local development only - idempotent (safe to re-run, never deletes or
duplicates), and never touches Production. Every score here is randomly
generated, not measured from a real interview - clearly a synthetic seed,
same disclosure the old fixture roster (src/data/students.js) already made
about itself. The names mirror that fixture's style so demo data reads as
the same cohort, but this writes real rows via the real backend (password
hashes, dimension-score rows written the same way a completed session's
report would), not client-side fixtures.

Run from backend/: .venv/bin/python seed_demo_data.py
"""

import random
from datetime import datetime, timedelta, timezone

from app.api.admin import DEPARTMENTS
from app.auth import hash_password
from app.db import SessionLocal
from app.models import Admin, InterviewSession, Student, StudentDimensionScore

# Mirrors src/data/assessments.js's DIMENSIONS - the five dimensions the
# frontend's StatsPage/AdminPage read, kept in sync by hand since one lives
# in JS and one in Python.
DIMENSIONS = ["Fluency", "Clarity", "Structure", "Conciseness", "Vocabulary"]

DEMO_PASSWORD = "voiceprint"  # same password for every seeded account, on purpose - see AuthPage.jsx

DEMO_STUDENTS = [
    ("22CSE001", "Aditi Raman", "aditi.raman@demo.voiceprint"),
    ("22CSE014", "Karthik Subramani", "karthik.subramani@demo.voiceprint"),
    ("22IT007", "Meera Krishnan", "meera.krishnan@demo.voiceprint"),
    ("22ECE023", "Arjun Natarajan", "arjun.natarajan@demo.voiceprint"),
    ("22EEE009", "Divya Venkatesh", "divya.venkatesh@demo.voiceprint"),
]

DEMO_ADMIN = ("placement_officer", "Placement Cell Admin")

COHORT_SIZE = 100
COHORT_ROLL_PREFIX = "21"  # distinct from the named demo students' "22..." rolls
ASSESSMENTS = [
    ("hr", "HR Interview"), ("behavioral", "Behavioural Round"),
    ("technical", "Technical Interview"), ("placement", "Placement Mock"),
]

FIRST = [
    "Aditi", "Karthik", "Meera", "Arjun", "Divya", "Rohit", "Priya", "Sandeep",
    "Anitha", "Vikram", "Sneha", "Hari", "Lakshmi", "Naveen", "Pooja", "Ganesh",
    "Swathi", "Rahul", "Nithya", "Suresh", "Kavya", "Ajay", "Ramya", "Manoj",
    "Deepa", "Vishnu", "Sruthi", "Bala", "Janani", "Prakash", "Harini", "Kiran",
]
LAST = [
    "Raman", "Subramani", "Krishnan", "Natarajan", "Venkatesh", "Iyer", "Menon",
    "Pillai", "Reddy", "Sharma", "Nair", "Prasad", "Kumar", "Sundaram", "Anand",
]

# Conciseness runs lowest across the cohort - matches the bias the old
# fixture roster used, since it is what this product keeps finding students
# weakest at in practice.
DIMENSION_BIAS = {"Fluency": 3, "Vocabulary": 1, "Clarity": -2, "Structure": -5, "Conciseness": -10}
DEPARTMENT_LIFT = {"CSE": 5, "IT": 1, "ECE": -12, "EEE": -16}

YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"]


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def seed_named_students(db) -> int:
    created = 0
    for roll_number, name, email in DEMO_STUDENTS:
        if db.query(Student).filter_by(roll_number=roll_number).one_or_none() is not None:
            continue
        db.add(Student(roll_number=roll_number, name=name, email=email, password_hash=hash_password(DEMO_PASSWORD)))
        created += 1
    return created


def seed_admin(db) -> bool:
    username, admin_name = DEMO_ADMIN
    if db.query(Admin).filter_by(username=username).one_or_none() is not None:
        return False
    db.add(Admin(username=username, name=admin_name, password_hash=hash_password(DEMO_PASSWORD)))
    return True


def seed_cohort(db, rng: random.Random) -> int:
    """~100 students across the four departments, each with a plausible
    dimension-score progression (several sessions building to their current
    level) and, for a slice of them, no sessions at all or none recently -
    so the admin portal's participation/dormant stats have real variance to
    show, not a uniform roster."""
    if db.query(Student).filter(Student.roll_number.like(f"{COHORT_ROLL_PREFIX}%")).first() is not None:
        return 0

    now = datetime.now(timezone.utc)
    created = 0
    per_dept = COHORT_SIZE // len(DEPARTMENTS)

    for dept in DEPARTMENTS:
        for i in range(1, per_dept + 1):
            roll_number = f"{COHORT_ROLL_PREFIX}{dept['code']}{i:03d}"
            first, last = rng.choice(FIRST), rng.choice(LAST)
            name = f"{first} {last}"
            email = f"{roll_number.lower()}@demo.voiceprint"

            student = Student(
                roll_number=roll_number,
                name=name,
                email=email,
                password_hash=hash_password(DEMO_PASSWORD),
                department=dept["code"],
                year=rng.choice(YEARS),
            )
            db.add(student)
            db.flush()
            created += 1

            activity = rng.random()
            if activity < 0.12:
                continue  # never started - no sessions, no scores at all

            level = _clamp(rng.gauss(78 + DEPARTMENT_LIFT[dept["code"]], 11), 28, 97)
            num_sessions = rng.randint(1, 4)
            # Gone-quiet: the last session lands well over DORMANT_DAYS ago.
            last_session_days_ago = rng.randint(25, 90) if activity < 0.30 else rng.randint(0, 18)

            for session_index in range(num_sessions):
                assessment_id, assessment_title = rng.choice(ASSESSMENTS)
                days_ago = last_session_days_ago + (num_sessions - 1 - session_index) * rng.randint(5, 14)
                created_at = now - timedelta(days=days_ago, hours=rng.randint(0, 23))

                session = InterviewSession(
                    student_id=student.id,
                    assessment_id=assessment_id,
                    assessment_title=assessment_title,
                    status="complete",
                    created_at=created_at,
                    completed_at=created_at + timedelta(minutes=rng.randint(8, 20)),
                )
                db.add(session)
                db.flush()

                # Earlier sessions score lower, trending up to `level` - a
                # real progression, not a flat repeated value.
                progress = (session_index + 1) / num_sessions
                for dim in DIMENSIONS:
                    target = _clamp(level + DIMENSION_BIAS[dim] + rng.gauss(0, 4), 20, 100)
                    start = _clamp(target - rng.gauss(20, 6), 18, 95)
                    value = round(_clamp(start + (target - start) * progress + rng.gauss(0, 2), 18, 100))
                    db.add(StudentDimensionScore(
                        student_id=student.id, session_id=session.id, dimension=dim,
                        value=value, created_at=created_at,
                    ))

    return created


def seed() -> None:
    rng = random.Random(20260922)  # fixed seed - the same cohort every run, not a new random one each time
    with SessionLocal.begin() as db:
        named = seed_named_students(db)
        admin_created = seed_admin(db)
        cohort = seed_cohort(db, rng)

    print(f"Seeded {named} named demo student(s), admin {'created' if admin_created else 'already existed'}.")
    print(f"Seeded {cohort} cohort student(s) for the admin portal." if cohort else "Cohort already seeded; skipped.")
    print(f'Password for every seeded account: "{DEMO_PASSWORD}"')


if __name__ == "__main__":
    seed()
