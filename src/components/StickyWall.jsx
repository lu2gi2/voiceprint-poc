import { forwardRef } from 'react';
import { Pencil, Pin, Tape, Underline } from './paper';
import { useInViewOnce } from '../hooks/useReveal';
import { NOTES } from '../data/fixtures';

/** The wall of skill notes. Each note opens its evidence in a dialog. */
const StickyWall = forwardRef(function StickyWall({ onOpenNote }, ref) {
  const inView = useInViewOnce(ref, 0.12);

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
            {NOTES.map((n, i) => (
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
