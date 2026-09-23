import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.admin import router as admin_router
from .api.auth import router as auth_router
from .api.sessions import router as sessions_router
from .api.students import router as students_router
from .config import get_settings
from .db import init_db

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

app.include_router(admin_router)
app.include_router(auth_router)
app.include_router(sessions_router)
app.include_router(students_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict:
    """Also what the front end pings to decide whether to use live scoring or
    fall back to fixtures."""
    return {
        "status": "ok",
        "whisper_model": settings.whisper_model,
        "scored_dimensions": ["Fluency", "Conciseness"],
    }
