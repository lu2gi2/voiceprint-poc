import { useEffect, useLayoutEffect, useRef } from 'react';
import { useIsMobile, useReducedMotion } from './useMediaQuery';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => 1 - Math.pow(1 - x, 3);

/**
 * Drives the blackboard: the frame tilts up into place as it pins, and every
 * chalk stroke draws itself in across a scroll window.
 *
 * Elements opt in with `data-ch` (which timeline: "g" graph / "l" list) plus
 * `data-a`/`data-b`, the progress window over which they reveal. Strokes
 * (class `stroke`) animate stroke-dashoffset; everything else gets a `--r`
 * custom property to fade with.
 *
 * Stroke state is written straight to the DOM rather than through React —
 * this runs on every scroll frame, so re-rendering here would be far too hot.
 *
 * @param revision bump to re-collect after the marked-up SVG is rebuilt.
 */
export default function useChalkScroll({ trackRef, stickRef, frameRef, graphRef, listRef, revision = 0 }) {
  const itemsRef = useRef([]);
  const mobile = useIsMobile();
  const reduce = useReducedMotion();

  // Re-collect whenever the chalk markup is rebuilt (breakpoint change, nav).
  useLayoutEffect(() => {
    const root = trackRef.current;
    if (!root) return;
    itemsRef.current = Array.from(root.querySelectorAll('[data-ch]')).map((el) => ({
      el,
      ch: el.dataset.ch,
      a: +el.dataset.a,
      b: +el.dataset.b,
      stroke: el.classList.contains('stroke'),
    }));
  }, [trackRef, revision, mobile]);

  useEffect(() => {
    const track = trackRef.current;
    const stick = stickRef.current;
    const frame = frameRef.current;
    if (!track || !stick || !frame) return;

    const apply = (g, l) => {
      const v = { g, l };
      for (const it of itemsRef.current) {
        const r = clamp((v[it.ch] - it.a) / (it.b - it.a));
        if (it.stroke) {
          it.el.style.strokeDashoffset = String(1 - r);
          it.el.style.strokeOpacity = r <= 0 ? '0' : '';
        } else {
          it.el.style.setProperty('--r', r.toFixed(3));
        }
      }
    };

    let ticking = false;

    const update = () => {
      ticking = false;
      if (reduce) {
        apply(1, 1);
        frame.style.transform = '';
        return;
      }
      const vh = window.innerHeight;
      let g;
      let l;

      if (!mobile) {
        const tr = track.getBoundingClientRect();
        const stickTop = parseFloat(getComputedStyle(stick).top) || 0;
        const pinScroll = track.offsetHeight - stick.offsetHeight;
        const scrolled = stickTop - tr.top;
        const pre = vh * 0.4;
        const d = clamp((scrolled + pre) / (pre + pinScroll * 0.85));
        g = clamp(d / 0.7);
        l = clamp((d - 0.35) / 0.65);

        const bt = stick.getBoundingClientRect().top;
        const rise = ease(clamp(1 - (bt - stickTop) / (vh * 0.55)));
        frame.style.transform =
          `rotateX(${((1 - rise) * 6).toFixed(2)}deg) scale(${(0.935 + 0.065 * rise).toFixed(4)})`;
      } else {
        const gr = graphRef.current?.getBoundingClientRect();
        const lr = listRef.current?.getBoundingClientRect();
        g = gr ? clamp((vh * 0.88 - gr.top) / (gr.height * 0.9)) : 1;
        l = lr ? clamp((vh * 0.88 - lr.top) / (lr.height * 0.9)) : 1;
        frame.style.transform = '';
      }
      apply(g, l);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    // Metrics shift once the handwriting fonts land.
    if (document.fonts?.ready) document.fonts.ready.then(update).catch(() => {});

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [trackRef, stickRef, frameRef, graphRef, listRef, mobile, reduce, revision]);

  /** Scrolls so the board is pinned and mid-draw, matching the nav link. */
  const scrollToBoard = () => {
    const track = trackRef.current;
    const stick = stickRef.current;
    if (!track || !stick) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    let y;
    if (mobile) {
      y = top - 70;
    } else {
      const stickTop = parseFloat(getComputedStyle(stick).top) || 0;
      const pinScroll = track.offsetHeight - stick.offsetHeight;
      y = top - stickTop + pinScroll * 0.62;
    }
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  };

  return { scrollToBoard };
}
