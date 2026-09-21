import { Pencil, Pin, Tape } from './paper';
import { student } from '../data/fixtures';

export default function StudentIntro({ user, practiceCount }) {
  const name = user?.name || student.name;

  return (
    <section className="intro" id="top" aria-label="Welcome">
      <div className="hi">
        <p className="eyebrow">GOOD TO SEE YOU</p>
        <h1>Hi, {name}.</h1>
        <p className="meta">
          {student.year} · {student.branch} · {practiceCount} practices
        </p>
      </div>

      <div className="pair">
        <div className="slip">
          <Tape rotate={-5} />
          <p className="lab">THIS WEEK</p>
          <p className="num">
            {student.readiness}
            <small>%</small>
          </p>
          <p className="what">Interview Readiness</p>
          <Pencil pct={student.readiness} />
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
