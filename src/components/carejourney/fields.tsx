"use client";

import { useId, useState } from "react";
import type { CurrencyCode } from "@/lib/carejourney/data";
import { CURRENCIES } from "@/lib/carejourney/data";
import { fromCurrency, sanitize, toCurrency } from "@/lib/carejourney/engine";

type Accent = "sky" | "emerald";

const ring: Record<Accent, string> = {
  sky: "focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-200",
  emerald: "focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-200",
};

/**
 * Money field. The value is stored in USD and shown in the selected currency,
 * so switching currency never leaves a stale number in the box. While you type,
 * the box holds exactly what you typed (you can clear it); it reformats on blur.
 */
export function MoneyInput({
  label,
  hint,
  usd,
  currency,
  onChange,
  max = 1_000_000,
  accent = "sky",
}: {
  label: string;
  hint?: string;
  usd: number;
  currency: CurrencyCode;
  onChange: (usd: number) => void;
  /** Upper bound in USD. */
  max?: number;
  accent?: Accent;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [draft, setDraft] = useState<string | null>(null);
  const display = Math.round(toCurrency(usd, currency));
  const shown = draft ?? display.toLocaleString("en-US");

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <div className={`mt-1.5 flex items-center rounded-xl border border-slate-300 bg-white px-3 transition ${ring[accent]}`}>
        <span aria-hidden="true" className="select-none pr-1.5 text-sm font-medium text-slate-500">
          {CURRENCIES[currency].symbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={shown}
          aria-describedby={hint ? hintId : undefined}
          onFocus={() => setDraft(String(display))}
          onBlur={() => setDraft(null)}
          onChange={(event) => {
            const digits = event.target.value.replace(/[^\d]/g, "").slice(0, 9);
            setDraft(digits);
            onChange(sanitize(fromCurrency(Number(digits || 0), currency), 0, max));
          }}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-base text-slate-900 outline-none sm:text-sm"
        />
      </div>
      {hint ? (
        <p id={hintId} className="mt-1 text-xs text-slate-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function RangeField({
  label,
  valueText,
  min,
  max,
  step = 1,
  value,
  onChange,
  accent = "sky",
  hint,
  minLabel,
  maxLabel,
}: {
  label: string;
  /** Human text for the current value, e.g. "12 days". */
  valueText: string;
  /** Text under the left and right ends of the track. Defaults to the raw numbers. */
  minLabel?: string;
  maxLabel?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  accent?: Accent;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
        </label>
        <output htmlFor={id} className={`text-sm font-semibold ${accent === "sky" ? "text-sky-700" : "text-emerald-700"}`}>
          {valueText}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(sanitize(event.target.value, min, max))}
        className={`mt-2 h-2 w-full cursor-pointer ${accent === "sky" ? "accent-sky-600" : "accent-emerald-600"}`}
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-500" aria-hidden="true">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );
}

/** Two-or-more option toggle built on real radio inputs (keyboard and screen-reader friendly). */
export function Segmented<T extends string | number>({
  legend,
  value,
  options,
  onChange,
  accent = "sky",
}: {
  legend: string;
  value: T;
  options: { value: T; label: string; sub?: string }[];
  onChange: (value: T) => void;
  accent?: Accent;
}) {
  const name = useId();
  const on = accent === "sky" ? "peer-checked:border-sky-600 peer-checked:bg-sky-50 peer-checked:text-sky-900" : "peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-900";
  const focus = accent === "sky" ? "peer-focus-visible:ring-sky-600" : "peer-focus-visible:ring-emerald-600";
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-800">{legend}</legend>
      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={String(option.value)} className="relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={`block rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 transition peer-focus-visible:ring-2 hover:border-slate-400 ${on} ${focus}`}
            >
              <span className="block font-semibold">{option.label}</span>
              {option.sub ? <span className="block text-xs text-slate-600">{option.sub}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
