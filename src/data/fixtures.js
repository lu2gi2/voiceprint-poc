/* Deterministic sample data for the POC. No network, no persistence.
   Shapes here mirror what the evaluation/coaching agents in the PRD would
   eventually return, so swapping fixtures for an API is a drop-in change. */

export const student = {
  name: 'Aditi',
  initial: 'A',
  year: '2nd Year',
  branch: 'Computer Science',
  practices: 12,
  readiness: 76,
  focusQuote: 'Slow down just enough to let your strongest ideas land.',
};

/* ---------- Journey page ---------- */

export const growth = {
  data: [54, 62, 69, 74, 78, 82],
  labels: ['1', '2', '3', '4', '5', 'today'],
};

export const CHECKS = [
  ['Clarity', 'stronger'],
  ['Structure', 'more consistent'],
  ['Pacing', 'improving'],
  ['Fillers', 'fewer'],
  ['Confidence', 'steadier'],
];

export const NOTES = [
  {
    key: 'mastery', title: 'SKILL MASTERY', sub: 'Clarity · Vocabulary', pct: 72,
    c: 'var(--y)', rot: -2.4, dy: 0, pin: '#C0483E', tip: 'sharper word choices',
    rows: [['Clarity', 74], ['Vocabulary', 70]],
    note: 'Your word choices are getting sharper. Try one precise word instead of two vague ones.',
  },
  {
    key: 'speech', title: 'SPEECH GROWTH', sub: 'Fillers · Pauses', pct: 68,
    c: 'var(--p)', rot: 1.8, dy: 28, tape: true, tip: 'fewer “um”s',
    rows: [['Fillers', 66], ['Pauses', 70]],
    note: 'Fewer “um”s than before. Let a pause do the work of a filler.',
  },
  {
    key: 'star', title: 'STAR ADHERENCE', sub: 'Structure · Evidence', pct: 81,
    c: 'var(--b)', rot: -1.2, dy: -6, pin: '#3E6FA0', tip: 'strong openings',
    rows: [['Structure', 83], ['Evidence', 79]],
    note: 'Situation and Task are solid. Spend a little longer on the Result.',
  },
  {
    key: 'pacing', title: 'PACING & DELIVERY', sub: 'Rate · Pauses', pct: 76,
    c: 'var(--g)', rot: 2.2, dy: 6, tape: true, tip: 'a calmer pace',
    rows: [['Rate', 78], ['Pauses', 74]],
    note: 'A calmer pace. Let the key point land before you move on.',
  },
  {
    key: 'ready', title: 'INTERVIEW READINESS', sub: 'Overall pattern', pct: 76,
    c: 'var(--l)', rot: -2, dy: 30, pin: '#4E8A5B', tip: 'steady, week on week',
    rows: [['Content', 80], ['Delivery', 76], ['Composure', 72]],
    note: 'Steady and clear. Concise answers are the next step.',
  },
];

export const RECENT = [
  { t: 'MOCK INTERVIEW', q: 'Tell me about yourself', w: 'Today', d: '08:42', rot: -0.8, dx: 0 },
  { t: 'BEHAVIORAL ROUND', q: 'Describe a difficult problem', w: 'Yesterday', d: '06:15', rot: 0.9, dx: 0 },
  { t: 'HR PRACTICE', q: 'Why should we hire you?', w: 'Sep 18', d: '07:21', rot: -0.5, dx: 0 },
];

export const STEPS = [
  ['ASSESS', 'hear your baseline', 'var(--y)', -3],
  ['ANALYZE', 'see the evidence', 'var(--p)', 2.5],
  ['COACH', 'one clear focus', 'var(--b)', -2],
  ['PRACTICE', 'try it again', 'var(--g)', 3],
  ['REASSESS', 'measure the change', 'var(--l)', -2.5],
  ['GROW', 'carry it forward', 'var(--y)', 2],
];

export const PRACTICE_QUESTIONS = [
  'Tell me about a project you’re proud of.',
  'Why this role, and why now?',
  'Describe a time you disagreed with a teammate.',
  'What is your biggest strength? Give one example.',
];

export const NOTIFICATIONS = [
  'Your coach left a note on pacing.',
  'A new 45-second question is ready.',
];

/* ---------- Stats page ---------- */

/* PRD §9 — longitudinal profile. `terms` are the column headers. */
export const longitudinal = {
  terms: ['SEM 1', 'SEM 2', 'SEM 3', 'NOW'],
  skills: [
    { name: 'Fluency', scores: [54, 61, 70, 78] },
    { name: 'Clarity', scores: [49, 58, 67, 74] },
    { name: 'Structure', scores: [42, 51, 63, 71] },
    { name: 'Conciseness', scores: [39, 44, 55, 65] },
    { name: 'Vocabulary', scores: [61, 64, 69, 73] },
  ],
};

/* PRD §7 — every score carries the measurements it was derived from. */
export const evidence = [
  {
    key: 'fluency', title: 'FLUENCY', score: 78, c: 'var(--y)', rot: -2.2, dy: 0,
    measures: [
      ['Speaking rate', '143 wpm'],
      ['Filler words', '12 total'],
      ['Long pauses', '6'],
      ['Repeated phrases', '4'],
    ],
    fix: 'Swap “uh” and “um” for a deliberate silent beat.',
  },
  {
    key: 'clarity', title: 'CLARITY', score: 74, c: 'var(--b)', rot: 1.6, dy: 22,
    measures: [
      ['Sentences completed', '86%'],
      ['Avg sentence length', '19 words'],
      ['Jargon without setup', '5'],
      ['Restated points', '3'],
    ],
    fix: 'Give the plain-English headline before the technical detail.',
  },
  {
    key: 'structure', title: 'STRUCTURE', score: 71, c: 'var(--g)', rot: -1.4, dy: -8,
    measures: [
      ['Situation covered', '100%'],
      ['Task covered', '92%'],
      ['Action covered', '75%'],
      ['Result quantified', '58%'],
    ],
    fix: 'Land a number in the Result — time, percent, or money saved.',
  },
  {
    key: 'conciseness', title: 'CONCISENESS', score: 65, c: 'var(--p)', rot: 2.4, dy: 14,
    measures: [
      ['Avg answer length', '2m 40s'],
      ['Reasonable target', '90s'],
      ['Time before main point', '58s'],
      ['Tangents per answer', '1.8'],
    ],
    fix: 'Open with the outcome, then explain how you got there.',
  },
];

/* The benchmark every dimension is read against — the "interview ready" bar. */
export const BENCHMARK = 75;

/* PRD §6 — raw speech metrics behind the scores.
   `band` is the healthy range and `scale` the axis, so each row can be drawn
   as a bullet chart: you see the target zone and where the reading actually
   landed, instead of a bare number you have to already know how to judge. */
export const telemetry = [
  { name: 'Speaking rate',       value: 143, unit: 'wpm',      band: [120, 160], scale: [80, 200] },
  { name: 'Filler words',        value: 2.4, unit: '/ min',    band: [0, 1.5],   scale: [0, 5] },
  { name: 'Pause frequency',     value: 12,  unit: '/ min',    band: [8, 14],    scale: [0, 24] },
  { name: 'Avg pause length',    value: 1.4, unit: 's',        band: [0.8, 2.0], scale: [0, 3] },
  { name: 'Repeated words',      value: 4,   unit: '/ answer', band: [0, 2],     scale: [0, 8] },
  { name: 'Sentence completion', value: 86,  unit: '%',        band: [90, 100],  scale: [50, 100] },
  { name: 'Voice consistency',   value: 82,  unit: '%',        band: [75, 100],  scale: [50, 100] },
];

export const starStages = [
  ['Situation', 100],
  ['Task', 92],
  ['Action', 75],
  ['Result', 58],
];

/* PRD §8 — the coaching agent's plan, targeted at the weakest dimension. */
export const coachingPlan = {
  weakness: 'Conciseness',
  why: 'You take 2m 40s on answers that land better in 90 seconds.',
  weeks: [
    {
      when: 'WEEK 1', tag: 'DONE', done: true, rot: -0.7, pin: '#4E8A5B',
      do: 'Answer every question inside 90 seconds.',
      why: 'Builds the instinct to cut setup before it becomes a habit.',
    },
    {
      when: 'WEEK 2', tag: 'IN PROGRESS', done: false, rot: 0.8, pin: '#C0483E',
      do: 'Lead with the result, then fill in the story.',
      why: 'Front-loading the outcome keeps the listener with you.',
    },
    {
      when: 'WEEK 3', tag: 'NEXT', done: false, rot: -0.5, pin: '#3E6FA0',
      do: 'Explain one technical concept in under 60 seconds.',
      why: 'Compression under a clock is what interviews actually test.',
    },
    {
      when: 'WEEK 4', tag: 'REASSESS', done: false, rot: 0.6, pin: '#D9A72E',
      do: 'Retake the behavioural round and compare the evidence.',
      why: 'Closes the loop — the next score is measured against this one.',
    },
  ],
};
