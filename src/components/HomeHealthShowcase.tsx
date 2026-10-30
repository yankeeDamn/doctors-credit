import Link from "next/link";
import { ArrowRight, Camera, ClipboardCheck, Plane, ShieldCheck } from "lucide-react";
import type { Lang } from "@/lib/i18n/config";

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  start: string;
  verify: string;
  safety: string;
  photoLabel: string;
  photoTitle: string;
  photoBody: string;
  step1: string;
  step2: string;
  step3: string;
  photoAction: string;
  hospitalLabel: string;
  hospitalTitle: string;
  hospitalBody: string;
  hospitalAction: string;
  travelLabel: string;
  travelTitle: string;
  travelBody: string;
  travelAction: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    eyebrow: "AI-assisted guidance & care planning",
    title: "A clearer starting point for your care decisions.",
    lead: "Explore optional AI-assisted skin and hair photo observations, learn how to verify a hospital, and prepare for planned medical care in India.",
    start: "Explore AI health companion",
    verify: "Check a hospital",
    safety: "For adults 18+. Photo analysis needs consent and offers non-diagnostic observations, not medical advice. For emergencies, seek local medical care.",
    photoLabel: "01 / Skin & hair companion",
    photoTitle: "A photo, some context, and questions for your clinician.",
    photoBody: "Use your camera or upload a picture. The AI describes visible features and possible next questions; it cannot diagnose a condition.",
    step1: "Choose skin or hair",
    step2: "Upload and describe",
    step3: "Review observations",
    photoAction: "Open the analyzer",
    hospitalLabel: "02 / Hospital checks",
    hospitalTitle: "Verify before you decide.",
    hospitalBody: "Review the official accreditation directory and questions about the exact hospital and treating team. No in-app hospital directory or booking yet.",
    hospitalAction: "Hospital verification",
    travelLabel: "03 / Medical travel",
    travelTitle: "Plan beyond the procedure.",
    travelBody: "Think through costs, travel, follow-up care and official documents before making a commitment.",
    travelAction: "Explore travel planning",
  },
  es: {
    eyebrow: "Orientación con IA y planificación de la atención",
    title: "Un punto de partida más claro para decidir sobre su atención.",
    lead: "Explore observaciones opcionales con IA de fotos de piel y cabello, aprenda a verificar un hospital y prepare la atención médica planificada en la India.",
    start: "Explorar el asistente de salud con IA",
    verify: "Verificar un hospital",
    safety: "Para mayores de 18 años. El análisis de fotos requiere consentimiento y ofrece observaciones sin diagnóstico, no asesoramiento médico. En una emergencia, busque atención médica local.",
    photoLabel: "01 / Piel y cabello",
    photoTitle: "Una foto, algo de contexto y preguntas para su profesional de salud.",
    photoBody: "Use la cámara o suba una foto. La IA describe rasgos visibles y posibles preguntas; no puede diagnosticar enfermedades.",
    step1: "Elegir piel o cabello",
    step2: "Subir y describir",
    step3: "Revisar observaciones",
    photoAction: "Abrir el analizador",
    hospitalLabel: "02 / Verificación de hospitales",
    hospitalTitle: "Verifique antes de decidir.",
    hospitalBody: "Consulte el directorio oficial de acreditación y preguntas sobre el hospital y el equipo tratante. Aún no hay directorio interno ni reservas.",
    hospitalAction: "Verificar un hospital",
    travelLabel: "03 / Viajes médicos",
    travelTitle: "Planifique más allá del procedimiento.",
    travelBody: "Considere costos, viajes, seguimiento y documentos oficiales antes de comprometerse.",
    travelAction: "Planificar el viaje",
  },
  hi: {
    eyebrow: "AI सहायता और देखभाल की योजना",
    title: "स्वास्थ्य से जुड़े निर्णयों के लिए स्पष्ट शुरुआत।",
    lead: "त्वचा और बालों की तस्वीरों पर वैकल्पिक AI अवलोकन देखें, अस्पताल की पुष्टि करना जानें और भारत में नियोजित उपचार की तैयारी करें।",
    start: "AI स्वास्थ्य साथी देखें",
    verify: "अस्पताल की जाँच करें",
    safety: "केवल 18 वर्ष या उससे अधिक आयु के वयस्कों के लिए। तस्वीर के विश्लेषण में सहमति ज़रूरी है। यह निदान या चिकित्सीय सलाह नहीं देता। आपात स्थिति में स्थानीय चिकित्सा सहायता लें।",
    photoLabel: "01 / त्वचा और बाल",
    photoTitle: "एक तस्वीर, आपकी जानकारी और डॉक्टर से पूछने के सवाल।",
    photoBody: "कैमरे से तस्वीर लें या अपलोड करें। AI दिखाई देने वाली विशेषताओं और अगले सवालों में मदद करता है; यह बीमारी का निदान नहीं कर सकता।",
    step1: "त्वचा या बाल चुनें",
    step2: "तस्वीर और जानकारी दें",
    step3: "अवलोकन देखें",
    photoAction: "AI विश्लेषण खोलें",
    hospitalLabel: "02 / अस्पताल की पुष्टि",
    hospitalTitle: "निर्णय से पहले पुष्टि करें।",
    hospitalBody: "आधिकारिक मान्यता निर्देशिका देखें और अस्पताल तथा इलाज करने वाली टीम के बारे में सही सवाल पूछें। अभी वेबसाइट पर अस्पताल बुकिंग या सत्यापित खोज निर्देशिका नहीं है।",
    hospitalAction: "अस्पताल की पुष्टि",
    travelLabel: "03 / उपचार के लिए यात्रा",
    travelTitle: "सिर्फ़ उपचार नहीं, पूरी योजना बनाएँ।",
    travelBody: "फैसले से पहले खर्च, यात्रा, बाद की देखभाल और आधिकारिक दस्तावेज़ों पर विचार करें।",
    travelAction: "यात्रा की योजना देखें",
  },
};

/** Links into existing, independently maintained pages. No images or patient data are collected here. */
export default function HomeHealthShowcase({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <section className="band-soft" aria-labelledby="health-showcase-title" id="ai-health">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
          <div>
            <p className="ed-label">{c.eyebrow}</p>
            <h2 id="health-showcase-title" className="ed-display max-w-xl">{c.title}</h2>
            <p className="section-lede max-w-xl">{c.lead}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/health-check" className="btn-solid">
                {c.start}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/hospitals" className="btn-ghost">{c.verify}</Link>
            </div>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-(--muted)">
              <ShieldCheck aria-hidden="true" className="mr-2 inline h-4 w-4 align-[-3px]" />
              {c.safety}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/health-check"
              className="group rounded-3xl bg-(--navy) p-6 text-white shadow-lg shadow-slate-900/10 sm:col-span-2 sm:p-8 focus-visible:outline-offset-4"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-teal-100">
                  <Camera aria-hidden="true" className="h-5 w-5" />{c.photoLabel}
                </span>
                <ArrowRight aria-hidden="true" className="h-5 w-5 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
              </div>
              <h3 className="max-w-lg text-2xl font-semibold leading-tight text-white">{c.photoTitle}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">{c.photoBody}</p>
              <ol className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
                {[c.step1, c.step2, c.step3].map((step, i) => (
                  <li key={step} className="rounded-xl border border-white/15 bg-white/10 px-3 py-3">
                    <span className="mr-2 font-semibold text-teal-200">0{i + 1}</span>{step}
                  </li>
                ))}
              </ol>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-teal-300 underline-offset-4">
                {c.photoAction}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/hospitals" className="group rounded-2xl border border-(--line) bg-white p-6 shadow-sm focus-visible:outline-offset-4">
              <ClipboardCheck aria-hidden="true" className="mb-5 h-7 w-7 text-(--teal-ink)" />
              <p className="text-xs font-semibold uppercase tracking-wider text-(--teal-ink)">{c.hospitalLabel}</p>
              <h3 className="mt-3 text-xl font-semibold text-(--navy)">{c.hospitalTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--muted)">{c.hospitalBody}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-(--navy) underline underline-offset-4">
                {c.hospitalAction}<ArrowRight aria-hidden="true" className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
              </span>
            </Link>
            <Link href="/medical-tourism" className="group rounded-2xl border border-(--line) bg-white p-6 shadow-sm focus-visible:outline-offset-4">
              <Plane aria-hidden="true" className="mb-5 h-7 w-7 text-(--teal-ink)" />
              <p className="text-xs font-semibold uppercase tracking-wider text-(--teal-ink)">{c.travelLabel}</p>
              <h3 className="mt-3 text-xl font-semibold text-(--navy)">{c.travelTitle}</h3>
              <p className="mt-2 text-sm leading-relaxed text-(--muted)">{c.travelBody}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-(--navy) underline underline-offset-4">
                {c.travelAction}<ArrowRight aria-hidden="true" className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
