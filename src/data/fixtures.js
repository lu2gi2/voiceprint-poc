/* Deterministic sample data for the POC. No network, no persistence.
   Shapes here mirror what the evaluation/coaching agents in the PRD would
   eventually return, so swapping fixtures for an API is a drop-in change. */

export const student = {
  name: 'Deepak Bathirachalam',
  initial: 'D',
  year: '2nd Year',
  branch: 'Computer Science',
  email: 'deepak.bathirachalam@university.edu',
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
    key: 'verbs', title: 'REPETITIVE VERBS', sub: 'Repetitive action verbs detected',
    count: '4x', label: 'overused', pct: 68,
    c: 'var(--y)', rot: -2.4, dy: 0, pin: '#C0483E',
    tip: 'Swap ‘helped’ and ‘worked on’ with power verbs like ‘engineered’ or ‘orchestrated’',
    rows: [['Action Verbs', 65], ['Verb Variety', 71]],
    note: 'Overused weak verbs detected 4 times (“assisted”, “worked on”, “helped”). Swap with dynamic action verbs like “engineered” or “orchestrated”.',
  },
  {
    key: 'metrics', title: 'MISSING METRICS', sub: 'Bullets missing measurable results',
    count: '3', label: 'unquantified', pct: 58,
    c: 'var(--p)', rot: 1.8, dy: 28, tape: true,
    tip: 'Add scale metrics: %, latency numbers, user volume, or data processed',
    rows: [['Measurable Impact', 54], ['Numbers & Data', 62]],
    note: '3 bullets lack measurable results. Add scale metrics: %, latency numbers, user volume, or data processed.',
  },
  {
    key: 'star', title: 'BULLET STRUCTURE', sub: 'STAR method missing results',
    count: '2', label: 'incomplete', pct: 81,
    c: 'var(--b)', rot: -1.2, dy: -6, pin: '#3E6FA0',
    tip: 'Complete the bullet formula: [Action Verb] + [Context/Tech] + [Outcome]',
    rows: [['Action & Context', 86], ['Result Closure', 76]],
    note: '2 bullets lack the outcome. Complete the formula: [Action Verb] + [Context/Tech] + [Outcome].',
  },
  {
    key: 'keywords', title: 'KEYWORD GAPS', sub: 'ATS skill keywords omitted from bullets',
    count: '3', label: 'missing tags', pct: 74,
    c: 'var(--g)', rot: 2.2, dy: 6, tape: true,
    tip: 'Mention key tools (e.g. CI/CD, Docker, REST API) inside project bullets',
    rows: [['Domain Skills', 78], ['Keyword Balance', 70]],
    note: '3 core ATS skill keywords omitted. Mention key tools (e.g. CI/CD, Docker, REST API) inside project bullets.',
  },
  {
    key: 'brevity', title: 'FILLER PHRASES', sub: 'Fluff eating up resume whitespace',
    count: '5', label: 'filler phrases', pct: 76,
    c: 'var(--l)', rot: -2, dy: 30, pin: '#4E8A5B',
    tip: 'Drop ‘responsible for’, ‘successfully’, and ‘tasked with’',
    rows: [['Sentence Tightness', 78], ['Filler Removal', 74]],
    note: '5 filler phrases detected eating up whitespace. Drop “responsible for”, “successfully”, and “tasked with”.',
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
      ['Filler words', '2.4 / min'],
      ['Long pauses', '6'],
      ['Avg pause length', '1.4 s'],
      ['Restarted words', '4'],
      ['Voice steadiness', '82%'],
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
      ['Answers following STAR', '78%'],
      ['Clear opening line', '82%'],
      ['Signposted transitions', '1.4 / answer'],
      ['Story order kept', '91%'],
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
