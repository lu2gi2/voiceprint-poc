import { forwardRef, useEffect, useState } from 'react';
import { Pencil, Pin, Tape, Underline } from './paper';
import { useInViewOnce } from '../hooks/useReveal';
import { NOTES } from '../data/fixtures';
import { getStudentResume, pollStudentResume } from '../lib/api';
import { toDisplayNote } from '../lib/resumeNotes';

/** The wall of skill notes. Each note opens its evidence in a dialog.
 *
 * Reads the real resume analysis (see app/llm/resume_notes.py) once the
 * student's uploaded profile resume (ProfileDrawer.jsx) finishes
 * processing, falling back to the fixture NOTES — a sample of what the wall
 * looks like — until they have uploaded one. */
const StickyWall = forwardRef(function StickyWall({ user, onOpenNote }, ref) {
  const inView = useInViewOnce(ref, 0.12);
  const [notes, setNotes] = useState(NOTES);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        let resume = await getStudentResume(user.id);
        if (resume.status === 'processing') resume = await pollStudentResume(user.id);
        if (cancelled || resume?.status !== 'ready' || !resume.notes) return;
        const real = resume.notes.map(toDisplayNote).filter(Boolean);
        if (real.length) setNotes(real);
      } catch {
        // no resume uploaded yet (404) or a blip - the fixture sample stays
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <>
      <div className="rail" aria-hidden="true" />
      <section className={`wall${inView ? ' in' : ''}`} id="reports" ref={ref} aria-labelledby="wallH">
        <div className="wall-in">
          <div className="wall-head">
            <p className="eyebrow">LOOK CLOSER</p>
            <h2 id="wallH">
              Your resume breakdown, one note at a time.
              <Underline stroke="#C0483E" />
            </h2>
          </div>

          <div className="notes">
            {notes.map((n, i) => (
              <button
                key={n.key}
                type="button"
                className="note"
                onClick={() => onOpenNote(n.key)}
                style={{ '--c': n.c, '--rot': `${n.rot}deg`, '--dy': `${n.dy}px`, '--i': i }}
                aria-label={`${n.title.toLowerCase()}, ${n.count} ${n.label}. View details`}
              >
                {n.tape ? <Tape rotate={i % 2 ? 3 : -4} /> : <Pin color={n.pin} />}
                <span className="n-title">{n.title}</span>
                <span className="n-sub">{n.sub}</span>
                <span className="n-score">
                  {n.count}
                  <small>{n.label}</small>
                </span>
                <Pencil pct={n.pct} />
                <span className="n-tip">{n.tip}</span>
                <span className="n-view">
                  VIEW <i>→</i>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
});

export default StickyWall;
