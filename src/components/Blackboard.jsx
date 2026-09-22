import { forwardRef } from 'react';
import GrowthGraph, { trajectory } from './GrowthGraph';
import { CHECKS } from '../data/fixtures';
import { fixed as f } from '../lib/chalk';

const TICK = 'M4 19 C8 22 11 25 13 29 C17 19 24 11 32 5';

function Checklist() {
  return (
    <ul>
      {CHECKS.map(([word, sub], i) => {
        const a = 0.06 + i * 0.16;
        return (
          <li
            key={word}
            className="ck rv"
            data-ch="l"
            data-a={f(a)}
            data-b={f(a + 0.08)}
            style={{ '--r': 0 }}
          >
            <svg className="tick" viewBox="0 0 36 36" aria-hidden="true">
              <path
                className="stroke"
                pathLength={1}
                data-ch="l"
                data-a={f(a + 0.02)}
                data-b={f(a + 0.14)}
                style={{ strokeDashoffset: 1, strokeOpacity: 0 }}
                d={TICK}
              />
            </svg>
            <span>
              <span className="w">{word}</span>
              <span className="s">{sub}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The blackboard. It pins while you scroll past and the chalk draws itself in
 * (see useChalkScroll). The whole board is a button: tapping it opens the
 * full stats page.
 */
const Blackboard = forwardRef(function Blackboard(
  { stickRef, frameRef, graphRef, listRef, onOpenStats, user },
  trackRef,
) {
  // Counted from the same trajectory the graph draws, so the caption cannot
  // claim six practices over a four-point series.
  const points = trajectory(user).data.length;

  return (
    <section className="board-track" id="board" ref={trackRef} aria-label="Your communication journey">
      <div className="board-stick" ref={stickRef}>
        <div className="frame" ref={frameRef}>
          <div className="board">
            <div className="smudges" aria-hidden="true" />
            <div className="chalk-ghost" aria-hidden="true">
              <span>um…</span>
              <span>like, you know</span>
              <span>so basically</span>
            </div>

            <div className="board-grid">
              <div className="b-head">
                <p className="b-eyebrow">YOUR COMMUNICATION JOURNEY</p>
                <h2 className="b-title chalk">The voice you are building.</h2>
                <p className="b-sub">One glance. The pattern across your recent practice.</p>
              </div>

              <figure className="b-graph" ref={graphRef}>
                <div className="g-cap">
                  <span className="g-title chalk">Communication Growth</span>
                  <span className="g-sub">
                    LAST {points} {points === 1 ? 'PRACTICE' : 'PRACTICES'}
                  </span>
                </div>
                <div className="g-svg">
                  <GrowthGraph user={user} />
                </div>
                <p className="g-axis rv" data-ch="g" data-a=".85" data-b="1" style={{ '--r': 0 }}>
                  steadier → clearer → more confident
                </p>
              </figure>

              <div className="b-list" ref={listRef}>
                <h3 className="chalk">
                  What is moving?
                  <svg viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      className="stroke"
                      pathLength={1}
                      data-ch="l"
                      data-a="0"
                      data-b=".1"
                      style={{ strokeDashoffset: 1, strokeOpacity: 0 }}
                      d="M2 6 C40 2 80 9 120 5 S180 6 198 3"
                      stroke="#F1EFE3"
                      strokeWidth="2.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </h3>

                <Checklist />

                <p className="b-quote rv" data-ch="l" data-a=".86" data-b="1" style={{ '--r': 0 }}>
                  Say less. Mean more.
                  <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M2 7 C50 2 100 10 150 4 S190 7 198 5"
                      fill="none"
                      stroke="#EBDCA0"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </p>
              </div>
            </div>

            <div className="dust" aria-hidden="true" />

            {/* The board itself is the way in to the full report. */}
            <button
              type="button"
              className="board-open"
              onClick={onOpenStats}
              aria-label="Open your full stats and performance report"
            />
            <span className="board-cue" aria-hidden="true">
              tap the board for the full report <i>→</i>
            </span>
          </div>

          <div className="ledge" aria-hidden="true">
            <i className="chalk-dust" />
            <i className="chalk-a" />
            <i className="chalk-c" />
            <i className="chalk-b" />
            <i className="eraser" />
          </div>
        </div>
      </div>
    </section>
  );
});

export default Blackboard;
