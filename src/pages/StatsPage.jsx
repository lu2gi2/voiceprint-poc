import { useState } from 'react';
import { Pencil, Pin, Tape, Underline } from '../components/paper';
import { useScrolled } from '../hooks/useReveal';
import ChalkBarChart from '../components/charts/ChalkBarChart';
import ChalkSparkGrid from '../components/charts/ChalkSparkGrid';
import TelemetryBullets from '../components/charts/TelemetryBullets';
import StarDropoff from '../components/charts/StarDropoff';
import VerdictTiles from '../components/charts/VerdictTiles';
import { BOARD, rankSkills, signed } from '../lib/viz';
import {
  student,
  longitudinal,
  evidence,
  telemetry,
  starStages,
  coachingPlan,
  BENCHMARK,
} from '../data/fixtures';

/* One ranking, computed once, shared by every chart on the page so the
   ordering and the colouring can never drift apart. */
const ranked = rankSkills(longitudinal.skills, BENCHMARK);
const best = ranked[0];
const worst = ranked[ranked.length - 1];
const biggestGain = ranked.reduce((a, b) => (a.delta >= b.delta ? a : b));

/* ---------- The board: where you stand, and how you got here ---------- */

function StandingBoard() {
  const [showTable, setShowTable] = useState(false);
  const aheadCount = ranked.filter((r) => r.ahead).length;

  return (
    <section className="board-panel" aria-label="Where you stand">
      <div className="frame static">
        <div className="board static">
          <div className="smudges" aria-hidden="true" />

          <div className="b-chart-head">
            <h2 className="chalk">Where you stand today.</h2>
            <p className="mute">
              {aheadCount} of {ranked.length} dimensions {aheadCount === 1 ? 'is' : 'are'} at or
              above the {BENCHMARK} target.
            </p>
          </div>

          <div className="chalk-legend" aria-hidden="true">
            <span><i style={{ background: BOARD.ahead }} />at or above target</span>
            <span><i style={{ background: BOARD.behind }} />below target</span>
            <span><i className="rule" style={{ background: BOARD.accent }} />target {BENCHMARK}</span>
          </div>

          <ChalkBarChart rows={ranked} benchmark={BENCHMARK} />

          <div className="b-chart-head spaced">
            <h2 className="chalk">How each one moved.</h2>
            <p className="mute">Same five dimensions, every assessment since you started.</p>
          </div>

          <ChalkSparkGrid rows={ranked} terms={longitudinal.terms} benchmark={BENCHMARK} />

          <div className="board-foot">
            <p>Biggest gain: <em>{biggestGain.name} {signed(biggestGain.delta)}</em>.</p>
            <button type="button" className="board-link" onClick={() => setShowTable((v) => !v)}
              aria-expanded={showTable}>
              {showTable ? 'Hide the numbers' : 'Show the numbers'}
            </button>
          </div>

          {/* The chart's table twin — every value as text, no colour needed. */}
          {showTable && (
            <table className="ctable">
              <caption className="sr-cap">Every score, by assessment</caption>
              <thead>
                <tr>
                  <th scope="col">SKILL</th>
                  {longitudinal.terms.map((t) => <th key={t} scope="col">{t}</th>)}
                  <th scope="col">CHANGE</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((s) => (
                  <tr key={s.name}>
                    <th scope="row" className="chalk">{s.name}</th>
                    {s.scores.map((v, i) => (
                      <td key={i} className={i === s.scores.length - 1 ? 'now' : 'was'}>{v}</td>
                    ))}
                    <td className="delta">{signed(s.delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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

function EvidenceWall() {
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
              Every number above is calculated from your last assessment — not an opinion.
              These are the measurements it came from.
            </p>
          </div>

          <div className="ev-grid">
            {evidence.map((e, i) => (
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

function MetricPads() {
  const off = telemetry.filter((m) => m.value < m.band[0] || m.value > m.band[1]);

  return (
    <section className="paper-cols" aria-label="Speech metrics and answer structure">
      <div className="paper-cols-in">
        <div className="pad a">
          <Tape rotate={2} />
          <p className="eyebrow">MEASURED FROM YOUR AUDIO</p>
          <h3>Speech telemetry</h3>
          <TelemetryBullets rows={telemetry} />
          <p className="foot-note">
            {off.length} of {telemetry.length} readings sit outside their target range:{' '}
            {off.map((m) => m.name.toLowerCase()).join(', ')}.
          </p>
        </div>

        <div className="pad b">
          <Tape rotate={-3} />
          <p className="eyebrow">HOW YOUR ANSWERS ARE BUILT</p>
          <h3>Where answers fall away</h3>
          <StarDropoff stages={starStages} />
          <p className="foot-note">
            You set the story up well. Coverage halves by the Result — the part an
            interviewer remembers.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- The plan that follows from all of it (PRD §8) ---------- */

function CoachingPlan({ onPractice }) {
  return (
    <section className="plan" aria-labelledby="planH">
      <div className="plan-in">
        <div className="plan-head">
          <h2 className="eyebrow" id="planH">YOUR PLAN — {coachingPlan.weakness.toUpperCase()}</h2>
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

export default function StatsPage({ onBack, onPractice, practiceCount }) {
  const scrolled = useScrolled();

  return (
    <div className="stats">
      <header className={`stats-bar${scrolled ? ' scrolled' : ''}`}>
        <button className="back" type="button" onClick={onBack}>
          <i>←</i> BACK TO MY JOURNEY
        </button>
        <span className="who">{student.name} · {student.year}</span>
      </header>

      <main id="main">
        <div className="stats-head">
          <p className="eyebrow">THE FULL REPORT</p>
          <h1>
            Strongest at {best.name.toLowerCase()}. Weakest at {worst.name.toLowerCase()}.
            <Underline stroke="#C0483E" />
          </h1>
          <p className="lede">
            Pulled from {practiceCount} assessments. Everything below is the working
            behind those two sentences.
          </p>
        </div>

        <VerdictTiles best={best} worst={worst} benchmark={BENCHMARK} />
        <StandingBoard />
        <EvidenceWall />
        <MetricPads />
        <CoachingPlan onPractice={onPractice} />
      </main>
    </div>
  );
}
