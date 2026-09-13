# Voiceprint POC

A deterministic frontend demo for the AI-powered communication assessment and coaching platform described in the PRD.

## Run it

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## What is simulated

This POC is intentionally client-side and hardcoded. It demonstrates the intended product experience across the continuous loop:

**Assess → Analyze → Coach → Practice → Reassess → Track Growth**

The microphone, transcript, speech metrics, evaluation evidence, adaptive recommendation, and longitudinal scores are deterministic fixture data. The demo does not request microphone access, call a model, send network requests, or persist student data.
