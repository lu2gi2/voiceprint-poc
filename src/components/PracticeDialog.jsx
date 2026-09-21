import { useEffect, useMemo, useRef, useState } from 'react';
import Dialog from './Dialog';

const TOTAL = 45;
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* Fixed bar heights/delays so the waveform looks organic but never reshuffles. */
const BARS = Array.from({ length: 30 }, (_, i) => ({
  h: (0.25 + Math.abs(Math.sin(i * 1.7)) * 0.75).toFixed(2),
  d: -((i * 73) % 900),
}));

/**
 * The 45-second focus practice. This is the POC stand-in for the real capture
 * step — it times the answer and pins it to the journal, but records nothing.
 */
export default function PracticeDialog({ open, question, onClose, onFinish }) {
  const [phase, setPhase] = useState('ready'); // ready | running | done
  const [left, setLeft] = useState(TOTAL);
  const startedAt = useRef(0);
  const tick = useRef(null);

  // Reset every time the sheet is pulled out again.
  useEffect(() => {
    if (open) {
      setPhase('ready');
      setLeft(TOTAL);
    }
  }, [open, question]);

  const stop = () => {
    clearInterval(tick.current);
    tick.current = null;
  };

  useEffect(() => stop, []);

  const finish = () => {
    const elapsed = Math.min(TOTAL, Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)));
    stop();
    setPhase('done');
    onFinish(question, elapsed);
  };
  // Kept in a ref so the interval always calls the latest closure.
  const finishRef = useRef(finish);
  finishRef.current = finish;

  const start = () => {
    startedAt.current = Date.now();
    setPhase('running');
    tick.current = setInterval(() => {
      const remaining = Math.max(0, TOTAL - Math.floor((Date.now() - startedAt.current) / 1000));
      setLeft(remaining);
      if (remaining === 0) finishRef.current();
    }, 200);
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  const wave = useMemo(
    () => BARS.map((b, i) => <i key={i} style={{ '--h': b.h, '--d': `${b.d}ms` }} />),
    [],
  );

  return (
    <Dialog open={open} onClose={handleClose} labelledBy="pTitle">
      <div className={`dsheet${phase === 'running' ? ' running' : ''}`}>
        <button className="x" type="button" onClick={handleClose} aria-label="Close">✕</button>

        <p className="d-eyebrow" id="pTitle">45-SECOND PRACTICE</p>

        {phase !== 'done' && (
          <>
            <p className="pq">{question}</p>
            <div className="timer">{fmt(left)}</div>
            <div className="wave" aria-hidden="true">{wave}</div>
          </>
        )}

        {phase === 'done' && (
          <p className="done-msg">Pinned to your journal. Next, reassess to see what changed.</p>
        )}

        <div className="d-act">
          {phase === 'ready' && (
            <button className="btn" type="button" onClick={start}>START <i>→</i></button>
          )}
          {phase === 'running' && (
            <button className="btn ghost" type="button" onClick={finish}>FINISH</button>
          )}
          {phase === 'done' && (
            <button className="btn" type="button" onClick={handleClose}>DONE <i>→</i></button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
