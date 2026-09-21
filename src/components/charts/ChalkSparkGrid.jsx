import { useState } from 'react';
import { rngF, smooth, handCircle } from '../../lib/chalk';
import { BOARD, scale, signed } from '../../lib/viz';

/**
 * "How each one moved" — small multiples rather than five lines on one plot.
 * Five overlapping trend lines become spaghetti; five little panels on a
 * shared scale let you compare both the shape and the height at a glance.
 *
 * Each panel keeps the colour its bar had in the chart above, so a skill
 * reads as the same entity in both — colour follows the skill, never its row.
 */
export default function ChalkSparkGrid({ rows, terms, benchmark }) {
  const [hover, setHover] = useState(null);

  const W = 200;
  const H = 104;
  const padX = 12;
  const padY = 16;
  const x = scale([0, terms.length - 1], [padX, W - padX]);
  const y = scale([30, 100], [H - padY, padY]);
  const by = y(benchmark);

  return (
    <div className="spark-grid">
      {rows.map((r, i) => {
        const color = r.ahead ? BOARD.ahead : BOARD.behind;
        const rng = rngF(20 + i);
        const pts = r.scores.map((v, j) => [x(j), y(v)]);
        const jittered = pts.map((p) => [p[0] + (rng() - 0.5) * 2, p[1] + (rng() - 0.5) * 2]);
        const last = pts[pts.length - 1];
        const on = hover === i;

        return (
          <figure key={r.name} className={`spark${on ? ' on' : ''}`}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <figcaption>
              <span className="sp-name">{r.name}</span>
              <span className="sp-now" style={{ color }}>{r.now}</span>
            </figcaption>

            <svg viewBox={`0 0 ${W} ${H}`} role="img"
              aria-label={`${r.name} over ${terms.length} assessments: ${r.scores.join(', ')}.`}>
              {/* the same target rule as the bar chart, for a shared reference */}
              <line x1={padX} y1={by} x2={W - padX} y2={by}
                stroke={BOARD.accent} strokeWidth="1.4" opacity=".45" />

              <path d={smooth(jittered, false)} fill="none" stroke={color}
                strokeWidth={on ? 5 : 3.6} strokeLinecap="round" strokeLinejoin="round" />
              <path d={handCircle(last[0], last[1], 6, rng)} fill="none" stroke={color}
                strokeWidth="2.6" />
            </svg>

            <p className="sp-foot">
              <span className="sp-from">{r.first}</span>
              <span className="sp-arrow" aria-hidden="true">→</span>
              <span className="sp-delta">{signed(r.delta)}</span>
            </p>
          </figure>
        );
      })}
    </div>
  );
}
