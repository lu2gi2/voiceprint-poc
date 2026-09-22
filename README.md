# Voiceprint POC

Front-end prototype for the AI-powered communication assessment and coaching
platform described in the PRD. A student signs in, takes a recorded interview
round, and gets a report showing where they are strong, where they are weak, and
what to practise next.

Everything is a paper-and-chalkboard metaphor: the dashboard is a blackboard
that draws itself in as you scroll, skills are sticky notes, coaching arrives on
ruled notebook paper, and the record button is a sphere of chalk that moves with
your voice.

## Run it

```bash
npm install
npm run dev
```

## Deployment

The frontend is configured for Netlify through `netlify.toml`. Set the Netlify
environment variable `VITE_API_URL` to the public HTTPS URL of the deployed
FastAPI backend before building.

The backend can run from `backend/Dockerfile`. Configure these backend
environment variables in the hosting provider:

- `DATABASE_URL`: managed PostgreSQL connection string
- `CORS_ORIGINS`: JSON list containing the Netlify site origin
- `STORAGE_DIR`: durable object-storage integration is required for production audio retention
- `WHISPER_MODEL`, `WHISPER_DEVICE`, and `WHISPER_COMPUTE_TYPE`: speech runtime settings

The backend container runs `alembic upgrade head` before starting FastAPI. Do
not run the development seed script in a production database.

Then open the printed URL. Production build: `npm run build && npm run preview`.

Recording needs a secure context, so use `localhost` or https — the app says so
rather than failing silently if you don't.

## The flow

| View | File | What it is |
| --- | --- | --- |
| **Sign in** | `pages/AuthPage.jsx` | A blackboard that asks who's speaking. Any email and any password get you in. |
| **Journey** | `pages/JourneyPage.jsx` | The student's home — the pinned blackboard and its growth line, the wall of skill notes, the next coaching cue, recent practice. |
| **Report** | `pages/StatsPage.jsx` | Reached by tapping the blackboard. Leads with strongest/weakest, then the charts behind it. |
| **Practice** | `pages/AssessmentsPage.jsx` | Pick an assessment track. |
| **Session** | `pages/SessionPage.jsx` | The live round: the board asks, the orb listens, you hear the answer back. |

## Assessment tracks

Six are live — HR, Technical, Behavioural (STAR), Placement Mock, Impromptu and
Presentation. Each is a handful of questions with a **target time**, because
conciseness is one of the scored dimensions and a question with no time
expectation cannot measure it. The timer keeps running past the target instead
of cutting you off: going long is the thing being measured.

Group Discussion and Workplace Scenarios are listed locked, with the PRD phase
that unblocks them (speaker diarisation, and corporate simulation).

Tracks live in `src/data/assessments.js`.

## What is real, and what is not

**Real: the microphone.** `SessionPage` captures through `getUserMedia` into a
`MediaRecorder`, so you hear your own answer back. The clip stays in the page as
an object URL and is released when you move on — nothing is uploaded.

**Simulated: everything else.** Transcripts, speech metrics, scores, evidence
and the coaching plan are fixture data in `src/data/fixtures.js`. The demo calls
no model, persists nothing, and accepts any credentials by design — there is no
account to authenticate against. The only external request the page makes is for
its web fonts.

Against the PRD's §11 POC scope:

| Requirement | State |
| --- | --- |
| FR-01 student login | done |
| FR-02 assessment selection | done |
| FR-03 multi-question interview | done |
| FR-04 microphone interaction | done — real capture |
| FR-08 progress tracking | done |
| Evidence-backed scoring, personalised feedback | designed, on fixture data |
| Speech-to-text, transcripts | needs a backend |
| Speech metrics, LLM evaluation | needs a backend |

## Structure

```
src/
  lib/chalk.js          hand-drawn stroke geometry (seeded, so marks are stable)
  lib/viz.js            chart palette + scales, and why the colours are what they are
  data/fixtures.js      sample scores, shaped like the eventual API responses
  data/assessments.js   the assessment catalogue
  hooks/                mic recorder, chalkboard scroll engine, media queries
  components/           the paper/chalk vocabulary, page sections, charts/
  pages/                the five views
```

## Notes for whoever picks this up

**The mic is the fragile part.** Every path that ends a recording stops the
MediaStream tracks — stop, re-record, leaving mid-answer, unmount, and a failure
during setup. Miss one and the browser's recording indicator stays lit with the
mic held open. `getUserMedia`'s exceptions are mapped to copy a student can act
on (blocked, no device, device busy, insecure page, unsupported browser), and
the clip's mime type is read back from `recorder.mimeType` rather than assumed.
The candidate list comes from what the browser reports supporting, but when it
supports none of them the recorder picks its own — Safari answers mp4, Chrome
answers webm — and the label has to follow the bytes, not the guess made before
construction.

**Chart colours are blue/red, not green/red.** Green/red measures ΔE 4.2 under
deuteranopia — indistinguishable for red-green colourblind readers, on charts
whose whole purpose is strong vs weak. Both palettes were validated against
their own surface. Colour is never the only signal: sort order, direct labels, a
legend and a toggleable table of every value carry it too. The reasoning is
written into `src/lib/viz.js`; please read it before "fixing" the palette.

**Two hot paths write to the DOM directly, not through React state.** The
chalkboard scroll engine (`hooks/useChalkScroll.js`) and the voice orb
(`components/VoiceOrb.jsx`) both run inside an animation frame; routing them
through state would re-render the page 60 times a second.

**Chalk geometry is seeded.** `lib/chalk.js` uses a deterministic RNG, and the
order of calls into it decides where every wobble lands. Reordering them
silently reshapes the graphs.

## Next

Wire `fixtures.js` to a real API, and post the blobs `SessionPage` already holds
to a speech-to-text endpoint. Those two are the whole seam between this and the
backend described in the PRD.
