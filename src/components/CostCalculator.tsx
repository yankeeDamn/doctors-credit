"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoneyInput } from "@/components/carejourney/fields";
import AnimatedNumber from "@/components/motion/AnimatedNumber";
import { DEFAULTS, PROCEDURES, procedureById } from "@/lib/carejourney/data";
import { compare, formatMoney, homeOutOfPocket, indiaJourney, sanitize, type HomeMode } from "@/lib/carejourney/engine";

/**
 * The quick calculator. It shares one engine with the full CareJourney tool,
 * so both always agree. Prices are in USD.
 */
export default function CostCalculator() {
  const first = PROCEDURES[0];
  const [procedureId, setProcedureId] = useState(first.id);
  const procedure = procedureById(procedureId);

  const [mode, setMode] = useState<HomeMode>("self-pay");
  const [billed, setBilled] = useState<number>(first.homeUsd);
  const [deductibleLeft, setDeductibleLeft] = useState<number>(DEFAULTS.insured.deductibleRemaining);
  const [coinsurance, setCoinsurance] = useState<number>(DEFAULTS.insured.coinsurancePct);
  const [oopMax, setOopMax] = useState<number>(DEFAULTS.insured.outOfPocketMax);

  const [indiaCare, setIndiaCare] = useState<number>(first.indiaUsd);
  const [flights, setFlights] = useState<number>(DEFAULTS.flightPerTraveler * 2);
  const [stay, setStay] = useState<number>(first.stay.typical * DEFAULTS.stayPerDay);
  const [logistics, setLogistics] = useState<number>(DEFAULTS.visaConciergeTransport);
  const [follow, setFollow] = useState<number>(DEFAULTS.aftercare);

  function choose(id: string) {
    const p = procedureById(id);
    setProcedureId(p.id);
    setBilled(p.homeUsd); // The old calculator kept the previous procedure's price here.
    setIndiaCare(p.indiaUsd);
    setStay(p.stay.typical * DEFAULTS.stayPerDay);
  }

  const home = useMemo(
    () => homeOutOfPocket({ mode, retailPrice: billed, deductibleRemaining: deductibleLeft, coinsurancePct: coinsurance, outOfPocketMax: oopMax }),
    [mode, billed, deductibleLeft, coinsurance, oopMax]
  );
  // One lump sum per line here. Flights and stay are already totals, so use a 1-day, 1-traveler journey.
  const india = useMemo(
    () =>
      indiaJourney({
        hospitalPackage: indiaCare,
        travelers: 1,
        flightPerTraveler: flights,
        stayDays: 1,
        stayPerDay: stay,
        visaConciergeTransport: logistics,
        aftercare: follow,
        contingencyPct: DEFAULTS.contingencyPct,
      }),
    [indiaCare, flights, stay, logistics, follow]
  );
  const result = compare(home.total, india.total, procedure.homeWaitMonths, procedure.indiaWaitDays);

  const usd = "USD" as const;
  return (
    <form className="calc" onSubmit={(e) => e.preventDefault()} aria-labelledby="quick-calc-title">
      <p className="tag">Estimate only</p>
      <h3 id="quick-calc-title">Quick comparison for {procedure.short}</h3>
      <p className="muted">
        Every number is editable and in US dollars. Home costs depend on how you pay: the full price if you pay privately, or plan math
        (deductible, co-insurance, out-of-pocket maximum) if you have insurance. India figures are journey estimates, not quotes.{" "}
        <Link href="/carejourney">Open the full CareJourney India comparison</Link> for currencies, a PDF and the itemised view.
      </p>

      <div className="calc-grid">
        <label>
          Procedure
          <select value={procedureId} onChange={(e) => choose(e.target.value)}>
            {PROCEDURES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          How would you pay at home?
          <select value={mode} onChange={(e) => setMode(e.target.value as HomeMode)}>
            <option value="self-pay">Self-pay or not covered</option>
            <option value="insured">Private insurance (plan math)</option>
          </select>
        </label>
        <MoneyInput label="Procedure price at home" usd={billed} currency={usd} onChange={setBilled} />
        {mode === "insured" ? (
          <>
            <MoneyInput label="Deductible remaining" usd={deductibleLeft} currency={usd} onChange={setDeductibleLeft} />
            <label>
              Co-insurance % (0 to 100)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={coinsurance}
                onChange={(e) => setCoinsurance(sanitize(e.target.value, 0, 100))}
              />
            </label>
            <MoneyInput label="Out-of-pocket maximum" usd={oopMax} currency={usd} onChange={setOopMax} />
          </>
        ) : null}
        <MoneyInput label="India hospital & doctor package" usd={indiaCare} currency={usd} onChange={setIndiaCare} />
        <MoneyInput label="Flights (patient + companion)" usd={flights} currency={usd} onChange={setFlights} />
        <MoneyInput label="Stay in India (total)" usd={stay} currency={usd} onChange={setStay} />
        <MoneyInput label="Visa, concierge & local transport" usd={logistics} currency={usd} onChange={setLogistics} />
        <MoneyInput label="Aftercare & follow-up" usd={follow} currency={usd} onChange={setFollow} />
      </div>

      <div className="result" role="status" aria-live="polite">
        <dl>
          <div>
            <dt>Estimated cost at home</dt>
            <dd>
              <AnimatedNumber value={home.total} format={(n) => formatMoney(n, usd)} duration={0.5} />
            </dd>
          </div>
          <div>
            <dt>Estimated India journey (incl. {DEFAULTS.contingencyPct}% contingency)</dt>
            <dd>
              <AnimatedNumber value={india.total} format={(n) => formatMoney(n, usd)} duration={0.5} />
            </dd>
          </div>
          <div>
            <dt>Estimated difference</dt>
            <dd>
              {result.direction === "india-lower"
                ? `India is about ${formatMoney(result.difference, usd)} lower (${Math.round(result.percent)}%)`
                : result.direction === "home-lower"
                  ? `Home is about ${formatMoney(-result.difference, usd)} lower (${Math.round(result.percent)}%)`
                  : "About the same"}
            </dd>
          </div>
        </dl>
        <p className="source">
          Estimate only. Not a quote, not a guarantee, and not medical advice. Savings are not guaranteed, and sometimes home costs less. We
          compare what you may need to pay yourself, not hospital sticker prices alone.
        </p>
      </div>
    </form>
  );
}
