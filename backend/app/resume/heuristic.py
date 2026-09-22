"""Cheap local check: does this text look resume-shaped?

Not a classifier — regex/keyword pattern-matching, easy to fool both ways (see
the discussion on issue #4). Its only job is to catch the *obviously wrong*
upload (a lecture PDF, an invoice, an empty scan) before spending an API call
on it. The authoritative check is the DeepSeek call that follows, which reads
actual content and can return valid=false itself.

The pass bar is deliberately low: a false reject blocks a real student with
no recourse (bad), a false accept just costs one extra LLM call that
correctly flags it a moment later (cheap). When in doubt, let it through.
"""

import re
from dataclasses import dataclass, field

MIN_WORDS = 50
MAX_WORDS = 4000

# Each is one category; a resume typically hits several, and this only
# requires two — not every header naming convention needs to match.
SECTION_HEADERS = {
    "experience": r"\b(work\s+)?experience\b",
    "education": r"\beducation\b",
    "skills": r"\bskills\b",
    "projects": r"\bprojects?\b",
    "certifications": r"\bcertifications?\b",
    "summary": r"\b(summary|objective)\b",
}

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
DATE_RANGE_RE = re.compile(
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec\w*|\d{4})\s*"
    r"[-–—]\s*(present|current|\d{4})",
    re.IGNORECASE,
)

# Any one of these is a fairly strong tell that this is a different kind of
# document entirely (academic paper, invoice), not a resume with unusual
# formatting.
NEGATIVE_SIGNALS = [
    r"\babstract\b",
    r"\breferences\b",
    r"\bdoi:\s*10\.",
    r"\binvoice\b",
    r"\btotal\s+(due|amount)\b",
    r"\btable\s+of\s+contents\b",
]


@dataclass
class HeuristicResult:
    passed: bool
    score: int
    word_count: int
    signals: dict[str, bool] = field(default_factory=dict)
    reason: str | None = None


def check_resume_shape(text: str) -> HeuristicResult:
    words = text.split()
    word_count = len(words)

    if word_count < MIN_WORDS:
        return HeuristicResult(False, 0, word_count, {}, "too short to be a resume")
    if word_count > MAX_WORDS:
        return HeuristicResult(False, 0, word_count, {}, "too long to be a resume")

    lower = text.lower()

    header_hits = {name: bool(re.search(pat, lower)) for name, pat in SECTION_HEADERS.items()}
    header_categories = sum(header_hits.values())
    has_headers = header_categories >= 2

    has_contact = bool(EMAIL_RE.search(text)) or bool(PHONE_RE.search(text))
    has_dates = bool(DATE_RANGE_RE.search(text))
    negative_hits = [pat for pat in NEGATIVE_SIGNALS if re.search(pat, lower)]

    score = int(has_headers) + int(has_contact) + int(has_dates)
    if negative_hits:
        score -= 3

    signals = {
        "headers": has_headers,
        "header_categories": header_categories,
        "contact": has_contact,
        "dates": has_dates,
        "negative_hits": len(negative_hits),
    }

    passed = score >= 2
    reason = None if passed else "does not look like a resume (low signal match)"
    return HeuristicResult(passed, score, word_count, signals, reason)
