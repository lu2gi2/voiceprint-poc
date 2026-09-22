/* Chart palette and scales.
 *
 * Every chart on the report answers one question: is this above or below the
 * bar we're aiming at? That is a DIVERGING job — two opposed poles and a
 * neutral middle — not a categorical one, so there are exactly two hues.
 *
 * Blue/red rather than the obvious green/red: a green↔red pair measures
 * ΔE 4.2 under deuteranopia, i.e. the two states are indistinguishable for
 * red-green colourblind readers — the single most common way a "strong vs
 * weak" chart fails the people who most need to read it. Both pairs below
 * were checked with the dataviz validator against their own surface and pass
 * every check (board ΔE 17.6, paper ΔE 15.9 under CVD).
 *
 * Colour is never the only signal: every mark is direct-labelled, both charts
 * carry a legend, and the longitudinal table repeats every number as text.
 */

/* On the blackboard — coloured chalk, read against #18231E. */
export const BOARD = {
  ahead: '#4E92C9',
  behind: '#CE6055',
  neutral: '#BFC6BE', // --chalk-mute, the diverging midpoint
  chalk: '#F1EFE3',
  accent: '#EBDCA0',
};

/* On paper — ink, read against #FBF8EE. */
export const PAPER = {
  ahead: '#2F6BA5',
  behind: '#C0483E',
  neutral: '#5B574C', // --obj-mute
  ink: '#1B1A17',
};

/** Linear scale from a data domain to a pixel range. */
export const scale = ([d0, d1], [r0, r1]) => (v) =>
  r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** Clamp a value into its domain so a wild reading can't escape the plot. */
export const clampTo = ([d0, d1], v) => Math.max(d0, Math.min(d1, v));

/** Signed delta, always written with its sign so direction is explicit. */
export const signed = (n) => (n > 0 ? `+${n}` : `${n}`);

/**
 * Derive what is actually interesting about each dimension.
 *
 * The report used to show the same five scores in five different chart styles.
 * A score repeated is not analysis — so instead of re-drawing the level, work
 * out what is *distinctive* about each dimension and say that once.
 *
 * Level alone hides the thing that matters: a dimension sitting at 74 and
 * climbing is in a completely different situation from one sitting at 74 and
 * stalled, and the old page made you compare two charts to notice.
 */
export function diagnose(skills, benchmark) {
  const rows = skills.map((s) => {
    const n = s.scores.length;
    const now = s.scores[n - 1];
    const first = s.scores[0];
    const delta = now - first;
    // Average movement per assessment, used for the projection below.
    const rate = n > 1 ? delta / (n - 1) : 0;
    // Early half vs recent half: catches a dimension that has plateaued after
    // a good start, which the total delta flatters.
    const early = s.scores[Math.floor(n / 2)] - s.scores[0];
    const recent = s.scores[n - 1] - s.scores[Math.floor(n / 2)];
    const gap = now - benchmark;
    return { ...s, now, first, delta, rate, early, recent, gap, ahead: now >= benchmark };
  });

  const byDelta = [...rows].sort((a, b) => b.delta - a.delta);
  const byNow = [...rows].sort((a, b) => b.now - a.now);
  const byFirst = [...rows].sort((a, b) => b.first - a.first);
  const weakest = byNow[byNow.length - 1];

  return rows
    .map((r) => {
      const startRank = byFirst.findIndex((x) => x.name === r.name) + 1;
      const nowRank = byNow.findIndex((x) => x.name === r.name) + 1;
      // Rounds needed to clear the benchmark at the pace of the last few.
      const toTarget = r.ahead || r.rate <= 0 ? 0 : Math.ceil((benchmark - r.now) / r.rate);

      // One line, and only the most notable thing — a list of observations
      // per dimension is just the repetition problem in prose.
      let note;
      if (r.name === weakest.name) {
        note = r.recent > r.early
          ? `Furthest from target, but moving fastest lately (+${r.recent} in recent rounds)`
          : `Furthest from target — ${Math.abs(r.gap)} points short`;
      } else if (r.ahead) {
        note = `Clear of the ${benchmark} target`;
      } else if (r.name === byDelta[0].name) {
        note = `Biggest gain overall, +${r.delta} since you started`;
      } else if (nowRank > startRank) {
        note = `Started your strongest, now ${ordinal(nowRank)} — slowest to improve`;
      } else if (Math.abs(r.gap) <= 2) {
        note = `Within ${Math.abs(r.gap)} ${Math.abs(r.gap) === 1 ? 'point' : 'points'} of target`;
      } else if (r.recent < r.early) {
        note = `Rising, but slower than it was (+${r.early} then, +${r.recent} now)`;
      } else {
        note = `Steady climb, ${Math.abs(r.gap)} points to go`;
      }

      return { ...r, startRank, nowRank, toTarget, note };
    })
    .sort((a, b) => a.now - b.now); // weakest first — that is what to act on
}

const ordinal = (n) => ['', 'first', 'second', 'third', 'fourth', 'fifth'][n] || `${n}th`;
