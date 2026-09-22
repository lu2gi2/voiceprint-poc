"""Persist the assessment catalogue and questions."""
from alembic import op
import sqlalchemy as sa

from app.catalog import ASSESSMENT_CATALOG

revision = "20260922_0002"
down_revision = "20260922_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "assessment_catalog",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("kind", sa.String(120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("icon", sa.String(48), nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("soon_reason", sa.Text(), nullable=True),
        sa.Column("measures", sa.JSON(), nullable=False),
        sa.Column("questions", sa.JSON(), nullable=False),
    )
    op.create_index("ix_assessment_catalog_status", "assessment_catalog", ["status"], unique=False)
    table = sa.table(
        "assessment_catalog",
        sa.column("id", sa.String), sa.column("title", sa.String), sa.column("kind", sa.String),
        sa.column("description", sa.Text), sa.column("icon", sa.String), sa.column("status", sa.String),
        sa.column("soon_reason", sa.Text), sa.column("measures", sa.JSON), sa.column("questions", sa.JSON),
    )
    op.bulk_insert(table, ASSESSMENT_CATALOG)


def downgrade() -> None:
    op.drop_table("assessment_catalog")
