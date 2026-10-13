"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * Eases a number toward `target` whenever it changes. The first render shows
 * the final value, so server HTML and no-JS visitors see real numbers.
 * With `fromZero`, the first run counts up from 0 after `delay` seconds, which
 * suits a value that is hidden until its own reveal. People who ask their
 * system for reduced motion always get the final value at once. While `hold`
 * is true (for example until the number scrolls into view), a `fromZero`
 * value waits at 0.
 */
export function useCountUp(
  target: number,
  {
    duration = 0.6,
    delay = 0,
    fromZero = false,
    hold = false,
  }: { duration?: number; delay?: number; fromZero?: boolean; hold?: boolean } = {}
) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const first = useRef(true);

  useEffect(() => {
    if (reduce) {
      current.current = target;
      setValue(target);
      first.current = false;
      return;
    }
    if (hold) {
      if (fromZero && first.current) {
        current.current = 0;
        setValue(0);
      }
      return;
    }
    const startFromZero = first.current && fromZero;
    first.current = false;
    const start = startFromZero ? 0 : current.current;
    if (startFromZero) {
      current.current = 0;
      setValue(0);
    }
    const controls = animate(start, target, {
      duration,
      delay: startFromZero ? delay : 0,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        setValue(v);
      },
    });
    return () => controls.stop();
  }, [target, duration, delay, fromZero, hold, reduce]);

  return value;
}
