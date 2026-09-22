from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np


@dataclass
class Acoustics:
    """Properties of the signal itself — things no transcript can tell you."""

    duration_seconds: float
    voiced_ratio: float          # share of frames carrying speech energy
    volume_consistency: float    # 0-1, higher = steadier level
    pitch_variation: float       # semitone std dev of f0 over voiced frames
    pitch_median_hz: float | None

    def as_dict(self) -> dict:
        return {k: (round(v, 3) if isinstance(v, float) else v) for k, v in asdict(self).items()}


def analyse(wav: Path) -> Acoustics:
    """Energy and pitch measures from the waveform.

    librosa is imported here rather than at module scope: it pulls in numba and
    scikit-learn and costs a couple of seconds, which would otherwise be paid
    on every API start even for requests that never touch audio.
    """
    import librosa

    y, sr = librosa.load(str(wav), sr=16000, mono=True)
    duration = float(len(y) / sr) if len(y) else 0.0
    if duration == 0:
        return Acoustics(0.0, 0.0, 0.0, 0.0, None)

    # --- level ---
    rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=256)[0]
    # A relative threshold, not an absolute one: mic gain varies wildly between
    # laptops, so "loud enough to be speech" has to be defined against this
    # recording rather than a fixed dBFS value.
    speech_floor = max(rms.max() * 0.08, 1e-4)
    voiced = rms > speech_floor
    voiced_ratio = float(voiced.mean()) if rms.size else 0.0

    loud = rms[voiced]
    if loud.size > 1 and loud.mean() > 0:
        # Averaged into ~1s windows first. Raw frame-to-frame RMS is dominated
        # by the syllable peaks and troughs every speaker has, so it measures
        # the rhythm of speech rather than whether delivery holds its level —
        # it scored steady synthetic speech at 0.44. Delivery steadiness is a
        # property of seconds, so measure it over seconds.
        per_window = max(1, int(sr / 256))  # hop_length=256 -> frames per second
        usable = (loud.size // per_window) * per_window
        if usable >= per_window * 2:
            windows = loud[:usable].reshape(-1, per_window).mean(axis=1)
        else:
            windows = loud
        cv = float(windows.std() / windows.mean()) if windows.mean() > 0 else 1.0
        volume_consistency = float(max(0.0, min(1.0, 1.0 - cv)))
    else:
        volume_consistency = 0.0

    # --- pitch ---
    # yin rather than pyin: pyin's HMM smoothing is markedly more accurate and
    # markedly too slow to sit in a request path.
    pitch_variation = 0.0
    pitch_median: float | None = None
    try:
        f0 = librosa.yin(y, fmin=60, fmax=400, sr=sr, frame_length=1024)
        f0 = f0[np.isfinite(f0) & (f0 > 60) & (f0 < 400)]
        if f0.size > 10:
            pitch_median = float(np.median(f0))
            # Semitones, so the number means the same thing for a low voice and
            # a high one — raw Hz variance would just measure pitch register.
            semis = 12.0 * np.log2(f0 / np.median(f0))
            pitch_variation = float(np.std(semis))
    except Exception:  # noqa: BLE001 — pitch is a nice-to-have, never fatal
        pass

    return Acoustics(
        duration_seconds=duration,
        voiced_ratio=voiced_ratio,
        volume_consistency=volume_consistency,
        pitch_variation=pitch_variation,
        pitch_median_hz=pitch_median,
    )
