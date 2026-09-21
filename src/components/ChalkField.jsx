import { useId, useMemo, useState } from 'react';
import { rngF, wobble } from '../lib/chalk';

/**
 * A form field written on the blackboard: handwritten label, a chalk rule to
 * write on, and the correction in the margin when it goes wrong.
 *
 * The value itself is set in the sans, not the handwriting face — an email or
 * a password has to be unambiguous, and Caveat's l/1/I are not. Decoration in
 * the hand, data in the sans, the same rule the rest of the app follows.
 *
 * A rule instead of a box is the whole point of the theme, but a bare
 * underline is weak affordance, so focus thickens and brightens the chalk and
 * the caret is chalk-coloured.
 */
export default function ChalkField({
  label, type = 'text', value, onChange, error, autoComplete, placeholder, seed = 1,
}) {
  const id = useId();
  const errId = `${id}-err`;
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && revealed ? 'text' : type;

  // Two passes of chalk, like a line drawn and then gone over again.
  const rules = useMemo(() => {
    const rng = rngF(seed * 7 + 3);
    return [wobble(2, 6, 398, 6, 2.4, rng), wobble(2, 7, 398, 7, 3, rng)];
  }, [seed]);

  return (
    <div className={`cfield${error ? ' has-err' : ''}`}>
      <label htmlFor={id}>{label}</label>

      <div className="cfield-line">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          spellCheck="false"
        />

        {isPassword && (
          <button type="button" className="cfield-peek" onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed} aria-label={revealed ? 'Hide password' : 'Show password'}>
            {revealed ? 'hide' : 'show'}
          </button>
        )}

        <svg className="cfield-rule" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true">
          {rules.map((d, i) => (
            <path key={i} d={d} fill="none" strokeLinecap="round"
              strokeWidth={i ? 1.4 : 2.4} opacity={i ? 0.5 : 1} />
          ))}
        </svg>
      </div>

      {/* The correction, in the margin, in red — and never colour alone. */}
      {error && (
        <p className="cfield-err" id={errId} role="alert">
          <span aria-hidden="true">✗</span> {error}
        </p>
      )}
    </div>
  );
}
