import { useEffect, useRef, useState } from 'react';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import JourneyPage from './pages/JourneyPage';
import AssessmentsPage from './pages/AssessmentsPage';
import SessionPage from './pages/SessionPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import StatsPage from './pages/StatsPage';
import NoteDetailDialog from './components/NoteDetailDialog';
import PracticeDialog from './components/PracticeDialog';
import { student, RECENT, PRACTICE_QUESTIONS } from './data/fixtures';
import { byId } from './data/assessments';
import { getStudentProfile, getStudentSessions, getStudentHistory, setAuthToken } from './lib/api';

/* No router — the POC is a small set of views: the journey page, the full
   report behind the blackboard, the assessment picker, and a live session. */

const DEPARTMENT_NAMES = { CSE: 'Computer Science', IT: 'Information Tech', ECE: 'Electronics', EEE: 'Electrical' };

const relativeDay = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const mmss = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** Real session history -> the RECENT fixture's row shape, so JourneyPage's
 *  activity list keeps working unchanged whether the row came from a fixture
 *  seed or a real completed session. */
const sessionToRecentRow = (s, i) => ({
  id: `real-${s.id}`,
  t: s.assessment_title.toUpperCase(),
  q: `${s.answers_count} answer${s.answers_count === 1 ? '' : 's'} recorded`,
  w: relativeDay(s.created_at),
  d: mmss(s.total_seconds),
  rot: i % 2 ? 0.9 : -0.8,
  dx: 0,
});

/** Real per-dimension history rows -> {dimension: [values in order]}, the
 *  shape GrowthGraph/StatsPage already expect from user.history. */
const scoresToHistory = (scores) => {
  const byDim = {};
  for (const s of scores) (byDim[s.dimension] ??= []).push(s.value);
  return byDim;
};

const overallFromHistory = (history) => {
  const latest = Object.values(history).map((vals) => vals[vals.length - 1]).filter((v) => v != null);
  return latest.length ? Math.round(latest.reduce((a, v) => a + v, 0) / latest.length) : null;
};

const SESSION_KEY = 'voiceprint_session';

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** The sign-in -> dashboard transition: an eraser sweeps the board clean,
 *  chalk dust kicking up as it passes, revealing the real page underneath
 *  (see .board-wipe/.wipe-eraser/.wipe-motes in index.css). Motes are
 *  staggered along the eraser's actual travel path so the dust puffs up
 *  roughly where the eraser is at that moment, not at a fixed spot. */
const WIPE_MOTES = [8, 24, 40, 56, 72, 88];
function BoardWipe() {
  return (
    <>
      <div className="board-wipe" aria-hidden="true" />
      <div className="wipe-motes" aria-hidden="true">
        {WIPE_MOTES.map((pct, i) => (
          <i key={pct} style={{ left: `${pct}%`, animationDelay: `${0.05 + i * 0.15}s` }} />
        ))}
      </div>
      <div className="wipe-eraser" aria-hidden="true" />
    </>
  );
}

export default function App() {
  // Persisted across reloads - only signing out clears it. The hydration
  // effect below re-fetches this student's real data fresh on every mount
  // regardless, so a stale cached history/recent list here is never shown
  // for more than a frame.
  const [user, setUser] = useState(loadStoredUser);
  const [justAuthed, setJustAuthed] = useState(false);
  const [showWipe, setShowWipe] = useState(false); // the eraser-wipe transition overlay
  const [view, setView] = useState('journey');
  const [practiceCount, setPracticeCount] = useState(student.practices);

  // Every authenticated api.js call needs this student/admin's session token
  // (see deps.py) - kept in sync here rather than threaded through every
  // page/component that calls the API. Must run before the hydration effect
  // below so that effect's fetches are already authenticated.
  useEffect(() => { setAuthToken(user?.token); }, [user?.token]);

  // Adopt the signed-in student's own session count once they arrive.
  useEffect(() => { if (user?.sessions != null) setPracticeCount(user.sessions); }, [user]);
  const [recent, setRecent] = useState(() => RECENT.map((r, i) => ({ ...r, id: `seed-${i}` })));
  const [freshId, setFreshId] = useState(null);

  // Once a student is signed in, replace the fixture profile/journey/stats
  // data with what the backend actually has for them. `dataLoaded` marks
  // that this fetch genuinely succeeded, so pages can tell "empty because a
  // fresh account has done nothing yet" (real, honest zero) apart from
  // "empty because the fetch hasn't resolved / the backend is unreachable"
  // (the fixture fallback covers only that second case now, never the
  // first - a brand-new student must never see the sample cohort's numbers
  // dressed up as their own).
  useEffect(() => {
    if (!user || user.role !== 'student') return;
    let cancelled = false;
    (async () => {
      try {
        const [profile, sessions, historyRes] = await Promise.all([
          getStudentProfile(user.id),
          getStudentSessions(user.id, { limit: 4 }),
          getStudentHistory(user.id),
        ]);
        if (cancelled) return;

        const history = scoresToHistory(historyRes.scores);
        setUser((prev) => (prev ? {
          ...prev,
          year: profile.year || prev.year,
          branch: profile.department ? DEPARTMENT_NAMES[profile.department] || profile.department : prev.branch,
          sessions: profile.sessions_completed,
          history,
          overall: overallFromHistory(history),
          dataLoaded: true,
        } : prev));

        setRecent(sessions.map(sessionToRecentRow));
      } catch {
        // Backend unreachable or a blip - dataLoaded stays unset, so pages
        // keep showing the fixture fallback rather than a broken empty state.
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  const [openNote, setOpenNote] = useState(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [question, setQuestion] = useState(PRACTICE_QUESTIONS[0]);
  const [runningId, setRunningId] = useState(null);

  const qIndex = useRef(0);
  const nextId = useRef(0);
  const returnScroll = useRef(0);

  // Keep the stored session in sync with whatever's signed in - including
  // the hydration effect's later updates (real history/profile), so a
  // refresh right after login still has the latest fetch, not just the
  // bare account onAuthed first produced.
  useEffect(() => {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      // storage unavailable (private mode, quota) - session just won't
      // survive a refresh; nothing else depends on this.
    }
  }, [user]);

  const handleAuthed = (account) => {
    setUser(account);
    setJustAuthed(true);
    setShowWipe(true);
    // Matches the wipe/eraser animation's duration (index.css) - unmounts
    // the overlay once it's done rather than leaving it sitting at its
    // final (fully clipped, invisible) frame forever.
    window.setTimeout(() => setShowWipe(false), 950);
  };

  const signOut = () => {
    setUser(null);
    setJustAuthed(false);
    setShowWipe(false);
    setView('journey');
  };

  // Every other view opens at the top; coming back to the journey restores
  // the reader's place rather than dumping them at the masthead.
  useEffect(() => {
    if (view === 'journey') window.scrollTo({ top: returnScroll.current, behavior: 'auto' });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }, [view]);

  const leaveJourney = (next) => {
    if (view === 'journey') returnScroll.current = window.scrollY;
    setView(next);
  };

  const openStats = () => leaveJourney('stats');

  const openPractice = () => {
    setOpenNote(null);
    leaveJourney('assessments');
  };

  /* The 45-second drill is still reachable from a skill note — it is the
     quick version, where the assessment tracks are the real thing. */
  const openQuickDrill = () => {
    setQuestion(PRACTICE_QUESTIONS[qIndex.current % PRACTICE_QUESTIONS.length]);
    qIndex.current += 1;
    setOpenNote(null);
    setPracticeOpen(true);
  };

  /* A finished session pins one entry per answer to the journal. */
  const finishSession = (assessment, entries) => {
    const total = entries.reduce((s2, e) => s2 + e.seconds, 0);
    const id = `s-${nextId.current++}`;
    setPracticeCount((c) => c + 1);
    setFreshId(id);
    setRecent((list) => [
      {
        id,
        t: assessment.title.toUpperCase(),
        q: `${entries.length} answers recorded`,
        w: 'Today',
        d: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(Math.floor(total % 60)).padStart(2, '0')}`,
        rot: -1.2,
        dx: 0,
      },
      ...list,
    ].slice(0, 4));
    // Deliberately does not navigate: the session stays mounted so its results
    // screen can show what the backend measured. Leaving is the student's call.
  };

  const finishPractice = (q, elapsed) => {
    const id = `p-${nextId.current++}`;
    setPracticeCount((c) => c + 1);
    setFreshId(id);
    setRecent((list) =>
      [
        { id, t: 'FOCUS PRACTICE', q, w: 'Today', d: `00:${String(elapsed).padStart(2, '0')}`, rot: -1.2, dx: 0 },
        ...list,
      ].slice(0, 4),
    );
  };

  // Real auth now (see AuthPage.jsx / api/auth.py) - the auth page is a
  // real front door, not just a demo affordance.
  if (!user) return <AuthPage onAuthed={handleAuthed} />;

  // Staff get the college view; students get their own journey. Role comes
  // from the account the backend returned at login.
  if (user.role === 'admin') {
    return (
      <>
        {showWipe && <BoardWipe />}
        <div className={justAuthed ? 'page-enter' : undefined}>
          <AdminPage user={user} onSignOut={signOut} />
        </div>
      </>
    );
  }

  return (
    <>
      {showWipe && <BoardWipe />}
      <div className={justAuthed ? 'page-enter' : undefined}>
      {view === 'assessments' && (
        <AssessmentsPage
          onBack={() => setView('journey')}
          onPick={(id) => {
            setRunningId(id);
            setView(byId(id)?.resumeDriven ? 'resume' : 'session');
          }}
        />
      )}

      {view === 'session' && (
        <SessionPage
          assessmentId={runningId}
          user={user}
          onExit={() => { setRunningId(null); setView('assessments'); }}
          onDone={() => { setRunningId(null); setView('journey'); }}
          onComplete={finishSession}
        />
      )}

      {view === 'resume' && (
        <ResumeUploadPage
          assessmentId={runningId}
          user={user}
          onExit={() => { setRunningId(null); setView('assessments'); }}
          onDone={() => { setRunningId(null); setView('journey'); }}
          onComplete={finishSession}
        />
      )}

      {view === 'journey' && (
        <JourneyPage
          user={user}
          onSignOut={signOut}
          practiceCount={practiceCount}
          recent={recent}
          freshId={freshId}
          onOpenNote={setOpenNote}
          onPractice={openPractice}
          onOpenStats={openStats}
        />
      )}

      {view === 'stats' && (
        <StatsPage
          onBack={() => setView('journey')}
          onPractice={openPractice}
          practiceCount={practiceCount}
          user={user}
        />
      )}

      {view !== 'session' && view !== 'assessments' && view !== 'resume' && (
        <footer>
          <span>voiceprint · Speak. Grow. Get Hired.</span>
          <span>Sample data for design preview</span>
        </footer>
      )}

      <NoteDetailDialog
        noteKey={openNote}
        user={user}
        onClose={() => setOpenNote(null)}
        onPractice={openQuickDrill}
      />
      <PracticeDialog
        open={practiceOpen}
        question={question}
        onClose={() => setPracticeOpen(false)}
        onFinish={finishPractice}
      />
      </div>
    </>
  );
}
