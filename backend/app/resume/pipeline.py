"""Turns a validated resume into a pre-rendered question list.

Runs as a background task, same reasoning as app/pipeline/runner.py: this
takes seconds (one DeepSeek call, then one Kokoro synthesis per question),
opens its own DB session since it runs on a worker thread, and takes an id
rather than an ORM object for the same reason.
"""

import io
import logging

from ..db import SessionLocal
from ..llm import DeepSeekError, generate_questions
from ..models import Resume, SessionQuestion
from ..storage import audio_store
from ..tts import synthesize_wav_bytes
from .heuristic import redact_contact_info

log = logging.getLogger(__name__)


def process_resume(resume_id: int) -> None:
    db = SessionLocal()
    try:
        resume = db.get(Resume, resume_id)
        if resume is None:
            log.warning("resume %s vanished before processing", resume_id)
            return

        try:
            result = generate_questions(redact_contact_info(resume.extracted_text or ""))
        except DeepSeekError as exc:
            log.exception("resume %s: question generation failed", resume_id)
            resume.status = "failed"
            resume.reject_reason = str(exc)[:500]
            db.commit()
            return

        if not result["valid"]:
            # The heuristic passed this (it is only a cheap pre-filter), but
            # the model looked at actual content and disagrees - that is the
            # authoritative call, per the design on issue #4.
            resume.status = "rejected"
            resume.reject_reason = result["reason"]
            db.commit()
            return

        for i, q in enumerate(result["questions"]):
            wav_bytes = synthesize_wav_bytes(q["prompt"])
            audio_key = audio_store.put(io.BytesIO(wav_bytes), suffix=".wav")
            db.add(SessionQuestion(
                session_id=resume.session_id,
                question_index=i,
                prompt=q["prompt"],
                target_seconds=q["target_seconds"],
                audio_key=audio_key,
            ))

        resume.status = "ready"
        resume.reject_reason = None
        db.commit()
        log.info("resume %s processed: %d questions generated", resume_id, len(result["questions"]))

    except Exception as exc:  # noqa: BLE001 — a bad resume must not kill the worker
        log.exception("resume %s failed", resume_id)
        db.rollback()
        resume = db.get(Resume, resume_id)
        if resume is not None:
            resume.status = "failed"
            resume.reject_reason = str(exc)[:500]
            db.commit()
    finally:
        db.close()
