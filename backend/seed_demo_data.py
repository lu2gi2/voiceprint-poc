"""Seeds a handful of clearly-labeled demo accounts through SQLAlchemy.

Local development only - idempotent (safe to re-run, never deletes or
duplicates), and never touches Production. The names mirror the style of
the frontend's fixture roster (src/data/students.js) so demo data looks
like the same cohort, but this writes real rows with real password hashes,
not client-side fixtures.

Run from backend/: .venv/bin/python seed_demo_data.py
"""

from app.auth import hash_password
from app.db import SessionLocal
from app.models import Admin, Student

DEMO_PASSWORD = "voiceprint"  # same password for every seeded account, on purpose - see AuthPage.jsx

DEMO_STUDENTS = [
    ("22CSE001", "Aditi Raman", "aditi.raman@demo.voiceprint"),
    ("22CSE014", "Karthik Subramani", "karthik.subramani@demo.voiceprint"),
    ("22IT007", "Meera Krishnan", "meera.krishnan@demo.voiceprint"),
    ("22ECE023", "Arjun Natarajan", "arjun.natarajan@demo.voiceprint"),
    ("22EEE009", "Divya Venkatesh", "divya.venkatesh@demo.voiceprint"),
]

DEMO_ADMIN = ("placement_officer", "Placement Cell Admin")


def seed() -> None:
    with SessionLocal.begin() as db:
        created_students = 0
        for roll_number, name, email in DEMO_STUDENTS:
            if db.query(Student).filter_by(roll_number=roll_number).one_or_none() is not None:
                continue
            db.add(Student(roll_number=roll_number, name=name, email=email, password_hash=hash_password(DEMO_PASSWORD)))
            created_students += 1

        created_admin = False
        username, admin_name = DEMO_ADMIN
        if db.query(Admin).filter_by(username=username).one_or_none() is None:
            db.add(Admin(username=username, name=admin_name, password_hash=hash_password(DEMO_PASSWORD)))
            created_admin = True

    print(f"Seeded {created_students} student account(s), admin {'created' if created_admin else 'already existed'}.")
    print(f'Password for every seeded account: "{DEMO_PASSWORD}"')


if __name__ == "__main__":
    seed()
