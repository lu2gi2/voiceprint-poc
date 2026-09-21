import { useEffect, useState } from 'react';

/** Subscribes to a media query and re-renders when it flips. */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    // addListener is the Safari < 14 fallback.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery('(max-width: 820px)');
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
