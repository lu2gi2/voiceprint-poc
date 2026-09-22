import subprocess
import tempfile
from pathlib import Path


class AudioError(RuntimeError):
    pass


def to_wav16k(src: Path) -> Path:
    """Decode whatever the browser sent into 16 kHz mono PCM.

    The front end records webm/opus on Chrome and mp4/aac on Safari. Rather
    than teaching two libraries to read both, everything is normalised once on
    ingest: Whisper wants 16 kHz mono anyway, and librosa reads plain WAV
    without dragging in an audio backend that may or may not handle Opus.

    Returns a temp file the caller is responsible for deleting.
    """
    out = Path(tempfile.mkstemp(suffix=".wav")[1])
    proc = subprocess.run(
        [
            "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error",
            "-y", "-i", str(src),
            "-ac", "1",          # mono
            "-ar", "16000",      # 16 kHz
            "-f", "wav", str(out),
        ],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0 or not out.exists() or out.stat().st_size == 0:
        out.unlink(missing_ok=True)
        raise AudioError(f"could not decode audio: {proc.stderr.strip()[:400]}")
    return out
