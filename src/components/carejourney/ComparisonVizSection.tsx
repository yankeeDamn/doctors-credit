import { Check, Minus } from "lucide-react";
import type { CurrencyCode } from "@/lib/carejourney/data";
import { formatMoney, formatWait, type Comparison, type HomeBreakdown, type IndiaBreakdown } from "@/lib/carejourney/engine";

// Two series, so two fixed hues: slate (home) and emerald (India). Text stays in ink colors.
const HOME_FILL = "bg-slate-600";
const INDIA_FILL = "bg-emerald-600";

function Bar({ label, value, max, fill, valueText }: { label: string; value: number; max: number; fill: string; valueText: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 1.5 : 0, (value / max) * 100) : 0;
  return (
    <div title={`${label}: ${valueText}`}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="font-semibold tabular-nums text-slate-900">{valueText}</span>
      </div>
      <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-r-full ${fill} transition-[width] duration-500 ease-out motion-reduce:transition-none`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ComparisonBars({
  homeTotal,
  india,
  currency,
  homeWaitDays,
  indiaWaitDays,
  homeWaitMonths,
}: {
  homeTotal: number;
  india: IndiaBreakdown;
  currency: CurrencyCode;
  homeWaitDays: number;
  indiaWaitDays: number;
  homeWaitMonths: number;
}) {
  const costMax = Math.max(homeTotal, india.total, 1);
  const waitMax = Math.max(homeWaitDays, indiaWaitDays, 1);

  // Largest first, so the eye finds where the money goes.
  const rows = [...india.lines, { key: "contingency", label: "10% medical contingency buffer", amount: india.contingency }].sort(
    (a, b) => b.amount - a.amount
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-labelledby="viz-compare" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 id="viz-compare" className="text-lg font-semibold text-slate-900">
          Side by side
        </h3>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600" aria-label="Legend">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${HOME_FILL}`} /> At home
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${INDIA_FILL}`} /> India journey
          </li>
        </ul>
        <div className="mt-5 space-y-4">
          <Bar label="Estimated cost at home" value={homeTotal} max={costMax} fill={HOME_FILL} valueText={formatMoney(homeTotal, currency)} />
          <Bar label="Complete India journey" value={india.total} max={costMax} fill={INDIA_FILL} valueText={formatMoney(india.total, currency)} />
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-900">Time to treatment</p>
          <div className="mt-3 space-y-4">
            <Bar label="Waiting at home" value={homeWaitDays} max={waitMax} fill={HOME_FILL} valueText={formatWait(homeWaitMonths)} />
            <Bar
              label="Scheduling in India"
              value={indiaWaitDays}
              max={waitMax}
              fill={INDIA_FILL}
              valueText={`${indiaWaitDays} day${indiaWaitDays === 1 ? "" : "s"}`}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="viz-breakdown" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 id="viz-breakdown" className="text-lg font-semibold text-slate-900">
          Where the India budget goes
        </h3>
        <p className="mt-1 text-sm text-slate-600">Treatment is one part. Travel, stay and follow-up are in the total.</p>
        <ul className="mt-5 space-y-4">
          {rows.map((row) => {
            const share = india.total > 0 ? (row.amount / india.total) * 100 : 0;
            return (
              <li key={row.key} title={`${row.label}: ${formatMoney(row.amount, currency)} (${Math.round(share)}%)`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-800">{row.label}</span>
                  <span className="shrink-0 tabular-nums text-slate-900">
                    <span className="font-semibold">{formatMoney(row.amount, currency)}</span>
                    <span className="ml-2 text-xs text-slate-600">{Math.round(share)}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-r-full bg-emerald-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
                    style={{ width: `${row.amount > 0 ? Math.max(1.5, share) : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Yes({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-2 text-emerald-800">
      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
      <span>{children}</span>
    </span>
  );
}

function No({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-2 text-slate-600">
      <Minus aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={3} />
      <span>{children}</span>
    </span>
  );
}

export function ComparisonTable({
  home,
  homeMode,
  india,
  comparison,
  currency,
  homeWaitMonths,
  indiaWaitDays,
  stayDays,
  travelers,
}: {
  home: HomeBreakdown;
  homeMode: "self-pay" | "insured";
  india: IndiaBreakdown;
  comparison: Comparison;
  currency: CurrencyCode;
  homeWaitMonths: number;
  indiaWaitDays: number;
  stayDays: number;
  travelers: 1 | 2;
}) {
  const rows: { label: string; home: React.ReactNode; india: React.ReactNode }[] = [
    {
      label: "Estimated out-of-pocket",
      home: <strong className="text-slate-900">{formatMoney(home.total, currency)}</strong>,
      india: <strong className="text-slate-900">{formatMoney(india.total, currency)}</strong>,
    },
    {
      label: "Estimated difference",
      home: <span className="text-slate-600">Baseline</span>,
      india:
        comparison.direction === "india-lower" ? (
          <Yes>{formatMoney(comparison.difference, currency)} lower</Yes>
        ) : comparison.direction === "home-lower" ? (
          <No>{formatMoney(-comparison.difference, currency)} higher</No>
        ) : (
          <span className="text-slate-700">About the same</span>
        ),
    },
    {
      label: "Waiting time",
      home: <No>{formatWait(homeWaitMonths)}</No>,
      india: (
        <Yes>
          About {indiaWaitDays} day{indiaWaitDays === 1 ? "" : "s"} to schedule
        </Yes>
      ),
    },
    {
      label: "Procedure price",
      home: homeMode === "insured" ? <span>Plan rules apply (deductible, co-insurance, cap)</span> : <span>Full private price</span>,
      india: <Yes>One package: surgeon, hospital, ward</Yes>,
    },
    {
      label: "Flights",
      home: <span className="text-slate-600">Not needed</span>,
      india: <Yes>{travelers === 2 ? "Patient + companion included" : "Patient included"}</Yes>,
    },
    {
      label: "Recovery stay",
      home: <span className="text-slate-600">At home</span>,
      india: <Yes>{stayDays} days of serviced stay included</Yes>,
    },
    { label: "Visa, concierge & transport", home: <No>Not applicable</No>, india: <Yes>Included in the estimate</Yes> },
    { label: "Aftercare & follow-up", home: <span className="text-slate-600">Via your local team</span>, india: <Yes>Follow-up costs included</Yes> },
    { label: "Care coordinator", home: <No>Varies by provider</No>, india: <Yes>Dedicated coordinator</Yes> },
  ];

  return (
    <section aria-labelledby="table-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 id="table-heading" className="text-lg font-semibold text-slate-900">
        At-a-glance comparison
      </h3>
      <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-labelledby="table-heading">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">Comparison of at-home costs and the complete India medical journey</caption>
          <thead>
            <tr className="border-b border-slate-200 text-slate-700">
              <th scope="col" className="py-2.5 pr-3 font-semibold">
                Category
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold">
                At home
              </th>
              <th scope="col" className="px-3 py-2.5 font-semibold text-emerald-800">
                India journey
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-slate-100 align-top last:border-0">
                <th scope="row" className="py-3 pr-3 font-medium text-slate-800">
                  {row.label}
                </th>
                <td className="px-3 py-3 text-slate-700">{row.home}</td>
                <td className="px-3 py-3 text-slate-700">{row.india}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Both visuals plus the table, in the order readers need them. */
export default function ComparisonViz({
  home,
  homeMode,
  india,
  comparison,
  currency,
  homeWaitMonths,
  indiaWaitDays,
  stayDays,
  travelers,
}: {
  home: HomeBreakdown;
  homeMode: "self-pay" | "insured";
  india: IndiaBreakdown;
  comparison: Comparison;
  currency: CurrencyCode;
  homeWaitMonths: number;
  indiaWaitDays: number;
  stayDays: number;
  travelers: 1 | 2;
}) {
  return (
    <div className="space-y-6">
      <ComparisonBars
        homeTotal={home.total}
        india={india}
        currency={currency}
        homeWaitDays={comparison.homeWaitDays}
        indiaWaitDays={indiaWaitDays}
        homeWaitMonths={homeWaitMonths}
      />
      <ComparisonTable
        home={home}
        homeMode={homeMode}
        india={india}
        comparison={comparison}
        currency={currency}
        homeWaitMonths={homeWaitMonths}
        indiaWaitDays={indiaWaitDays}
        stayDays={stayDays}
        travelers={travelers}
      />
    </div>
  );
}
