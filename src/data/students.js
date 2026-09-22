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

/**
 * The worklist: students closest to crossing into the next band.
 *
 * Trainer time is finite, so ordering by "points to the next boundary" puts the
 * cheapest conversions first — the students a single workshop actually moves.
 * Dormant students are excluded; they need chasing, not coaching, and they
 * appear in the quiet list instead.
 */
export function worklist(limit = 12) {
  return students
    .filter((s) => s.band !== 'high' && !isDormant(s))
    .map((s) => {
      const next = BANDS[bandOf(s.overall).step + 1];
      const weakest = DIMENSIONS.reduce((a, d) => (s.scores[d] < s.scores[a] ? d : a), DIMENSIONS[0]);
      return { ...s, gap: next.min - s.overall, nextBand: next.label, weakest };
    })
    .sort((a, b) => a.gap - b.gap || b.overall - a.overall)
    .slice(0, limit);
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
