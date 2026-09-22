import { BOARD } from '../lib/viz';

/**
 * What the backend actually measured, shown on the board at the end of a
 * session. Weakest dimension first, each score followed by the numbers it was
 * derived from — the same evidence-first contract as the report page, except
 * these numbers came from the student's own audio rather than fixtures.
 */
export default function SessionResults({ summary, transcripts = [], offline, onDone }) {
  if (offline) {
    return (
      <div className="results">
        <p className="results-eyebrow">SESSION COMPLETE</p>
        <h1 className="results-title chalk">Answers recorded.</h1>
        <p className="results-sub">
          Scoring needs the analysis service, which is not running — your answers were
          recorded and played back, but nothing was measured. Start the backend and the
          next session will come back scored.
        </p>
        <div className="session-actions">
          <span className="session-spacer" />
          <button type="button" className="chalk-btn" onClick={onDone}>BACK TO MY JOURNEY <i>→</i></button>
        </div>
      </div>
    );
  }

  const waiting = !summary || summary.processing;
  const dims = summary?.dimensions ?? [];
  const failed = summary?.answers_failed ?? 0;

  return (
    <div className="results">
      <p className="results-eyebrow">SESSION COMPLETE</p>
      <h1 className="results-title chalk">
        {waiting ? 'Listening back…' : 'Here is what we measured.'}
      </h1>
      <p className="results-sub">
        {waiting
          ? `Transcribing your answers — ${summary?.answers_ready ?? 0} of ${summary?.answers_total ?? 0} done.`
          : `${summary.answers_ready} answers, ${Math.round(summary.total_seconds)}s of speech.`}
      </p>

      {dims.length > 0 && (
        <div className="results-grid">
          {dims.map((d) => (
            <article className="rcard" key={d.dimension}>
              <div className="rcard-head">
                <span className="rcard-dim">{d.dimension}</span>
                <span className="rcard-score"
                  style={{ color: d.value >= 75 ? BOARD.ahead : BOARD.behind }}>
                  {d.value}
                </span>
              </div>

              <p className="rcard-range">best {d.best} · weakest {d.worst}</p>

              <ul className="rcard-ev">
                {d.evidence.map((e) => (
                  <li key={e.label}>
                    <span>{e.label}</span>
                    <b>{e.value}</b>
                    {e.note && <em>{e.note}</em>}
                  </li>
                ))}
              </ul>

              <p className="rcard-rec">{d.recommendation}</p>

              {/* Whisper drops "um" and "uh", so a zero filler count may mean a
                  clean answer or a tidy transcript. Say which we can't tell. */}
              {d.confidence === 'low' && (
                <p className="rcard-caveat">
                  Some of this is unconfirmed — either the answers were too short to
                  read rates from, or no fillers were detected and the transcriber
                  sometimes removes them.
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {transcripts.length > 0 && (
        <section className="scripts" aria-label="What you said">
          <h2 className="scripts-lab">WHAT YOU SAID</h2>
          {[...transcripts].sort((a, b) => a.index - b.index).map((t) => (
            <article className="script" key={t.index}>
              <p className="script-q">{t.prompt}</p>
              <p className="script-t">“{t.text}”</p>
            </article>
          ))}
        </section>
      )}

      {failed > 0 && (
        <p className="results-failed" role="alert">
          {failed} answer{failed > 1 ? 's' : ''} could not be analysed.
        </p>
      )}

      {!waiting && dims.length === 0 && (
        <p className="results-sub">
          No speech was detected in these recordings — check your microphone input level.
        </p>
      )}

      <div className="session-actions">
        <span className="session-spacer" />
        <button type="button" className="chalk-btn" onClick={onDone} disabled={waiting}>
          {waiting ? 'ANALYSING…' : 'BACK TO MY JOURNEY'} <i>→</i>
        </button>
      </div>
    </div>
  );
}
