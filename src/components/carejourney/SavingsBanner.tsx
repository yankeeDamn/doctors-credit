"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { ArrowRight, Clock3, Info, TrendingDown } from "lucide-react";
import type { CurrencyCode } from "@/lib/carejourney/data";
import { formatMoney, formatWait, type Comparison } from "@/lib/carejourney/engine";

function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const controls = animate(from.current, target, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: setValue,
    });
    from.current = target;
    return () => controls.stop();
  }, [target]);
  return value;
}

export default function SavingsBanner({
  comparison,
  currency,
  homeWaitMonths,
  indiaWaitDays,
}: {
  comparison: Comparison;
  currency: CurrencyCode;
  homeWaitMonths: number;
  indiaWaitDays: number;
}) {
  const amount = useCountUp(Math.abs(comparison.difference));
  const pct = Math.round(comparison.percent);
  const lower = comparison.direction === "india-lower";
  const higher = comparison.direction === "home-lower";
  const finalAmount = formatMoney(Math.abs(comparison.difference), currency);

  const summary = lower
    ? `Estimated savings ${finalAmount}, ${pct} percent less than at home.`
    : higher
      ? `At these inputs the India journey costs ${finalAmount} more than at home.`
      : "At these inputs the two totals are about the same.";

  return (
    <section
      aria-labelledby="savings-heading"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-900 p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
      <p id="savings-heading" className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
        Live comparison
      </p>

      {/* Screen readers get one stable sentence; the animated number is hidden from them. */}
      <p className="sr-only" role="status" aria-live="polite">
        {summary}
      </p>

      <div aria-hidden="true" className="mt-3">
        {lower ? (
          <>
            <p className="text-lg font-medium text-slate-200">Estimated Savings:</p>
            <p className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-5xl font-semibold tracking-tight tabular-nums text-emerald-400 sm:text-6xl">{formatMoney(amount, currency)}</span>
              <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
                <TrendingDown className="h-4 w-4" />
                {pct}% less than at home
              </span>
            </p>
          </>
        ) : higher ? (
          <>
            <p className="text-lg font-medium text-slate-200">At these inputs, home costs less</p>
            <p className="mt-1 flex flex-wrap items-end gap-x-3">
              <span className="text-5xl font-semibold tracking-tight tabular-nums text-amber-300 sm:text-6xl">{formatMoney(amount, currency)}</span>
              <span className="mb-1.5 text-sm font-semibold text-amber-200">more in India ({pct}% higher)</span>
            </p>
          </>
        ) : (
          <p className="text-3xl font-semibold">The two totals are about the same</p>
        )}
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <p className="flex items-start gap-2.5 rounded-2xl bg-white/10 px-4 py-3 text-slate-100">
          <Clock3 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <span>
            Wait time: <strong className="text-white">{indiaWaitDays} day{indiaWaitDays === 1 ? "" : "s"}</strong> vs.{" "}
            <strong className="text-white">{formatWait(homeWaitMonths)}</strong> at home
            {comparison.waitDaysSaved > 0 ? <span className="block text-slate-300">About {comparison.waitDaysSaved} days sooner</span> : null}
          </span>
        </p>
        <p className="flex items-start gap-2.5 rounded-2xl bg-white/10 px-4 py-3 text-slate-100">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
          <span>
            {higher
              ? "India can still be worth investigating if waits, network limits or coverage exclusions apply to you."
              : "An estimate, not a quote. Final pricing needs a clinical record review. Savings are not guaranteed."}
          </span>
        </p>
      </div>

      <a
        href="#estimate"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
      >
        Get my itemized estimate
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </a>
    </section>
  );
}
