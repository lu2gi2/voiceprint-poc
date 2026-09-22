"""DeepSeek call behind the profile resume's sticky-note wall.

Separate from app/llm/tracks.py's interview pipeline - this judges a resume
document itself, not an interview transcript, and always produces exactly
five fixed categories (the sticky-note wall's five notes) rather than a
per-track dimension list.
"""

import json

from .deepseek import DeepSeekError, _call

RESUME_NOTES_PROMPT = """You are reviewing a resume for a student placement-prep tool. You will be
given the resume text (contact info already redacted).

Judge exactly these five categories - always return all five, even if a
category found nothing wrong (say so honestly in "note" and give it a high
pct and a count of 0; do not invent a problem to fill the slot):

"verbs" (REPETITIVE VERBS) - the same weak action verb ("helped", "worked
on", "assisted", "responsible for") reused across multiple bullets instead
of varied, specific verbs.

"metrics" (MISSING METRICS) - bullets describing what was done with no
measurable result (a %, a count, a time saved, a scale) to back it up.

"star" (BULLET STRUCTURE) - bullets that name an action but never state the
outcome - missing the Result half of Action + Context + Outcome.

"keywords" (KEYWORD GAPS) - skills/tools the resume's own project or
experience descriptions imply but never name explicitly (e.g. describes
building a REST API but never writes "REST API" or "API" anywhere) -
generic ATS keyword advice not grounded in this resume's actual content
does not belong here.

"brevity" (FILLER PHRASES) - stock filler phrases that cost space without
adding information ("responsible for", "successfully", "tasked with", "in
order to").

For each category give:
- "count": how many real instances you actually found (integer, 0 if none)
- "pct": 0-100, how strong this resume already is on this category (100 =
  no problem at all, not "how bad it is" - a high count should pull this
  down)
- "tip": one concrete, actionable sentence
- "note": one or two sentences citing the actual instances found (quote or
  closely paraphrase the resume's own words) - not a generic template
  paragraph. If count is 0, say plainly that none were found.
- "rows": exactly two [label, pct 0-100] pairs, two different specific
  sub-aspects of this category scored separately (e.g. for "verbs":
  ["Action Verbs", 65], ["Verb Variety", 71])

Respond with strict JSON only, no other text, matching exactly this shape:
{{"notes": [
  {{"key": "verbs", "count": 4, "pct": 68, "tip": "...", "note": "...", "rows": [["Action Verbs", 65], ["Verb Variety", 71]]}},
  {{"key": "metrics", "count": 3, "pct": 58, "tip": "...", "note": "...", "rows": [["Measurable Impact", 54], ["Numbers & Data", 62]]}},
  {{"key": "star", "count": 2, "pct": 81, "tip": "...", "note": "...", "rows": [["Action & Context", 86], ["Result Closure", 76]]}},
  {{"key": "keywords", "count": 3, "pct": 74, "tip": "...", "note": "...", "rows": [["Domain Skills", 78], ["Keyword Balance", 70]]}},
  {{"key": "brevity", "count": 5, "pct": 76, "tip": "...", "note": "...", "rows": [["Sentence Tightness", 78], ["Filler Removal", 74]]}}
]}}
"""

REQUIRED_KEYS = {"verbs", "metrics", "star", "keywords", "brevity"}
REQUIRED_FIELDS = {"key", "count", "pct", "tip", "note", "rows"}


def generate_resume_notes(resume_text: str) -> list[dict]:
    """One call, once, right after a profile resume passes local checks.
    Raises DeepSeekError on anything that stops this from producing a
    usable set of notes; the caller decides how to degrade."""
    parsed = _call(RESUME_NOTES_PROMPT, resume_text)
    notes = parsed.get("notes")
    if not isinstance(notes, list):
        raise DeepSeekError(f"malformed resume-notes response: {parsed}")

    found_keys = set()
    for n in notes:
        if not REQUIRED_FIELDS.issubset(n) or not isinstance(n.get("rows"), list) or len(n["rows"]) != 2:
            raise DeepSeekError(f"malformed note in resume-notes response: {n}")
        found_keys.add(n["key"])
    if found_keys != REQUIRED_KEYS:
        raise DeepSeekError(f"resume-notes response missing categories: {REQUIRED_KEYS - found_keys}")

    return notes
