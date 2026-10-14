"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import type { CurrencyCode } from "@/lib/carejourney/data";
import { formatMoney, type IndiaBreakdown } from "@/lib/carejourney/engine";

export type CostGapLabels = {
  atHome: string;
  india: string;
  /** Use {amount}. Shown when the India journey costs less. */
  lower: string;
  /** Use {amount}. Shown when the India journey costs more. */
  higher: string;
  same: string;
  /** Use {pct}: the hospital package's share of the India total. */
  split: string;
};

export const COST_GAP_EN: CostGapLabels = {
  atHome: "At home",
  india: "India journey",
  lower: "{amount} lower in India",
  higher: "{amount} higher in India",
  same: "About the same",
  split: "Treatment is {pct}% of the India total. The rest is travel, stay, visa and follow-up.",
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** Treatment in deep emerald, the journey around it in a lighter emerald, the buffer lightest. */
function segmentClass(key: string) {
  if (key === "package") return "bg-emerald-700";
  if (key === "contingency") return "bg-emerald-300";
  return "bg-emerald-500";
}

function hatchImage(tone: "emerald" | "amber") {
  const c = tone === "emerald" ? "rgba(5,150,105,0.55)" : "rgba(217,119,6,0.6)";
  return `repeating-linear-gradient(135deg, ${c} 0 2px, transparent 2px 7px)`;
}

/**
 * Two bars on one scale. The empty stretch beside the shorter bar is the gap,
 * drawn as hatching, so the difference is something you see before you read it.
 * The bars draw themselves once, when this scrolls into view. After that they
 * slide to new values whenever the inputs change.
 */
export default function CostGap({
  homeTotal,
  india,
  currency,
  labels = COST_GAP_EN,
}: {
  homeTotal: number;
  india: IndiaBreakdown;
  currency: CurrencyCode;
  labels?: CostGapLabels;
}) {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.35 });
  // If the observer never fires (very old browsers), draw anyway.
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFallback(true), 1500);
    return () => clearTimeout(id);
  }, []);
  const go = reduce || seen || fallback;

  // The staggered intro lasts a few seconds from the moment it starts; later changes get no delay.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    if (!go) return;
    const id = setTimeout(() => setIntro(false), 4200);
    return () => clearTimeout(id);
  }, [go]);

  const scale = Math.max(homeTotal, india.total, 1);
  const homePct = (homeTotal / scale) * 100;
  const indiaPct = (india.total / scale) * 100;
  const diff = homeTotal - india.total;
  const direction = Math.abs(diff) < 1 ? "even" : diff > 0 ? "lower" : "higher";
  const packageAmount = india.lines.find((l) => l.key === "package")?.amount ?? 0;
  const packageShare = india.total > 0 ? Math.round((packageAmount / india.total) * 100) : 0;

  const segments = [...india.lines, { key: "contingency", label: "Medical contingency buffer", amount: india.contingency }].filter(
    (s) => s.amount > 0
  );
  const money = (usd: number) => formatMoney(usd, currency);
  const move = (delay: number, duration = 0.7) => (reduce ? { duration: 0 } : { duration, delay: intro ? delay : 0, ease: EASE });
  const gapText = (usd: number) =>
    direction === "even" ? labels.same : (direction === "lower" ? labels.lower : labels.higher).replace("{amount}", money(Math.abs(usd)));
  const tone = direction === "higher" ? "amber" : "emerald";

  return (
    <div ref={ref}>
      {/* The numbers count up, so the visual part stays out of the accessibility tree and one plain sentence stands in for it. */}
      <div aria-hidden="true">
        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between gap-3 text-sm sm:text-base">
              <span className="font-medium text-slate-800">{labels.atHome}</span>
              <span className="font-semibold tabular-nums text-slate-900">
                <AnimatedNumber value={homeTotal} format={money} fromZero hold={!go} delay={0.3} duration={0.9} />
              </span>
            </div>
            <div className="relative mt-2 h-10 overflow-hidden rounded-xl bg-slate-100">
              {direction === "higher" ? <Hatch from={homePct} tone="amber" show={go} reduce={reduce} delay={intro ? 2.1 : 0} /> : null}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-xl bg-slate-700"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: go ? `${homePct}%` : 0 }}
                transition={move(0.3, 0.9)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3 text-sm sm:text-base">
              <span className="font-medium text-slate-800">{labels.india}</span>
              <span className="font-semibold tabular-nums text-slate-900">
                <AnimatedNumber value={india.total} format={money} fromZero hold={!go} delay={1.0} duration={0.9} />
              </span>
            </div>
            <div className="relative mt-2 h-10 overflow-hidden rounded-xl bg-slate-100">
              {direction === "lower" ? <Hatch from={indiaPct} tone="emerald" show={go} reduce={reduce} delay={intro ? 2.1 : 0} /> : null}
              <div className="absolute inset-y-0 left-0 flex w-full">
                {segments.map((s, i) => (
                  <motion.div
                    key={s.key}
                    title={`${s.label}: ${money(s.amount)}`}
                    className={`h-full shrink-0 border-r-2 border-white first:rounded-l-xl last:rounded-r-xl last:border-r-0 ${segmentClass(s.key)}`}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: go ? `${(s.amount / scale) * 100}%` : 0 }}
                    transition={move(1.0 + i * 0.09, 0.6)}
                  />
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{labels.split.replace("{pct}", String(packageShare))}</p>
          </div>
        </div>

        <motion.p
          className="mt-4 flex items-center gap-2.5 text-sm font-semibold text-slate-900 sm:text-base"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: go ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.5, delay: intro ? 2.2 : 0 }}
        >
          <span
            className={`h-4 w-7 shrink-0 rounded-sm border ${tone === "amber" ? "border-amber-500" : "border-emerald-600"}`}
            style={{ backgroundImage: hatchImage(tone) }}
          />
          <span className="tabular-nums">
            <AnimatedNumber value={diff} format={gapText} fromZero hold={!go} delay={2.2} duration={0.8} />
          </span>
        </motion.p>
      </div>
      <p className="sr-only">
        {labels.atHome}: {money(homeTotal)}. {labels.india}: {money(india.total)}. {gapText(diff)}.
      </p>
    </div>
  );
}

/** The empty stretch beside the shorter bar. It fades in after the bars have drawn, then follows the bar. */
function Hatch({ from, tone, show, reduce, delay }: { from: number; tone: "emerald" | "amber"; show: boolean; reduce: boolean; delay: number }) {
  return (
    <motion.div
      className="absolute inset-y-0"
      style={{ backgroundImage: hatchImage(tone) }}
      initial={reduce ? false : { opacity: 0, left: `${from}%`, width: `${100 - from}%` }}
      animate={{ opacity: show ? 1 : 0, left: `${from}%`, width: `${Math.max(0, 100 - from)}%` }}
      transition={reduce ? { duration: 0 } : { duration: 0.6, delay }}
    />
  );
}
