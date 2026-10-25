import Link from "next/link";
import MedicalTravelChecklist from "@/components/MedicalTravelChecklist";

export const metadata = { title: "Plan Medical Travel in India | CareJourney India" };

export default function MedicalTourismPage() {
  return <main id="main" className="legal">
    <p className="eyebrow">Medical travel • India</p>
    <h1>A care plan before a travel plan.</h1>
    <p>For domestic and international patients considering planned treatment in India. Compare the full journey, check provider evidence and arrange aftercare before committing to travel. We do not confirm treatment suitability, hospital bookings or visa eligibility.</p>
    <div className="my-6 grid gap-4 sm:grid-cols-3">
      <Link className="rounded-xl border p-4" href="/hospitals">1. Check a hospital →</Link>
      <Link className="rounded-xl border p-4" href="/carejourney">2. Compare journey costs →</Link>
      <Link className="rounded-xl border p-4" href="/enroll">3. Explore coordination →</Link>
    </div>
    <MedicalTravelChecklist />
    <h2>Use official information</h2>
    <ul>
      <li><a href="https://nabh.co/find-a-healthcare-organisation/">NABH healthcare organisation directory</a> — check the branch, programme, validity and scope directly.</li>
      <li><a href="https://indianvisaonline.gov.in/evisa/">Government of India e-Visa portal</a> — check current medical and attendant visa rules for your nationality.</li>
      <li><a href="https://www.cdc.gov/yellow-book/hcp/health-care-abroad/medical-tourism.html">CDC medical tourism guidance</a> — discuss travel and aftercare risks with your clinician.</li>
    </ul>
    <p className="text-sm">Source links reviewed 25 October 2026. Requirements can change; follow the current official instructions. Accreditation does not guarantee treatment outcomes.</p>
    <Link href="/health-check" className="btn-solid">Back to AI health companion</Link>
  </main>;
}
