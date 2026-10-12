import {
  BadgeCheck,
  BedDouble,
  CalendarClock,
  Cpu,
  HeartHandshake,
  Languages,
  PackageCheck,
  Stethoscope,
  TriangleAlert,
  Video,
} from "lucide-react";

const REASONS = [
  {
    icon: CalendarClock,
    title: "Shorter time to treatment",
    text: "For many planned procedures, scheduling in India can take days to a few weeks once your records are reviewed and your visa is issued. Some health systems quote months.",
  },
  {
    icon: PackageCheck,
    title: "One clear package price",
    text: "Hospital packages usually bundle surgeon, implant, theatre and ward stay, so the quote is easier to compare than itemised bills from several providers.",
  },
  {
    icon: BadgeCheck,
    title: "Accredited hospitals",
    text: "Selected partner hospitals hold JCI and/or NABH accreditation. Accreditation is useful information, not a guarantee of outcome.",
  },
  {
    icon: Stethoscope,
    title: "Experienced specialist teams",
    text: "Some Indian centres perform large volumes of joint, cardiac, dental and fertility procedures. Ask for surgeon-level experience and we help you request it.",
  },
  {
    icon: Cpu,
    title: "Modern technology",
    text: "Selected hospitals offer robotic-assisted joint surgery, advanced imaging and modern cardiac and fertility laboratories. Capabilities vary by hospital.",
  },
  {
    icon: Languages,
    title: "English-speaking care teams",
    text: "English is widely used in Indian clinical settings, which makes consent, discharge notes and day-to-day questions simpler.",
  },
  {
    icon: BedDouble,
    title: "Recovery built around you and a companion",
    text: "Serviced apartments, airport pickup and local transport are planned with your treatment dates, and a companion can stay with you.",
  },
  {
    icon: Video,
    title: "Continuity after you fly home",
    text: "You leave with a discharge summary and follow-up plan, and consults can continue by video so your home doctor stays in the loop.",
  },
] as const;

const STEPS = [
  { title: "Share your basics", text: "Tell us the procedure and your situation. No records are needed to get a first estimate." },
  { title: "Records review", text: "With your consent, treating physicians review your records and confirm whether travel and treatment make sense." },
  { title: "Itemised plan", text: "You receive a written plan: package, stay, travel and follow-up, with assumptions spelled out." },
  { title: "Travel with support", text: "Visa guidance, airport pickup, a hospital coordinator and a comfortable place to recover." },
  { title: "Aftercare", text: "Follow-up checks, physiotherapy where needed, and a summary for your doctors at home." },
] as const;

export default function WhyIndia() {
  return (
    <div className="space-y-14">
      <section aria-labelledby="why-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Why patients look at India</p>
        <h2 id="why-heading" className="mt-2 max-w-3xl text-balance text-3xl font-semibold text-slate-900 sm:text-4xl">
          More than a lower price
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Cost opens the conversation. These are the reasons patients most often say tipped their decision, and the questions worth asking
          any hospital before you travel.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition group-hover:bg-emerald-100">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="rounded-3xl bg-slate-900 p-6 text-white sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">How your journey works</p>
        <h2 id="how-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">
          From first question to follow-up
        </h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-slate-950">
                {i + 1}
              </span>
              <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="fit-heading"
        className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6"
      >
        <HeartHandshake aria-hidden="true" className="mt-0.5 hidden h-6 w-6 shrink-0 text-amber-700 sm:block" />
        <div>
          <h2 id="fit-heading" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <TriangleAlert aria-hidden="true" className="h-5 w-5 text-amber-700 sm:hidden" />
            India is not always the right answer
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Travel may not make sense if your condition is unstable or urgent, if you need close continuity with your local team, or if your
            out-of-pocket cost at home is already low. We would rather tell you that early. Lower cost does not mean lower or higher risk, and
            no outcome or saving is guaranteed.
          </p>
        </div>
      </section>
    </div>
  );
}
