/* Small shared bits of the paper/chalk vocabulary: pins, tape, pencil rules
   and the hand-drawn underline that sits beneath headings. */

export function Pin({ color = '#C0483E', style }) {
  return <span className="pin" style={{ '--pin': color, ...style }} />;
}

export function Tape({ rotate = -3, style }) {
  return <span className="tape" style={{ '--tr': `${rotate}deg`, ...style }} />;
}

/** A pencil rule filled to `pct` — the design's inline progress bar. */
export function Pencil({ pct }) {
  const d = 'M2 5 C40 2 80 8 120 4 S180 6 198 4';
  return (
    <svg className="pencil" viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
      <path className="pt" pathLength="100" d={d} />
      <path className="pf" pathLength="100" style={{ strokeDasharray: `${pct} 100` }} d={d} />
    </svg>
  );
}

/** The loose underline swept beneath section headings. */
export function Underline({ stroke = '#1B1A17', width = 3 }) {
  return (
    <svg viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M2 8 C60 2 120 12 200 6 S340 10 398 4"
        fill="none"
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Arrow() {
  return (
    <span className="arrow" aria-hidden="true">
      <svg viewBox="0 0 46 14">
        <path d="M2 8 C14 5 28 9 42 7" />
        <path d="M35 2 L43 7 L34 12" />
      </svg>
    </span>
  );
}
