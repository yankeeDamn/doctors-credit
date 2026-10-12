import { NextRequest, NextResponse } from "next/server";
import { allowRequest, tooLarge } from "@/lib/rate-limit";
import { getRepository } from "@/lib/repo";
import { clientIp, verifyTurnstile } from "@/lib/turnstile";

const CURRENCIES = new Set(["USD", "GBP", "CAD", "AUD", "EUR"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(form: FormData, key: string, max: number) {
  return String(form.get(key) || "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  // Reports are never uploaded here, so the form is small. 16 KB is generous.
  if (tooLarge(req, 16_000)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  if (!allowRequest(req.headers, "carejourney_lead", 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Please wait a few minutes and try again." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = String(form.get("cf-turnstile-response") || form.get("turnstileToken") || "");
  if (!(await verifyTurnstile(token, clientIp(req.headers)))) {
    return NextResponse.json({ error: "Please complete the verification check." }, { status: 400 });
  }

  const name = text(form, "name", 80);
  const email = text(form, "email", 120).toLowerCase();
  const phone = text(form, "phone", 25);
  const procedure = text(form, "procedure", 120);
  const currencyRaw = text(form, "currency", 5).toUpperCase();
  const currency = CURRENCIES.has(currencyRaw) ? currencyRaw : "USD";
  const summary = text(form, "comparisonSummary", 1500);
  const reportNames = text(form, "reportNames", 300);
  const consent = form.get("consent");

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json({ error: "Please enter a phone number with your country code." }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: "Please agree to be contacted about your estimate." }, { status: 400 });
  }

  const message = [
    "CareJourney India estimate request",
    `procedure: ${procedure || "not selected"}`,
    `currency: ${currency}`,
    `phone: ${phone}`,
    `reports ready to share securely later: ${reportNames || "none listed"}`,
    `comparison: ${summary || "not provided"}`,
  ].join("\n");

  try {
    const repo = await getRepository();
    await repo.saveContact({ name, email, message });
    await repo.appendAudit("contact_submitted", "carejourney_lead");
  } catch {
    // Storage can be unavailable (for example a preview deploy without the database).
    return NextResponse.json(
      { error: "We could not save your request right now." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
