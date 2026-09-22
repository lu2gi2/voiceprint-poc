import { useEffect, useRef, useState } from 'react';
import AuthPage from './pages/AuthPage';
import JourneyPage from './pages/JourneyPage';
import AssessmentsPage from './pages/AssessmentsPage';
import SessionPage from './pages/SessionPage';
import StatsPage from './pages/StatsPage';
import NoteDetailDialog from './components/NoteDetailDialog';
import PracticeDialog from './components/PracticeDialog';
import { student, RECENT, PRACTICE_QUESTIONS } from './data/fixtures';

/* No router — the POC is a small set of views: the journey page, the full
   report behind the blackboard, the assessment picker, and a live session. */

export default function App() {
  const [user, setUser] = useState(() => ({ name: student.name, email: student.email }));
  const [view, setView] = useState('journey');
  const [practiceCount, setPracticeCount] = useState(student.practices);
  const [recent, setRecent] = useState(() => RECENT.map((r, i) => ({ ...r, id: `seed-${i}` })));
  const [freshId, setFreshId] = useState(null);

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

  return (
    <>
      {view === 'assessments' && (
        <AssessmentsPage
          onBack={() => setView('journey')}
          onPick={(id) => { setRunningId(id); setView('session'); }}
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
        />
      )}

      {view !== 'session' && view !== 'assessments' && (
        <footer>
          <span>voiceprint · Speak. Grow. Get Hired.</span>
          <span>Sample data for design preview</span>
        </footer>
      )}

      <NoteDetailDialog
        noteKey={openNote}
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
