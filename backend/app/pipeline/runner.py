import logging
from datetime import datetime, timezone

from ..db import SessionLocal
from ..models import Answer, AnswerScore
from ..storage import audio_store
from .acoustics import analyse
from .audio import to_wav16k
from .measure import measure
from .score import score_all
from .transcribe import transcribe

log = logging.getLogger(__name__)


def process_answer(answer_id: int) -> None:
    """Run one answer through the pipeline and persist the result.

    Takes an id rather than an ORM object and opens its own session: this runs
    on a worker thread, and SQLAlchemy sessions are not safe to share across
    threads. When this graduates to a real queue the signature does not change.
    """
    db = SessionLocal()
    wav = None
    try:
        answer = db.get(Answer, answer_id)
        if answer is None:
            log.warning("answer %s vanished before processing", answer_id)
            return

        answer.status = "processing"
        answer.processing_started_at = datetime.now(timezone.utc)
        db.commit()

        src = audio_store.path(answer.audio_key)
        wav = to_wav16k(src)

        # Both branches of PRD §13 — what was said, and how it sounded.
        tr = transcribe(wav)
        ac = analyse(wav)

        m = measure(tr, ac, answer.target_seconds)
        scores = score_all(m)

        answer.transcript = tr.text
        answer.words = tr.as_dicts()
        answer.measurements = m.as_dict()
        answer.scores = [s.as_dict() for s in scores]
        answer.answer_scores = [
            AnswerScore(
                dimension=s.dimension,
                value=s.value,
                recommendation=s.recommendation,
                confidence=s.confidence,
                evidence=s.evidence,
            )
            for s in scores
        ]
        answer.duration_seconds = m.duration_seconds
        answer.status = "ready"
        answer.error = None
        answer.processed_at = datetime.now(timezone.utc)
        answer.processing_started_at = None
        db.commit()
        log.info("answer %s processed: %d words, %.0f wpm", answer_id, m.word_count,
                 m.speaking_rate_wpm)

    except Exception as exc:  # noqa: BLE001 — a bad answer must not kill the worker
        log.exception("answer %s failed", answer_id)
        db.rollback()
        answer = db.get(Answer, answer_id)
        if answer is not None:
            answer.status = "failed"
            answer.error = str(exc)[:500]
            answer.processing_started_at = None
            db.commit()
    finally:
        if wav is not None:
            wav.unlink(missing_ok=True)
        db.close()
