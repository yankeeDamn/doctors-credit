"use client";

import { useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { BadgeCheck, CircleDollarSign, Download, Hospital, Loader2, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import CostGap from "@/components/carejourney/CostGap";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import ComparisonViz from "@/components/carejourney/ComparisonVizSection";
import LeadForm from "@/components/carejourney/LeadForm";
import ProcedurePicker from "@/components/carejourney/ProcedurePicker";
import SavingsBanner from "@/components/carejourney/SavingsBanner";
import TrustPanel from "@/components/carejourney/TrustPanel";
import WhyIndia from "@/components/carejourney/WhyIndia";
import { MoneyInput, RangeField, Segmented } from "@/components/carejourney/fields";
import {
  CURRENCIES,
  CURRENCY_ORDER,
  DEFAULTS,
  RATES_NOTE,
  procedureById,
  PROCEDURES,
  type CurrencyCode,
} from "@/lib/carejourney/data";
import { compare, formatMoney, formatMoneyCode, formatWait, homeOutOfPocket, indiaJourney, type HomeMode } from "@/lib/carejourney/engine";
import { downloadComparisonPdf, headline, type PdfInput } from "@/lib/carejourney/pdf";

export default function CareJourneyPlanner({ siteKey }: { siteKey?: string }) {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [query, setQuery] = useState("");
  const [procedureId, setProcedureId] = useState(PROCEDURES[0].id);
  const procedure = procedureById(procedureId);

  // At home
  const [mode, setMode] = useState<HomeMode>("self-pay");
  const [retailPrice, setRetailPrice] = useState<number>(procedure.homeUsd);
  const [deductibleRemaining, setDeductibleRemaining] = useState<number>(DEFAULTS.insured.deductibleRemaining);
  const [coinsurancePct, setCoinsurancePct] = useState<number>(DEFAULTS.insured.coinsurancePct);
  const [outOfPocketMax, setOutOfPocketMax] = useState<number>(DEFAULTS.insured.outOfPocketMax);
  const [homeWaitMonths, setHomeWaitMonths] = useState<number>(procedure.homeWaitMonths);

  // India
  const [hospitalPackage, setHospitalPackage] = useState<number>(procedure.indiaUsd);
  const [travelers, setTravelers] = useState<1 | 2>(2);
  const [flightPerTraveler, setFlightPerTraveler] = useState<number>(DEFAULTS.flightPerTraveler);
  const [stayDays, setStayDays] = useState<number>(procedure.stay.typical);
  const [stayPerDay, setStayPerDay] = useState<number>(DEFAULTS.stayPerDay);
  const [logistics, setLogistics] = useState<number>(DEFAULTS.visaConciergeTransport);
  const [aftercare, setAftercare] = useState<number>(DEFAULTS.aftercare);

  const [pdfState, setPdfState] = useState<"idle" | "working" | "error">("idle");

  function loadProcedure(id: string) {
    const p = procedureById(id);
    setProcedureId(p.id);
    setRetailPrice(p.homeUsd);
    setHomeWaitMonths(p.homeWaitMonths);
    setHospitalPackage(p.indiaUsd);
    setStayDays(p.stay.typical);
  }

  function resetAll() {
    loadProcedure(procedureId);
    setMode("self-pay");
    setDeductibleRemaining(DEFAULTS.insured.deductibleRemaining);
    setCoinsurancePct(DEFAULTS.insured.coinsurancePct);
    setOutOfPocketMax(DEFAULTS.insured.outOfPocketMax);
    setTravelers(2);
    setFlightPerTraveler(DEFAULTS.flightPerTraveler);
    setStayPerDay(DEFAULTS.stayPerDay);
    setLogistics(DEFAULTS.visaConciergeTransport);
    setAftercare(DEFAULTS.aftercare);
  }

  const home = useMemo(
    () => homeOutOfPocket({ mode, retailPrice, deductibleRemaining, coinsurancePct, outOfPocketMax }),
    [mode, retailPrice, deductibleRemaining, coinsurancePct, outOfPocketMax]
  );
  const india = useMemo(
    () =>
      indiaJourney({
        hospitalPackage,
        travelers,
        flightPerTraveler,
        stayDays,
        stayPerDay,
        visaConciergeTransport: logistics,
        aftercare,
        contingencyPct: DEFAULTS.contingencyPct,
      }),
    [hospitalPackage, travelers, flightPerTraveler, stayDays, stayPerDay, logistics, aftercare]
  );
  const comparison = useMemo(
    () => compare(home.total, india.total, homeWaitMonths, procedure.indiaWaitDays),
    [home.total, india.total, homeWaitMonths, procedure.indiaWaitDays]
  );

  const pdfInput: PdfInput = {
    procedureName: procedure.name,
    currency,
    homeMode: mode,
    home,
    india,
    comparison,
    homeWaitMonths,
    indiaWaitDays: procedure.indiaWaitDays,
    stayDays,
    travelers,
    notes: procedure.clinicalNote ? [procedure.clinicalNote] : undefined,
  };

  const summaryText = [
    `${procedure.name}.`,
    `At home (${mode === "self-pay" ? "self-pay" : "private insurance"}): ${formatMoneyCode(home.total, currency)}.`,
    `India journey: ${formatMoneyCode(india.total, currency)}.`,
    `${headline(pdfInput)}.`,
    `Wait: ${procedure.indiaWaitDays} days vs ${formatWait(homeWaitMonths)}.`,
  ].join(" ");

  async function exportPdf() {
    setPdfState("working");
    try {
      await downloadComparisonPdf(pdfInput);
      setPdfState("idle");
    } catch {
      setPdfState("error");
    }
  }

  const money = (usd: number) => formatMoney(usd, currency);

  return (
    <main id="main" className="bg-slate-50 text-slate-900">
      {/* Hero + procedure selector */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_12%_20%,rgba(2,132,199,0.14),transparent_46%),radial-gradient(circle_at_90%_30%,rgba(16,185,129,0.16),transparent_44%),linear-gradient(180deg,#f8fcff_0%,#eef8ff_100%)] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white/90 px-3 py-1 text-sm font-semibold text-sky-800">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              CareJourney India
            </p>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] text-slate-900 sm:text-5xl">
              Compare Procedure Costs: At Home vs. India Medical Journey
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              See what you may pay at home, what a complete India journey costs once flights, a companion, your stay, visa and follow-up are
              counted, and how much sooner you could be treated.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5 text-sm">
              {[
                { icon: ShieldCheck, text: "JCI and NABH partner hospitals" },
                { icon: CircleDollarSign, text: "Itemised, whole-journey estimate" },
                { icon: BadgeCheck, text: "Dedicated care coordinator" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-medium text-slate-800 shadow-sm ring-1 ring-slate-200">
                  <Icon aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200/70 sm:p-6"
          >
            <ProcedurePicker selectedId={procedureId} onSelect={loadProcedure} query={query} onQuery={setQuery} currency={currency} />
            {procedure.clinicalNote ? (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">{procedure.clinicalNote}</p>
            ) : null}
          </motion.div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200/70 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="m-0! max-w-none! text-lg! font-semibold! leading-snug! tracking-normal! text-slate-900! sm:text-xl!">{procedure.name}: the gap in one picture</h2>
            <p className="text-sm text-slate-600">Follows the numbers you set below.</p>
          </div>
          <div className="mt-5 max-w-3xl">
            <CostGap homeTotal={home.total} india={india} currency={currency} />
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" aria-labelledby="calc-heading" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="calc-heading" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                {procedure.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">Adjust any number. The comparison updates as you type.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LayoutGroup id="currency">
                <div role="group" aria-label="Currency" className="flex flex-wrap gap-1.5">
                  {CURRENCY_ORDER.map((code) => (
                    <button
                      key={code}
                      type="button"
                      aria-pressed={currency === code}
                      onClick={() => setCurrency(code)}
                      className={`relative rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                        currency === code
                          ? "border-sky-700 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-sky-500 hover:text-sky-800"
                      }`}
                    >
                      {currency === code ? (
                        <motion.span
                          layoutId="currency-pill"
                          aria-hidden="true"
                          className="absolute -inset-px rounded-full bg-sky-700"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                        />
                      ) : null}
                      <span className="relative">
                        {CURRENCIES[code].symbol} {code}
                      </span>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 transition hover:border-slate-500"
              >
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Reset to typical values
              </button>
              <button
                type="button"
                onClick={exportPdf}
                disabled={pdfState === "working"}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-70"
              >
                {pdfState === "working" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" />}
                Export Comparison as PDF
              </button>
            </div>
          </div>
          {pdfState === "error" ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
              We could not create the PDF on this device. Please try again, or use your browser&apos;s print option.
            </p>
          ) : null}

          <SavingsBanner comparison={comparison} currency={currency} homeWaitMonths={homeWaitMonths} indiaWaitDays={procedure.indiaWaitDays} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Column A */}
            <article aria-labelledby="col-home" className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <CircleDollarSign aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="col-home" className="text-lg font-semibold leading-snug text-slate-900">
                    Expected Cost at Home
                  </h3>
                  <p className="text-sm text-slate-600">(e.g., USA / Private Insurance)</p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <Segmented
                  legend="How would you pay at home?"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "self-pay", label: "Self-pay or not covered", sub: "You pay the full private price" },
                    { value: "insured", label: "Private insurance", sub: "Deductible, co-insurance and a cap" },
                  ]}
                />
                <MoneyInput label="Procedure retail price" usd={retailPrice} currency={currency} onChange={setRetailPrice} />
                {mode === "insured" ? (
                  <>
                    <RangeField
                      label="Insurance deductible remaining"
                      valueText={money(deductibleRemaining)}
                      min={0}
                      max={15000}
                      step={250}
                      value={deductibleRemaining}
                      onChange={setDeductibleRemaining}
                      minLabel={money(0)}
                      maxLabel={money(15000)}
                    />
                    <RangeField
                      label="Co-insurance %"
                      valueText={`${coinsurancePct}%`}
                      min={0}
                      max={50}
                      step={5}
                      value={coinsurancePct}
                      onChange={setCoinsurancePct}
                      minLabel="0%"
                      maxLabel="50%"
                    />
                    <MoneyInput
                      label="Out-of-pocket max limit"
                      hint="The most your plan makes you pay in a plan year."
                      usd={outOfPocketMax}
                      currency={currency}
                      onChange={setOutOfPocketMax}
                    />
                  </>
                ) : (
                  <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                    Not covered, out of network, or paying privately (common in the UK, Canada and Australia for private care). Switch to{" "}
                    <strong>Private insurance</strong> to see how deductibles and an out-of-pocket maximum change the result.
                  </p>
                )}
                <RangeField
                  label="Estimated wait time"
                  valueText={formatWait(homeWaitMonths)}
                  min={0}
                  max={12}
                  value={homeWaitMonths}
                  onChange={setHomeWaitMonths}
                  minLabel="None"
                  maxLabel="12 months"
                />
              </div>

              <div className="mt-6 rounded-xl bg-slate-100 p-4">
                <p className="text-sm font-medium text-slate-700">Estimated Total Out-of-Pocket Expense</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                  <AnimatedNumber value={home.total} format={money} duration={0.5} />
                </p>
                {mode === "insured" ? (
                  <p className="mt-1 text-xs text-slate-700">
                    {home.capApplied
                      ? `Your out-of-pocket maximum limits this. Without it, the plan math would be ${money(home.beforeCap)}.`
                      : `Deductible ${money(home.deductiblePart)} + co-insurance ${money(home.coinsurancePart)}.`}
                  </p>
                ) : null}
              </div>
            </article>

            {/* Column B */}
            <article aria-labelledby="col-india" className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Hospital aria-hidden="true" className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="col-india" className="text-lg font-semibold leading-snug text-slate-900">
                    Complete India Care Journey
                  </h3>
                  <p className="text-sm text-slate-600">Treatment, travel, stay, visa and aftercare</p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                <MoneyInput
                  accent="emerald"
                  label="Hospital & doctor package"
                  hint="NABH/JCI accredited partner rate (estimate)"
                  usd={hospitalPackage}
                  currency={currency}
                  onChange={setHospitalPackage}
                />
                <Segmented
                  accent="emerald"
                  legend="Flight tickets"
                  value={travelers}
                  onChange={setTravelers}
                  options={[
                    { value: 1, label: "1 Patient" },
                    { value: 2, label: "Patient + 1 Companion" },
                  ]}
                />
                <MoneyInput accent="emerald" label="Round-trip flight, per traveler" usd={flightPerTraveler} currency={currency} onChange={setFlightPerTraveler} />
                <RangeField
                  accent="emerald"
                  label="Pre- and post-op hotel / serviced apartment stay"
                  valueText={`${stayDays} days`}
                  min={procedure.stay.min}
                  max={procedure.stay.max}
                  value={Math.min(procedure.stay.max, Math.max(procedure.stay.min, stayDays))}
                  onChange={setStayDays}
                  minLabel={`${procedure.stay.min} days`}
                  maxLabel={`${procedure.stay.max} days`}
                />
                <MoneyInput
                  accent="emerald"
                  label="Stay cost per night"
                  hint="One room, shared with your companion"
                  usd={stayPerDay}
                  currency={currency}
                  onChange={setStayPerDay}
                />
                <MoneyInput
                  accent="emerald"
                  label="Medical visa + airport concierge + local transport"
                  usd={logistics}
                  currency={currency}
                  onChange={setLogistics}
                />
                <MoneyInput accent="emerald" label="Aftercare & follow-up" hint="Tests, consults and physiotherapy outside the package" usd={aftercare} currency={currency} onChange={setAftercare} />
              </div>

              <div className="mt-6 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <dl className="space-y-1 text-sm text-slate-800">
                  <div className="flex justify-between gap-3">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums">{money(india.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{DEFAULTS.contingencyPct}% medical contingency buffer</dt>
                    <dd className="tabular-nums">{money(india.contingency)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm font-medium text-slate-700">Estimated Total Journey Cost</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                  <AnimatedNumber value={india.total} format={money} duration={0.5} />
                </p>
              </div>
            </article>
          </div>

          <ComparisonViz
            home={home}
            homeMode={mode}
            india={india}
            comparison={comparison}
            currency={currency}
            homeWaitMonths={homeWaitMonths}
            indiaWaitDays={procedure.indiaWaitDays}
            stayDays={stayDays}
            travelers={travelers}
          />
          <p className="text-xs text-slate-600">
            {RATES_NOTE} Typical wait and stay lengths are planning assumptions that your coordinator confirms for your case.
          </p>
        </div>
      </section>

      <section className="px-4 pb-4 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <WhyIndia />
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <TrustPanel />
        </div>
      </section>

      {/* Lead capture */}
      <section id="estimate" aria-labelledby="estimate-heading" className="scroll-mt-6 px-4 pb-20 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-md sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 id="estimate-heading" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Get Itemized Journey Estimate &amp; Free Medical Opinion
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Your current comparison for <strong>{procedure.name}</strong> travels with the request, so your coordinator starts from your numbers.
              Opinions come from treating physicians after they review your records. {`CareJourney India`} coordinates and is not a clinic.
            </p>
            <div className="mt-6">
              <LeadForm siteKey={siteKey} procedureName={procedure.name} currency={currency} summaryText={summaryText} />
            </div>
          </div>
          <aside className="self-start rounded-2xl bg-slate-900 p-6 text-slate-100">
            <h3 className="text-lg font-semibold">What you receive</h3>
            <ul className="mt-4 space-y-4 text-sm leading-relaxed text-slate-200">
              {[
                "An itemised journey estimate with every travel and stay assumption written out.",
                "A hospital shortlist matched to your procedure, with accreditation status to verify.",
                "A treatment and travel timeline, including when you could realistically be scheduled.",
                "A named coordinator who stays with you from first question to follow-up.",
              ].map((text) => (
                <li key={text} className="flex items-start gap-3">
                  <BadgeCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {text}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
