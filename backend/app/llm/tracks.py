"""Per-track configuration for the adaptive resume-driven interview pipeline.

One pipeline (deepseek.py's generate_next_question / generate_report),
many tracks — each track supplies the track-specific pieces (what "going
deeper" means, what counts as worth a correction, what the report judges)
and shares the surrounding prompt shape, JSON contract and validation.
Add a track by adding an entry here; nothing else needs to change unless
the track needs a genuinely different pipeline shape.

`uses_engagement_signals` gates whether this track's follow-up/report calls
receive the client-side camera telemetry from useEngagementSignals.js (raw
ratios only — face_in_frame_ratio, gaze_forward_ratio, head_pose_stability;
never a score, never "confidence"). It is always supplementary evidence for
one named dimension, never scored on its own — see `evidence_for` below.
"""

CLARITY_JUDGE = (
    "how easy the answers were to follow, including genuine grammar errors "
    "(subject-verb agreement, tense consistency, and similar) if present. Do "
    "not penalize normal spoken-language patterns - sentence fragments, "
    "restarts, contractions - only score real communication problems."
)

TRACKS: dict[str, dict] = {
    "technical-resume": {
        "label": "technical interview",
        "opening_instructions": (
            'It must reference something concrete and specific from the resume - '
            'a named project, a specific technology, a specific role - not a '
            'generic prompt ("tell me about a project") that could apply to any '
            "resume."
        ),
        "correction_criteria": (
            "technically incorrect, vague to the point of not really answering, "
            "or worth flagging"
        ),
        "followup_instructions": (
            "Then decide whether to go deeper on the current topic or move to a "
            "new one. Default to going deeper - a real interviewer spends several "
            "questions on the same project before moving on, not one question per "
            "resume line. Only move to a different, not-yet-covered part of the "
            "resume once the current topic has had at least two substantive "
            "exchanges, or the candidate's last answer was a non-answer/evasive "
            "dodge that leaves nothing to dig into.\n\n"
            "When going deeper, make the question a genuine escalation, not a "
            "rephrase - ask about a trade-off they made, a failure mode or edge "
            "case, what they would change if a requirement shifted, or push back "
            'directly on a claim ("what if that library did not exist"). When '
            "moving on, reference something specific and concrete (a named "
            "project, technology, or role), never a generic prompt."
        ),
        "uses_engagement_signals": False,
        "evidence_for": None,
        "needs_resume": True,
        "dimensions": [
            {
                "key": "Relevance",
                "judge": (
                    "did each answer actually address what was asked, or did the "
                    "candidate talk around the question, skip parts of it, or "
                    "answer a different question than the one asked. Judge across "
                    "all answers together, not just one."
                ),
            },
            {
                "key": "Technical Knowledge",
                "judge": (
                    "was what the candidate said technically accurate and "
                    "substantive, checked against what their resume actually "
                    "claims. A confident but incorrect or hand-wavy answer should "
                    "score low even if delivered fluently."
                ),
            },
            {
                "key": "Clarity",
                "judge": CLARITY_JUDGE,
            },
        ],
    },
    "hr": {
        "label": "HR interview",
        "opening_instructions": (
            "Open the way a real HR round opens: a warm, general invitation for "
            "the candidate to introduce themselves and their background, "
            "grounded in one concrete detail from the resume (their most recent "
            "role, degree, or a named project) so it reads as informed rather "
            "than generic small talk."
        ),
        "correction_criteria": (
            "evasive, generic to the point of saying nothing specific about "
            "them, or inconsistent with something stated earlier in the resume "
            "or interview"
        ),
        "followup_instructions": (
            "Then decide whether to go deeper on the current topic or move to a "
            "new one. Default to going deeper for one genuine follow-up on the "
            "same story or trait before moving on - a real HR interviewer "
            "presses on motivation and self-awareness rather than firing off "
            "unrelated questions. Only move to a new, not-yet-covered part of "
            "the resume or a different behavioral theme (strengths, weaknesses, "
            "motivation, teamwork, career goals) once the current one has had at "
            "least one solid follow-up, or the candidate's last answer was "
            "evasive or purely rehearsed-sounding.\n\n"
            "When going deeper, push past the rehearsed version - ask why, ask "
            "for a specific example that actually proves the claim, or ask what "
            "they would do differently. When moving on, ground the new question "
            "in something concrete from the resume (a role, a gap, a transition) "
            'rather than a generic "tell me about a weakness" that could apply '
            "to anyone."
        ),
        "uses_engagement_signals": True,
        "evidence_for": "Self Presentation",
        "needs_resume": True,
        "dimensions": [
            {
                "key": "Relevance",
                "judge": (
                    "did each answer actually address what was asked, rather than "
                    "a generic, rehearsed script that would fit almost any "
                    "question. Judge across all answers together, not just one."
                ),
            },
            {
                "key": "Self Presentation",
                "judge": (
                    "did the candidate come across as prepared and genuine rather "
                    "than reciting a memorized script - specific, self-aware "
                    "answers score higher than generic, interchangeable ones."
                ),
            },
            {
                "key": "Clarity",
                "judge": CLARITY_JUDGE,
            },
        ],
    },
    "behavioral": {
        "label": "behavioral (STAR) interview",
        "opening_instructions": (
            "Ask for a specific past situation using the STAR framework "
            "(Situation, Task, Action, Result), anchored to something concrete "
            "on the resume - a named project, role, or claimed responsibility - "
            "so the candidate has an actual event to recall, not a hypothetical."
        ),
        "correction_criteria": (
            "missing a concrete Result, vague on their own specific role versus "
            "the team's, or inconsistent with something stated earlier"
        ),
        "followup_instructions": (
            "Then decide whether to go deeper on the current STAR story or move "
            "to a new one. Default to going deeper when the candidate has not "
            "yet reached a clear Result - a real interviewer will not let a "
            "story end at the Action step. Only move to a new situation once the "
            "current story has a concrete Result (an outcome, a number, a "
            "lesson), or the candidate's last answer was too vague to have an "
            "Action or Result worth pressing on.\n\n"
            "When going deeper, ask specifically for the missing STAR element - "
            "what actually happened, what they personally did versus the team, "
            "or what the measurable outcome was. When moving on, ask for a "
            "different concrete situation grounded in the resume (a different "
            'project, role, or claimed responsibility), not a generic "tell me '
            'about a time..." prompt.'
        ),
        "uses_engagement_signals": True,
        "evidence_for": "Clarity",
        "needs_resume": True,
        "dimensions": [
            {
                "key": "STAR Structure",
                "judge": (
                    "did each answer actually cover Situation, Task, Action and "
                    "Result, or does it stop short (e.g. no concrete Result, or "
                    "skips straight from Situation to Result). Judge each story "
                    "on whether all four parts are present, in order."
                ),
            },
            {
                "key": "Relevance",
                "judge": (
                    "did each answer actually address the situation asked for, "
                    "or did the candidate substitute a different, easier story. "
                    "Judge across all answers together, not just one."
                ),
            },
            {
                "key": "Clarity",
                "judge": CLARITY_JUDGE,
            },
        ],
    },

    # The tracks below run a fixed question script (see assessments.js) —
    # no resume, no per-candidate adaptive follow-up, so they only ever go
    # through generate_report(), never generate_next_question(). They omit
    # opening_instructions/correction_criteria/followup_instructions on
    # purpose: calling the adaptive half of the pipeline on one of these
    # should fail loudly (a real bug), not silently fall back to another
    # track's questioning style.
    "technical": {
        "label": "technical interview",
        "needs_resume": False,
        "uses_engagement_signals": False,
        "evidence_for": None,
        "dimensions": [
            {
                "key": "Structure",
                "judge": (
                    "did each answer have a clear shape (a specific example, then "
                    "the reasoning, then a conclusion) rather than rambling or "
                    "trailing off, and did multi-part questions get fully "
                    "addressed rather than only the easiest part."
                ),
            },
            {
                "key": "Vocabulary",
                "judge": (
                    "did the candidate use precise, domain-appropriate technical "
                    "vocabulary rather than vague filler terms ('stuff', 'things', "
                    "'basically'), and was jargon explained rather than dropped "
                    "unexplained - especially on the question asking them to "
                    "explain a concept to a non-technical listener."
                ),
            },
            {
                "key": "Clarity",
                "judge": CLARITY_JUDGE,
            },
        ],
    },
    "placement": {
        "label": "placement mock interview",
        "needs_resume": False,
        "uses_engagement_signals": False,
        "evidence_for": None,
        "dimensions": [
            {
                "key": "Structure",
                "judge": (
                    "did each answer follow a shape appropriate to the question "
                    "asked - Situation/Task/Action/Result for the 'something went "
                    "wrong' story, problem-then-approach for the project question "
                    "- rather than a flat, unstructured ramble."
                ),
            },
            {
                "key": "Vocabulary",
                "judge": (
                    "did the candidate adapt their vocabulary to the audience "
                    "implied by each question (plain language for the "
                    "'non-technical interviewer' prompt, precise terms elsewhere) "
                    "rather than using the same register throughout."
                ),
            },
            {
                "key": "Clarity",
                "judge": CLARITY_JUDGE,
            },
        ],
    },
    "presentation": {
        "label": "presentation simulation",
        "needs_resume": False,
        "uses_engagement_signals": False,
        "evidence_for": None,
        "dimensions": [
            {
                "key": "Structure",
                "judge": (
                    "did the talk actually open, develop and close as asked - a "
                    "hook and roadmap at the start, a clear throughline through "
                    "the body, a real close that restates the one thing to "
                    "remember - rather than trailing off or skipping a section."
                ),
            },
            {
                "key": "Clarity",
                "judge": CLARITY_JUDGE,
            },
            {
                "key": "Vocabulary",
                "judge": (
                    "did the candidate use delivery and vocabulary suited to "
                    "presenting to a panel (signposting - 'three options, I chose "
                    "the second' - a headline before detail) rather than the "
                    "informal register of a one-on-one answer."
                ),
            },
        ],
    },
}

DEFAULT_TRACK = "technical-resume"


def get_track(track_id: str | None) -> dict:
    """Unknown/missing track ids fall back to the technical-resume shape,
    the one this pipeline was generalized from. Only meant for the
    adaptive (resume-driven) half of the pipeline — callers generating a
    report for a fixed-script track should look up TRACKS directly and
    skip entirely on a miss (see resume/pipeline.py), not fall back."""
    return TRACKS.get(track_id or "", TRACKS[DEFAULT_TRACK])
