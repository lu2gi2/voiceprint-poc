import { forwardRef } from 'react';
import { Tape } from './paper';

/** The circled-in-red focus word, as if marked by hand. */
function Circled({ children }) {
  return (
    <span className="circled">
      {children}
      <svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M14 33 C8 12 70 4 112 6 C162 8 197 16 192 35 C187 53 130 58 90 55 C40 52 4 45 16 22" />
      </svg>
    </span>
  );
}

const CoachingCue = forwardRef(function CoachingCue({ onPractice, focus }, ref) {
  return (
    <section className="coach" id="practice" ref={ref} aria-label="Next coaching cue">
      <div className="coach-in">
        <div className="sheet">
          <Tape rotate={2} />
          <div className="holes" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          <p className="eyebrow">NEXT COACHING CUE</p>
          <blockquote>
            “Your ideas are strong.
            <br />
            Now make them easier to follow.”
          </blockquote>

          <dl className="cue">
            <div>
              <dt>Focus:</dt>
              <dd>
                <Circled>{focus || 'Complete an assessment'}</Circled>
              </dd>
            </div>
            <div>
              <dt>Practice:</dt>
              <dd>Answer the next interview question in 45 seconds.</dd>
            </div>
          </dl>

          <button className="btn" type="button" onClick={onPractice}>
            PRACTICE NOW <i>→</i>
          </button>

          <span className="margin-note" aria-hidden="true">three sentences is enough</span>
        </div>
      </div>
    </section>
  );
});

export default CoachingCue;
