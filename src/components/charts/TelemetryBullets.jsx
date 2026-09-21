import { PAPER, scale, clampTo } from '../../lib/viz';

/**
 * Speech metrics as bullet rows. A bare "2.4 / min" means nothing unless you
 * already know the healthy range — so each row draws the target band and
 * shows where the reading actually landed inside or outside it.
 *
 * Note some metrics are better low (fillers) and some better high (sentence
 * completion); the band handles both without the reader needing the rule.
 */
export default function TelemetryBullets({ rows }) {
  const W = 300;
  const H = 26;
  const x0 = 4;
  const x1 = W - 4;
  const mid = H / 2;

  return (
    <div className="bullets">
      {rows.map((m) => {
        const x = scale(m.scale, [x0, x1]);
        const inBand = m.value >= m.band[0] && m.value <= m.band[1];
        const color = inBand ? PAPER.ahead : PAPER.behind;
        const vx = x(clampTo(m.scale, m.value));
        const b0 = x(m.band[0]);
        const b1 = x(m.band[1]);

        return (
          <div className="bullet" key={m.name}>
            <span className="b-name">{m.name}</span>

            <svg viewBox={`0 0 ${W} ${H}`} className="b-track" role="img"
              aria-label={`${m.name}: ${m.value} ${m.unit}. Target ${m.band[0]} to ${m.band[1]}. ${inBand ? 'In range' : 'Outside range'}.`}>
              {/* full scale */}
              <line x1={x0} y1={mid} x2={x1} y2={mid} stroke={PAPER.neutral}
                strokeWidth="1.5" opacity=".28" />
              {/* target band */}
              <rect x={Math.min(b0, b1)} y={mid - 7} width={Math.abs(b1 - b0)} height={14}
                fill={PAPER.neutral} opacity=".16" rx="2" />
              {/* where the student actually landed */}
              <line x1={vx} y1={mid - 10} x2={vx} y2={mid + 10} stroke={color}
                strokeWidth="4" strokeLinecap="round" />
            </svg>

            <span className="b-val">
              {m.value}<small>{m.unit}</small>
            </span>
            <span className={`b-flag ${inBand ? 'ok' : 'off'}`}>
              {inBand ? 'IN RANGE' : 'OFF TARGET'}
            </span>
          </div>
        );
      })}

      <p className="b-key">
        <span className="b-key-band" aria-hidden="true" /> target range ·
        <span className="b-key-mark" aria-hidden="true" /> your reading
      </p>
    </div>
  );
}
