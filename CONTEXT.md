# Voiceprint — project context

Where this came from, what has been built, and the decisions worth knowing
before changing anything. The two READMEs say *how to run* things; this one
says *why they are the way they are*.

- [`README.md`](README.md) — front end
- [`backend/README.md`](backend/README.md) — API and analysis pipeline

---

## 1. The idea

From the PRD: most institutions only assess communication at placement time,
and the feedback is subjective, infrequent and impossible to track. The
product turns communication into a **continuous, measurable process**:

```
Assess → Analyse → Coach → Practice → Reassess → Track growth
```

A student takes recorded interview rounds. The system measures how they spoke,
scores it **with the evidence attached**, tells them what to practise, and
keeps the history so improvement is visible across years rather than guessed at.

**The differentiator is not the AI interviewer.** Plenty of products answer
"how did I do today?". This one is built to answer:

> *How have I developed over three years, what am I still weak at, why, and
> what should I practise next?*

### The principle everything hangs off

PRD §7: **the AI must not invent a score.** Every number carries the
measurements it came from — "Fluency 72, because 143 wpm, 12 fillers, 6 long
pauses". That constraint is the reason for most of the technical decisions
below, and the reason some features are deliberately *absent* rather than
approximated.

---

## 2. Where the code is

| Branch | State |
| --- | --- |
| `master` | The front end. PR #1 merged. |
| `frontend-v2` | Merged into master. |
| `backend-v1` | **Current.** Backend + the wiring to it. Uncommitted. |

Roughly 3,500 lines of front end, 1,100 of backend.

---

## 3. What exists

### Front end — React + Vite

A paper-and-chalkboard metaphor throughout: the dashboard is a blackboard that
draws itself in as you scroll, skills are sticky notes, coaching arrives on
ruled paper, and the record button is a sphere of chalk that moves with your
voice.

| View | What it does |
| --- | --- |
| **Sign in** | A blackboard that asks who's speaking. Any credentials work — there is nothing to authenticate against. |
| **Journey** | Home. The pinned blackboard and growth line, the wall of skill notes, the coaching cue, recent practice. |
| **Report** | Behind the blackboard. Leads with strongest/weakest, then charts. |
| **Practice** | The assessment track picker. |
| **Session** | The live round — the board asks, the orb listens, your words come back as text, then scores. |

### Backend — FastAPI, fully local

Audio in, evidence-backed scores out. No API keys, no cloud services,
transcription runs on the machine.

```
audio ──► ffmpeg 16k mono ──┬──► faster-whisper (word timings) ──┐
                            └──► librosa (energy, pitch) ────────┴──► measurements ──► scores
```

Both branches, because only one of them can produce evidence — see §4.

**Stack:** FastAPI · SQLAlchemy · SQLite by default (Postgres in
`docker-compose.yml`) · faster-whisper `base.en` · librosa · audio on local
disk behind a storage interface.

### The loop, working end to end

Record in the browser → upload → transcribe + analyse → **your words appear on
the board** → scored with evidence → pinned to the journal.

---

## 4. Decisions worth knowing

### The audio-analysis branch is not optional

The original architecture sketch had `STT → Agent → Evaluation`. The PRD's
(§13) forks the audio **two** ways, and the second branch was missing.

That branch is where *143 wpm, 12 fillers, 6 long pauses, 1.4s mean pause*
come from. They are acoustic and timing facts — an LLM reading a transcript
cannot produce them. Without it the model has no measurements and will invent
the numbers, which breaks the one principle the product is built on.

### Whisper deletes the fillers you are trying to count

Whisper is trained to produce *clean prose* and quietly drops "um" and "uh".
A filler count of zero may mean a fluent speaker or a tidy transcriber, and
from inside the pipeline **the two are indistinguishable**.

So a zero count is reported with **low confidence** and the UI says so, rather
than congratulating someone on a clean run that may not have happened. Deepgram
and AssemblyAI expose disfluencies natively and would remove the caveat.

### Only two dimensions are scored, on purpose

**Fluency** and **Conciseness** — both computable from measurements.

Clarity, Structure and Vocabulary are judgements about *content* and need an
LLM reading the transcript. They are **absent rather than faked**; inventing
rule-based numbers for them is exactly the dishonesty §7 forbids. The front end
still shows fixture data for them, clearly marked.

### Rules, not a model, for the scores that exist

A rule can be shown to the student. *"72 because you ran 143 wpm with 6 long
pauses"* is checkable; *"72 because the model said so"* is the subjective
feedback this product exists to replace.

### Hedges are counted separately from fillers

"um" is unambiguously a filler. "like" is a filler in *"it was like really
hard"* and a comparison in *"a tool like this"*. Folding them together would
manufacture evidence the audio does not support, so they are two counts.

### Chart colour is blue/red, not green/red

Green/red measures **ΔE 4.2 under deuteranopia** — indistinguishable for
red-green colourblind readers, on charts whose entire purpose is strong vs
weak. Both palettes were validated per surface (board ΔE 17.6, paper ΔE 15.9).

Colour is never the only signal: sort order, direct labels, a legend and a
toggleable table of every value all carry it. Reasoning is in `src/lib/viz.js`
— **read it before "fixing" the palette.**

### `base.en`, after measuring the alternatives

| model | speed | words | pauses found | bad timestamps |
| --- | --- | --- | --- | --- |
| **base.en** | **28× realtime** | 82 | 11 | 1 |
| small.en | 11× | 82 | 12 | 1 |
| distil-small.en | 14.5× | 84 | **9** | 1 (2 on clip 2) |

The "faster and better" distil model was **slower** than base *and* worse at
the thing that matters most here: word timestamps. Distilled models drop
decoder layers, and word timings come from cross-attention in those layers — so
alignment degrades even when the transcript reads fine. Since wpm and every
pause metric derive from word gaps, weaker timestamps quietly corrupt the
evidence.

Caveat: measured on clean synthetic speech. Re-test on real student audio —
accents, room noise, laptop mics — before treating it as settled.

### Two hot paths bypass React

The chalkboard scroll engine and the voice orb both write to the DOM inside an
animation frame. Routing 56 orb points through state at 60fps would re-render
the page every frame.

### Mic cleanup is the fragile part

Every path that ends a recording stops the MediaStream tracks — stop,
re-record, leaving mid-answer, unmount, and a failure during setup. Miss one
and the browser's recording indicator stays lit with the mic held open.

---

## 5. Verified, not assumed

Everything below was driven in a real browser or against the live API, not
reasoned about:

- **Recording works** — 42,623 bytes captured from a 3-second answer.
- **The mic is released** — `getUserMedia` instrumented to prove the stream
  ends (`live: 0, ended: 1`) after stop *and* after leaving mid-answer.
- **Transcription is accurate** — spoken test sentence came back word-perfect.
- **Permission denial** is handled with a message, not a dead button.
- **Backend-offline** degrades cleanly — recording still works, the UI says why.
- **Scoring is sane** — a deliberately padded answer scored Fluency 50 /
  Conciseness 60 at 167 wpm with 16 padding phrases; a tight one scored 98 / 72.

### Bugs found by looking at output rather than trusting the code

1. **Uncapped padding penalty** — 32.7 hedges/min cost 53 points alone,
   swamping every other signal. Capped.
2. **"Volume consistency" measured the wrong thing** — frame-to-frame RMS is
   dominated by syllable peaks, rating steady speech 0.44. Windowed to ~1s: 0.87.
3. **Per-minute rates from short clips are fiction** — 2 hedges in 4 seconds
   read as 24/min and drove a real penalty. Skipped under 15s.
4. **Which opened a gaming hole** — a 4-second answer then scored 100 for
   conciseness. Answering in 4s against a 60s target is not concision. Capped.
5. **A `.ghost` class collision** in the original design file made the practice
   dialog's FINISH button unclickable.

---

## 6. Not done

| | |
| --- | --- |
| **Real auth** | `POST /sessions` trusts the email it is handed. |
| **LLM evaluation** | Clarity, Structure, Vocabulary — needs an API key. |
| **Longitudinal profile** | Scores are per-session; nothing aggregates across them yet, so the report's history is still fixtures. |
| **Coaching agent** | The week-by-week plan is fixture data. |
| **Adaptive assessment** | PRD §10 — weaknesses do not yet drive question selection. |
| **Audio retention** | Implemented (`storage.purge_older_than`) but nothing schedules it. |
| **Real queue** | `BackgroundTasks` loses jobs on restart. |
| **Group discussion / workplace scenarios** | Listed locked; need diarisation and phase-5 work. |

---

## 7. Running it

```bash
# front end
npm install && npm run dev            # → localhost:5173

# backend (needs ffmpeg on PATH)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

First transcription downloads the Whisper model (~141 MB) and is slow once.
The backend is optional — without it, recording and playback still work, and
the UI says why nothing is scored.

---

## 8. What I would do next

1. **Longitudinal profile.** Aggregate scores per student across sessions. This
   turns the report page from fixtures into real history and is the product's
   actual differentiator — currently the biggest gap between demo and promise.
2. **LLM content evaluation** for the three missing dimensions.
3. **Re-test the STT choice on real student audio.** The model comparison used
   clean synthetic speech; accents and room noise are the real test, and
   transcription errors feed straight into word count and therefore wpm.
4. **Coaching agent**, once there is history to coach against.
5. **Real auth**, last — nothing is blocked on it.
