import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Plays one TTS clip at a time and exposes a live analyser, so VoiceOrb can
 * be driven by the agent's voice the same way it is already driven by the
 * student's mic during recording — same component, different source.
 *
 * The Web Audio graph (AudioContext -> MediaElementAudioSourceNode ->
 * AnalyserNode -> destination) is built once per <audio> element, since a
 * MediaElementAudioSourceNode can only ever be created once for a given
 * element — building it fresh per play() would throw on the second call.
 */
export default function useTtsPlayback() {
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false); // autoplay was rejected; needs a tap
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const onEndedRef = useRef(null);

  const ensureGraph = useCallback(() => {
    if (audioRef.current) return;
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;
    ctx.createMediaElementSource(audio).connect(analyser);
    analyser.connect(ctx.destination); // must reach speakers — this is what plays

    audio.addEventListener('ended', () => {
      setPlaying(false);
      onEndedRef.current?.();
    });
  }, []);

  const play = useCallback((url, { onEnded } = {}) => {
    ensureGraph();
    onEndedRef.current = onEnded;
    const audio = audioRef.current;
    audio.src = url;
    setBlocked(false);

    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});

    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // Autoplay policy blocked it — needs a direct tap to satisfy the
        // browser's user-gesture requirement.
        setPlaying(false);
        setBlocked(true);
      });
  }, [ensureGraph]);

  /** Retry playback from a direct click — used when autoplay was blocked. */
  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
    audio.play().then(() => { setPlaying(true); setBlocked(false); }).catch(() => {});
  }, []);

  useEffect(() => () => {
    audioRef.current?.pause();
    ctxRef.current?.close().catch(() => {});
  }, []);

  return { play, retry, playing, blocked, analyserRef };
}
