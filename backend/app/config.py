from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime configuration. Everything has a working default so the API can
    be started with no .env at all — the POC should not need a setup ritual."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # PostgreSQL is the deployment default. SQLite remains available for local
    # work by explicitly setting DATABASE_URL=sqlite:///voiceprint.db.
    database_url: str = "postgresql+psycopg://voiceprint:voiceprint@localhost:5432/voiceprint"

    # Raw audio lives on disk behind a storage interface (see storage.py) so
    # swapping in S3 later is one class, not a refactor.
    storage_dir: Path = BACKEND_DIR / "storage"

    # base.en keeps a 90-second answer under ~15s on a normal CPU. small.en is
    # noticeably more accurate and roughly 3x slower — worth it once answers
    # are being scored for real rather than demoed.
    whisper_model: str = "base.en"
    whisper_compute_type: str = "int8"
    whisper_device: str = "cpu"

    # The Vite dev server.
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ]

    # How long a student's audio is kept. PRD §16 asks for audio to be retained
    # "only when required"; this is the knob that honours it.
    audio_retention_days: int = 30


@lru_cache
def get_settings() -> Settings:
    return Settings()
