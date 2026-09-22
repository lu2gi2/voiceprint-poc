import { rngF, smooth, wobble, handCircle, fixed as f } from '../lib/chalk';
import { useIsMobile } from '../hooks/useMediaQuery';
import { growth } from '../data/fixtures';

/* Props shared by every element the scroll engine draws in. Starting hidden
   avoids a flash of fully-drawn chalk before the first scroll frame lands. */
const stroke = (a, b, ch = 'g') => ({
  className: 'stroke',
  pathLength: 1,
  'data-ch': ch,
  'data-a': a,
  'data-b': b,
  style: { strokeDashoffset: 1, strokeOpacity: 0 },
});
const fade = (a, b, ch = 'g', extra = '') => ({
  className: `rv${extra ? ` ${extra}` : ''}`,
  'data-ch': ch,
  'data-a': a,
  'data-b': b,
  style: { '--r': 0 },
});

/** The student's own overall trajectory — the mean of their dimension
 *  histories — falling back to the sample roll when nobody is signed in. */
function trajectory(user) {
  if (!user?.history) return growth;
  const dims = Object.values(user.history);
  const n = dims[0].length;
  const data = Array.from({ length: n }, (_, i) =>
    Math.round(dims.reduce((a, h) => a + h[i], 0) / dims.length));
  return { data, labels: data.map((_, i) => (i === n - 1 ? 'today' : String(i + 1))) };
}

export default function GrowthGraph({ user }) {
  const m = useIsMobile();
  const W = m ? 400 : 640;
  const H = m ? 340 : 330;
  const L = m ? 46 : 54;
  const R = m ? 22 : 34;
  const T = m ? 44 : 46;
  const B = m ? 46 : 48;

  const { data, labels } = trajectory(user);

  // Seeded so the wobble is identical on every render at a given breakpoint.
  // The call ORDER below must not change or the strokes shift.
  const rng = rngF(7);
  const last = data.length - 1;
  const lo = Math.max(0, Math.min(...data) - 10);
  const hi = Math.min(100, Math.max(...data) + 10);
  const pts = data.map((v, i) => [
    L + (i * (W - L - R)) / last,
    H - B - ((v - lo) / (hi - lo)) * (H - B - T),
  ]);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(lo + (hi - lo) * f));
  const yFor = (v) => H - B - ((v - lo) / (hi - lo)) * (H - B - T);
  const gridLines = ticks.map((v) => wobble(L - 6, yFor(v), W - R, yFor(v), 1.6, rng));

  const ax = L - 16;
  const ay = H - B + 10;
  const axisY = wobble(ax, T - 10, ax, ay, 2, rng);
  const axisX = wobble(ax, ay, W - R + 6, ay, 2, rng);
  const axisTip = `M${W - R - 6} ${ay - 7} L${W - R + 7} ${ay} L${W - R - 6} ${ay + 7}`;

  // Jittered midpoints keep the line from reading as a clean spline.
  const lp = [];
  pts.forEach((p, i) => {
    lp.push([p[0] + (rng() - 0.5) * 1.5, p[1] + (rng() - 0.5) * 1.5]);
    if (i < last) {
      const q = pts[i + 1];
      lp.push([
        (p[0] + q[0]) / 2 + (rng() - 0.5) * 4,
        (p[1] + q[1]) / 2 + (rng() - 0.5) * 6,
      ]);
    }
  });
  const lp2 = lp.map((p) => [p[0] + (rng() - 0.5) * 4 + 1.5, p[1] + (rng() - 0.5) * 4 - 1]);
  const linePath = smooth(lp, false);
  const linePath2 = smooth(lp2, false);

  const marks = pts.map((p, i) => {
    const a = 0.25 + 0.6 * (i / last) - 0.02;
    const b = a + 0.07;
    const isLast = i === last;
    return {
      i, a, b, last: isLast,
      ring: handCircle(p[0], p[1], isLast ? 12 : 9, rng),
      halo: isLast ? handCircle(p[0], p[1], 20, rng) : null,
      lx: isLast ? Math.min(p[0], W - R - 6) : p[0] + 4,
      ly: isLast ? p[1] - 32 : p[1] - 22,
    };
  });

  const alt = `Communication growth across the last ${data.length} practices: ${data.join(', ')}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={alt} preserveAspectRatio="xMidYMid meet">
      {/* horizon lines */}
      <g {...fade(0.04, 0.28)} fill="none" stroke="#F1EFE3" strokeOpacity=".2" strokeWidth="1.6" strokeDasharray="3 8" strokeLinecap="round">
        {gridLines.map((d, i) => <path key={i} d={d} />)}
      </g>

      {/* axes */}
      <g stroke="#F1EFE3" strokeWidth="3" strokeOpacity=".8">
        <path {...stroke(0.02, 0.16)} d={axisY} />
        <path {...stroke(0.08, 0.24)} d={axisX} />
        <path {...stroke(0.22, 0.27)} d={axisTip} />
      </g>

      {/* scale + practice labels */}
      <g {...fade(0.1, 0.3)}>
        {[ticks[0], ticks[2], ticks[4]].map((v) => (
          <text key={v} className="g-lbl" x={ax - 8} y={yFor(v) + 7} textAnchor="end">{v}</text>
        ))}
        {pts.map((p, i) => (
          <text key={i} className={i === last ? 'g-now' : 'g-lbl'} x={f(p[0])} y={ay + 34} textAnchor="middle">
            {labels[i]}
          </text>
        ))}
      </g>

      {/* the line: soft halo, solid core, then a lighter second pass */}
      <path {...stroke(0.25, 0.85)} stroke="#F1EFE3" strokeOpacity=".14" strokeWidth="13" d={linePath} />
      <path {...stroke(0.25, 0.85)} stroke="#F1EFE3" strokeWidth="5.5" d={linePath} />
      <path {...stroke(0.26, 0.86)} stroke="#F1EFE3" strokeOpacity=".55" strokeWidth="2.4" d={linePath2} />

      {/* point rings, with the latest one circled twice and called out */}
      {marks.map((mk) => (
        <g key={mk.i}>
          <path {...stroke(+f(mk.a), +f(mk.b))} stroke="#F1EFE3" strokeWidth="3.6" d={mk.ring} />
          {mk.halo && (
            <path {...stroke(+f(mk.b), +f(mk.b + 0.06))} stroke="#F1EFE3" strokeOpacity=".6" strokeWidth="2.4" d={mk.halo} />
          )}
          {(mk.i === 0 || mk.last) && (
            <text
              {...fade(+f(mk.a + 0.02), +f(mk.b + 0.06), 'g', mk.last ? 'g-val' : 'g-val sm')}
              x={f(mk.lx)}
              y={f(mk.ly)}
              textAnchor="middle"
            >
              {data[mk.i]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
