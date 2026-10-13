"use client";

import { useId } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { Search } from "lucide-react";
import { PROCEDURES, type CurrencyCode } from "@/lib/carejourney/data";
import { formatMoney } from "@/lib/carejourney/engine";

/**
 * Searchable procedure list built on native radio inputs. Filtering never
 * changes the selected procedure, so the calculator can't fall out of sync
 * with what the list shows.
 */
export default function ProcedurePicker({
  selectedId,
  onSelect,
  query,
  onQuery,
  currency,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (value: string) => void;
  currency: CurrencyCode;
}) {
  const searchId = useId();
  const name = useId();
  const needle = query.trim().toLowerCase();
  const list = needle ? PROCEDURES.filter((p) => `${p.name} ${p.short}`.toLowerCase().includes(needle)) : PROCEDURES;
  const selected = PROCEDURES.find((p) => p.id === selectedId);
  const selectedHidden = selected && !list.some((p) => p.id === selected.id);

  return (
    <div>
      <label htmlFor={searchId} className="block text-sm font-medium text-slate-800">
        Find your procedure
      </label>
      <div className="relative mt-1.5">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Try knee, heart, dental, IVF, LASIK"
          autoComplete="off"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 sm:text-sm"
        />
      </div>

      <fieldset className="mt-3">
        <legend className="sr-only">Procedure</legend>
        <LayoutGroup id={name}>
          <div className="grid gap-2">
            {list.map((p) => (
              <label key={p.id} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={p.id}
                  checked={p.id === selectedId}
                  onChange={() => onSelect(p.id)}
                  className="peer sr-only"
                />
                <span className="relative flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 transition-colors hover:border-sky-500 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-600">
                  {/* One highlight that glides to whichever procedure is picked. */}
                  {p.id === selectedId ? (
                    <motion.span
                      layoutId="procedure-highlight"
                      aria-hidden="true"
                      className="absolute -inset-px rounded-xl border border-sky-600 bg-sky-50 ring-2 ring-sky-600/25"
                      transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    />
                  ) : null}
                  <span className="relative text-sm font-semibold text-slate-900">{p.name}</span>
                  <span className="relative shrink-0 text-right text-xs leading-snug text-slate-600">
                    <span className="block">At home ~{formatMoney(p.homeUsd, currency)}</span>
                    <span className="block font-semibold text-emerald-700">India ~{formatMoney(p.indiaUsd, currency)}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </LayoutGroup>
      </fieldset>

      <p className="mt-2 min-h-5 text-sm text-slate-600" role="status">
        {list.length === 0 ? "No procedure matches that search. Clear the box to see all six." : null}
        {selectedHidden && list.length > 0 ? `Still comparing: ${selected?.name}.` : null}
      </p>
    </div>
  );
}
