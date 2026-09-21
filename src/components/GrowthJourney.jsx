import { Fragment, useRef } from 'react';
import { Arrow } from './paper';
import { useInViewOnce } from '../hooks/useReveal';
import { STEPS } from '../data/fixtures';

/** The closing loop: Assess → Analyze → Coach → Practice → Reassess → Grow. */
export default function GrowthJourney() {
  const ref = useRef(null);
  const on = useInViewOnce(ref, 0.5);

  return (
    <section className="closing" aria-labelledby="closeH">
      <div className="closing-in">
        <ol className={`journey${on ? ' on' : ''}`} ref={ref} aria-label="The voiceprint loop">
          {STEPS.map(([name, sub, color, rot], i) => (
            <Fragment key={name}>
              <li className="step" style={{ '--i': i, '--c': color, '--rot': `${rot}deg` }}>
                <span className="mini" />
                <span>
                  <b>{name}</b>
                  <em>{sub}</em>
                </span>
              </li>
              {i < STEPS.length - 1 && <Arrow />}
            </Fragment>
          ))}
        </ol>

        <div className="loop" aria-hidden="true">
          <svg viewBox="0 0 1000 74" preserveAspectRatio="none">
            <path d="M915 2 C915 70 85 70 85 10" />
            <path d="M73 22 L85 6 L98 20" />
          </svg>
          <span>and around again</span>
        </div>

        <h2 id="closeH">YOUR VOICE IS PROGRESS.</h2>
        <blockquote>“Every answer leaves a trace. Every practice makes it clearer.”</blockquote>
      </div>
    </section>
  );
}
