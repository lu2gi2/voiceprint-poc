import { useEffect, useState } from 'react';
import ChalkField from '../components/ChalkField';
import { findStudent, findAdmin, DEMO_PASSWORD } from '../data/students.js';

/* Two roles share one board — the chalk gets rubbed out and rewritten rather
   than sending an admin to a separate page. */
const ROLES = {
  student: { label: 'Student', eyebrowNew: 'FIRST TIME HERE' },
  admin:   { label: 'Admin',   eyebrowNew: 'PLACEMENT CELL' },
};

const ADMIN_COPY = {
  signin: {
    title: 'Placement cell sign in.',
    sub: 'Department readiness, intervention lists and training impact.',
    cta: 'OPEN ADMIN PORTAL',
    swap: 'Need a staff account? Ask your placement officer',
  },
  register: {
    title: 'Request staff access.',
    sub: 'Admin accounts are issued by the placement cell, not self-served.',
    cta: 'REQUEST ACCESS',
    swap: '← Back to sign in',
  },
};

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

/* Which fields are simply blank — worth saying, because the reader already
   knows they left one empty. Nothing here discloses anything. */
function missingFields(values, isAdmin) {
  const errors = {};
  if (!values.username.trim()) {
    errors.username = isAdmin ? 'Enter your staff username.' : 'Enter your roll number.';
  }
  if (!values.password) errors.password = 'A password is needed.';
  return errors;
}

/* Whether the credentials are actually good.
 *
 * Deliberately returns one answer for "no such user" and "wrong password".
 * Telling them apart lets someone enumerate which roll numbers are real by
 * reading the error text — the failure mode the login-page guides all warn
 * about.
 *
 * Worth being straight about the limit: with no backend, the whole roll and
 * the password itself ship inside the JS bundle, so an attacker reads them
 * from source rather than guessing. This keeps the right shape for when a
 * server does the checking; it is not a security boundary today.
 */
function authenticate(values, isAdmin) {
  const who = values.username.trim();
  const account = isAdmin ? findAdmin(who) : findStudent(who);
  if (!account || values.password !== DEMO_PASSWORD) return null;
  return account;
}

/* Failed attempts cost time. Client-side throttling is bypassable by anyone
   willing to open devtools, so this is the pattern rather than the protection
   — the real version belongs on the server. */
const FREE_ATTEMPTS = 5;
const COOLDOWN_MS = 10000;

/**
 * The blackboard asks; you write your answer on it. Sign-in and registration
 * are the same board with the chalk rubbed out and rewritten, rather than two
 * separate pages.
 *
 * Nothing here authenticates — the POC has no backend. Any email and any
 * password get you in, and the board says so rather than pretending otherwise.
 */
export default function AuthPage({ onAuthed }) {
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('signin');
  const [values, setValues] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [fails, setFails] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Tick the cooldown down so the button can say how long is left.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);
  const isAdmin = role === 'admin';
  const copy = (isAdmin ? ADMIN_COPY : COPY)[mode];

  const set = (key) => (v) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    // Clear the correction as soon as they start fixing it.
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setFormError(null);
  };

  const swapMode = () => {
    setMode((m) => (m === 'signin' ? 'register' : 'signin'));
    setErrors({});
  };

  // Staff accounts are issued, so the admin side only ever shows sign-in.
  useEffect(() => { if (isAdmin) setMode('signin'); }, [isAdmin]);

  const submit = (e) => {
    e.preventDefault();
    if (cooldown > 0) return;

    const blanks = missingFields(values, isAdmin);
    setErrors(blanks);
    setFormError(null);
    if (Object.keys(blanks).length) return;

    const account = authenticate(values, isAdmin);
    if (!account) {
      const n = fails + 1;
      setFails(n);
      if (n >= FREE_ATTEMPTS) setCooldown(COOLDOWN_MS / 1000);
      setFormError(isAdmin
        ? 'That username and password do not match a staff account.'
        : 'That roll number and password do not match.');
      return;
    }

    setFails(0);
    if (isAdmin) {
      onAuthed({ role: 'admin', name: account.name, username: account.username, title: account.role });
    } else {
      // The whole record travels with the session, so the portal renders this
      // student's own scores rather than a stand-in.
      onAuthed({ role: 'student', ...account });
    }
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
              <div className="role-switch" role="radiogroup" aria-label="Sign in as">
                {Object.entries(ROLES).map(([key, r]) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={role === key}
                    className={`role-opt${role === key ? ' on' : ''}`}
                    onClick={() => { setRole(key); setErrors({}); }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <p className="auth-eyebrow">
                {mode === 'signin'
                  ? (isAdmin ? 'COLLEGE OPERATIONS' : 'WELCOME BACK')
                  : ROLES[role].eyebrowNew}
              </p>
              <h1 className="auth-title chalk">{copy.title}</h1>
              <p className="auth-sub">{copy.sub}</p>

              <div className="auth-fields">
                <ChalkField
                  label={isAdmin ? 'staff username' : 'roll number'}
                  value={values.username} onChange={set('username')}
                  error={errors.username} autoComplete="username"
                  seed={2}
                />
                <ChalkField
                  label="password" type="password" value={values.password} onChange={set('password')}
                  error={errors.password} seed={3}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              {/* One message for every wrong-credential case, so the text never
                  says which half was wrong. */}
              {formError && (
                <p className="auth-formerr" role="alert">
                  <span aria-hidden="true">✗</span> {formError}
                  {fails >= FREE_ATTEMPTS && cooldown > 0 && (
                    <em> Too many attempts — try again in {cooldown}s.</em>
                  )}
                </p>
              )}

              <div className="auth-actions">
                <button type="submit" className="chalk-btn" disabled={cooldown > 0}>
                  {cooldown > 0 ? `WAIT ${cooldown}s` : copy.cta} <i>→</i>
                </button>

              </div>

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
