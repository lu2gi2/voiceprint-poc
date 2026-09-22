/* Client for the v1 backend.
 *
 * The backend is optional. If it is not running, the app keeps working
 * exactly as it did before — you can still record and play answers back, you
 * just do not get scored. Every call here either returns data or returns null
 * and lets the caller carry on; none of them throw into the UI.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function req(path, options = {}, { timeout = 15000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/** Is there a backend to talk to? Short timeout — this gates the UI. */
export async function checkHealth() {
  try {
    return await req('/api/health', {}, { timeout: 2500 });
  } catch {
    return null;
  }
}

export async function createSession({ student, assessment }) {
  // No explicit Content-Type: the browser defaults to text/plain for a string
  // body, which keeps this a CORS "simple request" (no preflight OPTIONS).
  // The backend parses the body manually to match (see create_session),
  // since FastAPI's automatic JSON parsing only kicks in for
  // Content-Type: application/json. Catalyst AppSail's gateway currently
  // swallows preflight OPTIONS requests before they reach the app container,
  // so avoiding preflight entirely is the workaround until that's fixed.
  return req('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      student: { email: student.email, name: student.name },
      assessment_id: assessment.id,
      assessment_title: assessment.title,
    }),
  });
}

export async function uploadAnswer(sessionId, { index, prompt, target, blob, mime }) {
  const form = new FormData();
  form.append('question_index', String(index));
  form.append('prompt', prompt);
  form.append('target_seconds', String(target));
  // The extension has to match the container or ffmpeg guesses wrong.
  const ext = (mime || '').includes('mp4') ? 'm4a' : 'webm';
  form.append('audio', blob, `answer-${index}.${ext}`);

  // Generous: a long answer can be a few megabytes on a slow uplink.
  return req(`/api/sessions/${sessionId}/answers`, { method: 'POST', body: form }, { timeout: 60000 });
}

/** Upload a resume for the technical-resume track. Throws with the
 *  backend's rejection reason on 400/422 (failed the local checks before
 *  processing even started) so the caller can show it. A 202 means
 *  "processing" — poll getResume/pollResume for the real outcome. */
export async function uploadResume(sessionId, file) {
  const form = new FormData();
  form.append('resume', file, file.name);
  const res = await fetch(`${BASE}/api/sessions/${sessionId}/resume`, { method: 'POST', body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || `${res.status} ${res.statusText}`);
  return body;
}

export async function getResume(sessionId) {
  return req(`/api/sessions/${sessionId}/resume`);
}

/** Wait for the resume's background pipeline (DeepSeek question generation +
 *  Kokoro pre-render) to reach a terminal state: ready | rejected | failed. */
export async function pollResume(sessionId, { onTick, timeoutMs = 120000, everyMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await getResume(sessionId);
      onTick?.(r);
      if (r.status !== 'processing') return r;
    } catch {
      // a blip mid-poll should not strand the screen; keep trying
    }
    await new Promise((res) => setTimeout(res, everyMs));
  }
  return null;
}

export async function getQuestions(sessionId) {
  return req(`/api/sessions/${sessionId}/questions`);
}

export function questionAudioUrl(sessionId, index) {
  return `${BASE}/api/sessions/${sessionId}/questions/${index}/audio`;
}

/** Wait for question `index` to exist — the adaptive next-question step runs
 *  as a background task after the previous answer is scored, so this can
 *  take a while (a DeepSeek call plus a TTS render). Returns null on
 *  timeout rather than throwing, so the caller can show a clear message
 *  instead of an unexplained hang. */
export async function pollForQuestion(sessionId, index, { onTick, timeoutMs = 120000, everyMs = 2500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const qs = await getQuestions(sessionId);
      const found = qs.find((q) => q.question_index === index);
      onTick?.(qs);
      if (found) return found;
    } catch {
      // a blip mid-poll should not strand the interview; keep trying
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return null;
}

export async function getAnswer(answerId) {
  return req(`/api/answers/${answerId}`);
}

/** Wait for one answer to be transcribed, so the student can see what was heard
 *  before moving on. Short deadline — this blocks a visible readout. */
export async function pollAnswer(answerId, { onTick, timeoutMs = 90000, everyMs = 1200 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const a = await getAnswer(answerId);
      onTick?.(a);
      if (a.status === 'ready' || a.status === 'failed') return a;
    } catch {
      // keep polling; a blip should not strand the readout
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return null;
}

export async function getSession(sessionId) {
  return req(`/api/sessions/${sessionId}`);
}

export async function completeSession(sessionId) {
  return req(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
}

export async function getSummary(sessionId) {
  return req(`/api/sessions/${sessionId}/summary`);
}

/**
 * Wait for the backend to finish transcribing. Transcription is several
 * seconds per answer, so this polls rather than holding a request open.
 * Gives up after `timeoutMs` and returns whatever is ready — a partial
 * result is more use than a spinner that never resolves.
 */
export async function pollSummary(sessionId, { onTick, timeoutMs = 180000, everyMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    try {
      last = await getSummary(sessionId);
      onTick?.(last);
      if (!last.processing) return last;
    } catch {
      // A blip mid-session should not kill the results screen; keep polling
      // until the deadline and report whatever we last saw.
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
  return last;
}
