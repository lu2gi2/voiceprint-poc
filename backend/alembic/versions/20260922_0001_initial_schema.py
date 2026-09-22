"""Create the deployment-ready schema.

Revision ID: 20260922_0001
Revises:
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "20260922_0001"
down_revision = None
branch_labels = None
depends_on = None


def _tables(bind):
    return set(inspect(bind).get_table_names())


def _columns(bind, table):
    return {column["name"] for column in inspect(bind).get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = _tables(bind)

    if "departments" not in tables:
        op.create_table(
            "departments",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("code", sa.String(32), nullable=False),
            sa.Column("name", sa.String(120), nullable=False),
            sa.UniqueConstraint("code"),
            sa.UniqueConstraint("name"),
        )
        op.create_index("ix_departments_code", "departments", ["code"], unique=True)

    if "cohorts" not in tables:
        op.create_table(
            "cohorts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(80), nullable=False),
            sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.id"), nullable=True),
            sa.UniqueConstraint("name", "department_id", name="uq_cohorts_name_department"),
        )
        op.create_index("ix_cohorts_department_id", "cohorts", ["department_id"], unique=False)

    if "students" not in tables:
        op.create_table(
            "students",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("email", sa.String(320), nullable=False),
            sa.Column("name", sa.String(120), nullable=False),
            sa.Column("department_id", sa.Integer(), sa.ForeignKey("departments.id"), nullable=True),
            sa.Column("cohort_id", sa.Integer(), sa.ForeignKey("cohorts.id"), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("email"),
        )
        op.create_index("ix_students_email", "students", ["email"], unique=True)
        op.create_index("ix_students_department_id", "students", ["department_id"], unique=False)
        op.create_index("ix_students_cohort_id", "students", ["cohort_id"], unique=False)

    if "students" in tables:
        columns = _columns(bind, "students")
        if "department_id" not in columns:
            with op.batch_alter_table("students") as batch:
                batch.add_column(sa.Column("department_id", sa.Integer(), nullable=True))
                batch.create_foreign_key("fk_students_department_id", "departments", ["department_id"], ["id"])
                batch.create_index("ix_students_department_id", ["department_id"], unique=False)
        if "cohort_id" not in columns:
            with op.batch_alter_table("students") as batch:
                batch.add_column(sa.Column("cohort_id", sa.Integer(), nullable=True))
                batch.create_foreign_key("fk_students_cohort_id", "cohorts", ["cohort_id"], ["id"])
                batch.create_index("ix_students_cohort_id", ["cohort_id"], unique=False)

    if "sessions" not in tables:
        op.create_table(
            "sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("student_id", sa.Integer(), sa.ForeignKey("students.id"), nullable=False),
            sa.Column("assessment_id", sa.String(64), nullable=False),
            sa.Column("assessment_title", sa.String(160), nullable=False),
            sa.Column("status", sa.String(24), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_sessions_student_id", "sessions", ["student_id"], unique=False)

    if "answers" not in tables:
        op.create_table(
            "answers",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id"), nullable=False),
            sa.Column("question_index", sa.Integer(), nullable=False),
            sa.Column("prompt", sa.Text(), nullable=False),
            sa.Column("target_seconds", sa.Integer(), nullable=False),
            sa.Column("audio_key", sa.String(255), nullable=True),
            sa.Column("audio_mime", sa.String(64), nullable=False),
            sa.Column("duration_seconds", sa.Float(), nullable=True),
            sa.Column("status", sa.String(24), nullable=False),
            sa.Column("error", sa.Text(), nullable=True),
            sa.Column("transcript", sa.Text(), nullable=True),
            sa.Column("words", sa.JSON(), nullable=True),
            sa.Column("measurements", sa.JSON(), nullable=True),
            sa.Column("scores", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("audio_deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.UniqueConstraint("session_id", "question_index", name="uq_answers_session_question"),
        )
        op.create_index("ix_answers_session_id", "answers", ["session_id"], unique=False)
        op.create_index("ix_answers_status", "answers", ["status"], unique=False)
    else:
        columns = _columns(bind, "answers")
        with op.batch_alter_table("answers", recreate="always") as batch:
            if "audio_key" in columns:
                batch.alter_column("audio_key", nullable=True)
        for name, column in (
            ("processing_started_at", sa.Column("processing_started_at", sa.DateTime(timezone=True), nullable=True)),
            ("audio_deleted_at", sa.Column("audio_deleted_at", sa.DateTime(timezone=True), nullable=True)),
        ):
            if name not in columns:
                op.add_column("answers", column)
        with op.batch_alter_table("answers", recreate="always") as batch:
            batch.create_unique_constraint("uq_answers_session_question", ["session_id", "question_index"])

    if "answer_scores" not in tables:
        op.create_table(
            "answer_scores",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("answer_id", sa.Integer(), sa.ForeignKey("answers.id", ondelete="CASCADE"), nullable=False),
            sa.Column("dimension", sa.String(80), nullable=False),
            sa.Column("value", sa.Integer(), nullable=False),
            sa.Column("recommendation", sa.Text(), nullable=False),
            sa.Column("confidence", sa.String(16), nullable=False),
            sa.Column("evidence", sa.JSON(), nullable=False),
            sa.UniqueConstraint("answer_id", "dimension", name="uq_answer_scores_answer_dimension"),
        )
        op.create_index("ix_answer_scores_answer_id", "answer_scores", ["answer_id"], unique=False)
        op.create_index("ix_answer_scores_dimension", "answer_scores", ["dimension"], unique=False)
        op.create_index("ix_answer_scores_value", "answer_scores", ["value"], unique=False)

        if "answers" in tables:
            rows = bind.execute(sa.text("SELECT id, scores FROM answers WHERE scores IS NOT NULL")).fetchall()
            score_table = sa.table(
                "answer_scores",
                sa.column("answer_id", sa.Integer),
                sa.column("dimension", sa.String),
                sa.column("value", sa.Integer),
                sa.column("recommendation", sa.Text),
                sa.column("confidence", sa.String),
                sa.column("evidence", sa.JSON),
            )
            for answer_id, scores in rows:
                if isinstance(scores, str):
                    import json
                    scores = json.loads(scores)
                for score in scores or []:
                    bind.execute(score_table.insert().values(
                        answer_id=answer_id,
                        dimension=score["dimension"],
                        value=score["value"],
                        recommendation=score.get("recommendation", ""),
                        confidence=score.get("confidence", "high"),
                        evidence=score.get("evidence", []),
                    ))


def downgrade() -> None:
    op.drop_table("answer_scores")
    op.drop_constraint("uq_answers_session_question", "answers", type_="unique")
    op.drop_column("answers", "audio_deleted_at")
    op.drop_column("answers", "processing_started_at")
    op.drop_table("answers")
    op.drop_table("sessions")
    op.drop_table("cohorts")
    op.drop_table("departments")
