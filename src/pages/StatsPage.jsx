import { useEffect, useState } from 'react';
import { Pencil, Pin, Tape, Underline } from '../components/paper';
import { useScrolled } from '../hooks/useReveal';
import DimensionBoard from '../components/charts/DimensionBoard';
import StarDropoff from '../components/charts/StarDropoff';
import { diagnose, signed } from '../lib/viz';
import { getStudentSessions, getSummary } from '../lib/api';
import {
  student,
  longitudinal,
  evidence,
  starStages,
  coachingPlan,
  BENCHMARK,
} from '../data/fixtures';

/* The signed-in student's own dimensions, or the sample roll when there is no
   session. Worked out once and shared, so no two sections can disagree — and
   each score is rendered in exactly one place on the page. */
function skillsFor(user) {
  if (!user?.history) return longitudinal.skills;
  return Object.entries(user.history).map(([name, scores]) => ({ name, scores }));
}

const EV_COLORS = ['var(--y)', 'var(--b)', 'var(--g)', 'var(--p)', 'var(--l)'];

/** The most recent completed session's real per-dimension evidence
 *  (GET /sessions/{id}/summary already carries exactly this shape - label/
 *  value measurement pairs behind each score) in place of the fixture
 *  `evidence` array. Cosmetic layout fields (color/rotation/offset) are
 *  generated rather than hardcoded, since real dimension names/counts vary
 *  by which tracks the student actually took. */
function useRealEvidence(user) {
  const [real, setReal] = useState(null);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const sessions = await getStudentSessions(user.id, { limit: 5 });
        const latestComplete = sessions.find((s) => s.status === 'complete');
        if (!latestComplete) return;
        const summary = await getSummary(latestComplete.id);
        if (cancelled || !summary.dimensions?.length) return;
        setReal(summary.dimensions.map((d, i) => ({
          key: d.dimension.toLowerCase().replace(/\s+/g, '-'),
          title: d.dimension.toUpperCase(),
          score: d.value,
          c: EV_COLORS[i % EV_COLORS.length],
          rot: i % 2 ? 1.8 : -2.2,
          dy: (i % 3) * 14,
          measures: (d.evidence || []).map((e) => [e.label, e.value]),
          fix: d.recommendation,
        })));
      } catch {
        // fixture fallback already covers a blip or an unreachable backend
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return real;
}

/* ---------- The board: where you stand, and how you got here ---------- */

function StandingBoard({ dims, behind }) {
  return (
    <section className="board-panel" aria-label="Where you stand">
      <div className="frame static">
        <div className="board static">
          <div className="smudges" aria-hidden="true" />

          <div className="b-chart-head">
            <h2 className="chalk">Five dimensions, five different stories.</h2>
            <p className="mute">
              {behind} of {dims.length} still short of the {BENCHMARK} target.
              Tap any row for its full history.
            </p>
          </div>

          <DimensionBoard rows={dims} benchmark={BENCHMARK} />

          <div className="dust" aria-hidden="true" />
        </div>

        <div className="ledge" aria-hidden="true">
          <i className="chalk-dust" />
          <i className="chalk-a" />
          <i className="chalk-c" />
          <i className="chalk-b" />
          <i className="eraser" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Evidence behind each score (PRD §7) ---------- */

function EvidenceWall({ items }) {
  return (
    <>
      <div className="rail" aria-hidden="true" />
      <section className="ev-wrap" aria-labelledby="evH">
        <div className="ev-in">
          <div className="ev-head">
            <p className="eyebrow">WHY EACH SCORE IS WHAT IT IS</p>
            <h2 id="evH">
              No score without the evidence.
              <Underline stroke="#C0483E" />
            </h2>
            <p className="lede">
              Each score above comes from these counts, and each count appears once.
              Nothing here is an opinion — it was measured from your last assessment.
            </p>
          </div>

          <div className="ev-grid">
            {items.map((e, i) => (
              <article key={e.key} className="ev-note"
                style={{ '--c': e.c, '--rot': `${e.rot}deg`, '--dy': `${e.dy}px` }}>
                {i % 2 ? <Tape rotate={i % 4 === 1 ? 3 : -4} /> : <Pin color="#C0483E" />}

                <p className="e-title">{e.title}</p>
                <p className="e-score">{e.score}<small>/100</small></p>
                <Pencil pct={e.score} />

                <p className="e-lab">EVIDENCE</p>
                <ul>
                  {e.measures.map(([label, value]) => (
                    <li key={label}><span>{label}</span><b>{value}</b></li>
                  ))}
                </ul>

                <p className="e-fix">{e.fix}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------- Measured signals, on ruled paper (PRD §6) ---------- */

function AnswerShape() {
  const drops = starStages.map(([, v], i) => (i === 0 ? 0 : v - starStages[i - 1][1]));
  const worstStep = Math.min(...drops);
  const at = starStages[drops.indexOf(worstStep)][0];

  return (
    <section className="paper-cols" aria-label="How your answers are built">
      <div className="paper-cols-in single">
        <div className="pad a">
          <Tape rotate={2} />
          <p className="eyebrow">A DIFFERENT CUT — WITHIN A SINGLE ANSWER</p>
          <h3>Where answers fall away</h3>
          <p className="pad-lede">
            The scores above measure dimensions across the whole round. This is the
            other axis: how far a single answer gets before it runs out.
          </p>
          <StarDropoff stages={starStages} />
          <p className="foot-note">
            You set the story up well and lose most of it at {at} — {Math.abs(worstStep)} points
            gone in one step, and the Result is the part an interviewer remembers.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- The plan that follows from all of it (PRD §8) ---------- */

function CoachingPlan({ onPractice, worst }) {
  return (
    <section className="plan" aria-labelledby="planH">
      <div className="plan-in">
        <div className="plan-head">
          <h2 className="eyebrow" id="planH">YOUR PLAN — {worst.name.toUpperCase()}</h2>
          <span>{coachingPlan.why}</span>
        </div>

        <div className="weeks">
          {coachingPlan.weeks.map((w) => (
            <article key={w.when} className={`week${w.done ? ' done' : ''}`}
              style={{ '--rot': `${w.rot}deg` }}>
              <Pin color={w.pin} />
              <div>
                <p className="w-when">{w.when}</p>
                <p className="w-do">{w.do}</p>
                <p className="w-why">{w.why}</p>
              </div>
              <span className="w-tag">{w.tag}</span>
            </article>
          ))}
        </div>

        <div className="cta-slip">
          <Tape rotate={3} />
          <p>Week 2 is live. One question, 45 seconds.</p>
          <button className="btn" type="button" onClick={onPractice}>
            PRACTICE THIS WEEK’S DRILL <i>→</i>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

export default function StatsPage({ onBack, onPractice, practiceCount, user }) {
  const scrolled = useScrolled();
  const realEvidence = useRealEvidence(user);
  const dims = diagnose(skillsFor(user), BENCHMARK);   // weakest first
  const worst = dims[0];
  const best = dims[dims.length - 1];
  const biggestGain = dims.reduce((a, b) => (a.delta >= b.delta ? a : b));
  const behind = dims.filter((d) => !d.ahead).length;

  return (
    <div className="stats">
      <header className={`stats-bar${scrolled ? ' scrolled' : ''}`}>
        <button className="back" type="button" onClick={onBack}>
          <i>←</i> BACK TO MY JOURNEY
        </button>
        <span className="who">{user?.name || student.name} · {user?.roll || student.year}</span>
      </header>

      <main id="main">
        <div className="stats-head">
          <p className="eyebrow">THE FULL REPORT</p>
          <h1>
            Strongest at {best.name.toLowerCase()}. Weakest at {worst.name.toLowerCase()}.
            <Underline stroke="#C0483E" />
          </h1>
          <p className="lede">
            Pulled from {practiceCount} assessments. {best.name} has cleared the target;
            {' '}{worst.name.toLowerCase()} is {Math.abs(worst.gap)} points short and is what
            the plan below plays for. Biggest mover so far: {biggestGain.name}{' '}
            {signed(biggestGain.delta)}.
          </p>
        </div>

        <StandingBoard dims={dims} behind={behind} />
        <EvidenceWall items={realEvidence || evidence} />
        <AnswerShape />
        <CoachingPlan onPractice={onPractice} worst={worst} />
      </main>
    </div>
  );
}
