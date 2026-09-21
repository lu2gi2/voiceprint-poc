import { useEffect, useMemo, useState } from 'react';
import VoiceOrb from '../components/VoiceOrb';
import useAudioRecorder from '../hooks/useAudioRecorder';
import { byId } from '../data/assessments';

const fmt = (s) => {
  const n = Math.max(0, Math.floor(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
};

/**
 * Runs one assessment: the board asks, the orb listens, you hear it back.
 *
 * The target time is shown as a countdown that keeps going past zero rather
 * than cutting you off — going long is the thing being measured, so the
 * recording has to be allowed to run long enough to show it.
 */
export default function SessionPage({ assessmentId, onExit, onComplete }) {
  const assessment = byId(assessmentId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const rec = useAudioRecorder();

  const q = assessment?.questions[index];
  const isLast = index === (assessment?.questions.length ?? 0) - 1;
  const over = q ? rec.duration - q.target : 0;

  // Fresh recorder state for each question.
  useEffect(() => { rec.reset(); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Releases the mic if you leave mid-answer.
  useEffect(() => () => rec.reset(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = rec.status === 'stopped' && rec.clip;

  const next = () => {
    const entry = {
      prompt: q.prompt,
      target: q.target,
      seconds: rec.clip?.seconds ?? 0,
      bytes: rec.clip?.blob.size ?? 0,
    };
    const all = [...answers, entry];
    setAnswers(all);
    if (isLast) onComplete(assessment, all);
    else setIndex((i) => i + 1);
  };

  const progress = useMemo(
    () => ((index + (answered ? 1 : 0)) / (assessment?.questions.length || 1)) * 100,
    [index, answered, assessment],
  );

  if (!assessment || !q) return null;

  return (
    <div className="session">
      <header className="session-bar">
        <button className="back" type="button" onClick={onExit}>
          <i>←</i> LEAVE SESSION
        </button>
        <span className="session-which">
          {assessment.title} · question {index + 1} of {assessment.questions.length}
        </span>
      </header>

      <div className="session-progress" role="progressbar" aria-valuenow={Math.round(progress)}
        aria-valuemin={0} aria-valuemax={100} aria-label="Session progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <main className="session-main" id="main">
        <div className="frame session-frame">
          <div className="board session-board">
            <div className="smudges" aria-hidden="true" />

            <div className="session-q">
              <p className="session-kind">{assessment.kind}</p>
              <h1 className="session-prompt chalk">“{q.prompt}”</h1>
              <p className="session-guide">{q.guidance}</p>
            </div>

            <div className="session-stage">
              <button
                type="button"
                className={`orb-btn${rec.status === 'recording' ? ' recording' : ''}`}
                onClick={rec.status === 'recording' ? rec.stop : rec.start}
                disabled={rec.status === 'requesting' || answered}
                aria-label={rec.status === 'recording' ? 'Stop recording' : 'Start recording your answer'}
              >
                <VoiceOrb analyserRef={rec.analyserRef} live={rec.status === 'recording'} />
              </button>

              <div className="session-readout">
                {rec.status === 'idle' && (
                  <>
                    <p className="sr-big">Tap to answer</p>
                    <p className="sr-sub">Aim for about {fmt(q.target)}. Speak at your normal pace.</p>
                  </>
                )}

                {rec.status === 'requesting' && (
                  <>
                    <p className="sr-big">Waiting for the mic…</p>
                    <p className="sr-sub">Allow microphone access when your browser asks.</p>
                  </>
                )}

                {rec.status === 'recording' && (
                  <>
                    <p className={`sr-big timer${over > 0 ? ' over' : ''}`}>{fmt(rec.duration)}</p>
                    <p className="sr-sub">
                      {over > 0
                        ? `${fmt(over)} over the ${fmt(q.target)} target — start landing it.`
                        : `${fmt(q.target - rec.duration)} of target left. Tap the sphere to finish.`}
                    </p>
                  </>
                )}

                {answered && (
                  <>
                    <p className="sr-big">Answer captured</p>
                    <p className="sr-sub">
                      {fmt(rec.clip.seconds)} against a {fmt(q.target)} target
                      {rec.clip.seconds > q.target
                        ? ` — ${fmt(rec.clip.seconds - q.target)} long.`
                        : '. Inside the target.'}
                    </p>
                    <audio className="sr-audio" src={rec.clip.url} controls preload="metadata" />
                  </>
                )}

                {rec.status === 'error' && (
                  <>
                    <p className="sr-big err">Cannot record</p>
                    <p className="sr-sub err" role="alert">{rec.error?.message}</p>
                  </>
                )}
              </div>
            </div>

            <div className="session-actions">
              {answered && (
                <button type="button" className="auth-swap" onClick={rec.reset}>
                  ↺ Record it again
                </button>
              )}
              {rec.status === 'error' && (
                <button type="button" className="auth-swap" onClick={rec.reset}>
                  ↺ Try again
                </button>
              )}
              <span className="session-spacer" />
              {answered && (
                <button type="button" className="chalk-btn" onClick={next}>
                  {isLast ? 'FINISH SESSION' : 'NEXT QUESTION'} <i>→</i>
                </button>
              )}
            </div>

            <p className="session-note">
              Recorded in your browser only. Nothing is uploaded — the POC has no backend yet.
            </p>

            <div className="dust" aria-hidden="true" />
          </div>

          <div className="ledge" aria-hidden="true">
            <i className="chalk-dust" />
            <i className="chalk-a" />
            <i className="chalk-c" />
            <i className="chalk-b" />
            <i className="eraser" />
          </div>
        </div>
      </main>
    </div>
  );
}
