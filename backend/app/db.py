from collections.abc import Iterator
from datetime import datetime, timezone

from sqlalchemy import create_engine, update
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()

# check_same_thread is a SQLite-only requirement: background jobs touch the
# session from a worker thread. Postgres needs neither the arg nor the dialect
# check, hence the guard.
connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def recover_interrupted_answers() -> int:
    """Mark in-flight work failed after a process restart.

    BackgroundTasks cannot resume work across a server restart, so retaining
    ``processing`` would make the UI poll forever.
    """
    from .models import Answer

    with SessionLocal.begin() as db:
        result = db.execute(
            update(Answer)
            .where(Answer.status == "processing")
            .values(
                status="failed",
                error="Processing interrupted by server restart; please record the answer again.",
                processing_started_at=None,
            )
        )
    return result.rowcount or 0


def clear_deleted_audio_references(deleted_keys: list[str]) -> int:
    if not deleted_keys:
        return 0
    from .models import Answer

    with SessionLocal.begin() as db:
        result = db.execute(
            update(Answer)
            .where(Answer.audio_key.in_(deleted_keys))
            .values(audio_key=None, audio_deleted_at=datetime.now(timezone.utc))
        )
    return result.rowcount or 0
