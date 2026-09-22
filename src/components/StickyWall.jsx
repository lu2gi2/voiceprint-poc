import { forwardRef } from 'react';
import { Pencil, Pin, Tape, Underline } from './paper';
import { useInViewOnce } from '../hooks/useReveal';

/** The wall of skill notes. Each note opens its evidence in a dialog. */
const StickyWall = forwardRef(function StickyWall({ onOpenNote, dimensions = [] }, ref) {
  const inView = useInViewOnce(ref, 0.12);

  return (
    <>
      <div className="rail" aria-hidden="true" />
      <section className={`wall${inView ? ' in' : ''}`} id="reports" ref={ref} aria-labelledby="wallH">
        <div className="wall-in">
          <div className="wall-head">
            <p className="eyebrow">LOOK CLOSER</p>
            <h2 id="wallH">
              Your communication profile, one note at a time.
              <Underline stroke="#C0483E" />
            </h2>
          </div>

          <div className="notes">
            {dimensions.map((dimension, i) => {
              const n = { key: dimension.name, title: dimension.name.toUpperCase(), sub: `${dimension.count} scored answers`, pct: dimension.score, c: ['var(--y)', 'var(--p)', 'var(--b)', 'var(--g)'][i % 4], rot: [-2.4, 1.8, -1.2, 2.2][i % 4], dy: [0, 28, -6, 6][i % 4], pin: '#C0483E', tip: 'from persisted answers' };
              return (
              <button
                key={n.key}
                type="button"
                className="note"
                onClick={() => onOpenNote(n.key)}
                style={{ '--c': n.c, '--rot': `${n.rot}deg`, '--dy': `${n.dy}px`, '--i': i }}
                aria-label={`${n.title.toLowerCase()}, ${n.pct} percent. View details`}
              >
                {n.tape ? <Tape rotate={i % 2 ? 3 : -4} /> : <Pin color={n.pin} />}
                <span className="n-title">{n.title}</span>
                <span className="n-sub">{n.sub}</span>
                <span className="n-score">
                  {n.pct}
                  <small>%</small>
                </span>
                <Pencil pct={n.pct} />
                <span className="n-tip">{n.tip}</span>
                <span className="n-view">
                  VIEW <i>→</i>
                </span>
              </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
});

export default StickyWall;
