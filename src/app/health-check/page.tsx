import Link from "next/link";
import SkinHairAnalyzer from "@/components/SkinHairAnalyzer";

export const metadata = { title: "AI Health Companion | CareJourney India", description: "Prepare for a clinician conversation with skin and hair photo observations and care-planning tools." };

export default function HealthCheckPage() {
  return <main id="main">
    <div className="legal">
      <p className="eyebrow">AI health companion</p>
      <h1>Understand what to ask. Plan your next step.</h1>
      <p>Start with non-diagnostic skin or hair observations, then prepare a clinician conversation or explore planned care in India. This tool cannot assess your overall health, diagnose disease or replace a medical examination.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <a href="#skin-hair-analyzer" className="rounded-xl border p-4">Skin and hair observations →</a>
        <Link href="/hospitals" className="rounded-xl border p-4">Verify a hospital →</Link>
        <Link href="/medical-tourism" className="rounded-xl border p-4">Plan care in India →</Link>
      </div>
      <p>For urgent concerns, seek local medical care. <Link href="/emergency" className="underline">Emergency guidance</Link></p>
    </div>
    <div className="px-[5vw] pb-20"><SkinHairAnalyzer /></div>
  </main>;
}
