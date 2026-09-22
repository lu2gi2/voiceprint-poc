import { useEffect, useRef, useState } from 'react';
import { useScrolled } from '../hooks/useReveal';

function Logo() {
  return (
    <svg viewBox="0 0 24 20" aria-hidden="true">
      <g fill="currentColor">
        <rect x="1" y="7" width="3.4" height="6" rx="1.7" />
        <rect x="7" y="2" width="3.4" height="16" rx="1.7" />
        <rect x="13" y="5" width="3.4" height="10" rx="1.7" />
        <rect x="19" y="8.5" width="3.4" height="3" rx="1.5" />
      </g>
    </svg>
  );
}

export default function Navbar({ user, onSignOut, onGoBoard, onGoPractice, onGoReports }) {
  const name = user?.name || 'Student';
  const scrolled = useScrolled();
  const [popOpen, setPopOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const wrapRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!popOpen) return;
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setPopOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPopOpen(false);
        bellRef.current?.focus();
      }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [popOpen]);

  const toggleBell = (e) => {
    e.stopPropagation();
    setPopOpen((o) => {
      if (!o) setUnread(false);
      return !o;
    });
  };

  return (
    <header className={`nav${scrolled ? ' scrolled' : ''}`}>
      <a
        className="brand"
        href="#top"
        aria-label="voiceprint home"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <Logo />
        <span className="brand-text">
          <b>voiceprint</b>
          <small>Speak. Grow. Get Hired.</small>
        </span>
      </a>

      <nav className="links" aria-label="Primary">
        <a href="#board" onClick={(e) => { e.preventDefault(); onGoBoard(); }}>
          <span className="hide-m">MY </span>JOURNEY
        </a>
        <a href="#practice" onClick={(e) => { e.preventDefault(); onGoPractice(); }}>PRACTICE</a>
        <a href="#reports" onClick={(e) => { e.preventDefault(); onGoReports(); }}>REPORTS</a>
      </nav>

      <div className="nav-right">
        <div className="bellwrap" ref={wrapRef}>
          <button
            className="icon-btn"
            ref={bellRef}
            onClick={toggleBell}
            aria-label="Notifications"
            aria-expanded={popOpen}
            aria-controls="nav-pop"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
            {unread && <span className="dot" />}
          </button>

          <div className="pop" id="nav-pop" hidden={!popOpen}>
            <p><button type="button" onClick={() => { setPopOpen(false); onGoPractice(); }}>
              Complete an assessment to receive database-backed coaching.
            </button></p>
          </div>
        </div>

        <button type="button" className="signout" onClick={onSignOut}>SIGN OUT</button>

        <div className="avatar" role="img" aria-label={`${name}'s profile`}>
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
