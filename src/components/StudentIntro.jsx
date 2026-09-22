import { Pencil, Pin, Tape } from './paper';
import { student } from '../data/fixtures';

export default function StudentIntro({ user, practiceCount }) {
  const name = user?.name || student.name;
  const readiness = user?.overall ?? student.readiness;

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
          <p className="num">
            {readiness}
            <small>%</small>
          </p>
          <p className="what">Interview Readiness</p>
          <Pencil pct={readiness} />
        </div>

        <div className="focus">
          <Pin color="#C0483E" />
          <p className="lab">TODAY’S FOCUS</p>
          <p className="q">“{student.focusQuote}”</p>
        </div>
      </div>
    </section>
  );
}
