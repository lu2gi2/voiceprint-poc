import Icon from '../components/Icon';
import { Pin, Tape, Underline } from '../components/paper';
import { useScrolled } from '../hooks/useReveal';
import { assessments } from '../data/assessments';

/* PRD FR-02 — the student picks what to be assessed on. Laid out as the wall
   of notes the rest of the app already uses, so choosing a track feels like
   pulling a card off the board rather than filling in a form. */

function TrackNote({ a, onPick }) {
  const soon = a.status === 'soon';
  const mins = Math.max(1, Math.round(a.questions.reduce((s, q) => s + q.target, 0) / 60));

  return (
    <article className={`track${soon ? ' soon' : ''}`}
      style={{ '--c': a.c, '--rot': `${a.rot}deg` }}>
      {a.tape ? <Tape rotate={a.rot > 0 ? -4 : 3} /> : <Pin color={a.pin} />}

      <div className="track-top">
        <span className="track-icon"><Icon name={a.icon} size={19} /></span>
        <span className="track-kind">{a.kind}</span>
      </div>

      <h3 className="track-title">{a.title}</h3>
      <p className="track-desc">{a.desc}</p>

      <p className="track-measures">
        <span>MEASURES</span>
        {a.measures.map((m) => <em key={m}>{m}</em>)}
      </p>

      <div className="track-foot">
        {soon ? (
          <>
            <span className="track-soon"><Icon name="lock" size={13} /> {a.soonWhy}</span>
          </>
        ) : (
          <>
            <span className="track-len">{a.questions.length} questions · ~{mins} min</span>
            <button type="button" className="track-go" onClick={() => onPick(a.id)}>
              START <i>→</i>
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function AssessmentsPage({ onBack, onPick }) {
  const scrolled = useScrolled();
  const ready = assessments.filter((a) => a.status === 'ready');
  const soon = assessments.filter((a) => a.status === 'soon');

  return (
    <div className="stats">
      <header className={`stats-bar${scrolled ? ' scrolled' : ''}`}>
        <button className="back" type="button" onClick={onBack}>
          <i>←</i> BACK TO MY JOURNEY
        </button>
        <span className="who">{ready.length} tracks ready</span>
      </header>

      <main>
        <div className="stats-head">
          <p className="eyebrow">PRACTICE</p>
          <h1>
            What are we working on today?
            <Underline stroke="#C0483E" />
          </h1>
          <p className="lede">
            Each track records your answers and scores the dimensions it actually
            exercises. Your weakest one is conciseness — the behavioural and
            impromptu rounds press on it hardest.
          </p>
        </div>

        <section className="tracks-wrap" aria-label="Assessment tracks">
          <div className="tracks">
            {ready.map((a) => <TrackNote key={a.id} a={a} onPick={onPick} />)}
          </div>

          <div className="tracks-soon">
            <h2 className="eyebrow">COMING LATER</h2>
            <div className="tracks">
              {soon.map((a) => <TrackNote key={a.id} a={a} onPick={onPick} />)}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
