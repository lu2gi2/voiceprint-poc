import Dialog from './Dialog';
import { Pencil } from './paper';

/** The torn-out sheet behind a sticky note: sub-scores plus the coach's line. */
export default function NoteDetailDialog({ noteKey, onClose, onPractice, dimensions = [] }) {
  const dimension = dimensions.find((item) => item.name === noteKey);
  const n = dimension && {
    title: dimension.name.toUpperCase(),
    pct: dimension.score,
    rows: [[`${dimension.count} persisted answers`, dimension.score]],
    note: `Calculated from ${dimension.count} answer score${dimension.count === 1 ? '' : 's'} stored in PostgreSQL.`,
  };

  return (
    <Dialog open={!!n} onClose={onClose} labelledBy="dTitle">
      {n && (
        <div className="dsheet">
          <button className="x" type="button" onClick={onClose} aria-label="Close">✕</button>

          <p className="d-eyebrow" id="dTitle">{n.title}</p>
          <p className="d-score">
            {n.pct}
            <small>%</small>
          </p>

          <div className="d-rows">
            {n.rows.map(([label, val]) => (
              <div className="d-row" key={label}>
                <span>{label}</span>
                <Pencil pct={val} />
                <b>{val}</b>
              </div>
            ))}
          </div>

          <p className="d-note">{n.note}</p>

          <div className="d-act">
            <button className="btn" type="button" onClick={onPractice}>
              PRACTICE THIS <i>→</i>
            </button>
            <button className="btn ghost" type="button" onClick={onClose}>CLOSE</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
