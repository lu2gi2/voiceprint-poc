import re
from dataclasses import dataclass, field

from .acoustics import Acoustics
from .transcribe import Transcript

# Unambiguous vocalised fillers. These are sounds, not words — if one appears
# in a transcript it is a filler, with no judgement call to make.
FILLERS = {
    "um", "umm", "ummm", "uh", "uhh", "uhhh", "erm", "er", "ah", "ahh",
    "mm", "mmm", "hmm", "hm", "mhm", "eh", "uhm",
}

# Discourse markers. Counted separately and never folded into the filler count,
# because every one of these has a legitimate use — "like" is a filler in
# "it was like really hard" and a comparison in "a tool like this". Reporting
# them as fillers would manufacture evidence the audio does not support.
HEDGES = {
    "like", "basically", "actually", "literally", "honestly", "obviously",
    "sort", "kind", "really", "just", "stuff", "things",
}
HEDGE_PHRASES = ["you know", "i mean", "sort of", "kind of", "or something", "and so on"]

# Below this, per-minute rates are noise rather than signal.
MIN_SECONDS_FOR_RATES = 15.0

PAUSE_SECONDS = 0.35
LONG_PAUSE_SECONDS = 1.0

_word_re = re.compile(r"[a-z']+")


def _norm(tok: str) -> str:
    return _word_re.findall(tok.lower().strip())[0] if _word_re.findall(tok.lower()) else ""


@dataclass
class Measurements:
    """Every number the scores are allowed to cite.

    Nothing downstream may invent a figure that is not in here — that is the
    whole point of PRD §7. Each field is something that was counted or timed,
    not inferred.
    """

    duration_seconds: float = 0.0
    target_seconds: int = 0
    over_target_seconds: float = 0.0

    word_count: int = 0
    speaking_rate_wpm: float = 0.0      # words over the whole answer
    articulation_rate_wpm: float = 0.0  # words over talking time only

    pause_count: int = 0
    long_pause_count: int = 0
    pause_seconds_total: float = 0.0
    pause_seconds_mean: float = 0.0
    longest_pause_seconds: float = 0.0

    filler_count: int = 0
    filler_per_minute: float = 0.0
    filler_examples: list[str] = field(default_factory=list)

    hedge_count: int = 0
    hedge_per_minute: float = 0.0

    repeated_word_count: int = 0

    sentence_count: int = 0
    words_per_sentence: float = 0.0

    voiced_ratio: float = 0.0
    volume_consistency: float = 0.0
    pitch_variation: float = 0.0

    # Metrics the engine knows it cannot stand behind. Whisper is trained to
    # produce clean prose and quietly drops "um"/"uh", so a low filler count
    # may mean a fluent speaker or may mean the model tidied up — and the two
    # are indistinguishable from here. Surfaced so the UI can qualify it
    # rather than presenting a possibly-wrong number as evidence.
    low_confidence: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            k: (round(v, 2) if isinstance(v, float) else v)
            for k, v in self.__dict__.items()
        }


def measure(tr: Transcript, ac: Acoustics, target_seconds: int) -> Measurements:
    m = Measurements()
    m.duration_seconds = ac.duration_seconds or tr.audio_seconds
    m.target_seconds = target_seconds
    m.over_target_seconds = max(0.0, m.duration_seconds - target_seconds)

    m.voiced_ratio = ac.voiced_ratio
    m.volume_consistency = ac.volume_consistency
    m.pitch_variation = ac.pitch_variation

    words = tr.words
    tokens = [_norm(w.text) for w in words]
    tokens = [t for t in tokens if t]
    m.word_count = len(tokens)

    minutes = m.duration_seconds / 60.0 if m.duration_seconds > 0 else 0.0
    m.speaking_rate_wpm = (m.word_count / minutes) if minutes > 0 else 0.0

    # --- pauses, from the gaps between words ---
    gaps: list[float] = []
    for a, b in zip(words, words[1:]):
        gap = b.start - a.end
        if gap >= PAUSE_SECONDS:
            gaps.append(gap)
    m.pause_count = len(gaps)
    m.long_pause_count = sum(1 for g in gaps if g >= LONG_PAUSE_SECONDS)
    m.pause_seconds_total = float(sum(gaps))
    m.pause_seconds_mean = float(sum(gaps) / len(gaps)) if gaps else 0.0
    m.longest_pause_seconds = float(max(gaps)) if gaps else 0.0

    talking = max(0.1, m.duration_seconds - m.pause_seconds_total)
    m.articulation_rate_wpm = m.word_count / (talking / 60.0)

    # --- fillers and hedges ---
    found = [t for t in tokens if t in FILLERS]
    m.filler_count = len(found)
    m.filler_per_minute = (m.filler_count / minutes) if minutes > 0 else 0.0
    m.filler_examples = sorted(set(found))[:5]

    text = " ".join(tokens)
    hedges = sum(1 for t in tokens if t in HEDGES)
    hedges += sum(text.count(p) for p in HEDGE_PHRASES)
    m.hedge_count = hedges
    m.hedge_per_minute = (hedges / minutes) if minutes > 0 else 0.0

    # --- restarts: the same word twice in a row ---
    m.repeated_word_count = sum(1 for a, b in zip(tokens, tokens[1:]) if a == b and len(a) > 1)

    # --- sentence shape, from Whisper's own punctuation ---
    sentences = [s for s in re.split(r"[.!?]+", tr.text) if s.strip()]
    m.sentence_count = len(sentences)
    m.words_per_sentence = (m.word_count / len(sentences)) if sentences else 0.0

    if m.filler_count == 0:
        m.low_confidence.append("filler_count")
    if not words:
        m.low_confidence.append("no_speech_detected")
    # Per-minute rates are extrapolations. From a 4-second clip, two hedges
    # reads as 30/min, which is an artefact of the sample length rather than
    # anything the student did. Flag it so scoring can decline to penalise.
    if 0 < m.duration_seconds < MIN_SECONDS_FOR_RATES:
        m.low_confidence.append("short_sample")

    return m
