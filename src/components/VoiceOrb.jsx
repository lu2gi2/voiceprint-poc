import { useEffect, useRef } from 'react';
import { smooth } from '../lib/chalk';
import { useReducedMotion } from '../hooks/useMediaQuery';

const CX = 120;
const CY = 120;
const BASE = 58;      // resting radius
const POINTS = 56;    // angular samples around the sphere
const TAU = Math.PI * 2;

/* Low frequencies carry most of the energy in speech, so sampling the bins
   linearly would leave the top half of the orb almost flat. Weight the
   sampling toward the low end the way the ear does. */
const binFor = (i, binCount) => {
  const t = i / POINTS;
  return Math.min(binCount - 1, Math.floor(Math.pow(t, 1.9) * binCount * 0.72));
};

/**
 * The record control: a sphere drawn in chalk that deforms with whatever the
 * microphone is hearing. Idle it breathes; live, each angle around it is
 * pushed out by the energy in one band of the spectrum, so you can see your
 * own voice in it rather than watching a generic meter.
 *
 * The whole animation is written straight to path elements inside one
 * requestAnimationFrame loop. Driving 56 points through React state at 60fps
 * would re-render the page on every frame — the same reason the chalkboard
 * scroll engine writes to the DOM directly.
 */
export default function VoiceOrb({ analyserRef, live, size = 240 }) {
  const coreRef = useRef(null);
  const midRef = useRef(null);
  const haloRef = useRef(null);
  const glowRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    let raf;
    let t = 0;
    let smoothed = new Float32Array(POINTS); // per-angle, eased between frames
    let loudness = 0;
    const freq = new Uint8Array(1024);

    const ring = (radiusAt, jitter) => {
      const pts = [];
      for (let i = 0; i < POINTS; i++) {
        const a = (i / POINTS) * TAU - Math.PI / 2;
        const r = radiusAt(i);
        pts.push([
          CX + Math.cos(a) * r + (jitter ? Math.sin(i * 12.9898 + t) * jitter : 0),
          CY + Math.sin(a) * r + (jitter ? Math.cos(i * 4.1414 + t) * jitter : 0),
        ]);
      }
      return smooth(pts, true) + 'Z';
    };

    const frame = () => {
      t += 0.016;
      const analyser = analyserRef?.current;

      if (analyser && live) {
        const bins = Math.min(freq.length, analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freq.subarray(0, bins));
        let sum = 0;
        for (let i = 0; i < POINTS; i++) {
          const v = freq[binFor(i, bins)] / 255;
          // Ease toward the new value so the surface undulates instead of strobing.
          smoothed[i] += (v - smoothed[i]) * 0.35;
          sum += smoothed[i];
        }
        loudness += (sum / POINTS - loudness) * 0.2;
      } else {
        for (let i = 0; i < POINTS; i++) smoothed[i] += (0 - smoothed[i]) * 0.08;
        loudness += (0 - loudness) * 0.08;
      }

      // Idle breathing keeps it feeling alive before the first word.
      const breathe = reduce ? 0 : Math.sin(t * 1.1) * 2.2;
      const speak = (i) => smoothed[i] * 26;

      coreRef.current?.setAttribute('d',
        ring((i) => BASE + breathe + speak(i), reduce ? 0 : 0.6));
      midRef.current?.setAttribute('d',
        ring((i) => BASE + 13 + breathe * 0.6 + speak(i) * 0.55, reduce ? 0 : 0.9));
      haloRef.current?.setAttribute('d',
        ring((i) => BASE + 26 + breathe * 0.35 + speak(i) * 0.3, reduce ? 0 : 1.2));

      // A soft bloom that grows with overall loudness.
      if (glowRef.current) {
        glowRef.current.setAttribute('r', String(BASE + 6 + loudness * 30));
        glowRef.current.setAttribute('opacity', String(0.1 + loudness * 0.3));
      }

      raf = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(raf);
  }, [analyserRef, live, reduce]);

  return (
    <svg className={`orb${live ? ' live' : ''}`} viewBox="0 0 240 240"
      style={{ width: size, height: size }} aria-hidden="true">
      <defs>
        <radialGradient id="orbGlow">
          <stop offset="0%" stopColor="#F1EFE3" stopOpacity=".5" />
          <stop offset="100%" stopColor="#F1EFE3" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle ref={glowRef} cx={CX} cy={CY} r={BASE} fill="url(#orbGlow)" opacity=".1" />
      <path ref={haloRef} className="orb-halo" />
      <path ref={midRef} className="orb-mid" />
      <path ref={coreRef} className="orb-core" />
    </svg>
  );
}
