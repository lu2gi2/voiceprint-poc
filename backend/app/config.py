from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime configuration. Everything has a working default so the API can
    be started with no .env at all — the POC should not need a setup ritual."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # SQLite by default so `uvicorn app.main:app` just runs. docker-compose.yml
    # brings up the Postgres the PRD actually targets; point DATABASE_URL at it
    # to switch. The models are plain SQLAlchemy, so nothing else changes.
    database_url: str = f"sqlite:///{BACKEND_DIR / 'voiceprint.db'}"

    # Raw audio lives on disk behind a storage interface (see storage.py) so
    # swapping in S3 later is one class, not a refactor.
    storage_dir: Path = BACKEND_DIR / "storage"

    # Every downloaded model lives under the repo, not the user's home
    # directory — a fresh checkout is fully self-contained and `rm -rf
    # backend/models` is the entire cleanup story. Nothing here should ever
    # touch ~/.cache.
    models_dir: Path = BACKEND_DIR / "models"

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

    # Kokoro TTS. int8 for CPU speed/size; unlike faster-whisper, kokoro-onnx
    # does not fetch its own weights, so synthesize.py downloads these to the
    # cache dir itself on first use, the same "just works, no setup ritual"
    # experience the whisper side already has.
    tts_cache_dir: Path = BACKEND_DIR / "models" / "kokoro"
    tts_model_file: str = "kokoro-v1.0.int8.onnx"
    tts_voices_file: str = "voices-v1.0.bin"
    tts_model_url: str = (
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/"
        "model-files-v1.1/kokoro-v1.0.int8.onnx"
    )
    tts_voices_url: str = (
        "https://github.com/thewh1teagle/kokoro-onnx/releases/download/"
        "model-files-v1.1/voices-v1.0.bin"
    )
    tts_default_voice: str = "af_heart"

    # DeepSeek — used only for resume-shape double-checking and question
    # generation (redacted resume text, never audio). None of it is required
    # for the app to start; a session just cannot generate resume-driven
    # questions without it.
    #
    # Routed through OpenRouter rather than DeepSeek's own API — same model,
    # OpenRouter is OpenAI-API-compatible so only the base URL and the
    # provider-prefixed model name change; deepseek.py's request shape is
    # untouched. DEEPSEEK_API_KEY is now an OpenRouter key, not a DeepSeek one.
    deepseek_api_key: str | None = None
    deepseek_base_url: str = "https://openrouter.ai/api/v1"
    deepseek_model: str = "deepseek/deepseek-chat"


@lru_cache
def get_settings() -> Settings:
    return Settings()
