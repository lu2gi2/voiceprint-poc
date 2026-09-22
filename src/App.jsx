import { useEffect, useRef, useState } from 'react';
import AuthPage from './pages/AuthPage';
import JourneyPage from './pages/JourneyPage';
import AssessmentsPage from './pages/AssessmentsPage';
import SessionPage from './pages/SessionPage';
import StatsPage from './pages/StatsPage';
import NoteDetailDialog from './components/NoteDetailDialog';
import PracticeDialog from './components/PracticeDialog';
import { checkDatabaseHealth, completeSession, createSession, getAssessments, getStudentDashboard, saveStudent } from './lib/api';

/* No router — the POC is a small set of views: the journey page, the full
   report behind the blackboard, the assessment picker, and a live session. */

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('journey');
  const [practiceCount, setPracticeCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [freshId, setFreshId] = useState(null);

  const [openNote, setOpenNote] = useState(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [question, setQuestion] = useState('Complete an assessment to receive a practice question.');
  const [runningId, setRunningId] = useState(null);
  const [databaseHealth, setDatabaseHealth] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [assessmentCatalog, setAssessmentCatalog] = useState([]);

  const qIndex = useRef(0);
  const nextId = useRef(0);
  const returnScroll = useRef(0);

  const authenticate = async (candidate) => {
    try {
      const saved = await saveStudent(candidate);
      setUser(saved);
      setAuthError(null);
    } catch {
      setAuthError('The database could not save your profile. Start the backend and try again.');
    }
  };

  useEffect(() => {
    checkDatabaseHealth().then(setDatabaseHealth);
    getAssessments().then(setAssessmentCatalog).catch(() => setAssessmentCatalog([]));
  }, []);

  const refreshDashboard = () => {
    if (!user?.email) return Promise.resolve();
    return getStudentDashboard(user.email).then((data) => {
      setDashboard(data);
      setPracticeCount(data.practice_count);
      return data;
    });
  };

  const signOut = () => {
    setUser(null);
    setView('journey');
  };

  useEffect(() => {
    if (!user?.email) return;
    refreshDashboard()
      .then((data) => setUser((current) => ({ ...current, ...data.student })))
      .catch(() => setDashboard(null));
  }, [user?.email]);

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
    const questions = assessmentCatalog.find((assessment) => assessment.status === 'ready')?.questions || [];
    setQuestion(questions[qIndex.current % questions.length]?.prompt || 'Complete an assessment to receive a practice question.');
    qIndex.current += 1;
    setOpenNote(null);
    setPracticeOpen(true);
  };

  /* A finished session pins one entry per answer to the journal. */
  const finishSession = () => refreshDashboard().catch(() => {});

  const finishPractice = async () => {
    const assessment = assessmentCatalog.find((item) => item.status === 'ready');
    if (!assessment || !user?.email) return;
    try {
      const session = await createSession({ student: user, assessment });
      await completeSession(session.id);
      await refreshDashboard();
    } catch {
      setAuthError('Practice could not be saved to the database. Please try again.');
    }
  };

  // Nothing is gated for real — there is no backend. The auth page is the
  // front door of the demo, not a security boundary.
  if (!user) return <AuthPage onAuthed={authenticate} error={authError} />;

  return (
    <>
      {view === 'assessments' && (
        <AssessmentsPage
          onBack={() => setView('journey')}
          onPick={(id) => { setRunningId(id); setView('session'); }}
          assessments={assessmentCatalog}
        />
      )}

      {view === 'session' && (
        <SessionPage
          assessmentId={runningId}
          assessment={assessmentCatalog.find((item) => item.id === runningId)}
          user={user}
          onExit={() => { setRunningId(null); setView('assessments'); }}
          onDone={() => { refreshDashboard().catch(() => {}); setRunningId(null); setView('journey'); }}
          onComplete={finishSession}
        />
      )}

      {view === 'journey' && (
        <JourneyPage
          user={user}
          onSignOut={signOut}
          practiceCount={practiceCount}
          recent={dashboard?.recent?.map((item) => ({
            id: `session-${item.id}`,
            t: item.title.toUpperCase(),
            q: `${item.answers} answers recorded`,
            w: new Date(item.created_at).toLocaleDateString(),
            d: `${Math.floor(item.duration_seconds / 60)}:${String(Math.floor(item.duration_seconds % 60)).padStart(2, '0')}`,
            rot: -1.2,
            dx: 0,
          })) || recent}
          freshId={freshId}
          onOpenNote={setOpenNote}
          onPractice={openPractice}
          onOpenStats={openStats}
          dashboard={dashboard}
        />
      )}

      {view === 'stats' && (
        <StatsPage
          onBack={() => setView('journey')}
          onPractice={openPractice}
          practiceCount={practiceCount}
          dashboard={dashboard}
        />
      )}

      {view !== 'session' && view !== 'assessments' && (
        <footer>
          <span>voiceprint · Speak. Grow. Get Hired.</span>
          <span>
            Database: {databaseHealth?.status === 'connected'
              ? `${databaseHealth.database} · Connected`
              : 'Unavailable'}
          </span>
        </footer>
      )}

      <NoteDetailDialog
        noteKey={openNote}
        onClose={() => setOpenNote(null)}
        onPractice={openQuickDrill}
        dimensions={dashboard?.dimensions || []}
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
