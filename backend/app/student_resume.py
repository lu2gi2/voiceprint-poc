"""Turns an uploaded profile resume into the sticky-note wall's five notes.

Same background-task shape as resume/pipeline.py's process_resume: local
checks already ran synchronously in the API layer before this is queued
(see api/profile.py), this only does the one DeepSeek call and takes an id
rather than an ORM object since it runs on a worker thread.
"""

import logging

from .db import SessionLocal
from .llm import DeepSeekError, generate_resume_notes
from .models import StudentResume
from .resume.heuristic import redact_contact_info

log = logging.getLogger(__name__)


def process_student_resume(resume_id: int) -> None:
    db = SessionLocal()
    try:
        resume = db.get(StudentResume, resume_id)
        if resume is None:
            log.warning("student resume %s vanished before processing", resume_id)
            return

        try:
            notes = generate_resume_notes(redact_contact_info(resume.extracted_text or ""))
        except DeepSeekError as exc:
            log.exception("student resume %s: note generation failed", resume_id)
            resume.status = "failed"
            resume.reject_reason = str(exc)[:500]
            db.commit()
            return

        resume.notes = notes
        resume.status = "ready"
        resume.reject_reason = None
        db.commit()
        log.info("student resume %s processed: %d notes generated", resume_id, len(notes))

    except Exception as exc:  # noqa: BLE001 — a bad resume must not kill the worker
        log.exception("student resume %s failed", resume_id)
        db.rollback()
        resume = db.get(StudentResume, resume_id)
        if resume is not None:
            resume.status = "failed"
            resume.reject_reason = str(exc)[:500]
            db.commit()
    finally:
        db.close()
