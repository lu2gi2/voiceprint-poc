import { useState } from 'react';
import { rngF, wobble } from '../../lib/chalk';
import { BOARD, scale, signed } from '../../lib/viz';
import { useIsMobile } from '../../hooks/useMediaQuery';

/**
 * "Where you stand" — one chalk bar per skill, sorted strongest first, read
 * against the target rule. Bar colour says which side of the target you are
 * on; the sort order says the ranking; the number at the bar end says the
 * value. Three signals, so colour is never load-bearing on its own.
 */
export default function ChalkBarChart({ rows, benchmark }) {
  const [hover, setHover] = useState(null);

  // The viewBox is sized so the SVG lands near 1:1 at each breakpoint. Reuse
  // the wide one on a phone and every stroke and label shrinks to a thumbnail;
  // reuse the narrow one on a desktop board and they blow up into slabs.
  const m = useIsMobile();
  const W = m ? 440 : 1000;
  const rowH = m ? 54 : 56;
  const padT = m ? 30 : 34;
  const padB = m ? 46 : 52;
  const H = padT + rows.length * rowH + padB;

  const x0 = m ? 152 : 250;
  const x1 = m ? 368 : 878;
  const valX = m ? 436 : 968; // values in their own column, clear of the target rule
  const barW = m ? 11 : 9;
  const x = scale([0, 100], [x0, x1]);
  const bx = x(benchmark);

  const rng = rngF(11);
  const bars = rows.map((r, i) => ({
    ...r,
    y: padT + i * rowH + rowH / 2,
    xEnd: x(r.now),
    d: wobble(x0, padT + i * rowH + rowH / 2, x(r.now), padT + i * rowH + rowH / 2, 2.2, rng),
  }));
  const axisD = wobble(x0, H - padB + 12, x1, H - padB + 12, 1.8, rng);
  const benchD = wobble(bx, padT - 12, bx, H - padB + 6, 2, rng);

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" role="img"
        aria-label={`Current score per skill against a target of ${benchmark}. ${rows
          .map((r) => `${r.name} ${r.now}`).join(', ')}.`}>

        {/* target rule — the thing every bar is judged against */}
        <path d={benchD} fill="none" stroke={BOARD.accent} strokeWidth="2.2"
          strokeLinecap="round" opacity=".75" />
        <text className="c-bench" x={bx} y={padT - 18} textAnchor="middle" fill={BOARD.accent}>
          target {benchmark}
        </text>

        {/* baseline */}
        <path d={axisD} fill="none" stroke={BOARD.chalk} strokeWidth="2"
          strokeLinecap="round" opacity=".4" />
        {[0, 50, 100].map((t) => (
          <text key={t} className="c-tick" x={x(t)} y={H - padB + 32} textAnchor="middle"
            fill={BOARD.neutral}>{t}</text>
        ))}

        {bars.map((b, i) => {
          const on = hover === i;
          const color = b.ahead ? BOARD.ahead : BOARD.behind;
          return (
            <g key={b.name}>
              {/* soft chalk halo, then the bar itself */}
              <path d={b.d} fill="none" stroke={color} strokeWidth={barW + (on ? 11 : 8)}
                strokeLinecap="round" opacity=".14" />
              <path d={b.d} fill="none" stroke={color} strokeWidth={on ? barW + 2 : barW}
                strokeLinecap="round" opacity=".92" />

              <text className="c-name" x={x0 - (m ? 12 : 20)} y={b.y + 8} textAnchor="end"
                fill={on ? BOARD.chalk : BOARD.neutral}>{b.name}</text>
              <text className="c-val" x={valX} y={b.y + 9} textAnchor="end" fill={BOARD.chalk}>{b.now}</text>

              {/* hit area spans the whole row, not just the bar */}
              <rect x={0} y={b.y - rowH / 2} width={W} height={rowH} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div className="chart-tip" style={{
          left: `${(bars[hover].xEnd / W) * 100}%`,
          top: `${((bars[hover].y - 34) / H) * 100}%`,
        }}>
          <strong>{bars[hover].name} {bars[hover].now}</strong>
          {bars[hover].ahead
            ? ` · ${signed(bars[hover].gap)} over target`
            : ` · ${Math.abs(bars[hover].gap)} under target`}
        </div>
      )}
    </div>
  );
}
