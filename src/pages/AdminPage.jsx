import { useMemo, useState } from 'react';
import { Pin, Tape, Underline, Pencil } from '../components/paper';
import { useScrolled } from '../hooks/useReveal';
import { BAND_RAMP, BOARD } from '../lib/viz';
import BandRegister from '../components/BandRegister';
import {
  collegeStats, bandStats, departmentStats, dimensionStats, worklist, dormantStats,
} from '../data/students';
import { college, lastIntervention, recommendation } from '../data/admin';

/* Everything on this page is computed from the student roll — the band totals
   are the students in them, the department averages are their students'
   averages. Nothing here is a number typed in to agree with a chart. */
const stats = collegeStats();
const bands = bandStats();
const departments = departmentStats();
const collegeDimensions = dimensionStats();
const dormant = dormantStats();
const work = worklist(10);

/* ---------- Headline numbers, on paper slips ---------- */

function Headline() {
  const tiles = [
    { lab: 'STUDENTS', val: stats.totalStudents, sub: `across ${stats.departments} departments`, rot: -1.4, pin: '#3E6FA0' },
    { lab: 'OVERALL READINESS', val: `${stats.overallReadiness}%`, sub: `mean of every student's score`, rot: 1.2, tape: true },
    { lab: 'PRACTISING', val: `${stats.participation}%`, sub: `${stats.participated} of ${stats.totalStudents} active`, rot: -0.9, pin: '#4E8A5B' },
    { lab: 'BELOW NEARLY-READY', val: stats.needIntervention, sub: `${Math.round((stats.needIntervention / stats.totalStudents) * 100)}% — Low and Medium bands`, rot: 1.6, tape: true, alert: true },
  ];
  return (
    <section className="kpis" aria-label="College at a glance">
      {tiles.map((t) => (
        <article key={t.lab} className={`kpi${t.alert ? ' alert' : ''}`} style={{ '--rot': `${t.rot}deg` }}>
          {t.tape ? <Tape rotate={t.rot > 0 ? -4 : 3} /> : <Pin color={t.pin} />}
          <p className="kpi-lab">{t.lab}</p>
          <p className="kpi-val">{t.val}</p>
          <p className="kpi-sub">{t.sub}</p>
        </article>
      ))}
    </section>
  );
}

/* ---------- The board: where the college stands ---------- */

function CollegeBoard() {
  const weakest = collegeDimensions[collegeDimensions.length - 1];
  const strongest = collegeDimensions[0];
  const maxDept = Math.max(...departments.map((d) => d.readiness));

  return (
    <section className="board-panel" aria-label="Readiness across the college">
      <div className="frame static">
        <div className="board static">
          <div className="smudges" aria-hidden="true" />

          <div className="b-chart-head">
            <h2 className="chalk">Where the college actually stands.</h2>
            <p className="mute">
              {weakest.name} is the weakest dimension at {weakest.score}, {strongest.score - weakest.score} points
              below {strongest.name.toLowerCase()} — that is the gap a workshop should close.
            </p>
          </div>

          <div className="admin-cols">
            {/* by department — where to send trainers */}
            <div>
              <p className="admin-sublab">BY DEPARTMENT</p>
              {departments.map((d) => (
                <div className="deptrow" key={d.code}>
                  <span className="dept-code">{d.code}</span>
                  <span className="dept-bar">
                    <span style={{
                      width: `${(d.readiness / maxDept) * 100}%`,
                      background: d.readiness >= 75 ? BOARD.ahead : BOARD.behind,
                    }} />
                  </span>
                  <span className="dept-val">{d.readiness}%</span>
                  <span className="dept-meta">{d.flagged} below · {d.quiet} quiet</span>
                </div>
              ))}
            </div>

            {/* by dimension — which workshop to run */}
            <div>
              <p className="admin-sublab">BY DIMENSION, COLLEGE-WIDE</p>
              {collegeDimensions.map((c) => (
                <div className="dimrow" key={c.name}>
                  <span className="dimrow-name">{c.name}</span>
                  <span className="dimrow-bar">
                    <span style={{
                      width: `${c.score}%`,
                      background: c.name === weakest.name ? BOARD.behind : BOARD.neutral,
                    }} />
                  </span>
                  <span className="dimrow-val">{c.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dust" aria-hidden="true" />
        </div>
        <div className="ledge" aria-hidden="true">
          <i className="chalk-dust" /><i className="chalk-a" /><i className="chalk-c" />
          <i className="chalk-b" /><i className="eraser" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Readiness bands ---------- */

function Bands({ onPick, active }) {
  return (
    <section className="bands-wrap" aria-labelledby="bandsH">
      <div className="bands-in">
        <p className="eyebrow">STUDENT CATEGORISATION</p>
        <h2 id="bandsH" className="bands-h">
          Readiness bands
          <Underline stroke="#C0483E" />
        </h2>

        <div className="bands">
          {bands.map((b) => {
            const pct = b.share;
            return (
              <button
                key={b.key}
                type="button"
                className={`band${active === b.key ? ' on' : ''}`}
                style={{ '--tone': BAND_RAMP[b.step] }}
                onClick={() => onPick(active === b.key ? null : b)}
                aria-pressed={active === b.key}
              >
                <span className="band-rule" aria-hidden="true" />
                <span className="band-label">{b.label}</span>
                <span className="band-range">{b.range}</span>
                <span className="band-count">{b.students}</span>
                <span className="band-meaning">{b.meaning}</span>
                <span className="band-share">{pct}% of the college · view list</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- The worklist ---------- */

function Worklist() {
  const rows = work;

  return (
    <section className="worklist" aria-labelledby="workH">
      <div className="worklist-in">
        <div className="work-head">
          <div>
            <p className="eyebrow">THIS WEEK’S LIST</p>
            <h2 id="workH">Closest to moving up</h2>
          </div>
          <p className="work-why">
            Sorted by how few points separate each student from the next band. Trainer
            time is finite — this is the order that moves the most students.
          </p>
        </div>

        <div className="work-rows">
          {rows.map((s, i) => (
            <article className="wrow" key={s.id} style={{ '--rot': `${i % 2 ? 0.5 : -0.6}deg` }}>
              <Pin color={['#C0483E', '#3E6FA0', '#D9A72E', '#4E8A5B'][i % 4]} />
              <div className="wrow-who">
                <p className="wrow-name">{s.name}</p>
                <p className="wrow-dept">{s.roll} · {s.dept} · {s.sessions} sessions · {s.daysSince}d since last practice</p>
              </div>
              <div className="wrow-score">
                <span className="wrow-now">{s.overall}</span>
                <Pencil pct={s.overall} />
              </div>
              <div className="wrow-gap">
                <span className="wrow-gapnum">{s.gap} pts</span>
                <span className="wrow-gaplab">to {s.nextBand}</span>
              </div>
              <span className="wrow-weak">{s.weakest}</span>
            </article>
          ))}
          {rows.length === 0 && <p className="work-empty">No students flagged in this band.</p>}
        </div>
      </div>
    </section>
  );
}

/* ---------- Blind spot + what to run next + did it work ---------- */

function Actions() {
  const lift = lastIntervention.afterAvg - lastIntervention.beforeAvg;

  return (
    <section className="admin-actions" aria-label="Interventions">
      <div className="admin-actions-in">

        {/* the students no score-based view can see */}
        <div className="pad a">
          <Tape rotate={2} />
          <p className="eyebrow">THE BLIND SPOT</p>
          <h3>{dormant.count} students have gone quiet</h3>
          <p className="pad-lede">
            {dormant.pctOfCollege}% of the college. They do not appear in any readiness
            average — no practice means no fresh score, so they drop out of the numbers
            rather than showing up as a risk.
          </p>
          <div className="quiet-rows">
            {dormant.byDept.map((d) => (
              <div className="quiet-row" key={d.code}>
                <span>{d.code}</span>
                <span className="quiet-bar">
                  <span style={{ width: `${(d.count / dormant.byDept[0].count) * 100}%` }} />
                </span>
                <b>{d.count}</b>
              </div>
            ))}
          </div>
          <p className="foot-note">
            {dormant.neverStarted} have never started · {dormant.overThirtyDays} inactive over 30 days
          </p>
        </div>

        {/* what to run, and the argument for it */}
        <div className="sheet admin-rec">
          <Tape rotate={-3} />
          <div className="holes" aria-hidden="true"><i /><i /><i /></div>
          <p className="eyebrow">RECOMMENDED NEXT</p>
          <blockquote>{recommendation.headline}</blockquote>
          <p className="rec-why">{recommendation.why}</p>
          <dl className="rec-figs">
            <div><dt>Reaches</dt><dd>{recommendation.reach} students</dd></div>
            <div><dt>Would move a band</dt><dd>{recommendation.wouldMove} students</dd></div>
            <div><dt>Effort</dt><dd>{recommendation.effort}</dd></div>
          </dl>
          <button className="btn" type="button">DRAFT THE TRAINING BRIEF <i>→</i></button>
        </div>

        {/* proof the last one worked, so the next is arguable */}
        <div className="pad b">
          <Tape rotate={3} />
          <p className="eyebrow">DID THE LAST ONE WORK?</p>
          <h3>{lastIntervention.name}</h3>
          <div className="ba">
            <div><span className="ba-lab">BEFORE</span><span className="ba-val">{lastIntervention.beforeAvg}</span></div>
            <span className="ba-arrow" aria-hidden="true">→</span>
            <div><span className="ba-lab">AFTER</span><span className="ba-val up">{lastIntervention.afterAvg}</span></div>
            <span className="ba-lift">+{lift}</span>
          </div>
          <p className="foot-note">
            {lastIntervention.students} students, run {lastIntervention.ranOn}.
            {' '}{lastIntervention.movedUpBand} moved up a band. Worth running again.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Page ---------- */

export default function AdminPage({ user, onSignOut }) {
  const scrolled = useScrolled();
  const [openBand, setOpenBand] = useState(null);

  return (
    <div className="stats admin">
      <header className={`stats-bar${scrolled ? ' scrolled' : ''}`}>
        <span className="admin-crumb">
          <b>{college.name}</b> · Admin portal <em>{college.term}</em>
        </span>
        <span className="admin-right">
          <button type="button" className="signout" onClick={onSignOut}>SIGN OUT</button>
          <span className="avatar" role="img" aria-label={`${user?.name || 'Admin'} profile`}>
            {(user?.name || 'AD').slice(0, 2).toUpperCase()}
          </span>
        </span>
      </header>

      <main id="main">
        <div className="stats-head">
          <p className="eyebrow">COLLEGE OPERATIONS</p>
          <h1>
            Placement readiness, in one view.
            <Underline stroke="#C0483E" />
          </h1>
          <p className="lede">
            {stats.needIntervention} students sit below the nearly-ready line and {dormant.count} have
            stopped practising altogether. Every figure here is counted from the {stats.totalStudents}-student
            roll — tap a band to see who is in it.
          </p>
        </div>

        <Headline />
        <CollegeBoard />
        <Bands onPick={setOpenBand} active={openBand?.key} />
        {openBand && <BandRegister band={openBand} onClose={() => setOpenBand(null)} />}
        <Worklist />
        <Actions />
      </main>
    </div>
  );
}
