/* Hand-drawn chalk geometry helpers.
   Ported verbatim from the design prototype so every stroke keeps the same
   wobble. The RNG is seeded, so paths are deterministic across renders. */

export function rngF(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => n.toFixed(1);

/** Catmull-Rom style smoothing through a list of [x,y] points. */
export function smooth(pts, closed) {
  const n = pts.length;
  let d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
  const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1);
    const p1 = P(i);
    const p2 = P(i + 1);
    const p3 = P(i + 2);
    d +=
      'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) +
      ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) +
      ' ' + f(p2[0]) + ' ' + f(p2[1]);
  }
  return d;
}

/** A line from (x1,y1) to (x2,y2) that drifts off-true by up to `amp`. */
export function wobble(x1, y1, x2, y2, amp, rng) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(3, Math.round(len / 70));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      x1 + (x2 - x1) * t + (rng() - 0.5) * amp,
      y1 + (y2 - y1) * t + (rng() - 0.5) * amp,
    ]);
  }
  return smooth(pts, false);
}

/** An overshooting, slightly elliptical circle — as if drawn in one stroke. */
export function handCircle(cx, cy, r, rng) {
  const a0 = rng() * 6.28;
  const pts = [];
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * 6.28 * 1.12;
    const rr = r * (0.94 + (0.1 * i) / n) * (1 + (rng() - 0.5) * 0.14);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return smooth(pts, false);
}

export { f as fixed };
