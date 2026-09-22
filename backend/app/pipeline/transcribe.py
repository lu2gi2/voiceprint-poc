import logging
import threading
from dataclasses import dataclass
from pathlib import Path

from faster_whisper import WhisperModel

from ..config import get_settings

log = logging.getLogger(__name__)

_model: WhisperModel | None = None
_lock = threading.Lock()


def _get_model() -> WhisperModel:
    """One model for the process. Loading costs seconds and hundreds of MB, so
    it is built once on first use and shared; the lock stops two concurrent
    first-requests from each building their own."""
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                s = get_settings()
                log.info("loading whisper model %s (%s)", s.whisper_model, s.whisper_compute_type)
                _model = WhisperModel(
                    s.whisper_model,
                    device=s.whisper_device,
                    compute_type=s.whisper_compute_type,
                )
    return _model


@dataclass
class Word:
    text: str
    start: float
    end: float
    probability: float


@dataclass
class Transcript:
    text: str
    words: list[Word]
    language: str
    audio_seconds: float

    def as_dicts(self) -> list[dict]:
        return [
            {"text": w.text, "start": round(w.start, 3), "end": round(w.end, 3),
             "p": round(w.probability, 3)}
            for w in self.words
        ]


def transcribe(wav: Path) -> Transcript:
    """Transcribe with word-level timings.

    Word timings are the point of this call, not just the text: words-per-
    minute, pause counts and pause lengths are all derived from the gaps
    between words, which is far more reliable than trying to find silence in
    the waveform.

    condition_on_previous_text is off because these are short standalone
    answers — carrying context between segments mostly invites Whisper to
    invent continuations when a student trails off.
    """
    model = _get_model()
    segments, info = model.transcribe(
        str(wav),
        word_timestamps=True,
        condition_on_previous_text=False,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 350},
    )

    words: list[Word] = []
    chunks: list[str] = []
    for seg in segments:  # generator — consuming it is what does the work
        chunks.append(seg.text)
        for w in seg.words or []:
            words.append(
                Word(text=w.word.strip(), start=w.start, end=w.end, probability=w.probability)
            )

    return Transcript(
        text=" ".join(c.strip() for c in chunks).strip(),
        words=words,
        language=info.language,
        audio_seconds=float(info.duration),
    )
