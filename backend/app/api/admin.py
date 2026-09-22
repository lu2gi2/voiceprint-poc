"""Placement-cell admin portal endpoints.

Backs the real ~100-student seeded roster (seed_demo_data.py), computed
live from Student + StudentDimensionScore + InterviewSession - not a second
copy of numbers hand-typed anywhere, same principle students.js's own
comments already called out about hand-typed admin figures drifting from
the roll they were supposed to describe.

Deliberately does NOT include a "last intervention" endpoint: that fixture
(a specific past workshop's before/after impact) describes an event that
never actually happened. Inventing one to fill the slot would be exactly
the "score without evidence" this codebase's own README refuses to do
elsewhere (see backend/README.md). AdminPage.jsx keeps that one section on
fixture data until a real intervention-tracking feature exists.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DbSession

from ..db import get_db
from ..models import InterviewSession, Student, StudentDimensionScore

router = APIRouter(prefix="/api/admin", tags=["admin"])

DEPARTMENTS = [
    {"code": "CSE", "name": "Computer Science"},
    {"code": "IT", "name": "Information Tech"},
    {"code": "ECE", "name": "Electronics"},
    {"code": "EEE", "name": "Electrical"},
]

BANDS = [
    {"key": "low", "label": "Low", "range": "below 50%", "min": 0, "max": 49, "meaning": "Needs intensive support"},
    {"key": "medium", "label": "Medium", "range": "50–64%", "min": 50, "max": 64, "meaning": "Needs improvement"},
    {"key": "intermediate", "label": "Intermediate", "range": "65–79%", "min": 65, "max": 79, "meaning": "Nearly placement ready"},
    {"key": "high", "label": "High", "range": "80–100%", "min": 80, "max": 100, "meaning": "Placement ready"},
]

DORMANT_DAYS = 21
NEEDS_INTERVENTION_BELOW = 65


def _band_for(score: int) -> str:
    for b in BANDS:
        if b["min"] <= score <= b["max"]:
            return b["key"]
    return BANDS[0]["key"]


def _latest_dimension_values(db: DbSession) -> dict[int, dict[str, int]]:
    """student_id -> {dimension: most_recent_value}. Loaded and reduced in
    Python rather than a window-function query - simple and plenty fast at
    the ~100-student scale this portal is seeded for."""
    rows = db.query(StudentDimensionScore).order_by(StudentDimensionScore.created_at).all()
    latest: dict[int, dict[str, int]] = defaultdict(dict)
    for r in rows:
        latest[r.student_id][r.dimension] = r.value  # later rows overwrite earlier ones
    return latest


def _overall_scores(latest: dict[int, dict[str, int]]) -> dict[int, int]:
    """A student's current standing: the average of their dimensions' most
    recent judged values, not a lifetime average across every session."""
    return {
        sid: round(sum(dims.values()) / len(dims))
        for sid, dims in latest.items()
        if dims
    }


def _last_activity(db: DbSession) -> dict[int, datetime | None]:
    rows = (
        db.query(InterviewSession.student_id, InterviewSession.created_at)
        .filter(InterviewSession.status == "complete")
        .all()
    )
    last: dict[int, datetime] = {}
    for student_id, created_at in rows:
        if student_id not in last or created_at > last[student_id]:
            last[student_id] = created_at
    return last


@router.get("/overview")
def get_overview(db: DbSession = Depends(get_db)) -> dict:
    students = db.query(Student).filter(Student.department.isnot(None)).all()
    latest = _latest_dimension_values(db)
    overall = _overall_scores(latest)
    last_activity = _last_activity(db)
    now = datetime.now(timezone.utc)

    scored_students = [s for s in students if s.id in overall]
    overall_readiness = round(sum(overall[s.id] for s in scored_students) / len(scored_students)) if scored_students else 0

    dept_rows = []
    for dept in DEPARTMENTS:
        in_dept = [s for s in scored_students if s.department == dept["code"]]
        readiness = round(sum(overall[s.id] for s in in_dept) / len(in_dept)) if in_dept else 0
        dept_rows.append({
            "code": dept["code"],
            "name": dept["name"],
            "count": len([s for s in students if s.department == dept["code"]]),
            "readiness": readiness,
            "lift": readiness - overall_readiness if in_dept else 0,
        })

    # Averaged across the whole roster, weakest first - what the "what's
    # moving, what's not" panel reads.
    dim_totals: dict[str, list[int]] = defaultdict(list)
    for dims in latest.values():
        for name, value in dims.items():
            dim_totals[name].append(value)
    dimensions = sorted(
        ({"name": name, "avg": round(sum(vals) / len(vals))} for name, vals in dim_totals.items()),
        key=lambda d: d["avg"],
    )

    never_started = [s for s in students if s.id not in last_activity]
    over_dormant_days = [
        s for s in students
        if s.id in last_activity and (now - last_activity[s.id]) > timedelta(days=DORMANT_DAYS)
    ]
    dormant_students = never_started + over_dormant_days
    dormant_by_dept: dict[str, int] = defaultdict(int)
    for s in dormant_students:
        dormant_by_dept[s.department] += 1

    return {
        "students_total": len(students),
        "departments": dept_rows,
        "overall_readiness": overall_readiness,
        "participating": len(scored_students),
        "participation_pct": round((len(scored_students) / len(students)) * 100) if students else 0,
        "need_intervention": len([s for s in scored_students if overall[s.id] < NEEDS_INTERVENTION_BELOW]),
        "dimensions": dimensions,
        "dormant": {
            "count": len(dormant_students),
            "pct_of_college": round((len(dormant_students) / len(students)) * 100) if students else 0,
            "never_started": len(never_started),
            "over_dormant_days": len(over_dormant_days),
            "by_department": [
                {"code": d["code"], "name": d["name"], "count": dormant_by_dept.get(d["code"], 0)}
                for d in DEPARTMENTS
            ],
        },
    }


@router.get("/bands")
def get_bands(db: DbSession = Depends(get_db)) -> list[dict]:
    students = db.query(Student).filter(Student.department.isnot(None)).all()
    overall = _overall_scores(_latest_dimension_values(db))
    scored = [s for s in students if s.id in overall]

    result = []
    for band in BANDS:
        in_band = [s for s in scored if _band_for(overall[s.id]) == band["key"]]
        result.append({
            **band,
            "students": len(in_band),
            "share": round((len(in_band) / len(scored)) * 100) if scored else 0,
        })
    return result


@router.get("/bands/{key}")
def get_band_roster(key: str, db: DbSession = Depends(get_db)) -> list[dict]:
    if key not in {b["key"] for b in BANDS}:
        raise HTTPException(404, "unknown band")

    students = db.query(Student).filter(Student.department.isnot(None)).all()
    overall = _overall_scores(_latest_dimension_values(db))

    roster = [
        {
            "id": s.id,
            "name": s.name,
            "roll_number": s.roll_number,
            "department": s.department,
            "year": s.year,
            "overall": overall[s.id],
        }
        for s in students
        if s.id in overall and _band_for(overall[s.id]) == key
    ]
    roster.sort(key=lambda r: r["overall"], reverse=True)
    return roster
