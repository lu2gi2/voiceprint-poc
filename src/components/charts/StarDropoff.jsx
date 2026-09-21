import { PAPER, scale } from '../../lib/viz';

/**
 * STAR as a drop-off. The interesting thing about these four numbers is not
 * their heights but where the answer falls away — so the columns carry the
 * values and the gaps between them are labelled with what was lost.
 *
 * Emphasis rather than a full palette: only the stage that ends up weakest is
 * inked in the warning hue. Four categorical colours here would bury the one
 * stage that actually matters.
 */
export default function StarDropoff({ stages }) {
  const W = 340;
  const H = 210;
  const padT = 34;
  const padB = 44;
  const colW = 46;
  const gap = (W - stages.length * colW) / (stages.length + 1);

  const y = scale([0, 100], [H - padB, padT]);
  const drops = stages.map(([, v], i) => (i === 0 ? 0 : v - stages[i - 1][1]));
  const steepest = Math.min(...drops);
  const lowest = Math.min(...stages.map(([, v]) => v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="funnel" role="img"
      aria-label={`STAR coverage by stage: ${stages.map(([n, v]) => `${n} ${v} percent`).join(', ')}.`}>

      <line x1={0} y1={H - padB} x2={W} y2={H - padB} stroke={PAPER.neutral}
        strokeWidth="1.5" opacity=".3" />

      {stages.map(([name, v], i) => {
        const cx = gap + i * (colW + gap);
        const top = y(v);
        const isWeakest = v === lowest;
        const prevTop = i > 0 ? y(stages[i - 1][1]) : 0;

        return (
          <g key={name}>
            <rect x={cx} y={top} width={colW} height={H - padB - top} rx="3"
              fill={isWeakest ? PAPER.behind : PAPER.neutral}
              opacity={isWeakest ? 0.8 : 0.34} />

            <text className="f-val" x={cx + colW / 2} y={top - 12} textAnchor="middle"
              fill={PAPER.ink}>{v}%</text>
            <text className="f-name" x={cx + colW / 2} y={H - padB + 20} textAnchor="middle"
              fill={PAPER.neutral}>{name}</text>

            {i > 0 && (
              <>
                {/* guide across the column tops */}
                <line x1={cx - gap - colW / 2} y1={prevTop} x2={cx + colW / 2} y2={top}
                  stroke={PAPER.neutral} strokeWidth="1.6" opacity=".45"
                  strokeDasharray="1 5" strokeLinecap="round" />
                {/* the loss, sat below the guide so it clears the value labels */}
                <text className={`f-drop${drops[i] === steepest ? ' worst' : ''}`}
                  x={cx - gap / 2} y={(prevTop + top) / 2 + 20} textAnchor="middle"
                  fill={drops[i] === steepest ? PAPER.behind : PAPER.neutral}>
                  {drops[i]}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
