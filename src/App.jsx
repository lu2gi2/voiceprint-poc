import { useEffect, useRef, useState } from 'react';
import AuthPage from './pages/AuthPage';
import JourneyPage from './pages/JourneyPage';
import StatsPage from './pages/StatsPage';
import NoteDetailDialog from './components/NoteDetailDialog';
import PracticeDialog from './components/PracticeDialog';
import { student, RECENT, PRACTICE_QUESTIONS } from './data/fixtures';

/* Two views, no router — the POC is a single flow: the journey page, and the
   full report you reach by tapping the blackboard. */

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('journey');
  const [practiceCount, setPracticeCount] = useState(student.practices);
  const [recent, setRecent] = useState(() => RECENT.map((r, i) => ({ ...r, id: `seed-${i}` })));
  const [freshId, setFreshId] = useState(null);

  const [openNote, setOpenNote] = useState(null);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [question, setQuestion] = useState(PRACTICE_QUESTIONS[0]);

  const qIndex = useRef(0);
  const nextId = useRef(0);
  const returnScroll = useRef(0);

  const signOut = () => {
    setUser(null);
    setView('journey');
  };

  // Restore the reader's place on the journey page when they come back.
  useEffect(() => {
    if (view === 'stats') window.scrollTo({ top: 0, behavior: 'auto' });
    else window.scrollTo({ top: returnScroll.current, behavior: 'auto' });
  }, [view]);

  const openStats = () => {
    returnScroll.current = window.scrollY;
    setView('stats');
  };

  const openPractice = () => {
    setQuestion(PRACTICE_QUESTIONS[qIndex.current % PRACTICE_QUESTIONS.length]);
    qIndex.current += 1;
    setOpenNote(null);
    setPracticeOpen(true);
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
      {view === 'journey' ? (
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
      ) : (
        <StatsPage onBack={() => setView('journey')} onPractice={openPractice} />
      )}

      <footer>
        <span>voiceprint · Speak. Grow. Get Hired.</span>
        <span>Sample data for design preview</span>
      </footer>

      <NoteDetailDialog
        noteKey={openNote}
        onClose={() => setOpenNote(null)}
        onPractice={openPractice}
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
