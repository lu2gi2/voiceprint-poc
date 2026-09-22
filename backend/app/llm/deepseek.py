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

SYSTEM_PROMPT = """You help build a mock technical interview from a candidate's resume.

First, judge whether the given text is genuinely a resume/CV for a specific
person - not a job posting, cover letter, template, or unrelated document.
Be strict: a job posting often shares resume vocabulary (skills, education,
experience) but describes a role, not a person's history.

If it is not a real resume, respond with valid=false and a short, specific
reason.

If it is a real resume, generate exactly {count} technical interview
questions. Each question must reference something concrete and specific from
the resume - a named project, a specific technology, a specific role - so
that only someone who actually did that work could answer it well. Do not
ask generic questions ("tell me about a project") that could apply to any
resume. Give each question a target_seconds between 60 and 150, appropriate
to how much depth the question calls for.

Respond with strict JSON only, no other text, matching exactly this shape:
{{"valid": true, "reason": null, "questions": [{{"prompt": "...", "target_seconds": 90}}]}}
or, if not a real resume:
{{"valid": false, "reason": "...", "questions": []}}
"""


class DeepSeekError(RuntimeError):
    pass


def generate_questions(resume_text: str, count: int = 6) -> dict:
    """Returns {"valid": bool, "reason": str | None, "questions": [...]}.

    Raises DeepSeekError for anything that stops this from producing a
    usable answer (no key configured, network/HTTP failure, unparseable or
    malformed response) - the caller treats that as "processing failed",
    distinct from a model-judged valid=false.
    """
    settings = get_settings()
    if not settings.deepseek_api_key:
        raise DeepSeekError("DEEPSEEK_API_KEY is not set")

    payload = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(count=count)},
            {"role": "user", "content": resume_text},
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
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise DeepSeekError(f"DeepSeek did not return valid JSON: {content[:300]}") from exc

    if "valid" not in parsed or "questions" not in parsed:
        raise DeepSeekError(f"DeepSeek response missing required fields: {parsed}")

    if parsed["valid"]:
        for q in parsed["questions"]:
            if "prompt" not in q or "target_seconds" not in q:
                raise DeepSeekError(f"malformed question in DeepSeek response: {q}")

    return parsed
