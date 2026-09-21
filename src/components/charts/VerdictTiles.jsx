import { Pin, Tape } from '../paper';
import { rngF, smooth } from '../../lib/chalk';
import { PAPER, scale, signed } from '../../lib/viz';

/* A stat tile, not a chart: one number is the whole story, and a one-bar bar
   chart would be a worse way to say it. The sparkline is context, not the
   point — so it carries no axis and no labels. */
function Spark({ scores, color, seed }) {
  const W = 120;
  const H = 34;
  const x = scale([0, scores.length - 1], [2, W - 2]);
  const y = scale([Math.min(...scores) - 6, Math.max(...scores) + 6], [H - 3, 3]);
  const rng = rngF(seed);
  const pts = scores.map((v, i) => [x(i) + (rng() - 0.5) * 1.5, y(v) + (rng() - 0.5) * 1.5]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="v-spark" aria-hidden="true">
      <path d={smooth(pts, false)} fill="none" stroke={color} strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.4" fill={color} />
    </svg>
  );
}

/**
 * The answer to "where am I strong, where am I weak", stated before any chart
 * asks the reader to work it out. Everything below this band is the evidence
 * for these two sentences.
 */
export default function VerdictTiles({ best, worst, benchmark }) {
  const tiles = [
    {
      k: 'best', lab: 'STRONGEST', skill: best, color: PAPER.ahead, c: 'var(--b)', rot: -1.4,
      line: best.ahead
        ? `Clear of the ${benchmark} target and still climbing.`
        : `Your best dimension, though still under the ${benchmark} target.`,
      pin: '#3E6FA0',
    },
    {
      k: 'worst', lab: 'NEEDS WORK', skill: worst, color: PAPER.behind, c: 'var(--p)', rot: 1.6,
      line: `${Math.abs(worst.gap)} points under target — this is what the plan below plays for.`,
      tape: true,
    },
  ];

  return (
    <section className="verdict" aria-label="Strongest and weakest dimension">
      {tiles.map((t) => (
        <article key={t.k} className="v-tile" style={{ '--c': t.c, '--rot': `${t.rot}deg` }}>
          {t.tape ? <Tape rotate={-4} /> : <Pin color={t.pin} />}

          <p className="v-lab">{t.lab}</p>
          <p className="v-skill">{t.skill.name}</p>

          <div className="v-row">
            <span className="v-score" style={{ color: t.color }}>{t.skill.now}</span>
            <Spark scores={t.skill.scores} color={t.color} seed={t.k === 'best' ? 3 : 9} />
          </div>

          <p className="v-delta">
            <strong style={{ color: t.color }}>{signed(t.skill.delta)}</strong> since your first assessment
          </p>
          <p className="v-line">{t.line}</p>
        </article>
      ))}
    </section>
  );
}
