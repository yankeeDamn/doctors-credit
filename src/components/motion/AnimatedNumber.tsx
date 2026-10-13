"use client";

import { useCountUp } from "@/components/motion/useCountUp";

/** A number that eases to its new value. `format` turns the in-between numbers into text. */
export default function AnimatedNumber({
  value,
  format,
  duration,
  delay,
  fromZero,
  hold,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
  delay?: number;
  fromZero?: boolean;
  hold?: boolean;
}) {
  const shown = useCountUp(value, { duration, delay, fromZero, hold });
  return <>{format(shown)}</>;
}
