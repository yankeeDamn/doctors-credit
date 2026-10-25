import Link from "next/link";
import SkinHairAnalyzer from "@/components/SkinHairAnalyzer";

export const metadata = { title: "Hospital Verification | CareJourney India" };

export default function HospitalsPage() {
  return <main id="main">
    <div className="legal">
      <p className="eyebrow">Hospital verification</p>
      <h1>Choose with evidence.</h1>
      <p>Check the exact hospital branch and treating team before sharing records or making a payment. CareJourney India does not own hospitals and does not yet offer a verified partner directory or live hospital booking.</p>
      <a className="btn-solid" href="https://nabh.co/find-a-healthcare-organisation/">Open the official NABH directory ↗</a>
      <p className="text-sm">Official external directory; includes accreditation, certification and empanelment programmes, including organisations under renewal. Confirm the programme and current status. Listing is not a guarantee of outcome.</p>
      <h2>Questions to ask your shortlisted hospital</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Branch and accreditation", "Does the listing match this address? What services and dates does its certificate cover?"],
          ["Treating team", "Who will treat me? How can I verify their registration, specialty and experience with this procedure?"],
          ["Written quote", "What is included? Ask about tests, implants, intensive care, complications and cancellation terms."],
          ["Continuity of care", "Who handles complications and follow-up after I return home? How will my local clinician receive the care plan?"],
        ].map(([title, detail]) => <section key={title} className="rounded-xl border p-5"><h3>{title}</h3><p>{detail}</p></section>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link className="btn-solid" href="/medical-tourism">Plan treatment travel</Link>
        <Link className="btn-solid" href="/carejourney">Compare full journey costs</Link>
        <Link href="/health-check" className="underline">AI health companion</Link>
      </div>
    </div>
    <div className="px-[5vw] pb-20"><SkinHairAnalyzer /></div>
  </main>;
}
