/* Admin / placement-cell fixtures.
 *
 * The mock prototype showed counts. Counts tell a placement officer that a
 * problem exists; they do not tell them what to do on Monday. So alongside the
 * headline numbers this carries the things the job actually turns on:
 *
 *  - which students are closest to crossing a band, because trainer time is
 *    finite and those students convert for the least effort
 *  - which students have stopped practising, who are invisible in any
 *    score-based view precisely because they have no recent scores
 *  - which dimension is weakest college-wide, because that decides which
 *    workshop to run
 */

export const college = {
  name: 'RMK Innovate',
  term: 'Odd semester 2026',
  totalStudents: 1240,
  departments: 4,
  overallReadiness: 74,
  readinessDelta: 9,
  participation: 81,
  participated: 1004,
  needIntervention: 146,
};

/* Ordered low → high. The prototype used four unrelated hues; these bands are
   an ordered scale, so they take a single-hue ramp that darkens as readiness
   rises (validated for this surface — see lib/viz). Green/red would also have
   made the two most important bands indistinguishable under deuteranopia. */
export const BANDS = [
  { key: 'low',          label: 'Low',          range: 'below 50%',  min: 0,  max: 49,  students: 46,  meaning: 'Needs intensive support', step: 0 },
  { key: 'medium',       label: 'Medium',       range: '50–64%',     min: 50, max: 64,  students: 184, meaning: 'Needs improvement',       step: 1 },
  { key: 'intermediate', label: 'Intermediate', range: '65–79%',     min: 65, max: 79,  students: 524, meaning: 'Nearly placement ready',  step: 2 },
  { key: 'high',         label: 'High',         range: '80–100%',    min: 80, max: 100, students: 486, meaning: 'Placement ready',         step: 3 },
];

export const departments = [
  { code: 'CSE', name: 'Computer Science', readiness: 82, students: 420, flagged: 48,  trend: +6 },
  { code: 'IT',  name: 'Information Tech', readiness: 78, students: 280, flagged: 32,  trend: +8 },
  { code: 'ECE', name: 'Electronics',      readiness: 64, students: 330, flagged: 28,  trend: +3 },
  { code: 'EEE', name: 'Electrical',       readiness: 59, students: 210, flagged: 16,  trend: -2 },
];

/* College-wide average per dimension. This is what decides which workshop to
   run — a readiness number alone cannot. */
export const collegeDimensions = [
  { name: 'Fluency',     score: 76, delta: +7 },
  { name: 'Vocabulary',  score: 74, delta: +4 },
  { name: 'Clarity',     score: 71, delta: +6 },
  { name: 'Structure',   score: 68, delta: +9 },
  { name: 'Conciseness', score: 63, delta: +5 },
];

/* The worklist. Sorted by how few points separate a student from the next
   band, because that is the order that moves the most students for the least
   trainer time. `gap` is points to the next band boundary. */
export const interventionList = [
  { id: 'S1', name: 'Karthik R',   dept: 'ECE', score: 63, band: 'medium',       gap: 2, weakest: 'Conciseness', lastPractice: '3 days ago',  sessions: 9 },
  { id: 'S2', name: 'Meera S',     dept: 'EEE', score: 48, band: 'low',          gap: 2, weakest: 'Structure',   lastPractice: '6 days ago',  sessions: 4 },
  { id: 'S3', name: 'Arjun P',     dept: 'ECE', score: 78, band: 'intermediate', gap: 2, weakest: 'Conciseness', lastPractice: 'yesterday',   sessions: 14 },
  { id: 'S4', name: 'Divya N',     dept: 'IT',  score: 63, band: 'medium',       gap: 2, weakest: 'Clarity',     lastPractice: '2 days ago',  sessions: 11 },
  { id: 'S5', name: 'Rohit V',     dept: 'EEE', score: 47, band: 'low',          gap: 3, weakest: 'Fluency',     lastPractice: '9 days ago',  sessions: 3 },
  { id: 'S6', name: 'Priya L',     dept: 'CSE', score: 77, band: 'intermediate', gap: 3, weakest: 'Structure',   lastPractice: 'today',       sessions: 18 },
  { id: 'S7', name: 'Sandeep K',   dept: 'ECE', score: 61, band: 'medium',       gap: 4, weakest: 'Conciseness', lastPractice: '5 days ago',  sessions: 7 },
  { id: 'S8', name: 'Anitha J',    dept: 'IT',  score: 76, band: 'intermediate', gap: 4, weakest: 'Clarity',     lastPractice: '4 days ago',  sessions: 12 },
];

/* Students with no recent activity. They are the blind spot in every
   score-based view: no practice means no fresh score, so they quietly drop
   out of the averages rather than showing up as a problem. */
export const dormant = {
  count: 236,
  pctOfCollege: 19,
  overThirtyDays: 88,
  neverStarted: 41,
  byDept: [
    { code: 'EEE', count: 84 },
    { code: 'ECE', count: 71 },
    { code: 'IT',  count: 47 },
    { code: 'CSE', count: 34 },
  ],
};

/* Did the last workshop work? The one question that tells a training team
   whether to run it again. */
export const lastIntervention = {
  name: 'Verbal ability workshop — ECE',
  ranOn: '14 Aug',
  students: 62,
  beforeAvg: 58,
  afterAvg: 67,
  movedUpBand: 19,
  dimension: 'Clarity',
};

/* What to run next, and the reasoning behind it, so the recommendation can be
   argued with rather than just accepted. */
export const recommendation = {
  focus: 'Conciseness',
  dept: 'ECE',
  headline: 'Run a conciseness clinic for ECE and EEE',
  why: 'Conciseness is the weakest dimension college-wide at 63, thirteen points below Fluency. ECE and EEE hold 62% of the students sitting within four points of the next band.',
  reach: 128,
  wouldMove: 74,
  effort: 'One 90-minute session per department',
};
