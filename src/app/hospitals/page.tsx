import Link from "next/link";
import { SOURCES } from "@/lib/sources";

export const metadata = { title: "Hospitals | CareJourney India" };

export default function HospitalsPage() {
  return (
    <main id="main" className="legal">
      <p className="eyebrow">Hospitals</p>
      <h1>Provider-level evidence matters.</h1>
      <p>
        CareJourney India will publish provider information only when it can be checked
        against reliable sources. Capabilities vary by hospital, department and
        physician. A directory of names and logos is how medical-tourism sites
        manufacture trust. We will not invent hospitals, logos or outcomes.
        CareJourney India does not operate or own hospitals.
      </p>
      <p>
        We are building CareJourney India in stages, starting with the decision itself.
        This page is not an operational hospital marketplace.
      </p>
      <h2>What a future profile may contain</h2>
      <p>
        Institution, location, relevant department, accreditation, capabilities,
        technology, specialist information, official website, the source, and
        the date we last checked. Estimated treatment ranges will be labeled
        ESTIMATE or PROVIDER-REPORTED.
      </p>
      <h2>What we will not do</h2>
      <p>
        Invent doctors, fabricate testimonials, or imply that every hospital in
        India offers equivalent quality. Accreditation is useful information,
        but it is not a guarantee of outcome.
      </p>
      <p className="source">
        NABH: {SOURCES.nabh.publisher}. {SOURCES.nabh.url}
      </p>
      <Link className="btn-solid" href="/enroll">
        Talk to a care coordinator
      </Link>
    </main>
  );
}
