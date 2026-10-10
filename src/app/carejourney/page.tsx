import type { Metadata } from "next";
import CareJourneyPlanner from "@/components/CareJourneyPlanner";

export const metadata: Metadata = {
  title: "CareJourney India | Medical Tourism Cost Comparison",
  description:
    "Compare at-home treatment out-of-pocket costs with a complete India medical journey estimate across major procedures.",
};

export default function CareJourneyPage() {
  return <CareJourneyPlanner />;
}
