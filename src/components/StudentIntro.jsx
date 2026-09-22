import { Pencil, Pin, Tape } from './paper';
export default function StudentIntro({ user, practiceCount, dashboard }) {
  const name = user?.name || 'Student';
  const readiness = dashboard?.readiness ?? '—';

  return (
    <section className="intro" id="top" aria-label="Welcome">
      <div className="hi">
        <p className="eyebrow">GOOD TO SEE YOU</p>
        <h1>Hi, {name}.</h1>
        <p className="meta">
          {dashboard?.student?.email || user?.email} · {practiceCount} practices
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
          <Pencil pct={typeof readiness === 'number' ? readiness : 0} />
        </div>

        <div className="focus">
          <Pin color="#C0483E" />
          <p className="lab">TODAY’S FOCUS</p>
          <p className="q">{dashboard?.focus ? `Focus on ${dashboard.focus.toLowerCase()} in your next answer.` : 'Complete an assessment to receive your first coaching focus.'}</p>
        </div>
      </div>
    </section>
  );
}
