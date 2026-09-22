import { forwardRef, useEffect, useState } from 'react';
import { Pencil, Pin, Tape, Underline } from './paper';
import { useInViewOnce } from '../hooks/useReveal';
import { getStudentResume, pollStudentResume } from '../lib/api';
import { toDisplayNote } from '../lib/resumeNotes';

/** The wall of skill notes. Each note opens its evidence in a dialog.
 *
 * Real resume analysis only (see app/llm/resume_notes.py) - never the
 * fixture sample notes, since those would show made-up "repetitive verbs"
 * findings against a resume that was never actually read. No resume on
 * file yet -> says so plainly instead. */
const StickyWall = forwardRef(function StickyWall({ user, onOpenNote }, ref) {
  const inView = useInViewOnce(ref, 0.12);
  const [status, setStatus] = useState('checking'); // checking | none | processing | ready
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        let resume = await getStudentResume(user.id);
        if (resume.status === 'processing') {
          if (!cancelled) setStatus('processing');
          resume = await pollStudentResume(user.id);
        }
        if (cancelled) return;
        if (resume?.status === 'ready' && resume.notes) {
          setNotes(resume.notes.map(toDisplayNote).filter(Boolean));
          setStatus('ready');
        } else {
          setStatus('none');
        }
      } catch {
        if (!cancelled) setStatus('none'); // no resume uploaded yet (404) or a blip
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

          {status === 'ready' && (
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
          )}

          {status === 'none' && (
            <p className="wall-empty">Upload your resume for results — open your profile to add one.</p>
          )}
          {status === 'processing' && (
            <p className="wall-empty">Analyzing your resume…</p>
          )}
          {status === 'checking' && (
            <p className="wall-empty">Checking your resume…</p>
          )}
        </div>
      </section>
    </>
  );
});

export default StickyWall;
