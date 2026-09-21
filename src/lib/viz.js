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
 * Rank skills against the benchmark. Returns them sorted strongest first,
 * each tagged with its standing — the report leans on this everywhere so the
 * ordering and the colouring can never disagree with each other.
 */
export function rankSkills(skills, benchmark) {
  return skills
    .map((s) => {
      const now = s.scores[s.scores.length - 1];
      const first = s.scores[0];
      return {
        ...s,
        now,
        first,
        delta: now - first,
        gap: now - benchmark,
        ahead: now >= benchmark,
      };
    })
    .sort((a, b) => b.now - a.now);
}
