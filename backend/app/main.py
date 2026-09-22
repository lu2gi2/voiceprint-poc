import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.sessions import router as sessions_router
from .config import get_settings
from .db import clear_deleted_audio_references, recover_interrupted_answers
from .storage import audio_store

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

settings = get_settings()

app = FastAPI(
    title="Voiceprint API",
    version="0.1.0",
    description=(
        "v1 of the assessment backend. Records go in as audio and come back as "
        "evidence-backed scores. Fluency and conciseness are computed from "
        "measurements; the content dimensions still need an LLM and are absent "
        "rather than faked."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)


@app.on_event("startup")
def on_startup() -> None:
    recovered = recover_interrupted_answers()
    deleted = audio_store.purge_older_than(settings.audio_retention_days)
    cleared = clear_deleted_audio_references(deleted)
    if recovered or deleted:
        logging.getLogger(__name__).info(
            "startup maintenance: recovered=%s deleted_audio=%s cleared_references=%s",
            recovered,
            len(deleted),
            cleared,
        )


@app.get("/api/health")
def health() -> dict:
    """Also what the front end pings to decide whether to use live scoring or
    fall back to fixtures."""
    return {
        "status": "ok",
        "whisper_model": settings.whisper_model,
        "scored_dimensions": ["Fluency", "Conciseness"],
    }


@app.get("/api/health/db")
def database_health() -> dict:
    from sqlalchemy import text

    from .db import SessionLocal

    with SessionLocal() as db:
        db.execute(text("SELECT 1"))
    dialect = settings.database_url.split(":", 1)[0].split("+")[0]
    database_name = {"postgresql": "PostgreSQL", "sqlite": "SQLite"}.get(dialect, dialect)
    return {"status": "connected", "database": database_name}
