# Voiceprint POC

Frontend prototype for the AI-powered communication assessment and coaching
platform described in the PRD.

## Run it

```bash
npm install
npm run dev
```

Production build: `npm run build && npm run preview`.

## The two views

**Journey** (`src/pages/JourneyPage.jsx`) — the student's home. A blackboard
that pins while you scroll and draws its growth chalk-line in, a wall of sticky
skill notes, the next coaching cue, recent practice, and the loop diagram.

**Stats** (`src/pages/StatsPage.jsx`) — reached by tapping the blackboard. The
full report: the longitudinal profile written up on the board (PRD §9), an
evidence note per dimension (§7), raw speech telemetry and STAR breakdown (§6),
and the coaching plan that follows from them (§8).

## Structure

```
src/
  lib/chalk.js        hand-drawn stroke geometry (seeded, deterministic)
  data/fixtures.js    all sample data, shaped like the eventual API responses
  hooks/              scroll engine, media queries, reveal-on-scroll
  components/         the paper/chalk vocabulary and each page section
  pages/              the two views
```

## What is simulated

Everything. The microphone, transcript, speech metrics, scores, evidence and
coaching plan are fixture data in `src/data/fixtures.js`. The demo does not
request microphone access, call a model, make network requests, or persist
anything. Swapping `fixtures.js` for API calls is the intended next step.
