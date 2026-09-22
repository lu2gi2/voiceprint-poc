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

PostgreSQL is the deployment default. Start the included PostgreSQL 16 service,
then set `DATABASE_URL=postgresql+psycopg://voiceprint:voiceprint@localhost:5432/voiceprint`.
SQLite remains available only when explicitly selected, for example
`DATABASE_URL=sqlite:///voiceprint.db`.

For a hosted frontend, set the Vite build variable `VITE_API_URL` to the public
HTTPS URL of the deployed FastAPI service. Set the backend `CORS_ORIGINS`
environment variable to a JSON list containing the deployed frontend origin,
for example `["https://your-site.netlify.app"]`.

Initialize or upgrade the schema with Alembic before starting the API:

```bash
docker compose up -d
# PowerShell: $env:DATABASE_URL="postgresql+psycopg://voiceprint:voiceprint@localhost:5432/voiceprint"
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

For a local screen demonstration, seed clearly labeled development rows through
SQLAlchemy. This is idempotent and does not delete existing data:

```powershell
$env:PYTHONPATH="C:\path\to\voiceprint-poc\backend"
$env:DATABASE_URL="postgresql+psycopg://voiceprint:voiceprint@localhost:5432/voiceprint"
python seed_demo_data.py
```

The seed account is `database-demo-student@example.com`. It is for demos only;
production sessions and scores must come from real API requests and recordings.

## API

| | |
| --- | --- |
| `POST /api/sessions` | open a session |
| `POST /api/students` | create or update a persisted student profile |
| `GET /api/assessments` | read the persisted assessment catalogue and questions |
| `POST /api/sessions/{id}/answers` | upload one answer (multipart) → `202` |
| `GET /api/sessions/{id}` | full session, per-answer transcript + measurements |
| `GET /api/sessions/{id}/summary` | per-dimension rollup, weakest first |
| `POST /api/sessions/{id}/complete` | mark finished |
| `GET /api/health` | also what the front end pings to decide live-vs-fixtures |
| `GET /api/health/db` | executes `SELECT 1` and reports the active database |

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

**Fluency** and **Conciseness** only. Both are computable from measurements.

Clarity, Structure and Vocabulary are judgements about *content* and need an
LLM reading the transcript. They are **absent rather than faked** — inventing
rule-based numbers for them is exactly the dishonesty PRD §7 forbids. The
front end keeps showing fixture data for those until the LLM stage lands.

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

No auth — `POST /sessions` trusts the email it is handed. No LLM stage. No
longitudinal profile across sessions. Audio retention runs during API startup;
deleted files have their `audio_key` cleared and receive an
`audio_deleted_at` timestamp. Answers left in `processing` during a restart
are marked `failed` because the POC background task cannot resume across
processes.
