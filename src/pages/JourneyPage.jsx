import { useRef } from 'react';
import Navbar from '../components/Navbar';
import StudentIntro from '../components/StudentIntro';
import Blackboard from '../components/Blackboard';
import StickyWall from '../components/StickyWall';
import CoachingCue from '../components/CoachingCue';
import RecentPractice from '../components/RecentPractice';
import GrowthJourney from '../components/GrowthJourney';
import useChalkScroll from '../hooks/useChalkScroll';
import { useReducedMotion } from '../hooks/useMediaQuery';

export default function JourneyPage({
  user,
  onSignOut,
  practiceCount,
  recent,
  freshId,
  onOpenNote,
  onPractice,
  onOpenStats,
}) {
  const trackRef = useRef(null);
  const stickRef = useRef(null);
  const frameRef = useRef(null);
  const graphRef = useRef(null);
  const listRef = useRef(null);
  const wallRef = useRef(null);
  const coachRef = useRef(null);
  const reduce = useReducedMotion();

  const { scrollToBoard } = useChalkScroll({ trackRef, stickRef, frameRef, graphRef, listRef });

  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });

  return (
    <>
      <Navbar
        user={user}
        onSignOut={onSignOut}
        onGoBoard={scrollToBoard}
        onGoPractice={onPractice}
        onGoReports={() => scrollTo(wallRef)}
      />

      <main id="main">
        <StudentIntro user={user} practiceCount={practiceCount} />

        <Blackboard
          ref={trackRef}
          stickRef={stickRef}
          frameRef={frameRef}
          graphRef={graphRef}
          listRef={listRef}
          onOpenStats={onOpenStats}
        />

        <StickyWall ref={wallRef} onOpenNote={onOpenNote} />
        <CoachingCue ref={coachRef} onPractice={onPractice} />
        <RecentPractice items={recent} freshId={freshId} />
        <GrowthJourney />
      </main>
    </>
  );
}
