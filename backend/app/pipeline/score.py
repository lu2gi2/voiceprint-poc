"""Turn measurements into scores.

Rules, not a model. Two reasons: the v1 has no LLM, and more importantly a
rule can be shown to the student. "72 because you ran 143 wpm with 6 long
pauses" is checkable; "72 because the model said so" is the subjective
feedback this product exists to replace (PRD §7, §18).

Only Fluency and Conciseness are scored here. Clarity, Structure and
Vocabulary are judgements about *content* and genuinely need an LLM reading
the transcript — inventing rule-based numbers for them would be exactly the
dishonesty the evidence principle forbids. They stay absent rather than fake.
"""

from dataclasses import dataclass, field

from .measure import Measurements

# Comfortable interview delivery. The band is wide on purpose: 120-160 wpm
# covers most confident speakers, and penalising someone for 118 would be
# false precision.
WPM_IDEAL = (120, 160)
FILLERS_PER_MIN_OK = 1.5
LONG_PAUSES_PER_MIN_OK = 2.0
HEDGES_PER_MIN_OK = 6.0


@dataclass
class Score:
    dimension: str
    value: int
    evidence: list[dict] = field(default_factory=list)
    recommendation: str = ""
    confidence: str = "high"  # high | low

    def as_dict(self) -> dict:
        return {
            "dimension": self.dimension,
            "value": self.value,
            "evidence": self.evidence,
            "recommendation": self.recommendation,
            "confidence": self.confidence,
        }


def _clamp(v: float) -> int:
    return int(max(0, min(100, round(v))))


def _band_penalty(value: float, low: float, high: float, per_unit: float) -> float:
    """Distance outside a comfortable band, scaled. Inside the band costs
    nothing — being at 130 wpm is not better than 140."""
    if value < low:
        return (low - value) * per_unit
    if value > high:
        return (value - high) * per_unit
    return 0.0


def _rate_penalty(value: float, budget: float, per_unit: float) -> float:
    return max(0.0, value - budget) * per_unit


def score_fluency(m: Measurements) -> Score:
    if m.word_count == 0:
        return Score("Fluency", 0, [{"label": "No speech detected", "value": "—"}],
                     "Nothing was recorded — check your microphone and try again.", "low")

    # On a very short answer only the raw counts are trustworthy; the
    # per-minute rates derived from them are not (see MIN_SECONDS_FOR_RATES).
    short = "short_sample" in m.low_confidence

    penalty = 0.0
    penalty += _band_penalty(m.speaking_rate_wpm, *WPM_IDEAL, per_unit=0.45)
    if not short:
        penalty += _rate_penalty(m.filler_per_minute, FILLERS_PER_MIN_OK, per_unit=7.0)
        penalty += _rate_penalty(m.long_pause_count / max(m.duration_seconds / 60, 0.1),
                                 LONG_PAUSES_PER_MIN_OK, per_unit=5.0)
    penalty += min(12.0, m.repeated_word_count * 2.5)
    value = _clamp(100 - penalty)

    evidence = [
        {"label": "Speaking rate", "value": f"{m.speaking_rate_wpm:.0f} wpm",
         "note": "comfortable range 120–160"},
        {"label": "Filler words", "value": f"{m.filler_count}"
         + (f" ({', '.join(m.filler_examples)})" if m.filler_examples else "")},
        {"label": "Long pauses", "value": f"{m.long_pause_count}",
         "note": f"longest {m.longest_pause_seconds:.1f}s"},
        {"label": "Restarted words", "value": f"{m.repeated_word_count}"},
    ]

    if m.speaking_rate_wpm > WPM_IDEAL[1]:
        rec = f"You ran at {m.speaking_rate_wpm:.0f} wpm. Slow to about 140 and let the key points land."
    elif m.speaking_rate_wpm < WPM_IDEAL[0]:
        rec = f"You ran at {m.speaking_rate_wpm:.0f} wpm. Lift the pace a little so the answer keeps momentum."
    elif m.filler_per_minute > FILLERS_PER_MIN_OK:
        rec = "Replace the fillers with a deliberate silent beat — a pause reads as thinking, 'um' reads as stalling."
    elif m.long_pause_count > 2:
        rec = f"{m.long_pause_count} pauses ran over a second. Plan the first line of the answer so the opening flows."
    else:
        rec = "Delivery is steady. Keep the pace and the pauses where they are."

    # A zero filler count is only meaningful if the transcriber keeps fillers,
    # and Whisper does not reliably. Say so rather than claiming a clean run.
    confidence = "low" if ("filler_count" in m.low_confidence or short) else "high"
    return Score("Fluency", value, evidence, rec, confidence)


def score_conciseness(m: Measurements) -> Score:
    if m.word_count == 0:
        return Score("Conciseness", 0, [{"label": "No speech detected", "value": "—"}],
                     "Nothing was recorded — check your microphone and try again.", "low")

    # Far under target is not concision, it is an unanswered question — and
    # without this an empty 4-second reply scores 100, which is both wrong and
    # trivially gameable. Capped rather than zeroed: the student may genuinely
    # have finished, we just cannot call it a good answer.
    if m.target_seconds > 0 and m.duration_seconds < m.target_seconds * 0.4:
        secs = int(m.duration_seconds)
        tgt = int(m.target_seconds)
        return Score(
            "Conciseness", min(55, _clamp(100 - 30)),
            [
                {"label": "Answer length", "value": f"{secs}s"},
                {"label": "Target", "value": f"{tgt}s"},
                {"label": "Words spoken", "value": f"{m.word_count}"},
            ],
            f"{secs}s against a {tgt}s target is too short to show the skill — "
            "answer fully, then tighten it.",
            "low",
        )

    penalty = 0.0
    if m.target_seconds > 0:
        # Judged proportionally: 30s over on a 60s answer is a bigger failure
        # of judgement than 30s over on a three-minute one.
        overshoot = m.over_target_seconds / m.target_seconds
        penalty += min(45.0, overshoot * 60.0)
    # Capped: no single signal may swallow the whole score. Uncapped, a short
    # padded answer scores near zero on padding alone, which buries the length
    # judgement the dimension is mostly about.
    if "short_sample" not in m.low_confidence:
        penalty += min(30.0, _rate_penalty(m.hedge_per_minute, HEDGES_PER_MIN_OK, per_unit=2.0))
    penalty += min(10.0, max(0.0, m.words_per_sentence - 28) * 0.8)
    value = _clamp(100 - penalty)

    mm, ss = divmod(int(m.duration_seconds), 60)
    tm, ts = divmod(int(m.target_seconds), 60)
    evidence = [
        {"label": "Answer length", "value": f"{mm}m {ss:02d}s"},
        {"label": "Target", "value": f"{tm}m {ts:02d}s"},
        {"label": "Over target", "value": f"{int(m.over_target_seconds)}s"
         if m.over_target_seconds else "none"},
        {"label": "Padding phrases", "value": f"{m.hedge_count}",
         "note": f"{m.hedge_per_minute:.1f} per minute"},
        {"label": "Words per sentence", "value": f"{m.words_per_sentence:.0f}"},
    ]

    if m.over_target_seconds > m.target_seconds * 0.25:
        rec = (f"You went {int(m.over_target_seconds)}s past the target. "
               "Open with the outcome, then explain how you got there.")
    elif m.hedge_per_minute > HEDGES_PER_MIN_OK:
        rec = "Cut the padding — 'basically', 'kind of', 'you know' — and the same point lands shorter."
    elif m.words_per_sentence > 28:
        rec = "Sentences are running long. Break them; one idea per sentence is easier to follow."
    else:
        rec = "Well judged for length. Keep answers at this shape."

    conf = "low" if "short_sample" in m.low_confidence else "high"
    return Score("Conciseness", value, evidence, rec, conf)


def score_all(m: Measurements) -> list[Score]:
    return [score_fluency(m), score_conciseness(m)]
