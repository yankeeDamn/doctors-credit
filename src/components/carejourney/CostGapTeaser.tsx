"use client";

import { useMemo } from "react";
import CostGap, { type CostGapLabels } from "@/components/carejourney/CostGap";
import { DEFAULTS, procedureById } from "@/lib/carejourney/data";
import { homeOutOfPocket, indiaJourney } from "@/lib/carejourney/engine";

/** The homepage version: one worked example (a total knee replacement, self-pay at home, a patient and a companion in India). */
export default function CostGapTeaser({ labels, caption }: { labels: CostGapLabels; caption: string }) {
  const { home, india } = useMemo(() => {
    const p = procedureById("knee-replacement");
    return {
      home: homeOutOfPocket({ mode: "self-pay", retailPrice: p.homeUsd, deductibleRemaining: 0, coinsurancePct: 0, outOfPocketMax: 0 }),
      india: indiaJourney({
        hospitalPackage: p.indiaUsd,
        travelers: 2,
        flightPerTraveler: DEFAULTS.flightPerTraveler,
        stayDays: p.stay.typical,
        stayPerDay: DEFAULTS.stayPerDay,
        visaConciergeTransport: DEFAULTS.visaConciergeTransport,
        aftercare: DEFAULTS.aftercare,
        contingencyPct: DEFAULTS.contingencyPct,
      }),
    };
  }, []);

  return (
    <figure className="cost-gap-card" aria-label={caption}>
      <figcaption>{caption}</figcaption>
      <CostGap homeTotal={home.total} india={india} currency="USD" labels={labels} />
    </figure>
  );
}
