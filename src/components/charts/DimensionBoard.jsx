import { useState } from 'react';
import { rngF, smooth, handCircle } from '../../lib/chalk';
import { BOARD, scale, signed } from '../../lib/viz';

/**
 * One row per dimension, and the only place a dimension score appears.
 *
 * This replaces four separate sections that each re-drew the same five
 * numbers — a ranked bar chart, a grid of sparklines, a table, and a pair of
 * headline tiles. Five renderings of one fact is not five insights.
 *
 * A row carries what is genuinely different about each dimension: where it
 * sits, how it got there, how far it has to go, and the one thing worth
 * noticing about it (see diagnose() in lib/viz).
 */

const W = 150;
const H = 34;

function Trace({ scores, benchmark, color, seed }) {
  const x = scale([0, scores.length - 1], [3, W - 3]);
  const y = scale([30, 100], [H - 3, 3]);
  const rng = rngF(seed);
  const pts = scores.map((v, i) => [x(i) + (rng() - 0.5) * 1.4, y(v) + (rng() - 0.5) * 1.4]);
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dim-trace" aria-hidden="true">
      {/* the target, so each trace is read against the same line */}
      <line x1={3} y1={y(benchmark)} x2={W - 3} y2={y(benchmark)}
        stroke={BOARD.accent} strokeWidth="1.2" opacity=".4" />
      <path d={smooth(pts, false)} fill="none" stroke={color} strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d={handCircle(last[0], last[1], 4, rng)} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export default function DimensionBoard({ rows, benchmark }) {
  const [open, setOpen] = useState(null);

  return (
    <div className="dimboard">
      <div className="dim-head" aria-hidden="true">
        <span>DIMENSION</span>
        <span>{rows[0]?.scores.length} ASSESSMENTS</span>
        <span className="num">NOW</span>
        <span className="num">TO TARGET</span>
        <span>WHAT STANDS OUT</span>
      </div>

      {rows.map((r, i) => {
        const color = r.ahead ? BOARD.ahead : BOARD.behind;
        const isOpen = open === r.name;
        return (
          <div key={r.name}>
            <button
              type="button"
              className={`dim-row${isOpen ? ' open' : ''}`}
              onClick={() => setOpen(isOpen ? null : r.name)}
              aria-expanded={isOpen}
            >
              <span className="dim-name">{r.name}</span>

              <Trace scores={r.scores} benchmark={benchmark} color={color} seed={30 + i} />

              <span className="dim-now" style={{ color }}>{r.now}</span>

              <span className="dim-gap">
                {r.ahead
                  ? <em>cleared</em>
                  : <>{Math.abs(r.gap)} pts<small>{r.toTarget
                      ? `~${r.toTarget} round${r.toTarget === 1 ? '' : 's'} away`
                      : ''}</small></>}
              </span>

              <span className="dim-note">{r.note}</span>
            </button>

            {/* The history, only when asked for — it is detail, not headline. */}
            {isOpen && (
              <div className="dim-detail">
                <table>
                  <tbody>
                    <tr>
                      <th scope="row">score</th>
                      {r.scores.map((v, j) => (
                        <td key={j} className={j === r.scores.length - 1 ? 'now' : ''}>{v}</td>
                      ))}
                      <td className="delta">{signed(r.delta)}</td>
                    </tr>
                    <tr>
                      <th scope="row">change</th>
                      <td>—</td>
                      {r.scores.slice(1).map((v, j) => (
                        <td key={j} className="dim-step">{signed(v - r.scores[j])}</td>
                      ))}
                      <td />
                    </tr>
                  </tbody>
                </table>
                <p>
                  Gained <strong>{signed(r.early)}</strong> over the first half and{' '}
                  <strong>{signed(r.recent)}</strong> since —{' '}
                  {r.recent > r.early ? 'still accelerating.'
                    : r.recent === r.early ? 'holding a steady pace.'
                    : 'the pace has eased off.'}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
