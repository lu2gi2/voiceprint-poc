import { useEffect, useRef, useState } from 'react';
import { byId } from '../data/assessments';
import {
  checkHealth, createSession, uploadResume, pollResume, getQuestions, questionAudioUrl,
  uploadAnswer, pollAnswer, pollForQuestion, completeSession, pollSummary, getSession,
} from '../lib/api';
import useAudioRecorder from '../hooks/useAudioRecorder';
import useTtsPlayback from '../hooks/useTtsPlayback';
import VoiceOrb from '../components/VoiceOrb';
import SessionResults from '../components/SessionResults';

// Fixed interview length. The backend never generates a question past this;
// this constant just lets the frontend independently know when to stop
// asking instead of waiting on a 7th question that will never arrive.
const MAX_QUESTIONS = 6;

const fmt = (s) => {
  const n = Math.max(0, Math.floor(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
};

/**
 * The resume-driven technical track, start to finish: upload a resume, wait
 * for it to be validated and question 1 generated, then run the interview —
 * the agent asks each question by voice (Kokoro, pre-rendered), the student
 * answers by voice, and the next question is generated adaptively from the
 * conversation so far, one at a time, until MAX_QUESTIONS is reached.
 *
 * The orb is the same VoiceOrb used on the scripted tracks — it is just fed
 * the TTS playback's own analyser while the agent is "speaking", and the
 * mic's analyser while the student is answering. There is deliberately no
 * play button anywhere here: the orb animating is the only indicator that
 * the agent is talking.
 */
export default function ResumeUploadPage({ assessmentId, user, onExit, onDone, onComplete }) {
  const assessment = byId(assessmentId);
  const [offline, setOffline] = useState(false);
  const [state, setState] = useState('idle'); // idle | uploading | processing | rejected | failed | interview | results
  const [reason, setReason] = useState(null);
  const [fileName, setFileName] = useState(null);

  const [questions, setQuestions] = useState([]); // fetched so far, by question_index
  const [qIndex, setQIndex] = useState(0);
  const [agentState, setAgentState] = useState('speaking'); // speaking | blocked | listening | next
  const [heard, setHeard] = useState(null);
  const [answers, setAnswers] = useState([]); // for the journal entry, same shape SessionPage builds
  const [transcripts, setTranscripts] = useState([]);
  const [summary, setSummary] = useState(null);

  const fileInput = useRef(null);
  const remoteId = useRef(null);
  const playedIndex = useRef(-1);
  const sentFor = useRef(null);
  const rec = useAudioRecorder();
  const tts = useTtsPlayback();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const health = await checkHealth();
      if (cancelled) return;
      if (!health) { setOffline(true); return; }
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

  const pickFile = () => fileInput.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFileName(file.name);

    if (!remoteId.current) {
      setState('rejected');
      setReason('The analysis service is not running, so a resume cannot be checked right now.');
      return;
    }

    setState('uploading');
    setReason(null);
    try {
      const result = await uploadResume(remoteId.current, file);
      if (result.status !== 'processing') {
        setState('rejected');
        setReason(result.reject_reason);
        return;
      }
      setState('processing');
      const final = await pollResume(remoteId.current);
      if (!final) {
        setState('failed');
        setReason('Timed out waiting for question generation.');
        return;
      }
      if (final.status !== 'ready') {
        setState(final.status);
        setReason(final.reject_reason);
        return;
      }
      const qs = await getQuestions(remoteId.current).catch(() => []);
      setQuestions(qs);
      setQIndex(0);
      setHeard(null);
      playedIndex.current = -1;
      setState('interview');
    } catch (err) {
      setState('rejected');
      setReason(err.message);
    }
  };

  // The moment the current question is available and hasn't been played
  // yet, ask it — this is what makes the agent ask immediately rather than
  // waiting for a manual "play" action.
  useEffect(() => {
    if (state !== 'interview') return;
    const current = questions.find((x) => x.question_index === qIndex);
    if (!current || playedIndex.current === qIndex) return;
    playedIndex.current = qIndex;
    rec.reset();
    setHeard(null);
    setAgentState('speaking');
    tts.play(questionAudioUrl(remoteId.current, qIndex), { onEnded: () => setAgentState('listening') });
  }, [state, qIndex, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = questions.find((x) => x.question_index === qIndex);
  const answered = rec.status === 'stopped' && rec.clip;
  const over = current && agentState !== 'speaking' ? rec.duration - current.target_seconds : 0;

  // Upload the moment an answer is captured — words on screen while the
  // student is still looking at the question they just answered.
  useEffect(() => {
    const clip = rec.clip;
    if (rec.status !== 'stopped' || !clip || !remoteId.current || !current) return;
    if (sentFor.current === clip.url) return;
    sentFor.current = clip.url;

    let cancelled = false;
    setHeard({ status: 'uploading', transcript: null });
    uploadAnswer(remoteId.current, {
      index: qIndex, prompt: current.prompt, target: current.target_seconds, blob: clip.blob, mime: clip.mime,
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
        setTranscripts((t) => [...t, { index: qIndex, prompt: current.prompt, text: a.transcript }]);
      })
      .catch(() => { if (!cancelled) setOffline(true); });
    return () => { cancelled = true; };
  }, [rec.status, rec.clip, qIndex, current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => rec.reset(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const finishInterview = () => {
    setState('results');
    onComplete?.(assessment, answers);
    if (!remoteId.current) { setOffline(true); return; }
    completeSession(remoteId.current).catch(() => {});
    pollSummary(remoteId.current, { onTick: setSummary }).then(async (final) => {
      setSummary(final);
      try {
        const full = await getSession(remoteId.current);
        setTranscripts(full.answers
          .filter((a) => a.transcript)
          .map((a) => ({ index: a.question_index, prompt: a.prompt, text: a.transcript })));
      } catch { /* the scores are the important part */ }
    });
  };

  const goNext = async () => {
    const entry = {
      prompt: current.prompt,
      target: current.target_seconds,
      seconds: rec.clip?.seconds ?? 0,
      bytes: rec.clip?.blob.size ?? 0,
    };
    setAnswers((a) => [...a, entry]);

    if (qIndex >= MAX_QUESTIONS - 1) {
      finishInterview();
      return;
    }

    setAgentState('next');
    const nextQ = await pollForQuestion(remoteId.current, qIndex + 1);
    if (!nextQ) {
      setReason('Timed out waiting for the next question — the interview cannot continue.');
      setState('failed');
      return;
    }
    setQuestions((qs) => [...qs, nextQ]);
    setQIndex((i) => i + 1);
  };

  if (!assessment) return null;

  if (state === 'results') {
    return (
      <div className="session">
        <header className="session-bar">
          <button className="back" type="button" onClick={onExit}>
            <i>←</i> LEAVE SESSION
          </button>
          <span className="session-which">{assessment.title} · results</span>
        </header>
        <main className="session-main" id="main">
          <div className="frame session-frame">
            <div className="board session-board">
              <div className="smudges" aria-hidden="true" />
              <SessionResults summary={summary} transcripts={transcripts} offline={offline} onDone={onDone} />
              <div className="dust" aria-hidden="true" />
            </div>
            <div className="ledge" aria-hidden="true">
              <i className="chalk-dust" /><i className="chalk-a" /><i className="chalk-c" /><i className="chalk-b" /><i className="eraser" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const progress = state === 'interview' ? ((qIndex + (answered ? 1 : 0)) / MAX_QUESTIONS) * 100 : 0;

  return (
    <div className="session">
      <header className="session-bar">
        <button className="back" type="button" onClick={onExit}>
          <i>←</i> LEAVE SESSION
        </button>
        <span className="session-which">
          {state === 'interview'
            ? `${assessment.title} · question ${qIndex + 1} of ${MAX_QUESTIONS}`
            : `${assessment.title} · resume upload`}
        </span>
      </header>

      {state === 'interview' && (
        <div className="session-progress" role="progressbar" aria-valuenow={Math.round(progress)}
          aria-valuemin={0} aria-valuemax={100} aria-label="Interview progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <main className="session-main" id="main">
        <div className="frame session-frame">
          <div className="board session-board">
            <div className="smudges" aria-hidden="true" />

            {state !== 'interview' && (
              <div className="session-q">
                <p className="session-kind">{assessment.kind}</p>
                <h1 className="session-prompt chalk">Upload your resume to begin.</h1>
                <p className="session-guide">
                  PDF or docx, text-based (not a scanned image). Used only to draw questions
                  from what you actually built — nothing else.
                </p>
              </div>
            )}

            {state === 'interview' && current && (
              <div className="session-q">
                <p className="session-kind">{assessment.kind}</p>
                <h1 className="session-prompt chalk">“{current.prompt}”</h1>
              </div>
            )}

            <div className="session-stage">
              {state !== 'interview' && (
                <div className="session-readout">
                  {state === 'idle' && (
                    <>
                      <p className="sr-big">No file chosen</p>
                      <p className="sr-sub">Choose a resume to check it.</p>
                    </>
                  )}
                  {state === 'uploading' && (
                    <>
                      <p className="sr-big">Checking “{fileName}”…</p>
                      <p className="sr-sub">Extracting text and confirming this looks like a resume.</p>
                    </>
                  )}
                  {state === 'processing' && (
                    <>
                      <p className="sr-big">Reading “{fileName}”…</p>
                      <p className="sr-sub">Generating interview questions from your projects and skills.</p>
                    </>
                  )}
                  {state === 'rejected' && (
                    <>
                      <p className="sr-big err">“{fileName}” was not accepted</p>
                      <p className="sr-sub err" role="alert">{reason}</p>
                    </>
                  )}
                  {state === 'failed' && (
                    <>
                      <p className="sr-big err">Something went wrong processing “{fileName}”</p>
                      <p className="sr-sub err" role="alert">{reason}</p>
                    </>
                  )}
                </div>
              )}

              {state === 'interview' && (
                <>
                  <button
                    type="button"
                    className={`orb-btn${rec.status === 'recording' ? ' recording' : ''}`}
                    onClick={() => {
                      if (agentState === 'blocked') { tts.retry(); return; }
                      if (agentState !== 'listening' || answered) return;
                      rec.status === 'recording' ? rec.stop() : rec.start();
                    }}
                    disabled={rec.status === 'requesting' || answered || agentState === 'speaking' || agentState === 'next'}
                    aria-label={
                      agentState === 'blocked' ? 'Tap to hear the question'
                        : rec.status === 'recording' ? 'Stop recording' : 'Start recording your answer'
                    }
                  >
                    <VoiceOrb
                      analyserRef={agentState === 'speaking' ? tts.analyserRef : rec.analyserRef}
                      live={agentState === 'speaking' ? tts.playing : rec.status === 'recording'}
                    />
                  </button>

                  <div className="session-readout">
                    {agentState === 'speaking' && (
                      <>
                        <p className="sr-big">Asking the question…</p>
                        <p className="sr-sub">Listen — you will be able to answer once it finishes.</p>
                      </>
                    )}
                    {agentState === 'blocked' && (
                      <>
                        <p className="sr-big">Tap the orb to hear the question</p>
                        <p className="sr-sub">Your browser needs one tap before it will play audio.</p>
                      </>
                    )}
                    {agentState === 'listening' && rec.status === 'idle' && (
                      <>
                        <p className="sr-big">Tap to answer</p>
                        <p className="sr-sub">Aim for about {fmt(current.target_seconds)}. Speak at your normal pace.</p>
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
                            ? `${fmt(over)} over the ${fmt(current.target_seconds)} target — start landing it.`
                            : `${fmt(current.target_seconds - rec.duration)} of target left. Tap the sphere to finish.`}
                        </p>
                      </>
                    )}
                    {answered && (
                      <>
                        <p className="sr-big">Answer captured</p>
                        <p className="sr-sub">
                          {fmt(rec.clip.seconds)} against a {fmt(current.target_seconds)} target
                          {rec.clip.seconds > current.target_seconds
                            ? ` — ${fmt(rec.clip.seconds - current.target_seconds)} long.`
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
                    {agentState === 'next' && (
                      <p className="sr-sub muted">Preparing the next question from your answer…</p>
                    )}
                    {rec.status === 'error' && (
                      <>
                        <p className="sr-big err">Cannot record</p>
                        <p className="sr-sub err" role="alert">{rec.error?.message}</p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {state !== 'interview' && (
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.docx"
                onChange={onFile}
                style={{ display: 'none' }}
              />
            )}

            <div className="session-actions">
              {state === 'interview' && answered && (
                <button type="button" className="auth-swap" onClick={rec.reset}>
                  ↺ Record it again
                </button>
              )}
              {state === 'interview' && rec.status === 'error' && (
                <button type="button" className="auth-swap" onClick={rec.reset}>
                  ↺ Try again
                </button>
              )}
              <span className="session-spacer" />
              {state !== 'interview' && (
                <button
                  type="button"
                  className="chalk-btn"
                  onClick={pickFile}
                  disabled={state === 'uploading' || state === 'processing'}
                >
                  {state === 'idle' ? 'CHOOSE RESUME' : 'CHOOSE A DIFFERENT FILE'} <i>→</i>
                </button>
              )}
              {state === 'interview' && answered && (
                <button type="button" className="chalk-btn" onClick={goNext} disabled={agentState === 'next'}>
                  {qIndex >= MAX_QUESTIONS - 1 ? 'FINISH SESSION' : 'NEXT QUESTION'} <i>→</i>
                </button>
              )}
            </div>

            <p className="session-note">
              {offline
                ? 'The analysis service is not running, so a resume cannot be checked right now.'
                : state === 'interview'
                  ? 'Answers are sent to the local analysis service for transcription and scoring.'
                  : 'Your resume is parsed locally and never stored as a file — only the extracted text is kept.'}
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
