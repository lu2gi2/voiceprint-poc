import { Pencil, Pin, Tape } from './paper';
import { student } from '../data/fixtures';

export default function StudentIntro({ user, practiceCount }) {
  const name = user?.name || student.name;
  // Only fall back to the sample number while we don't yet know (fetch not
  // resolved, backend unreachable) - a dataLoaded account with no real
  // score gets an honest "not yet rated", never a borrowed percentage.
  const readiness = user?.dataLoaded ? user.overall : student.readiness;

  return (
    <section className="intro" id="top" aria-label="Welcome">
      <div className="hi">
        <p className="eyebrow">GOOD TO SEE YOU</p>
        <h1>Hi, {name}.</h1>
        <p className="meta">
          {user?.roll ? `${user.roll} · ` : ''}{user?.year || student.year} ·{' '}
          {user?.branch || student.branch} · {practiceCount} practices
        </p>
      </div>

      <div className="pair">
        <div className="slip">
          <Tape rotate={-5} />
          <p className="lab">THIS WEEK</p>
          {readiness == null ? (
            <p className="num" style={{ fontSize: '1.1rem' }}>Not yet rated</p>
          ) : (
            <p className="num">
              {readiness}
              <small>%</small>
            </p>
          )}
          <p className="what">Interview Readiness</p>
          {readiness != null && <Pencil pct={readiness} />}
        </div>

        <div className="focus">
          <Pin color="#C0483E" />
          <p className="lab">TODAY’S FOCUS</p>
          <p className="q">
            {user?.dataLoaded && readiness == null
              ? 'Take your first interview to get a real focus for next time.'
              : `“${student.focusQuote}”`}
          </p>
        </div>
      </div>
    </section>
  );
}
