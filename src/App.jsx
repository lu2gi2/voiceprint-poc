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
import { getStudentProfile, getStudentSessions, getStudentHistory } from './lib/api';

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

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('journey');
  const [practiceCount, setPracticeCount] = useState(student.practices);

  // Adopt the signed-in student's own session count once they arrive.
  useEffect(() => { if (user?.sessions != null) setPracticeCount(user.sessions); }, [user]);
  const [recent, setRecent] = useState(() => RECENT.map((r, i) => ({ ...r, id: `seed-${i}` })));
  const [freshId, setFreshId] = useState(null);

  // Once a student is signed in, replace the fixture profile/journey/stats
  // data with what the backend actually has for them - a fresh account with
  // no sessions yet keeps the fixture's sample numbers rather than showing
  // zeros, same "sample data until there's real data" fallback the rest of
  // the app already uses.
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
          history: Object.keys(history).length ? history : prev.history,
          overall: overallFromHistory(history) ?? prev.overall,
        } : prev));

        if (sessions.length) setRecent(sessions.map(sessionToRecentRow));
      } catch {
        // Backend unreachable or a blip - the fixture fallback already
        // covers this; nothing further to do.
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

  const signOut = () => {
    setUser(null);
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

  // Nothing is gated for real — there is no backend. The auth page is the
  // front door of the demo, not a security boundary.
  if (!user) return <AuthPage onAuthed={setUser} />;

  // Staff get the college view; students get their own journey. Role comes
  // from the sign-in switch — v1 has nothing to authenticate against, so this
  // is a demo affordance, not access control.
  if (user.role === 'admin') return <AdminPage user={user} onSignOut={signOut} />;

  return (
    <>
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
    </>
  );
}
