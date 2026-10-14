import type { Metadata } from "next";
import CareJourneyPlanner from "@/components/CareJourneyPlanner";
import { turnstileSiteKey } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "Compare Procedure Costs: At Home vs. India | CareJourney India",
  description:
    "Compare what you may pay at home with a complete India medical journey: treatment, flights, companion, stay, visa and aftercare. Estimates only, not quotes.",
};

export default function CareJourneyPage() {
  return <CareJourneyPlanner siteKey={turnstileSiteKey()} />;
}
