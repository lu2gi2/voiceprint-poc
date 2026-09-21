import { Pencil, Pin, Tape, Underline } from '../components/paper';
import { useScrolled } from '../hooks/useReveal';
import {
  student,
  longitudinal,
  evidence,
  telemetry,
  starStages,
  coachingPlan,
} from '../data/fixtures';

/* ---------- Longitudinal profile, written up on the board (PRD §9) ---------- */

function LongitudinalBoard() {
  const { terms, skills } = longitudinal;
  const rows = skills.map((s) => ({
    ...s,
    delta: s.scores[s.scores.length - 1] - s.scores[0],
  }));
  const weakest = rows.reduce((a, b) =>
    (a.scores[a.scores.length - 1] <= b.scores[b.scores.length - 1] ? a : b));
  const best = rows.reduce((a, b) => (a.delta >= b.delta ? a : b));

  return (
    <section className="board-panel" aria-label="Communication profile over time">
      <div className="frame static">
        <div className="board static">
          <div className="smudges" aria-hidden="true" />

          <table className="ctable">
            <caption className="chalk">
              How each dimension has moved.
              <span>EVERY ASSESSMENT SINCE YOU STARTED</span>
            </caption>
            <thead>
              <tr>
                <th scope="col">SKILL</th>
                {terms.map((t) => <th key={t} scope="col">{t}</th>)}
                <th scope="col">CHANGE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.name}>
                  <th scope="row" className="chalk">{s.name}</th>
                  {s.scores.map((v, i) => (
                    <td key={i} className={i === s.scores.length - 1 ? 'now' : 'was'}>{v}</td>
                  ))}
                  <td className="delta">{s.delta > 0 ? `+${s.delta}` : s.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="board-foot">
            <p>Biggest gain: <em>{best.name} +{best.delta}</em> across four assessments.</p>
            <p>Still weakest: <em>{weakest.name}</em> — that is what the plan below targets.</p>
          </div>

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
              Every number below is calculated from your last assessment — not an opinion.
              These are the measurements it came from.
            </p>
          </div>

          <div className="ev-grid">
            {evidence.map((e, i) => (
              <article
                key={e.key}
                className="ev-note"
                style={{ '--c': e.c, '--rot': `${e.rot}deg`, '--dy': `${e.dy}px` }}
              >
                {i % 2 ? <Tape rotate={i % 4 === 1 ? 3 : -4} /> : <Pin color="#C0483E" />}

                <p className="e-title">{e.title}</p>
                <p className="e-score">
                  {e.score}
                  <small>/100</small>
                </p>
                <Pencil pct={e.score} />

                <p className="e-lab">EVIDENCE</p>
                <ul>
                  {e.measures.map(([label, value]) => (
                    <li key={label}>
                      <span>{label}</span>
                      <b>{value}</b>
                    </li>
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

/* ---------- Raw speech metrics + STAR breakdown (PRD §6) ---------- */

function MetricPads() {
  return (
    <section className="paper-cols" aria-label="Speech metrics and answer structure">
      <div className="paper-cols-in">
        <div className="pad a">
          <Tape rotate={2} />
          <p className="eyebrow">MEASURED FROM YOUR AUDIO</p>
          <h3>Speech telemetry</h3>

          {telemetry.map((m) => (
            <div className="m-row" key={m.name}>
              <span className="m-name">{m.name}</span>
              <span className="m-val">{m.value}</span>
              <span className={`m-flag ${m.flag}`}>{m.label}</span>
            </div>
          ))}

          <p className="foot-note">Fillers are the one metric moving the wrong way.</p>
        </div>

        <div className="pad b">
          <Tape rotate={-3} />
          <p className="eyebrow">HOW YOUR ANSWERS ARE BUILT</p>
          <h3>STAR breakdown</h3>

          {starStages.map(([name, pct]) => (
            <div className="star-row" key={name}>
              <span className="s-name">{name}</span>
              <Pencil pct={pct} />
              <b>{pct}%</b>
            </div>
          ))}

          <p className="foot-note">
            You set up the story well. The Result is where answers keep trailing off.
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
            <article
              key={w.when}
              className={`week${w.done ? ' done' : ''}`}
              style={{ '--rot': `${w.rot}deg` }}
            >
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

export default function StatsPage({ onBack, onPractice }) {
  const scrolled = useScrolled();

  return (
    <div className="stats">
      <header className={`stats-bar${scrolled ? ' scrolled' : ''}`}>
        <button className="back" type="button" onClick={onBack}>
          <i>←</i> BACK TO MY JOURNEY
        </button>
        <span className="who">{student.name} · {student.year}</span>
      </header>

      <main>
        <div className="stats-head">
          <p className="eyebrow">THE FULL REPORT</p>
          <h1>
            What the board is actually measuring.
            <Underline stroke="#C0483E" />
          </h1>
          <p className="lede">
            Every dimension, the evidence behind it, and what you should practise next.
            Pulled from {student.practices} assessments.
          </p>
        </div>

        <LongitudinalBoard />
        <EvidenceWall />
        <MetricPads />
        <CoachingPlan onPractice={onPractice} />
      </main>
    </div>
  );
}
