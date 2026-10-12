"use client";

import { FormEvent, useId, useState } from "react";
import { CheckCircle2, FileUp, Loader2, MessageCircle, ShieldAlert, X } from "lucide-react";
import TurnstileField from "@/components/TurnstileField";
import type { CurrencyCode } from "@/lib/carejourney/data";
import { SITE, whatsappEnabled, whatsappHref } from "@/lib/contact";

const MAX_FILES = 5;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const input =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 sm:text-sm";

export default function LeadForm({
  siteKey,
  procedureName,
  currency,
  summaryText,
}: {
  siteKey?: string;
  procedureName: string;
  currency: CurrencyCode;
  /** Plain-text version of the current comparison. */
  summaryText: string;
}) {
  const ids = useId();
  const fileId = `${ids}-files`;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  // The same estimate, ready to send over WhatsApp. Works even if the form backend is down.
  const waLink = whatsappEnabled()
    ? whatsappHref(
        `Hi, I used CareJourney India to compare ${procedureName}. ${summaryText} I would like an itemized journey estimate. I will not send medical records over WhatsApp.`
      )
    : "";

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((current) => [...current, ...Array.from(list)].slice(0, MAX_FILES));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("procedure", procedureName);
    data.set("currency", currency);
    data.set("comparisonSummary", summaryText);
    // Files stay on the device. Only their names are sent, so a coordinator knows what you have.
    data.set("reportNames", files.map((f) => f.name).join(", "));

    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/carejourney-lead", { method: "POST", body: data });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus("err");
        setMessage(body?.error || "We could not send your request just now.");
        return;
      }
      setStatus("ok");
      setMessage("Thank you. A care coordinator will reply by email or WhatsApp, usually within one business day.");
      form.reset();
      setFiles([]);
    } catch {
      setStatus("err");
      setMessage("We could not reach the server. Check your connection and try again.");
    }
  }

  if (status === "ok") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-emerald-600" />
        <h3 className="mt-3 text-xl font-semibold text-slate-900">Request received</h3>
        <p className="mt-2 text-sm text-slate-700">{message}</p>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f7b4f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c6a43]"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
            Message us on WhatsApp now
          </a>
        ) : null}
        <button type="button" onClick={() => setStatus("idle")} className="mt-4 block text-sm font-medium text-sky-700 underline-offset-2 hover:underline">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false} className="space-y-4" aria-describedby={`${ids}-privacy`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-name`} className="block text-sm font-medium text-slate-800">
            Name
          </label>
          <input id={`${ids}-name`} name="name" required minLength={2} maxLength={80} autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor={`${ids}-email`} className="block text-sm font-medium text-slate-800">
            Email
          </label>
          <input id={`${ids}-email`} name="email" type="email" required maxLength={120} autoComplete="email" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor={`${ids}-phone`} className="block text-sm font-medium text-slate-800">
          WhatsApp / Phone
        </label>
        <input
          id={`${ids}-phone`}
          name="phone"
          type="tel"
          required
          minLength={7}
          maxLength={25}
          autoComplete="tel"
          placeholder="+1 555 010 0199"
          className={input}
        />
        <p className="mt-1 text-xs text-slate-600">Include your country code.</p>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-800">
          Medical reports <span className="font-normal text-slate-600">(optional)</span>
        </span>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`relative mt-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
            dragging ? "border-sky-600 bg-sky-50" : "border-slate-300 bg-slate-50"
          }`}
        >
          <input
            id={fileId}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            className="peer sr-only"
          />
          <label
            htmlFor={fileId}
            className="inline-flex cursor-pointer flex-col items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-600"
          >
            <FileUp aria-hidden="true" className="h-6 w-6 text-sky-700" />
            <span>
              <span className="font-semibold text-sky-700 underline underline-offset-2">Browse</span> or drop reports here
            </span>
            <span className="text-xs text-slate-600">PDF, JPG, PNG, DOC. Up to {MAX_FILES} files.</span>
          </label>
        </div>
        {files.length > 0 ? (
          <ul className="mt-2 space-y-1.5" aria-label="Files you added">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-800">
                <span className="min-w-0 truncate">
                  {file.name} <span className="text-slate-600">({formatSize(file.size)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((current) => current.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded p-1 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">Remove {file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p id={`${ids}-privacy`} className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-slate-700">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span>
            Your files stay on your device. {SITE.short} does not collect medical records through this form. After we speak, your coordinator
            shares a secure way to send them. Only the file names are noted.
          </span>
        </p>
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 rounded border-slate-400 accent-sky-600" />
        <span>I agree to be contacted about this estimate by email, phone or WhatsApp.</span>
      </label>

      <TurnstileField siteKey={siteKey} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "sending" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
          {status === "sending" ? "Sending" : "Get my itemized estimate"}
        </button>
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-800"
          >
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
            Or send this on WhatsApp
          </a>
        ) : null}
      </div>

      {status === "err" ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {message} You can also use the WhatsApp button, or email{" "}
          <a className="font-medium underline" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}
