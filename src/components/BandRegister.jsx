import { useMemo, useState } from 'react';
import { DIMENSIONS } from '../data/assessments';
import { studentsInBand } from '../data/students';

/* A class register, not a dashboard. Placement staff already know the count
   from the card they clicked; what they need next is the names and the marks,
   in a shape they can read down a column and hand to a trainer.
   Deliberately plain — the page already has enough going on. */

const PAGE = 12;

function toCsv(rows) {
  const head = ['Roll number', 'Name', 'Department', ...DIMENSIONS, 'Overall'];
  // Quote every field and double any inner quotes; a name with a comma would
  // otherwise silently shift every column after it.
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [head.map(esc).join(',')];
  for (const s of rows) {
    lines.push([s.roll, s.name, s.dept, ...DIMENSIONS.map((d) => s.scores[d]), s.overall]
      .map(esc).join(','));
  }
  return lines.join('\r\n');   // CRLF, so Excel on Windows opens it cleanly
}

function download(name, text) {
  // A BOM, or Excel mangles any non-ASCII name in the roll.
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function BandRegister({ band, onClose }) {
  const [shown, setShown] = useState(PAGE);
  const [query, setQuery] = useState('');

  const all = useMemo(() => studentsInBand(band.key), [band.key]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) =>
      s.name.toLowerCase().includes(q) || s.roll.toLowerCase().includes(q) || s.dept.toLowerCase().includes(q));
  }, [all, query]);

  const visible = rows.slice(0, shown);

  return (
    <section className="register" aria-label={`${band.label} band students`}>
      <div className="reg-head">
        <div>
          <p className="reg-lab">{band.label.toUpperCase()} BAND · {band.range}</p>
          <h3>{all.length} students</h3>
        </div>
        <div className="reg-tools">
          <input
            className="reg-search"
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }}
            placeholder="name, roll or dept"
            aria-label="Filter this band"
          />
          {/* Exports the whole band, not the page on screen — the list is for
              reading, the file is for working from. */}
          <button type="button" className="reg-export"
            onClick={() => download(`${band.key}-band-students.csv`, toCsv(rows))}>
            ↓ EXPORT {rows.length} AS CSV
          </button>
          <button type="button" className="reg-close" onClick={onClose} aria-label="Close list">✕</button>
        </div>
      </div>

      <div className="reg-scroll">
        <table className="reg-table">
          <thead>
            <tr>
              <th scope="col" className="c-roll">ROLL</th>
              <th scope="col" className="c-name">NAME</th>
              <th scope="col" className="c-dept">DEPT</th>
              {DIMENSIONS.map((d) => (
                <th scope="col" key={d} className="c-num" title={d}>{d.slice(0, 4).toUpperCase()}</th>
              ))}
              <th scope="col" className="c-num c-overall">OVERALL</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => {
              const weakest = DIMENSIONS.reduce((a, d) => (s.scores[d] < s.scores[a] ? d : a), DIMENSIONS[0]);
              return (
                <tr key={s.id}>
                  <td className="c-roll">{s.roll}</td>
                  <td className="c-name">{s.name}</td>
                  <td className="c-dept">{s.dept}</td>
                  {DIMENSIONS.map((d) => (
                    <td key={d} className={`c-num${d === weakest ? ' weak' : ''}`}>{s.scores[d]}</td>
                  ))}
                  <td className="c-num c-overall">{s.overall}%</td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr><td colSpan={4 + DIMENSIONS.length} className="reg-empty">No match for “{query}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="reg-foot">
        <span>
          Showing {visible.length} of {rows.length}
          {query ? ` matching “${query}”` : ''} · lowest dimension marked
        </span>
        {shown < rows.length && (
          <button type="button" onClick={() => setShown((n) => n + 40)}>show 40 more</button>
        )}
      </div>
    </section>
  );
}
