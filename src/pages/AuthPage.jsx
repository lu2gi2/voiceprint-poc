import { useState } from 'react';
import ChalkField from '../components/ChalkField';

const COPY = {
  signin: {
    title: 'Who’s speaking today?',
    sub: 'Pick up where your voice left off.',
    cta: 'SIGN IN',
    swap: 'New here? Start your page →',
  },
  register: {
    title: 'Let’s start your page.',
    sub: 'Your first assessment becomes the baseline everything is measured against.',
    cta: 'CREATE ACCOUNT',
    swap: '← Already have a page? Sign in',
  },
};

/* Presence only — no format or length rules. There is nothing to sign in to,
   so any email and any password are accepted by design; enforcing a shape
   would just be friction in a demo. */
function validate(mode, values) {
  const errors = {};
  if (mode === 'register' && !values.name.trim()) {
    errors.name = 'Tell us what to call you.';
  }
  if (!values.email.trim()) errors.email = 'An email is needed to find your page.';
  if (!values.password) errors.password = 'A password is needed.';
  return errors;
}

/**
 * The blackboard asks; you write your answer on it. Sign-in and registration
 * are the same board with the chalk rubbed out and rewritten, rather than two
 * separate pages.
 *
 * Nothing here authenticates — the POC has no backend. Any email and any
 * password get you in, and the board says so rather than pretending otherwise.
 */
export default function AuthPage({ onAuthed, error }) {
  const [mode, setMode] = useState('signin');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const copy = COPY[mode];

  const set = (key) => (v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    // Clear the correction as soon as they start fixing it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const swapMode = () => {
    setMode((m) => (m === 'signin' ? 'register' : 'signin'));
    setErrors({});
  };

  const submit = (e) => {
    e.preventDefault();
    const found = validate(mode, values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const name = mode === 'register'
      ? values.name.trim()
      : values.email.trim().split('@')[0].replace(/[._-]+/g, ' ');
    const display = name.charAt(0).toUpperCase() + name.slice(1);
    onAuthed({ name: display, email: values.email.trim() }, mode);
  };

  return (
    <div className="auth">
      <header className="auth-top">
        <span className="brand">
          <svg viewBox="0 0 24 20" aria-hidden="true">
            <g fill="currentColor">
              <rect x="1" y="7" width="3.4" height="6" rx="1.7" />
              <rect x="7" y="2" width="3.4" height="16" rx="1.7" />
              <rect x="13" y="5" width="3.4" height="10" rx="1.7" />
              <rect x="19" y="8.5" width="3.4" height="3" rx="1.5" />
            </g>
          </svg>
          <span className="brand-text">
            <b>voiceprint</b>
            <small>Speak. Grow. Get Hired.</small>
          </span>
        </span>
      </header>

      <main className="auth-main" id="main">
        <div className="frame auth-frame">
          <div className="board auth-board">
            <div className="smudges" aria-hidden="true" />
            <form className="auth-form" onSubmit={submit} noValidate>
              <p className="auth-eyebrow">{mode === 'signin' ? 'WELCOME BACK' : 'FIRST TIME HERE'}</p>
              <h1 className="auth-title chalk">{copy.title}</h1>
              <p className="auth-sub">{copy.sub}</p>

              <div className="auth-fields">
                {mode === 'register' && (
                  <ChalkField
                    label="your name" value={values.name} onChange={set('name')}
                    error={errors.name} autoComplete="name" placeholder="Aditi" seed={1}
                  />
                )}
                <ChalkField
                  label="email" type="email" value={values.email} onChange={set('email')}
                  error={errors.email} autoComplete="email" placeholder="you@college.edu" seed={2}
                />
                <ChalkField
                  label="password" type="password" value={values.password} onChange={set('password')}
                  error={errors.password} seed={3}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="anything works"
                />
              </div>

              <div className="auth-actions">
                <button type="submit" className="chalk-btn">{copy.cta} <i>→</i></button>
                <button type="button" className="auth-swap" onClick={swapMode}>{copy.swap}</button>
              </div>

              {error && <p className="auth-demo" role="alert">{error}</p>}

              <p className="auth-demo">Your student profile is saved to the connected database. Password authentication is not enabled yet.</p>
            </form>

            <div className="dust" aria-hidden="true" />
          </div>

          <div className="ledge" aria-hidden="true">
            <i className="chalk-dust" />
            <i className="chalk-a" />
            <i className="chalk-c" />
            <i className="chalk-b" />
            <i className="eraser" />
          </div>
        </div>
      </main>

      <footer className="auth-foot">
        <span>voiceprint · Speak. Grow. Get Hired.</span>
        <span>Sample data for design preview</span>
      </footer>
    </div>
  );
}
