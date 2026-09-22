"""DeepSeek client for resume-driven question generation.

Text only, always redacted contact info, never audio - see the discussion on
issue #4. This call also doubles as the authoritative "is this really a
resume" check: the local heuristic is a cheap pre-filter that can be fooled
(a job posting passes it), so the model is asked to make the real call and
can return valid=false even when the heuristic passed.
"""

import json
import logging

import httpx

from ..config import get_settings

log = logging.getLogger(__name__)

FIRST_QUESTION_PROMPT = """You are opening a mock technical interview from a candidate's resume.

First, judge whether the given text is genuinely a resume/CV for a specific
person - not a job posting, cover letter, template, or unrelated document.
Be strict: a job posting often shares resume vocabulary (skills, education,
experience) but describes a role, not a person's history.

If it is not a real resume, respond with valid=false and a short, specific
reason, and leave question/target_seconds null.

If it is a real resume, write the first question. It must reference
something concrete and specific from the resume - a named project, a
specific technology, a specific role - not a generic prompt ("tell me about
a project") that could apply to any resume. Give it a target_seconds between
60 and 150, appropriate to how much depth it calls for.

Respond with strict JSON only, no other text, matching exactly this shape:
{{"valid": true, "reason": null, "question": "...", "target_seconds": 90}}
or, if not a real resume:
{{"valid": false, "reason": "...", "question": null, "target_seconds": null}}
"""

NEXT_QUESTION_PROMPT = """You are conducting a mock technical interview from a candidate's resume,
one question at a time. You will be given the resume, then the questions
asked so far and the candidate's actual answers.

First, in "correction", write a short note (one or two sentences) only if
something in the candidate's most recent answer was technically incorrect,
vague to the point of not really answering, or worth flagging - otherwise
null. This is never shown to the candidate during the interview, only used
in the final report, so be direct and specific rather than encouraging.

Then decide whether to go deeper on the current topic or move to a new one.
Default to going deeper - a real interviewer spends several questions on
the same project before moving on, not one question per resume line. Only
move to a different, not-yet-covered part of the resume once the current
topic has had at least two substantive exchanges, or the candidate's last
answer was a non-answer/evasive dodge that leaves nothing to dig into.

When going deeper, make the question a genuine escalation, not a rephrase -
ask about a trade-off they made, a failure mode or edge case, what they
would change if a requirement shifted, or push back directly on a claim
("what if that library did not exist"). When moving on, reference something
specific and concrete (a named project, technology, or role), never a
generic prompt. Either way, give it a target_seconds between 60 and 150.

Finally, in "transition", write a short (one clause to one sentence)
natural spoken acknowledgment of the candidate's last answer, the way an
interviewer would react before asking the next thing - e.g. "Got it.",
"That makes sense.", "Interesting approach." Keep it brief and neutral, not
effusive praise, and make it fit naturally before the question when spoken
aloud together.

Respond with strict JSON only, no other text, matching exactly this shape:
{{"correction": "..." or null, "transition": "...", "question": "...", "target_seconds": 90}}
"""


REPORT_PROMPT = """You are writing the final report for a completed mock technical interview.
You will be given the candidate's resume and the full interview transcript
(every question asked and every answer given, in order).

Judge three dimensions, each on a 0-100 scale:

"relevance" - did each answer actually address what was asked, or did the
candidate talk around the question, skip parts of it, or answer a different
question than the one asked. Judge across all answers together, not just one.

"technical_knowledge" - was what the candidate said technically accurate and
substantive, checked against what their resume actually claims. A confident
but incorrect or hand-wavy answer should score low even if delivered fluently.

"clarity" - how easy the answers were to follow, including genuine grammar
errors (subject-verb agreement, tense consistency, and similar) if present.
Do not penalize normal spoken-language patterns - sentence fragments,
restarts, contractions - only score real communication problems.

For each dimension, give:
- "value": the 0-100 score
- "evidence": a short list of specific, checkable examples from the actual
  transcript, each as {{"label": "...", "value": "..."}} - "label" is brief
  context (which question/answer this is from), "value" is a quote or close
  paraphrase of the candidate's own words. Never a vague justification. For
  clarity, cite a specific error if one exists.
- "recommendation": one concrete, actionable sentence
- "confidence": "high", or "low" if the transcript gave too little to judge
  this dimension fairly (e.g. very short answers throughout)

Respond with strict JSON only, no other text, matching exactly this shape:
{{"dimensions": [
  {{"dimension": "Relevance", "value": 72, "evidence": [{{"label": "Q2 answer", "value": "..."}}], "recommendation": "...", "confidence": "high"}},
  {{"dimension": "Technical Knowledge", "value": 60, "evidence": [{{"label": "...", "value": "..."}}], "recommendation": "...", "confidence": "high"}},
  {{"dimension": "Clarity", "value": 80, "evidence": [{{"label": "...", "value": "..."}}], "recommendation": "...", "confidence": "high"}}
]}}
"""


class DeepSeekError(RuntimeError):
    pass


def _call(system_prompt: str, user_content: str) -> dict:
    settings = get_settings()
    if not settings.deepseek_api_key:
        raise DeepSeekError("DEEPSEEK_API_KEY is not set")

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.4,
    }

    try:
        resp = httpx.post(
            f"{settings.deepseek_base_url}/chat/completions",
            json=payload,
            headers={"Authorization": f"Bearer {settings.deepseek_api_key}"},
            timeout=60.0,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise DeepSeekError(f"DeepSeek request failed: {exc}") from exc

    body = resp.json()
    try:
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise DeepSeekError(f"unexpected DeepSeek response shape: {body}") from exc

    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise DeepSeekError(f"DeepSeek did not return valid JSON: {content[:300]}") from exc


def _format_history(history: list[dict]) -> str:
    lines = []
    for i, turn in enumerate(history, 1):
        lines.append(f"Q{i}: {turn['question']}")
        lines.append(f"A{i}: {turn['answer']}")
    return "\n".join(lines)


def generate_next_question(resume_text: str, history: list[dict]) -> dict:
    """One question at a time, adaptively.

    history is the ordered list of {"question": str, "answer": str} pairs
    already asked and answered — empty on the first call. Returns:
      first call:  {"valid": bool, "reason": str|None, "question": str|None,
                    "target_seconds": int|None}
      later calls: {"correction": str|None, "question": str, "target_seconds": int}

    Raises DeepSeekError for anything that stops this from producing a
    usable answer (no key, network/HTTP failure, malformed response) - the
    caller treats that as "processing failed", distinct from a model-judged
    valid=false on the first call.
    """
    if not history:
        parsed = _call(FIRST_QUESTION_PROMPT, resume_text)
        if "valid" not in parsed:
            raise DeepSeekError(f"DeepSeek response missing required fields: {parsed}")
        if parsed["valid"] and ("question" not in parsed or "target_seconds" not in parsed):
            raise DeepSeekError(f"malformed DeepSeek response: {parsed}")
        return parsed

    user_content = f"RESUME:\n{resume_text}\n\nINTERVIEW SO FAR:\n{_format_history(history)}"
    parsed = _call(NEXT_QUESTION_PROMPT, user_content)
    if "question" not in parsed or "target_seconds" not in parsed:
        raise DeepSeekError(f"malformed DeepSeek response: {parsed}")
    return parsed


REPORT_REQUIRED_FIELDS = {"dimension", "value", "evidence", "recommendation"}


def generate_report(resume_text: str, transcript: list[dict]) -> list[dict]:
    """One call, once, after the interview ends - judges Relevance, Technical
    Knowledge and Clarity over the whole transcript. Never touches
    Fluency/Conciseness, which stay deterministic (score.py).

    transcript is the same {"question": str, "answer": str} shape as
    generate_next_question's history - the full interview, not just the
    latest turn. Raises DeepSeekError on anything that stops this from
    producing a usable report; the caller decides how to degrade.
    """
    user_content = f"RESUME:\n{resume_text}\n\nFULL TRANSCRIPT:\n{_format_history(transcript)}"
    parsed = _call(REPORT_PROMPT, user_content)
    dimensions = parsed.get("dimensions")
    if not isinstance(dimensions, list) or not dimensions:
        raise DeepSeekError(f"malformed DeepSeek report response: {parsed}")
    for d in dimensions:
        if not REPORT_REQUIRED_FIELDS.issubset(d):
            raise DeepSeekError(f"malformed dimension in DeepSeek report response: {d}")
        # The model occasionally drops "confidence" despite the prompt's
        # exact shape - default rather than fail the whole report over one
        # optional-ish field on one dimension.
        d.setdefault("confidence", "high")
    return dimensions
