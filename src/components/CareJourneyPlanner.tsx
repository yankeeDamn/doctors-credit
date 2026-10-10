"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  FileText,
  Hospital,
  Plane,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

type CurrencyCode = "USD" | "GBP" | "CAD" | "AUD" | "EUR";

type Procedure = {
  id: string;
  name: string;
  homeUsd: number;
  indiaUsd: number;
  waitMonths: number;
  indiaWaitDays: number;
};

const PROCEDURES: Procedure[] = [
  {
    id: "knee-replacement",
    name: "Total Knee Replacement",
    homeUsd: 35000,
    indiaUsd: 5800,
    waitMonths: 6,
    indiaWaitDays: 3,
  },
  {
    id: "hip-replacement",
    name: "Total Hip Replacement",
    homeUsd: 32000,
    indiaUsd: 6200,
    waitMonths: 5,
    indiaWaitDays: 3,
  },
  {
    id: "cabg",
    name: "Cardiac Bypass / CABG",
    homeUsd: 75000,
    indiaUsd: 7500,
    waitMonths: 4,
    indiaWaitDays: 3,
  },
  {
    id: "dental-implants",
    name: "Full-Mouth Dental Implants (All-on-4)",
    homeUsd: 24000,
    indiaUsd: 4500,
    waitMonths: 3,
    indiaWaitDays: 2,
  },
  {
    id: "ivf",
    name: "IVF Cycle",
    homeUsd: 16000,
    indiaUsd: 3200,
    waitMonths: 2,
    indiaWaitDays: 2,
  },
  {
    id: "lasik",
    name: "Laser Eye Surgery / LASIK",
    homeUsd: 4500,
    indiaUsd: 1100,
    waitMonths: 1,
    indiaWaitDays: 2,
  },
];

const CURRENCIES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  USD: { symbol: "$", rate: 1 },
  GBP: { symbol: "£", rate: 0.79 },
  CAD: { symbol: "C$", rate: 1.35 },
  AUD: { symbol: "A$", rate: 1.53 },
  EUR: { symbol: "€", rate: 0.92 },
};

function convertCurrency(usdValue: number, currency: CurrencyCode) {
  return usdValue * CURRENCIES[currency].rate;
}

function formatMoney(usdValue: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(convertCurrency(usdValue, currency));
}

function parseFieldNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

export default function CareJourneyPlanner() {
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(PROCEDURES[0].id);
  const [submissionState, setSubmissionState] = useState<"idle" | "ok" | "err">("idle");
  const [submissionMessage, setSubmissionMessage] = useState("");

  const activeProcedure = useMemo(
    () => PROCEDURES.find((procedure) => procedure.id === selectedId) ?? PROCEDURES[0],
    [selectedId]
  );

  const filteredProcedures = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return PROCEDURES;
    return PROCEDURES.filter((procedure) => procedure.name.toLowerCase().includes(normalized));
  }, [query]);

  const [procedureRetailPrice, setProcedureRetailPrice] = useState(activeProcedure.homeUsd);
  const [deductibleRemaining, setDeductibleRemaining] = useState(2500);
  const [coinsurancePercent, setCoinsurancePercent] = useState(20);
  const [outOfPocketMax, setOutOfPocketMax] = useState(9000);
  const [waitMonths, setWaitMonths] = useState(activeProcedure.waitMonths);

  const [hospitalPackage, setHospitalPackage] = useState(activeProcedure.indiaUsd);
  const [travelers, setTravelers] = useState<1 | 2>(2);
  const [flightPerTraveler, setFlightPerTraveler] = useState(820);
  const [stayDays, setStayDays] = useState(10);
  const [stayPerDay, setStayPerDay] = useState(95);
  const [visaConciergeTransport, setVisaConciergeTransport] = useState(640);
  const [aftercare, setAftercare] = useState(390);

  useEffect(() => {
    setProcedureRetailPrice(activeProcedure.homeUsd);
    setHospitalPackage(activeProcedure.indiaUsd);
    setWaitMonths(activeProcedure.waitMonths);
  }, [activeProcedure]);

  const homeOutOfPocket = useMemo(() => {
    const deductiblePart = Math.min(deductibleRemaining, procedureRetailPrice);
    const remainingAfterDeductible = Math.max(0, procedureRetailPrice - deductiblePart);
    const coinsurancePart = remainingAfterDeductible * (coinsurancePercent / 100);
    const rawOutOfPocket = deductiblePart + coinsurancePart;
    return Math.min(rawOutOfPocket, outOfPocketMax);
  }, [coinsurancePercent, deductibleRemaining, outOfPocketMax, procedureRetailPrice]);

  const indiaSubtotal = useMemo(() => {
    return (
      hospitalPackage +
      flightPerTraveler * travelers +
      stayDays * stayPerDay +
      visaConciergeTransport +
      aftercare
    );
  }, [aftercare, flightPerTraveler, hospitalPackage, stayDays, stayPerDay, travelers, visaConciergeTransport]);

  const contingency = indiaSubtotal * 0.1;
  const indiaTotal = indiaSubtotal + contingency;

  const savings = homeOutOfPocket - indiaTotal;
  const savingsPct = homeOutOfPocket > 0 ? (savings / homeOutOfPocket) * 100 : 0;

  const indiaWaitDays = activeProcedure.indiaWaitDays;
  const homeWaitDays = waitMonths * 30;
  const waitTimeSavedDays = Math.max(0, homeWaitDays - indiaWaitDays);

  const leadSummary = useMemo(() => {
    return {
      procedure: activeProcedure.name,
      currency,
      homeOutOfPocket: formatMoney(homeOutOfPocket, currency),
      indiaTotal: formatMoney(indiaTotal, currency),
      savings: formatMoney(Math.abs(savings), currency),
      savingsDirection: savings >= 0 ? "india-lower" : "home-lower",
      homeWaitMonths: waitMonths,
      indiaWaitDays,
    };
  }, [activeProcedure.name, currency, homeOutOfPocket, indiaTotal, indiaWaitDays, savings, waitMonths]);

  async function onLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("procedure", activeProcedure.name);
    formData.set("currency", currency);
    formData.set("comparisonSummary", JSON.stringify(leadSummary));

    const response = await fetch("/api/carejourney-lead", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setSubmissionState("err");
      setSubmissionMessage(data?.error || "We could not submit your request. Please try again.");
      return;
    }

    setSubmissionState("ok");
    setSubmissionMessage("Estimate request received. Our coordinator will respond within one business day.");
    form.reset();
  }

  function exportAsPdf() {
    window.print();
  }

  return (
    <main id="main" className="bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_15%_25%,rgba(2,132,199,0.15),transparent_48%),radial-gradient(circle_at_88%_30%,rgba(16,185,129,0.18),transparent_45%),linear-gradient(180deg,#f8fcff_0%,#eef8ff_100%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              CareJourney India
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Compare Procedure Costs: At Home vs. India Medical Journey
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              See your likely personal spend, wait time differences, and total India journey estimate in one transparent,
              medical-travel ready view.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-200"
          >
            <label className="block text-sm font-medium text-slate-700" htmlFor="procedure-search">
              Search procedure
            </label>
            <input
              id="procedure-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. knee, cabg, ivf"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="procedure-select">
              Procedure selector
            </label>
            <select
              id="procedure-select"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            >
              {filteredProcedures.map((procedure) => (
                <option key={procedure.id} value={procedure.id}>
                  {procedure.name} ({formatMoney(procedure.homeUsd, currency)} vs {formatMoney(procedure.indiaUsd, currency)})
                </option>
              ))}
            </select>
            {filteredProcedures.length === 0 ? (
              <p className="mt-2 text-sm text-amber-700">No procedure match. Clear search to view full list.</p>
            ) : null}
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8 print:py-3">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    currency === code
                      ? "border-sky-700 bg-sky-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-sky-500 hover:text-sky-700"
                  }`}
                >
                  {CURRENCIES[code].symbol} {code}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={exportAsPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-sky-600 hover:text-sky-700"
            >
              <FileText className="h-4 w-4" />
              Export Comparison as PDF
            </button>
          </div>

          <motion.article
            key={`${selectedId}-${currency}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-7 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-6 text-white shadow-xl shadow-slate-300"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Live Comparison</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
              Estimated Savings: {formatMoney(Math.abs(savings), currency)} ({Math.abs(savingsPct).toFixed(1)}% {savings >= 0 ? "less than at home" : "higher than at home"})
            </h2>
            <p className="mt-3 text-sm text-sky-100 sm:text-base">
              Wait time: {indiaWaitDays} days vs. {waitMonths} month{waitMonths === 1 ? "" : "s"} at home ({waitTimeSavedDays} days saved).
            </p>
          </motion.article>

          <div className="grid gap-6 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 text-sky-700" />
                <h3 className="text-lg font-semibold text-slate-900">Expected Cost at Home (e.g., USA / Private Insurance)</h3>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Procedure Retail Price
                  <input
                    type="number"
                    min={0}
                    value={Math.round(procedureRetailPrice)}
                    onChange={(event) => setProcedureRetailPrice(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Insurance Deductible Remaining
                  <input
                    type="range"
                    min={0}
                    max={15000}
                    value={deductibleRemaining}
                    onChange={(event) => setDeductibleRemaining(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full"
                  />
                  <span className="text-sm text-slate-600">{formatMoney(deductibleRemaining, currency)}</span>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Co-insurance %
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={coinsurancePercent}
                    onChange={(event) => setCoinsurancePercent(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full"
                  />
                  <span className="text-sm text-slate-600">{coinsurancePercent}%</span>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Out-of-Pocket Max Limit
                  <input
                    type="number"
                    min={0}
                    value={Math.round(outOfPocketMax)}
                    onChange={(event) => setOutOfPocketMax(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Estimated Wait Time (months)
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={waitMonths}
                    onChange={(event) => setWaitMonths(Math.max(1, parseFieldNumber(event.target.value)))}
                    className="mt-2 w-full"
                  />
                  <span className="text-sm text-slate-600">{waitMonths} month{waitMonths === 1 ? "" : "s"}</span>
                </label>
              </div>

              <div className="mt-6 rounded-xl bg-slate-100 p-4">
                <p className="text-sm font-medium text-slate-600">Estimated Total Out-of-Pocket Expense</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(homeOutOfPocket, currency)}</p>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <Hospital className="h-5 w-5 text-emerald-700" />
                <h3 className="text-lg font-semibold text-slate-900">Complete India Care Journey</h3>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Hospital &amp; Doctor Package
                  <input
                    type="number"
                    min={0}
                    value={Math.round(hospitalPackage)}
                    onChange={(event) => setHospitalPackage(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </label>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-700">Flight tickets</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTravelers(1)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        travelers === 1 ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                      }`}
                    >
                      1 Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelers(2)}
                      className={`rounded-full border px-3 py-1 text-sm ${
                        travelers === 2 ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                      }`}
                    >
                      Patient + 1 Companion
                    </button>
                  </div>
                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Flight per traveler
                    <input
                      type="number"
                      min={0}
                      value={Math.round(flightPerTraveler)}
                      onChange={(event) => setFlightPerTraveler(parseFieldNumber(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Stay duration (7-21 days)
                  <input
                    type="range"
                    min={7}
                    max={21}
                    value={stayDays}
                    onChange={(event) => setStayDays(Math.min(21, Math.max(7, parseFieldNumber(event.target.value))))}
                    className="mt-2 w-full"
                  />
                  <span className="text-sm text-slate-600">{stayDays} days</span>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Stay cost per day
                  <input
                    type="number"
                    min={0}
                    value={Math.round(stayPerDay)}
                    onChange={(event) => setStayPerDay(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Medical Visa + Concierge + Local Transport
                  <input
                    type="number"
                    min={0}
                    value={Math.round(visaConciergeTransport)}
                    onChange={(event) => setVisaConciergeTransport(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Aftercare & Follow-up
                  <input
                    type="number"
                    min={0}
                    value={Math.round(aftercare)}
                    onChange={(event) => setAftercare(parseFieldNumber(event.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </label>
              </div>

              <div className="mt-6 rounded-xl bg-emerald-50 p-4">
                <div className="flex items-center justify-between text-sm text-emerald-800">
                  <span>10% medical contingency buffer</span>
                  <span>{formatMoney(contingency, currency)}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-700">Estimated Complete Journey Cost</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatMoney(indiaTotal, currency)}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">At-a-glance comparison table</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-2 py-2 font-semibold">Category</th>
                    <th className="px-2 py-2 font-semibold">At Home</th>
                    <th className="px-2 py-2 font-semibold">India Journey</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-2">Estimated out-of-pocket</td>
                    <td className="px-2 py-2">{formatMoney(homeOutOfPocket, currency)}</td>
                    <td className="px-2 py-2">{formatMoney(indiaTotal, currency)}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-2">Wait time</td>
                    <td className="px-2 py-2">{waitMonths} months</td>
                    <td className="px-2 py-2">{indiaWaitDays} days</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-2 py-2">Visa and logistics support</td>
                    <td className="px-2 py-2 text-slate-400">Not included</td>
                    <td className="px-2 py-2 text-emerald-700">Included in estimate</td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2">Care coordination</td>
                    <td className="px-2 py-2 text-slate-400">Variable</td>
                    <td className="px-2 py-2 text-emerald-700">Dedicated coordinator</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Trust and accreditation</h3>
            <div className="mt-4 grid gap-3">
              <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-sky-700" />
                <div>
                  <p className="font-semibold text-slate-800">JCI quality standards</p>
                  <p className="text-sm text-slate-600">Partner hospitals are screened for international patient-safety standards.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-3">
                <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <p className="font-semibold text-slate-800">NABH accreditation</p>
                  <p className="text-sm text-slate-600">CareJourney recommends NABH-compliant institutions and specialty teams.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-3">
                <Stethoscope className="mt-0.5 h-5 w-5 text-slate-700" />
                <div>
                  <p className="font-semibold text-slate-800">Clinical case review first</p>
                  <p className="text-sm text-slate-600">Final pricing and candidacy require specialist review of your records.</p>
                </div>
              </div>
            </div>
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              Deductibles and out-of-pocket calculations are representative examples of standard private health plans. India
              figures are estimated journey totals, not formal medical quotes. Final pricing requires clinical record review.
            </p>
          </article>
        </div>
      </section>

      <section className="px-4 pb-16 pt-4 sm:px-6 lg:px-8 print:hidden">
        <div className="mx-auto grid max-w-6xl gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">Get Itemized Journey Estimate &amp; Free Medical Opinion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Share your basic details and we will send a structured estimate with next-step clinical review guidance.
            </p>
            <form className="mt-5 space-y-4" onSubmit={onLeadSubmit}>
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                WhatsApp / Phone
                <input
                  name="phone"
                  required
                  autoComplete="tel"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Optional report upload
                <span className="mt-2 block rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                  <span className="mb-1 inline-flex items-center gap-2 font-medium text-slate-700">
                    <Plane className="h-4 w-4" />
                    Drop report here or browse
                  </span>
                  <input name="reportFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="mt-2 w-full" />
                </span>
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                Submit estimate request
              </button>
              {submissionState !== "idle" ? (
                <p className={submissionState === "ok" ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>{submissionMessage}</p>
              ) : null}
            </form>
          </div>

          <aside className="rounded-2xl bg-slate-900 p-5 text-slate-100">
            <h4 className="text-lg font-semibold">What you receive</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li className="flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 text-emerald-400" />
                Treatment timeline and estimated booking window in India.
              </li>
              <li className="flex items-start gap-2">
                <CircleDollarSign className="mt-0.5 h-4 w-4 text-emerald-400" />
                Itemized journey estimate with travel and stay assumptions.
              </li>
              <li className="flex items-start gap-2">
                <Hospital className="mt-0.5 h-4 w-4 text-emerald-400" />
                Hospital shortlist based on your procedure and travel needs.
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
