import { Pin } from './paper';

const PIN_COLORS = ['#C0483E', '#3E6FA0', '#D9A72E', '#4E8A5B'];

/** Latest answers, pinned up as paper strips. `freshId` drops the newest in. */
export default function RecentPractice({ items, freshId }) {
  return (
    <section className="recent" aria-labelledby="recentH">
      <div className="recent-in">
        <div className="recent-head">
          <h2 className="eyebrow" id="recentH">RECENT PRACTICE</h2>
          <span>your latest answers, pinned up</span>
        </div>

        <div className="strips">
          {items.map((r, i) => (
            <article
              key={r.id}
              className={`strip${freshId === r.id ? ' fresh' : ''}`}
              style={{ '--rot': `${r.rot}deg`, '--dx': `${r.dx}px` }}
            >
              <Pin color={PIN_COLORS[i % PIN_COLORS.length]} />
              <div>
                <p className="t">{r.t}</p>
                <p className="q">{r.q}</p>
              </div>
              <div className="r">
                <p className="when">{r.w}</p>
                <p className="dur">{r.d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
