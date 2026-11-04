import { useState, useEffect, useRef } from "react";

/**
 * Native IntersectionObserver hook for triggering scroll reveals
 * with zero external animation dependencies.
 */
export function useInView(options = {}) {
  const { threshold = 0.15, once = true } = options;
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(() => !("IntersectionObserver" in window));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback if browser doesn't support IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (once) observer.unobserve(el);
      } else if (!once) {
        setIsInView(false);
      }
    }, { threshold });

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  return [ref, isInView];
}
