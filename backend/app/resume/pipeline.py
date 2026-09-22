"""Turns a validated resume into a pre-rendered question list.

Runs as a background task, same reasoning as app/pipeline/runner.py: this
takes seconds (one DeepSeek call, then one Kokoro synthesis per question),
opens its own DB session since it runs on a worker thread, and takes an id
rather than an ORM object for the same reason.
"""

import io
import logging

from ..db import SessionLocal
from ..llm import DeepSeekError, generate_next_question, generate_report
from ..llm.tracks import TRACKS
from ..models import Answer, InterviewSession, Resume, SessionQuestion
from ..storage import audio_store
from ..tts import synthesize_wav_bytes
from .heuristic import redact_contact_info

log = logging.getLogger(__name__)

# Fixed interview length. The backend never generates a 7th question past
# this; the frontend independently knows to stop asking after answer 6, so
# no "done" signal needs to round-trip - see the plan on issue #4.
MAX_QUESTIONS = 6


def update_student_score(session: InterviewSession, dimensions: list[dict]) -> None:
    """Hook point for the longitudinal per-student score store.

    That store is planned as a separate Postgres-backed service, not yet
    built - this call is the seam it will plug into once it exists (fired
    right after a session's report is ready, with the student id and this
    session's judged dimensions). No-op for now besides logging.
    """
    log.info(
        "student %s: score-update hook fired for session %s (%d dimensions, not yet wired to a store)",
        session.student_id,
        session.id,
        len(dimensions),
    )


def process_resume(resume_id: int) -> None:
    db = SessionLocal()
    try:
        resume = db.get(Resume, resume_id)
        if resume is None:
            log.warning("resume %s vanished before processing", resume_id)
            return

        session = db.get(InterviewSession, resume.session_id)
        track = session.assessment_id if session is not None else None

        try:
            result = generate_next_question(redact_contact_info(resume.extracted_text or ""), [], track=track)
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

        wav_bytes = synthesize_wav_bytes(result["question"])
        audio_key = audio_store.put(io.BytesIO(wav_bytes), suffix=".wav")
        db.add(SessionQuestion(
            session_id=resume.session_id,
            question_index=0,
            prompt=result["question"],
            target_seconds=result["target_seconds"],
            audio_key=audio_key,
        ))

        # 'ready' means "the interview can start, question 1 exists" - not
        # "all questions exist". Questions 2..MAX_QUESTIONS are generated one
        # at a time, chained off each answer in process_answer().
        resume.status = "ready"
        resume.reject_reason = None
        db.commit()
        log.info("resume %s processed: question 1 generated", resume_id)

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


def maybe_continue_interview(answer_id: int) -> None:
    """Called from process_answer() once an answer is scored. If this answer
    belongs to a resume-driven session that still has questions left,
    generates the next one adaptively and stashes any correction on this
    answer. Does nothing for scripted tracks (no Resume row) or once
    MAX_QUESTIONS is reached (frontend independently stops asking).

    Opens its own DB session, same reasoning as process_resume/process_answer
    - this runs after process_answer's own session has already committed and
    closed, on the same background thread, not concurrently with it.
    """
    db = SessionLocal()
    try:
        answer = db.get(Answer, answer_id)
        if answer is None:
            return

        resume = db.query(Resume).filter(Resume.session_id == answer.session_id).one_or_none()
        if resume is None or resume.status != "ready":
            return  # scripted track, or resume-driven but not past setup

        session = db.get(InterviewSession, answer.session_id)
        track = session.assessment_id if session is not None else None

        existing = (
            db.query(SessionQuestion)
            .filter(SessionQuestion.session_id == answer.session_id)
            .order_by(SessionQuestion.question_index)
            .all()
        )
        if len(existing) >= MAX_QUESTIONS:
            return  # interview already has its full script

        answers = {
            a.question_index: a
            for a in db.query(Answer).filter(Answer.session_id == answer.session_id).all()
        }
        history = [
            {"question": q.prompt, "answer": answers[q.question_index].transcript or ""}
            for q in existing
            if q.question_index in answers
        ]

        try:
            result = generate_next_question(
                redact_contact_info(resume.extracted_text or ""),
                history,
                track=track,
                engagement_signals=answer.engagement_signals,
            )
        except DeepSeekError:
            log.exception("session %s: next-question generation failed", answer.session_id)
            return  # the interview simply stalls here for this student; not retried

        if result.get("correction"):
            answer.llm_note = result["correction"]

        # The transition ("Got it.", "Interesting approach.") is spoken but
        # not stored as part of the question text - future history/context
        # should see only the actual question that was asked, not the
        # acknowledgment wrapped around it.
        transition = result.get("transition") or ""
        spoken = f"{transition} {result['question']}".strip()
        wav_bytes = synthesize_wav_bytes(spoken)
        audio_key = audio_store.put(io.BytesIO(wav_bytes), suffix=".wav")
        db.add(SessionQuestion(
            session_id=answer.session_id,
            question_index=len(existing),
            prompt=result["question"],
            target_seconds=result["target_seconds"],
            audio_key=audio_key,
        ))
        db.commit()
        log.info("session %s: question %d generated", answer.session_id, len(existing))

    except Exception:  # noqa: BLE001 — a bad turn must not kill the worker
        log.exception("session's next question failed for answer %s", answer_id)
        db.rollback()
    finally:
        db.close()


def generate_session_report(session_id: int) -> None:
    """Called once, after a session is marked complete: one DeepSeek call
    over the whole transcript, judging whatever dimensions this track
    defines (see tracks.py). Never touches Fluency/Conciseness - those stay
    deterministic and are already on each Answer regardless of report
    status.

    No-op for any track with no dimensions defined (e.g. Impromptu Speaking,
    which measures only Fluency/Conciseness by design - see assessments.js)
    and, for resume-driven tracks, until the resume has actually cleared
    setup. Fixed-script tracks (no Resume row at all) build their transcript
    straight from each Answer's own prompt instead.
    """
    db = SessionLocal()
    try:
        session = db.get(InterviewSession, session_id)
        if session is None:
            return

        track_config = TRACKS.get(session.assessment_id)
        if track_config is None:
            return  # no report defined for this track

        resume = db.query(Resume).filter(Resume.session_id == session_id).one_or_none()
        resume_text = ""
        if track_config.get("needs_resume", True):
            if resume is None or resume.status != "ready":
                return  # resume-driven but never got past setup
            resume_text = redact_contact_info(resume.extracted_text or "")

        answers = (
            db.query(Answer)
            .filter(Answer.session_id == session_id, Answer.transcript.isnot(None))
            .order_by(Answer.question_index)
            .all()
        )
        if not answers:
            return  # nothing to judge

        questions = {
            q.question_index: q.prompt
            for q in db.query(SessionQuestion).filter(SessionQuestion.session_id == session_id).all()
        }
        transcript = [
            {
                "question": questions.get(a.question_index, a.prompt),
                "answer": a.transcript,
                "engagement_signals": a.engagement_signals,
            }
            for a in answers
        ]

        session.report_status = "processing"
        db.commit()

        try:
            dimensions = generate_report(resume_text, transcript, track=session.assessment_id)
        except DeepSeekError:
            log.exception("session %s: report generation failed", session_id)
            session.report_status = "failed"
            db.commit()
            return

        session.report_dimensions = dimensions
        session.report_status = "ready"
        db.commit()
        log.info("session %s: report generated, %d dimensions", session_id, len(dimensions))

        update_student_score(session, dimensions)

    except Exception:  # noqa: BLE001 — a bad report must not kill the worker
        log.exception("report generation crashed for session %s", session_id)
        db.rollback()
        session = db.get(InterviewSession, session_id)
        if session is not None:
            session.report_status = "failed"
            db.commit()
    finally:
        db.close()
