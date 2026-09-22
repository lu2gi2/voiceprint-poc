/* Admin / placement-cell fixtures.
 *
 * Counts alone tell a placement officer that a problem exists; they do not say
 * what to do on Monday. So alongside the headline numbers the portal carries
 * the things the job actually turns on — who is closest to crossing a band,
 * who has stopped practising, and which dimension decides the next workshop.
 *
 * Those are all still mock data, but they are mock data that is *counted* from
 * the 1240-student roll in `students.js` rather than written down a second
 * time here. The five exports below used to be hand-typed copies and had
 * drifted well away from the roll — band totals 46/184/524/486 against a roll
 * that actually splits 75/307/491/367, a dormant count of 236 against 215,
 * department flagged counts off by up to an order of magnitude. The names stay
 * so the admin surface reads the same; the values cannot go stale.
 */

import {
  bandStats, departmentStats, dimensionStats, dormantStats, worklist,
} from './students.js';

export const college = {
  name: 'RMK Innovate',
  term: 'Odd semester 2026',
};

/* Derived from the roll — see the note above. `library/viz` still owns the
   colours for these bands (BAND_RAMP), because an ordered scale wants a ramp
   rather than the four unrelated hues the prototype used. */
export const BANDS = bandStats();
export const departments = departmentStats();
export const collegeDimensions = dimensionStats();
export const dormant = dormantStats();
export const interventionList = worklist(8);

/* Did the last workshop work? The one question that tells a training team
   whether to run it again. A past event, so it stays written down — there is
   nothing in the roll to recompute it from. */
export const lastIntervention = {
  name: 'Verbal ability workshop — ECE',
  ranOn: '14 Aug',
  students: 62,
  beforeAvg: 58,
  afterAvg: 67,
  movedUpBand: 19,
  dimension: 'Clarity',
};
