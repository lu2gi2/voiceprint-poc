"""Local text-to-speech via Kokoro-82M (ONNX), run through kokoro-onnx.

Runs fully local, same as the STT side: no cloud call, no API key. Unlike
faster-whisper, kokoro-onnx does not fetch its own weights, so this module
downloads them to a cache dir on first use — the same "just works, no setup
ritual" experience the whisper side already has (see config.py).
"""

import io
import logging
import threading
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

from ..config import get_settings

log = logging.getLogger(__name__)

_kokoro = None
_lock = threading.Lock()


def _download(url: str, dest: Path) -> None:
    log.info("downloading %s -> %s", url, dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    urllib.request.urlretrieve(url, tmp)  # noqa: S310 — fixed, known-good release URLs
    tmp.rename(dest)


def _ensure_weights(settings) -> tuple[Path, Path]:
    model_path = settings.tts_cache_dir / settings.tts_model_file
    voices_path = settings.tts_cache_dir / settings.tts_voices_file
    if not model_path.exists():
        _download(settings.tts_model_url, model_path)
    if not voices_path.exists():
        _download(settings.tts_voices_url, voices_path)
    return model_path, voices_path


def _get_kokoro():
    """One Kokoro instance for the process, built lazily — same pattern as
    the whisper model in transcribe.py, and for the same reason: loading
    costs real time and memory, so it happens once and is shared."""
    global _kokoro
    if _kokoro is None:
        with _lock:
            if _kokoro is None:
                from kokoro_onnx import Kokoro

                settings = get_settings()
                model_path, voices_path = _ensure_weights(settings)
                log.info("loading kokoro model %s", model_path.name)
                _kokoro = Kokoro(str(model_path), str(voices_path))
    return _kokoro


def synthesize(text: str, voice: str | None = None, speed: float = 1.0) -> tuple[np.ndarray, int]:
    """Synthesize `text` to audio. Returns (samples, sample_rate) — the
    caller decides how to encode/store it (see the pre-render step that
    writes these to disk once per question, not per turn)."""
    kokoro = _get_kokoro()
    settings = get_settings()
    samples, sample_rate = kokoro.create(text, voice=voice or settings.tts_default_voice, speed=speed)
    return samples, sample_rate


def synthesize_wav_bytes(text: str, voice: str | None = None, speed: float = 1.0) -> bytes:
    """Synthesize and encode as WAV, ready for audio_store.put(). This module
    stays storage-agnostic on purpose — storage.py is the only thing that
    knows where bytes live (see its docstring); the pre-render step calls
    this, then hands the result to audio_store itself."""
    samples, sample_rate = synthesize(text, voice=voice, speed=speed)
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV")
    return buf.getvalue()
