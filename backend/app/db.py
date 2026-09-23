import logging
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

log = logging.getLogger(__name__)

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


def init_db() -> None:
    """SQLite still gets the zero-setup create_all() path - the whole point
    of defaulting to it is that the API "just runs" with no setup ritual.
    Postgres is migration-managed now (backend/alembic); create_all() would
    bypass Alembic's version tracking and drift out of sync with it, so this
    only checks the schema is actually there and tells you to run
    `alembic upgrade head` if it isn't, rather than silently creating it.
    """
    from . import models  # noqa: F401  (import registers the mappers)

    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(engine)
        return

    from sqlalchemy import inspect

    if not inspect(engine).has_table("students"):
        log.warning(
            "Postgres database has no schema yet - run `alembic upgrade head` "
            "in backend/ before starting the API."
        )
