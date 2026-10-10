import { NextRequest, NextResponse } from "next/server";
import { allowRequest, tooLarge } from "@/lib/rate-limit";
import { getRepository } from "@/lib/repo";

export async function POST(req: NextRequest) {
  if (tooLarge(req, 6_000_000)) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }
  if (!allowRequest(req.headers, "carejourney_lead", 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Please wait and try again." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(form.get("name") || "").trim().slice(0, 80);
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 120);
  const phone = String(form.get("phone") || "").trim().slice(0, 40);
  const procedure = String(form.get("procedure") || "").trim().slice(0, 120);
  const currency = String(form.get("currency") || "USD").trim().toUpperCase().slice(0, 5);
  const comparisonSummary = String(form.get("comparisonSummary") || "").trim().slice(0, 2000);
  const reportFile = form.get("reportFile");

  if (name.length < 2 || !email.includes("@") || phone.length < 5) {
    return NextResponse.json({ error: "Name, email and phone are required." }, { status: 400 });
  }

  const fileMeta =
    reportFile && typeof reportFile === "object" && "name" in reportFile
      ? `report-upload: ${(reportFile as File).name || "unnamed"} (${(reportFile as File).size || 0} bytes)`
      : "report-upload: none";

  const message = [
    "CareJourney lead submitted",
    `procedure: ${procedure || "not selected"}`,
    `currency: ${currency}`,
    `phone: ${phone}`,
    fileMeta,
    `summary: ${comparisonSummary || "not provided"}`,
  ].join("\n");

  const repo = await getRepository();
  await repo.saveContact({ name, email, message });
  await repo.appendAudit("contact_submitted", "carejourney_lead");

  return NextResponse.json({ ok: true });
}
