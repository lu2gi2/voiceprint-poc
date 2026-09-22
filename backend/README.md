# Voiceprint backend — v1

Takes a recorded answer and returns **evidence-backed scores**: not a number a
model felt like, but a number you can trace to a measurement.

Runs with no API keys and no cloud services. Transcription is local.

## Run it

```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Needs `ffmpeg` on PATH. First request downloads the Whisper model (~150 MB),
so it is slow once and fast after.

Defaults to SQLite, so there is nothing to set up. For the Postgres the PRD
targets:

```bash
docker compose up -d          # local Postgres
# in backend/.env: DATABASE_URL=postgresql+psycopg://voiceprint:voiceprint@localhost:5432/voiceprint
.venv/bin/alembic upgrade head
.venv/bin/python seed_demo_data.py   # optional - a handful of demo accounts, password "voiceprint"
```

SQLite still auto-creates its schema on boot (`app.db.init_db`) — the whole
point of defaulting to it is no setup ritual. Postgres is migration-managed
(`backend/alembic`); `init_db` only checks the schema exists there and warns
if `alembic upgrade head` hasn't been run, rather than silently creating it
and drifting out of sync with the migration history.

## API

| | |
| --- | --- |
| `POST /api/auth/register` | create a student account |
| `POST /api/auth/login` | student or admin login |
| `POST /api/sessions` | open a session for an already-authenticated student |
| `POST /api/sessions/{id}/answers` | upload one answer (multipart) → `202` |
| `GET /api/sessions/{id}` | full session, per-answer transcript + measurements |
| `GET /api/sessions/{id}/summary` | per-dimension rollup, weakest first |
| `POST /api/sessions/{id}/complete` | mark finished, kicks off the report for resume-driven/fixed-script tracks that have one |
| `GET /api/students/{id}/history` | a student's real per-dimension score history across sessions |
| `GET /api/health` | also what the front end pings to decide live-vs-fixtures |

Upload returns `202` because transcription takes seconds to tens of seconds.
The client polls. `BackgroundTasks` is the right size for a POC — swap in a
real queue when a job lost on restart starts to matter.

## The pipeline

Both branches of PRD §13, because only one of them can produce evidence:

```
audio ──► ffmpeg 16k mono ──┬──► faster-whisper (word timestamps) ──┐
                            └──► librosa (energy, pitch) ───────────┴──► measurements ──► scores
```

Word timings are the point of the STT call, not the text: words-per-minute,
pause counts and pause lengths all come from the gaps between words, which is
far more reliable than hunting for silence in the waveform.

## What it scores, and what it refuses to

**Fluency** and **Conciseness**, rule-based from measurements, on every
answer regardless of track.

Clarity, Structure, Vocabulary and the rest are judgements about *content*
and need an LLM reading the transcript — inventing rule-based numbers for
them is exactly the dishonesty PRD §7 forbids. These now come from a real
DeepSeek report (`app/llm`), track-aware (`app/llm/tracks.py`): each
assessment track defines its own dimensions and what a genuine follow-up or
correction looks like, not one hardcoded prompt. Absent rather than faked
for any track with nothing configured (Impromptu Speaking, by design — its
own `measures` in `assessments.js` are rule-based only).

## Where it admits it might be wrong

Every score carries a confidence. Three things lower it:

- **Zero fillers detected.** Whisper is trained to produce clean prose and
  quietly drops "um" and "uh". A count of zero may mean a fluent speaker or a
  tidy transcriber, and from here the two are indistinguishable. Deepgram or
  AssemblyAI expose disfluencies natively and would remove this caveat.
- **A short answer.** Per-minute rates extrapolated from a few seconds are
  artefacts of sample length, not habits. Under 15s the rate-based penalties
  are skipped rather than applied to noise.
- **Far under target.** Answering in 4s against a 60s target is an unanswered
  question, not concision — capped rather than rewarded, or a 3-second reply
  scores 100.

Hedges ("like", "basically", "you know") are counted **separately** from
fillers and never folded in, because each has a legitimate use and counting
them as fillers would manufacture evidence the audio does not support.

## Not done yet

The 1240-student admin roster and department stats
(`src/data/students.js`/`admin.js`) are still 100% frontend fixture data —
never touches this DB. `StatsPage.jsx`'s dimension history is real data now
on the backend (`GET /students/{id}/history`) but the frontend hasn't been
switched over to read it yet. Login issues no token/session — the frontend
still needs to actually call `/api/auth/*` and hold onto the result. Audio
retention is implemented (`storage.purge_older_than`) but nothing calls it
on a schedule.
