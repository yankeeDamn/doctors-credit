import { BadgeCheck, ExternalLink, ShieldCheck, Stethoscope } from "lucide-react";
import { COMPARISON_DISCLAIMER } from "@/lib/carejourney/pdf";

const ITEMS = [
  {
    icon: ShieldCheck,
    iconClass: "text-sky-700",
    title: "JCI quality standards",
    text: "Joint Commission International accreditation reviews patient-safety and quality processes. We prioritise partner hospitals that hold it.",
    href: "https://www.jointcommissioninternational.org/",
    link: "About JCI",
  },
  {
    icon: BadgeCheck,
    iconClass: "text-emerald-700",
    title: "NABH accreditation",
    text: "India's National Accreditation Board for Hospitals & Healthcare Providers sets national hospital standards. We ask every hospital for its current status.",
    href: "https://nabh.co/",
    link: "About NABH",
  },
  {
    icon: Stethoscope,
    iconClass: "text-slate-700",
    title: "Clinical review comes first",
    text: "Candidacy and final pricing depend on a specialist reviewing your records. Accreditation is not a guarantee of outcome.",
  },
] as const;

export default function TrustPanel() {
  return (
    <section aria-labelledby="trust-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <h2 id="trust-heading" className="text-2xl font-semibold text-slate-900">
        Trust and accreditation
      </h2>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <Icon aria-hidden="true" className={`h-6 w-6 ${item.iconClass}`} />
              <h3 className="mt-3 font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.text}</p>
              {"href" in item ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-700 underline-offset-2 hover:underline"
                >
                  {item.link}
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 sm:text-sm">
        {COMPARISON_DISCLAIMER}
      </p>
    </section>
  );
}
