"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Camera, Check, ImagePlus, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { MAX_DESCRIPTION_CHARS, isSkinHairReport, type SkinHairReport } from "@/lib/skin-hair";

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.7;
/** Phone cameras produce 3 to 12 MB photos. Anything far past that is not a photo we want to decode. */
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 65_000;

type Stage = "idle" | "compressing" | "analyzing";

interface Photo {
  dataUrl: string;
  width: number;
  height: number;
  kb: number;
}

interface Analysis {
  report: SkinHairReport;
  /** The compressed photo that was actually analyzed, kept so it always matches the report. */
  image: string;
}

const STAGE_LABEL: Record<Exclude<Stage, "idle">, string> = {
  compressing: "Compressing image...",
  analyzing: "Analyzing with AI...",
};

const READ_ERROR = "We could not read that photo. Try taking it again, or choose a JPEG or PNG.";
const GENERIC_ERROR = "Something went wrong while analyzing. Please try again.";

/** Decodes the file, applying the camera's rotation, without holding on to more memory than needed. */
async function decodeImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Fall through to an <img> element, which handles a few formats createImageBitmap does not.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("decode");
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

/**
 * Scales the photo down so its longest side is at most 800px and re-encodes it as a JPEG at 0.7
 * quality using a canvas. Phone photos are several megabytes, which would blow past the 4.5MB
 * request limit on Vercel and cost far more AI tokens; the result is typically 60 to 200 KB.
 */
async function compressImage(file: File): Promise<Photo> {
  const decoded = await decodeImage(file);
  try {
    const { source, width, height } = decoded;
    if (!width || !height) throw new Error("empty");
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    // JPEG has no transparency; a PNG with transparent areas would otherwise turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    canvas.width = 0; // release the pixel buffer right away (matters on iOS Safari)
    canvas.height = 0;
    if (!dataUrl.startsWith("data:image/jpeg")) throw new Error("encode");

    const base64Length = dataUrl.length - dataUrl.indexOf(",") - 1;
    return { dataUrl, width: w, height: h, kb: Math.max(1, Math.round((base64Length * 0.75) / 1024)) };
  } finally {
    decoded.release();
  }
}

function messageFrom(data: unknown): string | null {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  return null;
}

function statusMessage(status: number): string {
  if (status === 413) return "That photo is too large. Please try another one.";
  if (status === 429) return "Too many analyses in a row. Please wait a few minutes and try again.";
  return GENERIC_ERROR;
}

export default function SkinHairAnalyzer() {
  const reduce = !!useReducedMotion();
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const photoJob = useRef(0);

  const [consent, setConsent] = useState(false);
  const [focus, setFocus] = useState<"skin" | "hair">("skin");
  const [stage, setStage] = useState<Stage>("idle");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const busy = stage !== "idle";

  // Cancel an in-flight request if the person leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Bring the finished report into view and let screen readers land on it.
  useEffect(() => {
    if (!analysis || !reportRef.current) return;
    reportRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    reportRef.current.focus({ preventScroll: true });
  }, [analysis, reduce]);

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same photo be chosen again
    if (!file) return;

    const job = ++photoJob.current;
    setError(null);
    setAnalysis(null);
    setPhoto(null);

    if (file.size > MAX_SOURCE_BYTES) {
      setError("That file is too large. Please choose a regular photo.");
      return;
    }
    if (file.type && !file.type.startsWith("image/")) {
      setError("Please choose a photo (an image file).");
      return;
    }

    setStage("compressing");
    try {
      const next = await compressImage(file);
      if (job !== photoJob.current) return; // a newer photo replaced this one
      setPhoto(next);
    } catch {
      if (job !== photoJob.current) return;
      setError(READ_ERROR);
    } finally {
      if (job === photoJob.current) setStage("idle");
    }
  }

  async function analyze(event: FormEvent) {
    event.preventDefault();
    if (!photo || busy || !consent) return;

    setError(null);
    setAnalysis(null);
    setStage("analyzing");

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch("/api/analyze-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo.dataUrl, description: description.trim(), consent, focus }),
        signal: controller.signal,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(messageFrom(data) ?? statusMessage(res.status));
        return;
      }
      const report = data && typeof data === "object" ? (data as { report?: unknown }).report : null;
      if (!isSkinHairReport(report)) {
        setError(GENERIC_ERROR);
        return;
      }
      setAnalysis({ report, image: photo.dataUrl });
    } catch {
      setError(
        controller.signal.aborted
          ? "The analysis took too long. Please try again."
          : "We could not reach the analyzer. Check your connection and try again."
      );
    } finally {
      window.clearTimeout(timer);
      setStage("idle");
    }
  }

  function startOver() {
    photoJob.current++;
    abortRef.current?.abort();
    setPhoto(null);
    setDescription("");
    setConsent(false);
    setAnalysis(null);
    setError(null);
    setStage("idle");
    rootRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const button =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";
  const primary = `${button} px-4 py-2.5 text-sm bg-(--navy) text-white hover:bg-(--navy-mid)`;
  const secondary = `${button} px-4 py-2.5 text-sm border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50`;
  const small = `${button} px-3 py-1.5 text-xs border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50`;

  return (
    <div id="skin-hair-analyzer" ref={rootRef} className="mx-auto w-full max-w-4xl scroll-mt-24 text-slate-900">
      <div className="overflow-hidden rounded-3xl border border-(--line) bg-white shadow-sm">
        <div className="border-b border-(--line) bg-(--paper-2)/60 px-5 py-6 sm:px-8">
          <h2 className="m-0! max-w-none! text-2xl! sm:text-3xl!">Skin and hair analyzer</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Take a photo of the area, tell us what you are noticing, and get an AI-written look at what is visible. It is
            guidance to take to a doctor, not a diagnosis.
          </p>
        </div>

        <div className="px-5 pt-5 sm:px-8">
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">For adults, for non-emergency concerns only. A photo cannot check your overall health. If you feel seriously unwell, seek urgent medical care instead of waiting for AI.</p>
        </div>
        <form onSubmit={analyze} className="grid gap-6 p-5 sm:p-8 md:grid-cols-2 md:gap-8">
          {/* Photo */}
          <div>
            <p className="text-sm font-medium text-slate-800">Photo</p>

            {/* capture="environment" opens the rear camera on phones; desktops just show a file picker. */}
            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPick}
              className="hidden"
            />
            {/* A phone camera input has no gallery option on some devices, so offer a plain upload too. */}
            <input
              ref={uploadInput}
              type="file"
              accept="image/*"
              onChange={onPick}
              className="hidden"
            />

            <div className="mt-1.5">
              {photo ? (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.dataUrl} alt="The photo you added" className="h-full w-full object-contain" />
                    {stage === "analyzing" && !reduce ? (
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-(--teal)/35 to-transparent"
                        initial={{ y: "-100%" }}
                        animate={{ y: "400%" }}
                        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                      />
                    ) : null}
                    {stage === "compressing" ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-800">
                        <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
                        {STAGE_LABEL.compressing}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="text-xs text-slate-600">
                      Resized to {photo.width} by {photo.height} px, {photo.kb} KB
                    </p>
                    <div className="flex gap-2">
                      <button type="button" disabled={busy} onClick={() => cameraInput.current?.click()} className={small}>
                        <Camera aria-hidden="true" className="h-3.5 w-3.5" />
                        Retake
                      </button>
                      <button type="button" disabled={busy} onClick={() => uploadInput.current?.click()} className={small}>
                        <ImagePlus aria-hidden="true" className="h-3.5 w-3.5" />
                        Choose another
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  {stage === "compressing" ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      {STAGE_LABEL.compressing}
                    </p>
                  ) : (
                    <>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-(--navy) shadow-sm ring-1 ring-slate-200">
                        <Camera aria-hidden="true" className="h-6 w-6" />
                      </span>
                      <p className="max-w-xs text-sm text-slate-700">Add a clear photo of the skin or scalp area you are asking about.</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <button type="button" onClick={() => cameraInput.current?.click()} className={primary}>
                          <Camera aria-hidden="true" className="h-4 w-4" />
                          Take photo
                        </button>
                        <button type="button" onClick={() => uploadInput.current?.click()} className={secondary}>
                          <ImagePlus aria-hidden="true" className="h-4 w-4" />
                          Upload
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">Natural light, in focus, close enough to see the area, no filters.</p>
          </div>

          {/* Description and submit */}
          <div className="flex flex-col">
            <label htmlFor="skin-hair-description" className="text-sm font-medium text-slate-800">
              What are you noticing?
            </label>
            <textarea
              id="skin-hair-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={MAX_DESCRIPTION_CHARS}
              rows={7}
              placeholder="For example: itchy red patches on my cheeks for two weeks, worse after shaving. Or: more hair on my brush than usual, mostly near the crown."
              className="mt-1.5 w-full flex-1 resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-(--teal) focus:ring-2 focus:ring-(--teal)/25 sm:text-sm"
            />
            <p className="mt-1.5 flex justify-between gap-3 text-xs text-slate-600">
              <span>Optional. How long, what makes it better or worse, and anything you have tried all help.</span>
              <span className="shrink-0 tabular-nums">
                {description.length}/{MAX_DESCRIPTION_CHARS}
              </span>
            </p>

            <label className="mt-4 block text-sm font-medium">Analysis focus
              <select value={focus} disabled={busy} onChange={(e) => { setFocus(e.target.value as "skin" | "hair"); setAnalysis(null); }} className="mt-2 block w-full rounded-xl border border-slate-300 p-3">
                <option value="skin">Skin</option><option value="hair">Hair and scalp</option>
              </select>
            </label>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input type="checkbox" required checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>I am 18 or older and agree to send this photo and description to Microsoft Azure AI for non-diagnostic observations. I have permission to share this photo. <a href="/privacy" className="underline">Privacy details</a></span>
            </label>
            <button type="submit" disabled={!photo || busy || !consent} className={`${button} mt-4 px-4 py-3 text-base bg-(--navy) text-white hover:bg-(--navy-mid)`}>
              {stage === "analyzing" ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  {STAGE_LABEL.analyzing}
                </>
              ) : (
                "Analyze with AI"
              )}
            </button>

            <p className="sr-only" role="status" aria-live="polite">
              {stage === "idle" ? (analysis ? "Your report is ready." : "") : STAGE_LABEL[stage]}
            </p>

            {error ? (
              <div role="alert" className="mt-3 flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              Your photo is resized on your device, then sent to an AI service to write the report. This application does not intentionally store photos or reports. Provider processing and retention policies apply. Avoid faces, names and identifying details.
              Do not use this for an emergency. Call your local emergency number instead.
            </p>
          </div>
        </form>
      </div>

      {stage === "analyzing" ? (
        <div aria-hidden="true" className="mt-6 space-y-3 rounded-3xl border border-(--line) bg-white p-6 shadow-sm sm:p-8">
          <div className="h-4 w-1/3 rounded bg-slate-200 motion-safe:animate-pulse" />
          <div className="h-3 w-full rounded bg-slate-100 motion-safe:animate-pulse" />
          <div className="h-3 w-11/12 rounded bg-slate-100 motion-safe:animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-slate-100 motion-safe:animate-pulse" />
        </div>
      ) : null}

      {analysis ? <ReportCard analysis={analysis} reduce={reduce} reportRef={reportRef} onReset={startOver} /> : null}
    </div>
  );
}

function ReportCard({
  analysis,
  reduce,
  reportRef,
  onReset,
}: {
  analysis: Analysis;
  reduce: boolean;
  reportRef: RefObject<HTMLElement | null>;
  onReset: () => void;
}) {
  const { report, image } = analysis;
  return (
    <motion.article
      ref={reportRef}
      tabIndex={-1}
      aria-labelledby="skin-hair-report-title"
      className="mt-6 scroll-mt-24 overflow-hidden rounded-3xl border border-(--line) bg-white shadow-sm outline-none"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--line) bg-(--paper-2)/60 px-5 py-4 sm:px-8">
        <h3 id="skin-hair-report-title" className="text-lg font-semibold text-(--navy)">
          Your report
        </h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">AI-generated, not a diagnosis</span>
      </div>

      <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[14rem_1fr] md:gap-8">
        <figure className="m-0 self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="The photo that was analyzed" className="aspect-square w-full rounded-2xl bg-slate-100 object-cover ring-1 ring-slate-200 md:w-56" />
          <figcaption className="mt-2 text-xs text-slate-600">The photo that was analyzed</figcaption>
        </figure>

        <div className="min-w-0 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">What the photo shows</h4>
            <p className="mt-1.5 text-base leading-relaxed text-slate-800">{report.observations}</p>
          </div>

          {report.current_situation ? (
            <div className="rounded-2xl bg-sky-50 px-4 py-3.5 ring-1 ring-sky-100">
              <h4 className="text-sm font-semibold text-sky-950">Points to discuss with a clinician</h4>
              <p className="mt-1.5 text-base leading-relaxed text-slate-800">{report.current_situation}</p>
            </div>
          ) : null}

          {report.suggestions.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold text-slate-900">What you can try</h4>
              <ul className="mt-2 space-y-2.5">
                {report.suggestions.map((tip, index) => (
                  <motion.li
                    key={`${index}-${tip}`}
                    className="flex gap-3 text-base leading-relaxed text-slate-800"
                    initial={reduce ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : 0.25 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span aria-hidden="true" className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{tip}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          ) : null}

          {report.limitations ? <section className="rounded-2xl bg-slate-50 p-4"><h4 className="font-semibold">What this photo cannot tell us</h4><p className="mt-2">{report.limitations}</p></section> : null}
          {report.questions.length ? <section className="rounded-2xl bg-teal-50 p-4"><h4 className="font-semibold">Questions for your dermatologist</h4><ul className="mt-2 list-disc space-y-2 pl-5">{report.questions.map((question, index) => <li key={index}>{question}</li>)}</ul></section> : null}
          <p className="text-sm text-slate-600">For treatment prices and payment options, request a written quote from a qualified provider. This tool does not verify prices or eligibility.</p>
          <div role="note" className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-amber-950">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-sm font-medium leading-relaxed">{report.disclaimer}</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Analyze another photo
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
