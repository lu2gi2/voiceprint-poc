/* Shared shape between StickyWall.jsx and NoteDetailDialog.jsx for the real,
 * backend-generated resume notes (see app/llm/resume_notes.py) — the
 * backend returns five fixed categories with real count/pct/tip/note/rows;
 * the decorative fields (title copy, color, pin/tape, rotation) aren't data,
 * so they stay here rather than round-tripping from the API. */
export const NOTE_META = {
  verbs: {
    title: 'REPETITIVE VERBS', sub: 'Repetitive action verbs detected',
    label: 'overused', c: 'var(--y)', rot: -2.4, dy: 0, pin: '#C0483E',
  },
  metrics: {
    title: 'MISSING METRICS', sub: 'Bullets missing measurable results',
    label: 'unquantified', c: 'var(--p)', rot: 1.8, dy: 28, tape: true,
  },
  star: {
    title: 'BULLET STRUCTURE', sub: 'STAR method missing results',
    label: 'incomplete', c: 'var(--b)', rot: -1.2, dy: -6, pin: '#3E6FA0',
  },
  keywords: {
    title: 'KEYWORD GAPS', sub: 'ATS skill keywords omitted from bullets',
    label: 'missing tags', c: 'var(--g)', rot: 2.2, dy: 6, tape: true,
  },
  brevity: {
    title: 'FILLER PHRASES', sub: 'Fluff eating up resume whitespace',
    label: 'filler phrases', c: 'var(--l)', rot: -2, dy: 30, pin: '#4E8A5B',
  },
};

/** Backend note -> the fixture NOTES shape StickyWall/NoteDetailDialog
 *  already render. "count" keeps the original fixture's "4x" display only
 *  for verbs (the one category the fixture ever suffixed). */
export function toDisplayNote(n) {
  const meta = NOTE_META[n.key];
  if (!meta) return null;
  return {
    key: n.key,
    ...meta,
    count: n.key === 'verbs' ? `${n.count}x` : String(n.count),
    pct: n.pct,
    tip: n.tip,
    note: n.note,
    rows: n.rows,
  };
}
