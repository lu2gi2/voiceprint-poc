import { useEffect, useRef, useState } from 'react';
import { byId } from '../data/assessments';
import {
  checkHealth, createSession, uploadResume, pollResume, getQuestions, questionAudioUrl,
} from '../lib/api';

/**
 * The setup step for the resume-driven technical track: open a session, take
 * a resume, run it past the backend's local checks, then wait for the
 * background pipeline (DeepSeek question generation + Kokoro TTS pre-render)
 * to finish and show the result.
 *
 * There is no live interview loop yet (that is a separate piece, issue #4
 * task 7) — a ready resume ends here, showing the generated questions with
 * playable audio, rather than pretending to hand off into an interview that
 * does not exist yet.
 */
export default function ResumeUploadPage({ assessmentId, user, onExit }) {
  const assessment = byId(assessmentId);
  const [offline, setOffline] = useState(false);
  const [state, setState] = useState('idle'); // idle | uploading | processing | ready | rejected | failed
  const [reason, setReason] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [questions, setQuestions] = useState([]);
  const fileInput = useRef(null);
  const remoteId = useRef(null);

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
    setQuestions([]);
    try {
      const result = await uploadResume(remoteId.current, file);
      if (result.status !== 'processing') {
        // failed a local check synchronously (400/422 already throws; this
        // covers any other non-processing status the backend might return)
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
      setState(final.status);
      setReason(final.reject_reason);
      if (final.status === 'ready') {
        const qs = await getQuestions(remoteId.current).catch(() => []);
        setQuestions(qs);
      }
    } catch (err) {
      setState('rejected');
      setReason(err.message);
    }
  };

  if (!assessment) return null;

  return (
    <div className="session">
      <header className="session-bar">
        <button className="back" type="button" onClick={onExit}>
          <i>←</i> LEAVE SESSION
        </button>
        <span className="session-which">{assessment.title} · resume upload</span>
      </header>

      <main className="session-main" id="main">
        <div className="frame session-frame">
          <div className="board session-board">
            <div className="smudges" aria-hidden="true" />

            <div className="session-q">
              <p className="session-kind">{assessment.kind}</p>
              <h1 className="session-prompt chalk">Upload your resume to begin.</h1>
              <p className="session-guide">
                PDF or docx, text-based (not a scanned image). Used only to draw questions
                from what you actually built — nothing else.
              </p>
            </div>

            <div className="session-stage">
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
                {state === 'ready' && (
                  <>
                    <p className="sr-big">Questions ready</p>
                    <p className="sr-sub">
                      Drawn from “{fileName}”. There is no live interview loop yet — this is
                      as far as this track goes for now.
                    </p>
                    <ol className="resume-questions">
                      {questions.map((q) => (
                        <li key={q.question_index}>
                          <p className="heard-text">“{q.prompt}”</p>
                          <audio controls preload="none" src={questionAudioUrl(remoteId.current, q.question_index)} />
                        </li>
                      ))}
                    </ol>
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
            </div>

            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx"
              onChange={onFile}
              style={{ display: 'none' }}
            />

            <div className="session-actions">
              <span className="session-spacer" />
              <button
                type="button"
                className="chalk-btn"
                onClick={pickFile}
                disabled={state === 'uploading' || state === 'processing'}
              >
                {state === 'idle' ? 'CHOOSE RESUME' : 'CHOOSE A DIFFERENT FILE'} <i>→</i>
              </button>
            </div>

            <p className="session-note">
              {offline
                ? 'The analysis service is not running, so a resume cannot be checked right now.'
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
