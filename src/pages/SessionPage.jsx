import { useEffect, useMemo, useRef, useState } from 'react';
import VoiceOrb from '../components/VoiceOrb';
import SessionResults from '../components/SessionResults';
import useAudioRecorder from '../hooks/useAudioRecorder';
import { byId } from '../data/assessments';
import { checkHealth, createSession, uploadAnswer, completeSession, pollSummary, pollAnswer, getSession } from '../lib/api';

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
export default function SessionPage({ assessmentId, user, onExit, onDone, onComplete }) {
  const assessment = byId(assessmentId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState('answering'); // answering | results
  const [summary, setSummary] = useState(null);
  const [offline, setOffline] = useState(false);
  const [heard, setHeard] = useState(null);   // { status, transcript } for this question
  const [transcripts, setTranscripts] = useState([]);
  const rec = useAudioRecorder();

  // The backend is optional. Open a session if it is there; if not, the round
  // still runs, it just comes back unscored.
  const remoteId = useRef(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const health = await checkHealth();
      if (cancelled) return;
      if (!health || !health.ok || health.status !== 'ok') { setOffline(true); return; }
      try {
        const s = await createSession({
          student: { email: user?.email || 'demo@voiceprint.local', name: user?.name || 'Student' },
          assessment,
        });
        if (!cancelled) remoteId.current = s.id;
      } catch {
        if (!cancelled) setOffline(true);
      }
    })();
    return () => { cancelled = true; };
  }, [assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = assessment?.questions[index];
  const isLast = index === (assessment?.questions.length ?? 0) - 1;
  const over = q ? rec.duration - q.target : 0;

  // Fresh recorder state for each question.
  useEffect(() => { rec.reset(); setHeard(null); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // The moment an answer is captured, send it and start listening for the
  // transcript. Uploading here rather than on "next" means the words are on
  // screen while the student is still looking at the question they answered.
  const sentFor = useRef(null);
  useEffect(() => {
    const clip = rec.clip;
    if (rec.status !== 'stopped' || !clip || !remoteId.current) return;
    if (sentFor.current === clip.url) return;   // one upload per recording
    sentFor.current = clip.url;

    let cancelled = false;
    setHeard({ status: 'uploading', transcript: null });
    uploadAnswer(remoteId.current, {
      index, prompt: q.prompt, target: q.target, blob: clip.blob, mime: clip.mime,
    })
      .then(({ answer_id }) => {
        if (cancelled) return null;
        setHeard({ status: 'transcribing', transcript: null });
        return pollAnswer(answer_id);
      })
      .then((a) => {
        if (cancelled || !a) return;
        if (a.status === 'failed') { setHeard({ status: 'failed', transcript: null }); return; }
        setHeard({ status: 'ready', transcript: a.transcript });
        setTranscripts((t) => [...t, { index, prompt: q.prompt, text: a.transcript }]);
      })
      .catch(() => { if (!cancelled) setOffline(true); });
    return () => { cancelled = true; };
  }, [rec.status, rec.clip, index]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (!isLast) { setIndex((i) => i + 1); return; }

    setPhase('results');
    onComplete(assessment, all);           // pin it to the journal straight away
    if (!remoteId.current) { setOffline(true); return; }
    completeSession(remoteId.current).catch(() => {});
    pollSummary(remoteId.current, { onTick: setSummary }).then(async (final) => {
      setSummary(final);
      // Pick up every transcript, including any the student clicked past.
      try {
        const full = await getSession(remoteId.current);
        setTranscripts(full.answers
          .filter((a) => a.transcript)
          .map((a) => ({ index: a.question_index, prompt: a.prompt, text: a.transcript })));
      } catch { /* the scores are the important part */ }
    });
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

            {phase === 'results' ? (
              <SessionResults summary={summary} transcripts={transcripts} offline={offline} onDone={onDone} />
            ) : (
            <>
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

                    {heard && (
                      <div className="heard">
                        <p className="heard-lab">
                          {heard.status === 'ready' ? 'WHAT WE HEARD'
                            : heard.status === 'failed' ? 'COULD NOT TRANSCRIBE'
                            : heard.status === 'transcribing' ? 'TRANSCRIBING…'
                            : 'SENDING…'}
                        </p>
                        {heard.status === 'ready' && <p className="heard-text">“{heard.transcript}”</p>}
                        {heard.status === 'failed' && (
                          <p className="heard-text err">The recording could not be transcribed.</p>
                        )}
                        {(heard.status === 'uploading' || heard.status === 'transcribing') && (
                          <p className="heard-text muted">Listening back to your answer…</p>
                        )}
                      </div>
                    )}
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
              {offline
                ? 'Recorded in your browser only — the analysis service is not running, so answers will not be scored.'
                : 'Answers are sent to the local analysis service for transcription and scoring.'}
            </p>
            </>
            )}

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
