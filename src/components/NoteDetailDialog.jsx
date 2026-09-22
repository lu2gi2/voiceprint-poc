import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import { Pencil } from './paper';
import { getStudentResume, pollStudentResume } from '../lib/api';
import { toDisplayNote } from '../lib/resumeNotes';

/** The torn-out sheet behind a sticky note: sub-scores plus the coach's
 *  line. Reads the same real resume analysis as StickyWall.jsx - fetched
 *  independently here rather than threaded down as a prop, since this
 *  dialog is opened directly from App.jsx, a level above JourneyPage.
 *  Real notes only - StickyWall.jsx never opens this with a fixture key,
 *  since it no longer renders any fixture notes to click on. */
export default function NoteDetailDialog({ noteKey, user, onClose, onPractice }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        let resume = await getStudentResume(user.id);
        if (resume.status === 'processing') resume = await pollStudentResume(user.id);
        if (cancelled || resume?.status !== 'ready' || !resume.notes) return;
        setNotes(resume.notes.map(toDisplayNote).filter(Boolean));
      } catch {
        // no resume uploaded yet (404) or a blip - nothing to show
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const n = notes.find((x) => x.key === noteKey);

  return (
    <Dialog open={!!n} onClose={onClose} labelledBy="dTitle">
      {n && (
        <div className="dsheet">
          <button className="x" type="button" onClick={onClose} aria-label="Close">✕</button>

          <p className="d-eyebrow" id="dTitle">{n.title}</p>
          {/* The headline reads the same as the sticky note it opened from —
              a count of things to fix, not a percentage of anything. */}
          <p className="d-score">
            {n.count}
            <small>{n.label}</small>
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
