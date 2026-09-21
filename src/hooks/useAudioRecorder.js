import { useCallback, useEffect, useRef, useState } from 'react';

/* Safari will not take webm; Chrome and Firefox will not take mp4. Pick the
   first the browser admits to supporting rather than assuming either. */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
];
const pickMime = () =>
  MIME_CANDIDATES.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';

/** Turn the browser's DOMException zoo into something we can write copy for. */
function classify(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return { kind: 'denied', message: 'Microphone access was blocked. Allow it in your browser’s address bar, then try again.' };
    case 'NotFoundError':
    case 'OverconstrainedError':
      return { kind: 'no-device', message: 'No microphone found. Plug one in or pick a different input device.' };
    case 'NotReadableError':
      return { kind: 'busy', message: 'Your microphone is in use by another app. Close it and try again.' };
    default:
      return { kind: 'unknown', message: err?.message || 'The microphone could not be started.' };
  }
}

/**
 * Records a single answer and exposes the live signal for the orb to draw.
 *
 * The analyser is handed out as a ref, not as state: the orb reads it ~60
 * times a second inside its own animation frame, and routing that through
 * React would re-render the page on every frame. Duration is state, but it
 * only ticks at 10fps.
 *
 * Every path that ends a recording also stops the MediaStream tracks. Without
 * that the browser's recording indicator stays lit and the mic stays held
 * open after the user thinks they are done.
 */
export default function useAudioRecorder() {
  const [status, setStatus] = useState('idle'); // idle | requesting | recording | stopped | error
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [clip, setClip] = useState(null); // { url, blob, mime, seconds }

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAt = useRef(0);
  const tickRef = useRef(null);
  const clipUrlRef = useRef(null);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
    clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  // Release the mic if the component goes away mid-recording.
  useEffect(() => () => {
    try { recorderRef.current?.stop(); } catch { /* already inactive */ }
    releaseStream();
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
  }, [releaseStream]);

  const start = useCallback(async () => {
    setError(null);

    if (!window.isSecureContext) {
      setStatus('error');
      setError({ kind: 'insecure', message: 'Recording needs a secure page — open this over https, or on localhost.' });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('error');
      setError({ kind: 'unsupported', message: 'This browser cannot record audio. Try a recent Chrome, Firefox or Safari.' });
      return;
    }

    setStatus('requesting');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch (err) {
      setStatus('error');
      setError(classify(err));
      return;
    }

    streamRef.current = stream;

    // Live signal for the orb. Created after the click, so the autoplay
    // policy is satisfied and the context starts running rather than suspended.
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    ctx.createMediaStreamSource(stream).connect(analyser);
    // Deliberately not connected to ctx.destination — piping the mic to the
    // speakers is a feedback loop.
    analyserRef.current = analyser;

    const mime = pickMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const seconds = Math.max(0, (Date.now() - startedAt.current) / 1000);
      const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
      if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
      const url = URL.createObjectURL(blob);
      clipUrlRef.current = url;
      setClip({ url, blob, mime: mime || 'audio/webm', seconds });
      setDuration(seconds);
      setStatus('stopped');
      releaseStream();
    };
    recorder.onerror = (e) => {
      setStatus('error');
      setError(classify(e.error));
      releaseStream();
    };

    startedAt.current = Date.now();
    setDuration(0);
    recorder.start(250); // timeslice, so a long answer is not one giant chunk
    setStatus('recording');

    tickRef.current = setInterval(() => {
      setDuration((Date.now() - startedAt.current) / 1000);
    }, 100);
  }, [releaseStream]);

  const stop = useCallback(() => {
    clearInterval(tickRef.current);
    tickRef.current = null;
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop(); // onstop finishes the job
    else { releaseStream(); setStatus('stopped'); }
  }, [releaseStream]);

  const reset = useCallback(() => {
    try { recorderRef.current?.stop(); } catch { /* already inactive */ }
    releaseStream();
    if (clipUrlRef.current) URL.revokeObjectURL(clipUrlRef.current);
    clipUrlRef.current = null;
    chunksRef.current = [];
    setClip(null);
    setDuration(0);
    setError(null);
    setStatus('idle');
  }, [releaseStream]);

  return { status, error, duration, clip, analyserRef, start, stop, reset };
}
