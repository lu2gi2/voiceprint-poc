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
from .tracks import get_track

log = logging.getLogger(__name__)

# Shared prompt shape across every track — see tracks.py for what actually
# varies per track (opening focus, what "going deeper" means, what the
# report judges). One pipeline, many track configs, not one prompt set
# copy-pasted per track.

FIRST_QUESTION_TEMPLATE = """You are opening a mock {label} from a candidate's resume.

First, judge whether the given text is genuinely a resume/CV for a specific
person - not a job posting, cover letter, template, or unrelated document.
Be strict: a job posting often shares resume vocabulary (skills, education,
experience) but describes a role, not a person's history.

If it is not a real resume, respond with valid=false and a short, specific
reason, and leave question/target_seconds null.

If it is a real resume, write the first question. {opening_instructions}
Give it a target_seconds between 60 and 150, appropriate to how much depth
it calls for.

Respond with strict JSON only, no other text, matching exactly this shape:
{{"valid": true, "reason": null, "question": "...", "target_seconds": 90}}
or, if not a real resume:
{{"valid": false, "reason": "...", "question": null, "target_seconds": null}}
"""

NEXT_QUESTION_TEMPLATE = """You are conducting a mock {label} from a candidate's resume, one question
at a time. You will be given the resume, then the questions asked so far and
the candidate's actual answers.{engagement_note}

First, in "correction", write a short note (one or two sentences) only if
something in the candidate's most recent answer was {correction_criteria} -
otherwise null. This is never shown to the candidate during the interview,
only used in the final report, so be direct and specific rather than
encouraging.

{followup_instructions}

Finally, in "transition", write a short (one clause to one sentence)
natural spoken acknowledgment of the candidate's last answer, the way an
interviewer would react before asking the next thing - e.g. "Got it.",
"That makes sense.", "Interesting approach." Keep it brief and neutral, not
effusive praise, and make it fit naturally before the question when spoken
aloud together.

Respond with strict JSON only, no other text, matching exactly this shape:
{{"correction": "..." or null, "transition": "...", "question": "...", "target_seconds": 90}}
"""

ENGAGEMENT_FOLLOWUP_NOTE = (
    " You may also be given this turn's camera engagement observations (the "
    "percent of time the candidate's face was in frame, the percent of time "
    "their gaze was roughly forward, and head-pose stability) as raw "
    "supplementary context alongside their spoken answer. Never treat it as "
    "confidence, honesty or emotion, never let it override judging the words "
    "themselves, and only mention it at all if it is genuinely extreme (e.g. "
    "the candidate was out of frame for most of the answer) - always "
    "alongside what they actually said, never by itself."
)

REPORT_TEMPLATE = """You are writing the final report for a completed mock {label}.
You will be given the full interview transcript (every question asked and
every answer given, in order){resume_clause}.{engagement_report_note}

Judge these dimensions, each on a 0-100 scale:

{dimension_block}

For each dimension, give:
- "value": the 0-100 score
- "evidence": a short list of specific, checkable examples from the actual
  transcript, each as {{"label": "...", "value": "..."}} - "label" is brief
  context (which question/answer this is from), "value" is a quote or close
  paraphrase of the candidate's own words. Never a vague justification.
- "recommendation": one concrete, actionable sentence
- "confidence": "high", or "low" if the transcript gave too little to judge
  this dimension fairly (e.g. very short answers throughout)

Respond with strict JSON only, no other text, matching exactly this shape:
{{"dimensions": [
{dimension_example_block}
]}}
"""

ENGAGEMENT_REPORT_NOTE_TEMPLATE = (
    " You are also given, per answer, this session's raw camera engagement "
    "observations (percent of time the candidate's face was in frame, "
    "percent of time their gaze was roughly forward, head-pose stability) as "
    "supplementary evidence only. Use it, if at all, only to add supporting "
    "color to the '{evidence_for}' dimension's evidence and recommendation "
    "(e.g. noting sustained eye contact, or a candidate who stepped out of "
    "frame) - never to justify a dimension's score by itself, never as a "
    "stand-in for what the candidate actually said, and never described as "
    "confidence, honesty or emotion."
)


def _build_first_question_prompt(track: dict) -> str:
    return FIRST_QUESTION_TEMPLATE.format(
        label=track["label"], opening_instructions=track["opening_instructions"]
    )


def _build_next_question_prompt(track: dict, has_engagement_signals: bool) -> str:
    engagement_note = ENGAGEMENT_FOLLOWUP_NOTE if (track["uses_engagement_signals"] and has_engagement_signals) else ""
    return NEXT_QUESTION_TEMPLATE.format(
        label=track["label"],
        engagement_note=engagement_note,
        correction_criteria=track["correction_criteria"],
        followup_instructions=track["followup_instructions"],
    )


def _build_report_prompt(track: dict, has_engagement_signals: bool) -> str:
    dimension_block = "\n\n".join(
        f'"{d["key"]}" - {d["judge"]}' for d in track["dimensions"]
    )
    dimension_example_block = ",\n".join(
        f'  {{"dimension": "{d["key"]}", "value": 72, '
        f'"evidence": [{{"label": "...", "value": "..."}}], '
        f'"recommendation": "...", "confidence": "high"}}'
        for d in track["dimensions"]
    )
    engagement_report_note = ""
    if track["uses_engagement_signals"] and has_engagement_signals and track["evidence_for"]:
        engagement_report_note = ENGAGEMENT_REPORT_NOTE_TEMPLATE.format(evidence_for=track["evidence_for"])
    resume_clause = ", and the candidate's resume" if track.get("needs_resume", True) else ""
    return REPORT_TEMPLATE.format(
        label=track["label"],
        resume_clause=resume_clause,
        engagement_report_note=engagement_report_note,
        dimension_block=dimension_block,
        dimension_example_block=dimension_example_block,
    )


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


def generate_next_question(
    resume_text: str,
    history: list[dict],
    *,
    track: str | None = None,
    engagement_signals: dict | None = None,
) -> dict:
    """One question at a time, adaptively, for whichever track this session
    is (see tracks.py) — resume-driven tracks all share this one pipeline.

    history is the ordered list of {"question": str, "answer": str} pairs
    already asked and answered — empty on the first call. Returns:
      first call:  {"valid": bool, "reason": str|None, "question": str|None,
                    "target_seconds": int|None}
      later calls: {"correction": str|None, "question": str, "target_seconds": int}

    engagement_signals is the most recent answer's camera telemetry
    (face_in_frame_ratio, gaze_forward_ratio, head_pose_stability) — only
    meaningful, and only sent, for tracks with uses_engagement_signals=True
    (see tracks.py); ignored otherwise.

    Raises DeepSeekError for anything that stops this from producing a
    usable answer (no key, network/HTTP failure, malformed response) - the
    caller treats that as "processing failed", distinct from a model-judged
    valid=false on the first call.
    """
    track_config = get_track(track)

    if not history:
        parsed = _call(_build_first_question_prompt(track_config), resume_text)
        if "valid" not in parsed:
            raise DeepSeekError(f"DeepSeek response missing required fields: {parsed}")
        if parsed["valid"] and ("question" not in parsed or "target_seconds" not in parsed):
            raise DeepSeekError(f"malformed DeepSeek response: {parsed}")
        return parsed

    user_content = f"RESUME:\n{resume_text}\n\nINTERVIEW SO FAR:\n{_format_history(history)}"
    if track_config["uses_engagement_signals"] and engagement_signals:
        user_content += (
            "\n\nCAMERA OBSERVATIONS FOR THE LAST ANSWER (raw ratios, not scores):\n"
            f"{json.dumps(engagement_signals)}"
        )
    prompt = _build_next_question_prompt(track_config, has_engagement_signals=bool(engagement_signals))
    parsed = _call(prompt, user_content)
    if "question" not in parsed or "target_seconds" not in parsed:
        raise DeepSeekError(f"malformed DeepSeek response: {parsed}")
    return parsed


REPORT_REQUIRED_FIELDS = {"dimension", "value", "evidence", "recommendation"}


def generate_report(resume_text: str, transcript: list[dict], *, track: str | None = None) -> list[dict]:
    """One call, once, after the interview ends - judges the dimensions
    tracks.py defines for this track over the whole transcript. Never
    touches Fluency/Conciseness, which stay deterministic (score.py).

    transcript is the same {"question": str, "answer": str} shape as
    generate_next_question's history - the full interview, not just the
    latest turn. Entries may also carry "engagement_signals" (per-answer
    camera telemetry); only tracks with uses_engagement_signals=True (see
    tracks.py) actually get told to use it, and then only as supplementary
    evidence for one named dimension, never scored on its own.

    Raises DeepSeekError on anything that stops this from producing a
    usable report; the caller decides how to degrade.
    """
    track_config = get_track(track)
    has_engagement_signals = track_config["uses_engagement_signals"] and any(
        t.get("engagement_signals") for t in transcript
    )

    lines = []
    for i, turn in enumerate(transcript, 1):
        lines.append(f"Q{i}: {turn['question']}")
        lines.append(f"A{i}: {turn['answer']}")
        if has_engagement_signals and turn.get("engagement_signals"):
            lines.append(f"Camera observations for A{i}: {json.dumps(turn['engagement_signals'])}")

    resume_block = f"RESUME:\n{resume_text}\n\n" if track_config.get("needs_resume", True) else ""
    user_content = f"{resume_block}FULL TRANSCRIPT:\n" + "\n".join(lines)

    prompt = _build_report_prompt(track_config, has_engagement_signals)
    parsed = _call(prompt, user_content)
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
