"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
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
import { procedureById } from "@/lib/carejourney/data";

const EASE = [0.22, 1, 0.36, 1] as const;

const WAIT = {
  icon: CalendarClock,
  title: "Shorter time to treatment",
  text: "For many planned procedures, scheduling in India can take days to a few weeks once your records are reviewed and your visa is issued. Some health systems quote months.",
} as const;

const PACKAGE = {
  icon: PackageCheck,
  title: "One clear package price",
  text: "Hospital packages usually bundle surgeon, implant, theatre and ward stay, so the quote is easier to compare than itemised bills from several providers.",
  includes: ["Surgeon and medical team", "Implant or devices, where one is used", "Operating theatre", "Ward stay"],
} as const;

const OTHERS = [
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

const tile = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

function IconBadge({ icon: Icon }: { icon: typeof CalendarClock }) {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
      <Icon aria-hidden="true" className="h-5 w-5" />
    </span>
  );
}

/** Two bars from the knee replacement planning assumptions: days in India against months quoted elsewhere. */
function WaitVisual() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const knee = procedureById("knee-replacement");
  const homeDays = Math.round((knee.homeWaitMonths * 365) / 12);
  const go = reduce || seen;
  const bar = (pct: number, delay: number, className: string) => (
    <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <motion.div
        className={`h-full rounded-full ${className}`}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: go ? `${pct}%` : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.9, delay, ease: EASE }}
      />
    </div>
  );
  return (
    <div ref={ref} className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-800">
        India: about {knee.indiaWaitDays} days
      </p>
      {bar(Math.max(2.5, (knee.indiaWaitDays / homeDays) * 100), 0.1, "bg-emerald-600")}
      <p className="mt-4 text-sm font-medium text-slate-800">Some health systems: about {knee.homeWaitMonths} months</p>
      {bar(100, 0.5, "bg-slate-600")}
      <p className="mt-3 text-xs text-slate-600">Example: total knee replacement. Planning assumptions, confirmed for your case by your coordinator.</p>
    </div>
  );
}

/** A quote's contents, ticked off one by one. */
function PackageVisual() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLUListElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.6 });
  const go = reduce || seen;
  return (
    <div className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <ul ref={ref} className="space-y-2.5">
        {PACKAGE.includes.map((item, i) => (
          <li key={item} className="flex items-center gap-3 text-sm text-slate-800">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" strokeWidth="1.6" className="text-emerald-200" stroke="currentColor" />
              <motion.path
                d="M7.5 12.5l3 3 6-6.5"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: go ? 1 : 0 }}
                transition={reduce ? { duration: 0 } : { duration: 0.4, delay: 0.15 + i * 0.28, ease: EASE }}
              />
            </svg>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-600">Ask every hospital what the quote includes and what it leaves out.</p>
    </div>
  );
}

function Step({ index, title, text, progress, reduce }: { index: number; title: string; text: string; progress: MotionValue<number>; reduce: boolean }) {
  const at = index / (STEPS.length - 1);
  const bg = useTransform(progress, [Math.max(0, at - 0.06), Math.min(1, at + 0.02)], ["#0f172a", "#10b981"]);
  const fg = useTransform(progress, [Math.max(0, at - 0.06), Math.min(1, at + 0.02)], ["#e2e8f0", "#022c22"]);
  return (
    <li className="relative pl-12 lg:pl-0 lg:pt-12">
      <motion.span
        style={reduce ? { backgroundColor: "#10b981", color: "#022c22" } : { backgroundColor: bg, color: fg }}
        className="absolute left-0 top-0 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ring-1 ring-white/25"
      >
        {index + 1}
      </motion.span>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{text}</p>
    </li>
  );
}

/** The journey is a real sequence, so the line fills as you scroll through it. */
function Journey() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const progress = useTransform(scrollYProgress, (v) => (reduce ? 1 : v));
  return (
    <ol ref={ref} className="relative mt-10 grid gap-8 lg:grid-cols-5 lg:gap-6">
      <div aria-hidden="true" className="absolute bottom-4 left-4 top-4 w-px bg-white/15 lg:hidden">
        <motion.div style={{ scaleY: progress }} className="h-full w-full origin-top bg-emerald-400" />
      </div>
      <div aria-hidden="true" className="absolute left-4 right-4 top-4 hidden h-px bg-white/15 lg:block">
        <motion.div style={{ scaleX: progress }} className="h-full w-full origin-left bg-emerald-400" />
      </div>
      {STEPS.map((step, i) => (
        <Step key={step.title} index={i} title={step.title} text={step.text} progress={progress} reduce={reduce} />
      ))}
    </ol>
  );
}

export default function WhyIndia() {
  return (
    <div className="space-y-14">
      <section aria-labelledby="why-heading">
        <h2 id="why-heading" className="max-w-3xl text-balance text-3xl font-semibold text-slate-900 sm:text-4xl">
          More than a lower price
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Cost opens the conversation. These are the reasons patients most often say tipped their decision, and the questions worth asking
          any hospital before you travel.
        </p>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <li className={`${tile} sm:col-span-2 lg:col-span-3`}>
            <IconBadge icon={WAIT.icon} />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{WAIT.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{WAIT.text}</p>
            <WaitVisual />
          </li>
          <li className={`${tile} sm:col-span-2 lg:col-span-3`}>
            <IconBadge icon={PACKAGE.icon} />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{PACKAGE.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{PACKAGE.text}</p>
            <PackageVisual />
          </li>
          {OTHERS.map(({ icon, title, text }) => (
            <li key={title} className={`${tile} lg:col-span-2`}>
              <IconBadge icon={icon} />
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-heading" className="rounded-3xl bg-slate-900 p-6 text-white sm:p-10">
        <h2 id="how-heading" className="text-2xl font-semibold sm:text-3xl">
          From first question to follow-up
        </h2>
        <Journey />
      </section>

      <section aria-labelledby="fit-heading" className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
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
