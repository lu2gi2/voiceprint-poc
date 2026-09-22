/* The student roll, and everything derived from it.
 *
 * This is the single source of truth for both portals. The admin view does not
 * carry its own counts — every headline number, band total, department average
 * and worklist entry on that page is computed from these records, so the bands
 * genuinely group students by their own scores rather than agreeing with them
 * by hand. If a score changes here, both portals change with it.
 *
 * Records are generated deterministically from a seeded RNG: a hand-written
 * 1240-row file would be unreadable, and hard-coding the totals is exactly the
 * thing this module exists to avoid. Same seed, same roll, every reload.
 */

import { rngF } from '../lib/chalk.js';
import { DIMENSIONS } from './assessments.js';

/* One password for every account. This is a demo with no backend to
   authenticate against; usernames are unique so each person lands on their own
   data, and the password is shared so nobody has to be issued one. */
export const DEMO_PASSWORD = 'voiceprint';

export const BANDS = [
  { key: 'low',          label: 'Low',          range: 'below 50%', min: 0,  max: 49,  meaning: 'Needs intensive support', step: 0 },
  { key: 'medium',       label: 'Medium',       range: '50–64%',    min: 50, max: 64,  meaning: 'Needs improvement',       step: 1 },
  { key: 'intermediate', label: 'Intermediate', range: '65–79%',    min: 65, max: 79,  meaning: 'Nearly placement ready',  step: 2 },
  { key: 'high',         label: 'High',         range: '80–100%',   min: 80, max: 100, meaning: 'Placement ready',         step: 3 },
];

export const bandOf = (score) =>
  BANDS.find((b) => score >= b.min && score <= b.max) ?? BANDS[0];

export const DEPARTMENTS = [
  { code: 'CSE', name: 'Computer Science',  count: 420, lift: +5 },
  { code: 'IT',  name: 'Information Tech',  count: 280, lift: +1 },
  { code: 'ECE', name: 'Electronics',       count: 330, lift: -12 },
  { code: 'EEE', name: 'Electrical',        count: 210, lift: -16 },
];

const FIRST = [
  'Aditi', 'Karthik', 'Meera', 'Arjun', 'Divya', 'Rohit', 'Priya', 'Sandeep',
  'Anitha', 'Vikram', 'Sneha', 'Hari', 'Lakshmi', 'Naveen', 'Pooja', 'Ganesh',
  'Swathi', 'Rahul', 'Nithya', 'Suresh', 'Kavya', 'Ajay', 'Ramya', 'Manoj',
  'Deepa', 'Vishnu', 'Sruthi', 'Bala', 'Janani', 'Prakash', 'Harini', 'Kiran',
  'Yamini', 'Dinesh', 'Keerthi', 'Surya', 'Aishwarya', 'Mohan', 'Varsha', 'Raj',
];
const LAST = [
  'Raman', 'Subramani', 'Krishnan', 'Natarajan', 'Venkatesh', 'Iyer', 'Menon',
  'Pillai', 'Reddy', 'Sharma', 'Nair', 'Prasad', 'Kumar', 'Sundaram', 'Anand',
  'Rajan', 'Murugan', 'Devi', 'Balaji', 'Chandran',
];

/* Box–Muller, so scores cluster the way a cohort really does rather than
   spreading evenly across the range. */
function normal(rng, mean, sd) {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* Each dimension sits near the student's own level, offset by how hard that
   dimension is across the cohort. Conciseness runs lowest — it is the thing
   the product keeps finding students weakest at. */
const DIMENSION_BIAS = {
  Fluency: +3, Vocabulary: +1, Clarity: -2, Structure: -5, Conciseness: -10,
};

function buildRoll() {
  const rng = rngF(20260922);
  const out = [];
  let n = 0;

  for (const dept of DEPARTMENTS) {
    for (let i = 1; i <= dept.count; i++) {
      n += 1;
      const first = FIRST[Math.floor(rng() * FIRST.length)];
      const last = LAST[Math.floor(rng() * LAST.length)];
      const roll = `21${dept.code}${String(i).padStart(3, '0')}`;

      // The student's underlying level; dimensions vary around it.
      const level = clamp(normal(rng, 78 + dept.lift, 11), 28, 97);

      const scores = {};
      for (const d of DIMENSIONS) {
        scores[d] = Math.round(clamp(level + DIMENSION_BIAS[d] + normal(rng, 0, 4), 20, 100));
      }
      const overall = Math.round(
        DIMENSIONS.reduce((s, d) => s + scores[d], 0) / DIMENSIONS.length,
      );

      // Four assessments ending where they are now, so the report has a real
      // history to draw rather than an invented one.
      const history = {};
      for (const d of DIMENSIONS) {
        const gained = Math.round(clamp(normal(rng, 22, 7), 6, 34));
        const start = clamp(scores[d] - gained, 18, 95);
        const stepSize = (scores[d] - start) / 3;
        history[d] = [0, 1, 2, 3].map((k) =>
          k === 3 ? scores[d] : Math.round(start + stepSize * k + normal(rng, 0, 1.5)),
        );
      }

      const sessions = Math.round(clamp(normal(rng, 11, 6), 0, 30));
      const daysSince = sessions === 0 ? 999 : Math.round(clamp(normal(rng, 9, 11), 0, 120));

      out.push({
        id: `S${n}`,
        roll,
        username: roll.toLowerCase(),
        name: `${first} ${last}`,
        email: `${roll.toLowerCase()}@rmkinnovate.edu`,
        dept: dept.code,
        year: '2nd Year',
        branch: dept.name,
        scores,
        overall,
        band: bandOf(overall).key,
        history,
        sessions,
        daysSince,
      });
    }
  }
  return out;
}

export const students = buildRoll();

/* ---------- lookups ---------- */

const byUsername = new Map(students.map((s) => [s.username, s]));
export const findStudent = (username) => byUsername.get(String(username).trim().toLowerCase());

export const ADMINS = [
  { username: 'admin',     name: 'Placement Cell', role: 'Head of placements' },
  { username: 'placement', name: 'Training Team',  role: 'Training coordinator' },
];
export const findAdmin = (username) =>
  ADMINS.find((a) => a.username === String(username).trim().toLowerCase());

/* ---------- derived, never hand-written ---------- */

/** Students inactive long enough to have dropped out of the averages. */
const isDormant = (s) => s.sessions === 0 || s.daysSince > 21;

export function collegeStats() {
  const active = students.filter((s) => !isDormant(s));
  const overall = Math.round(students.reduce((a, s) => a + s.overall, 0) / students.length);
  const needing = students.filter((s) => s.overall < 65).length;
  return {
    totalStudents: students.length,
    departments: DEPARTMENTS.length,
    overallReadiness: overall,
    participation: Math.round((active.length / students.length) * 100),
    participated: active.length,
    needIntervention: needing,
  };
}

export function bandStats() {
  return BANDS.map((b) => {
    const inBand = students.filter((s) => s.band === b.key);
    return {
      ...b,
      students: inBand.length,
      share: Math.round((inBand.length / students.length) * 100),
    };
  });
}

export const studentsInBand = (key) =>
  students.filter((s) => s.band === key).sort((a, b) => b.overall - a.overall);

export function departmentStats() {
  return DEPARTMENTS.map((d) => {
    const inDept = students.filter((s) => s.dept === d.code);
    const readiness = Math.round(inDept.reduce((a, s) => a + s.overall, 0) / inDept.length);
    return {
      code: d.code,
      name: d.name,
      students: inDept.length,
      readiness,
      flagged: inDept.filter((s) => s.overall < 65).length,
      quiet: inDept.filter(isDormant).length,
    };
  }).sort((a, b) => b.readiness - a.readiness);
}

export function dimensionStats() {
  return DIMENSIONS.map((d) => ({
    name: d,
    score: Math.round(students.reduce((a, s) => a + s.scores[d], 0) / students.length),
  })).sort((a, b) => b.score - a.score);
}

/** The dimension a student is weakest at. Ties go to the first in DIMENSIONS. */
const weakestDimension = (s) =>
  DIMENSIONS.reduce((a, d) => (s.scores[d] < s.scores[a] ? d : a), DIMENSIONS[0]);

/** Students close enough to the next band for one session to carry them over. */
const withinReach = (s, points) =>
  s.band !== 'high' && !isDormant(s)
  && BANDS[bandOf(s.overall).step + 1].min - s.overall <= points;

/**
 * What to run next — counted rather than asserted.
 *
 * The topic is the weakest dimension college-wide. It goes to the two
 * departments with the highest *share of their own students* within reach of
 * the next band, not the highest headcount: ranked by headcount the largest
 * department always wins, which reports that CSE is big rather than that CSE
 * needs it. `wouldMove` is the subset for whom that dimension is actually the
 * blocker, not merely a low score.
 */
export function nextRecommendation() {
  const dims = dimensionStats();        // strongest -> weakest
  const weakest = dims[dims.length - 1];

  // Share of each department's own students sitting within four points of the
  // next band — how much of that department one clinic would move.
  const ranked = DEPARTMENTS.map((d) => {
    const inDept = students.filter((s) => s.dept === d.code);
    const reach = inDept.filter((s) => withinReach(s, 4));
    return { code: d.code, pct: Math.round((reach.length / inDept.length) * 100), reach };
  }).sort((a, b) => b.pct - a.pct || b.reach.length - a.reach.length);

  const [first, second] = ranked;
  const theirs = [...first.reach, ...second.reach];
  const wouldMove = theirs.filter((s) => weakestDimension(s) === weakest.name).length;
  const topic = weakest.name.toLowerCase();

  return {
    focus: weakest.name,
    depts: [first.code, second.code],
    headline: `Run a ${topic} clinic for ${first.code} and ${second.code}`,
    why: `${first.code} and ${second.code} have the highest share of their own students `
      + `within four points of the next band (${first.pct}% and ${second.pct}%), and `
      + `${wouldMove} of those students are weakest at ${topic} — a clinic there converts `
      + 'the most for one session of trainer time.',
    reach: theirs.length,
    wouldMove,
    effort: 'One 90-minute session per department',
  };
}

/**
 * The worklist: students closest to crossing into the next band, dealt out a
 * department at a time.
 *
 * Trainer time is finite, so "points to the next boundary" picks the cheapest
 * conversions first. But strict ordering collapses: the gap-1 students all tie
 * on both keys, so stability hands back roll order and the list becomes ten
 * identical rows from whichever department generates first. Taking one per
 * department per round keeps every pick that department's closest to the next
 * band while leaving a trainer something they can actually run.
 *
 * Dormant students are excluded; they need chasing, not coaching, and they
 * appear in the quiet list instead.
 */
export function worklist(limit = 12) {
  const ranked = students
    .filter((s) => s.band !== 'high' && !isDormant(s))
    .map((s) => {
      const next = BANDS[bandOf(s.overall).step + 1];
      return { ...s, gap: next.min - s.overall, nextBand: next.label, weakest: weakestDimension(s) };
    })
    .sort((a, b) => a.gap - b.gap || b.overall - a.overall);

  const queues = DEPARTMENTS.map((d) => ranked.filter((s) => s.dept === d.code));
  const out = [];
  for (let i = 0; out.length < limit; i++) {
    const before = out.length;
    for (const q of queues) {
      if (out.length >= limit) break;
      if (q[i]) out.push(q[i]);
    }
    if (out.length === before) break;   // every department exhausted
  }
  return out;
}

export function dormantStats() {
  const quiet = students.filter(isDormant);
  const byDept = DEPARTMENTS.map((d) => ({
    code: d.code,
    count: quiet.filter((s) => s.dept === d.code).length,
  })).sort((a, b) => b.count - a.count);
  return {
    count: quiet.length,
    pctOfCollege: Math.round((quiet.length / students.length) * 100),
    neverStarted: quiet.filter((s) => s.sessions === 0).length,
    overThirtyDays: quiet.filter((s) => s.sessions > 0 && s.daysSince > 30).length,
    byDept,
  };
}
