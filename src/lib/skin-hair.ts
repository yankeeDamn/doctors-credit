/**
 * Types and validation shared by the SkinHairAnalyzer component and POST /api/analyze-patient.
 * Nothing here touches the server or the browser, so both sides can import it.
 */

export interface SkinHairReport {
  observations: string;
  current_situation: string;
  suggestions: string[];
  disclaimer: string;
  limitations: string;
  questions: string[];
}

export interface AnalyzeRequestBody {
  /** A data:image/jpeg;base64,... URL produced by the in-browser canvas compressor. */
  image: string;
  consent: true;
  focus: "skin" | "hair";
  /** What the person is noticing, in their own words. May be empty. */
  description: string;
}

export type AnalyzeResponseBody = { report: SkinHairReport } | { error: string };

export const MAX_DESCRIPTION_CHARS = 1000;

/**
 * An 800px JPEG at quality 0.7 is normally 60 to 200 KB. This ceiling (about 750 KB of image)
 * leaves generous headroom while still refusing anything that skipped the compressor.
 */
export const MAX_IMAGE_DATA_URL_CHARS = 1_000_000;

export const JPEG_DATA_URL_PREFIX = "data:image/jpeg;base64,";

export const DEFAULT_DISCLAIMER =
  "This is an AI analysis, not a medical diagnosis. It cannot replace an examination. Please consult a doctor, especially if the area is painful, changing quickly, bleeding or spreading.";

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** True for a compressed JPEG data URL. JPEG files start FF D8 FF, which base64 encodes as "/9j/". */
export function isJpegDataUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > MAX_IMAGE_DATA_URL_CHARS) return false;
  if (!value.startsWith(JPEG_DATA_URL_PREFIX)) return false;
  const data = value.slice(JPEG_DATA_URL_PREFIX.length);
  return data.length > 100 && data.startsWith("/9j/") && BASE64.test(data);
}

export type ValidatedAnalyzeRequest =
  | { ok: true; image: string; description: string; focus: "skin" | "hair" }
  | { ok: false; error: string };

export function validateAnalyzeRequest(body: unknown): ValidatedAnalyzeRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Invalid request." };
  }
  const { image, description, consent, focus } = body as Record<string, unknown>;
  if (consent !== true) return { ok: false, error: "Please consent to AI processing before continuing." };
  if (focus !== "skin" && focus !== "hair") return { ok: false, error: "Choose skin or hair analysis." };
  if (!isJpegDataUrl(image)) {
    return { ok: false, error: "Please add a photo and try again." };
  }
  if (description !== undefined && typeof description !== "string") {
    return { ok: false, error: "Invalid request." };
  }
  const text = (description ?? "").trim();
  if (text.length > MAX_DESCRIPTION_CHARS) {
    return { ok: false, error: `Please keep the description under ${MAX_DESCRIPTION_CHARS} characters.` };
  }
  return { ok: true, image, description: text, focus };
}

function clean(value: unknown, max: number): string {
  if (typeof value === "string") return value.trim().slice(0, max);
  // Models occasionally return a list of sentences where one string was asked for.
  if (Array.isArray(value)) {
    return value
      .filter((part): part is string => typeof part === "string")
      .join(" ")
      .trim()
      .slice(0, max);
  }
  return "";
}

/**
 * Turns the model's JSON text into a report we can safely render, or null if it is unusable.
 * The disclaimer never depends on the model: always use the application-owned warning.
 */
export function parseReport(raw: string | null | undefined): SkinHairReport | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;

  const observations = clean(o.observations, 2000);
  if (!observations) return null;

  const tips = Array.isArray(o.suggestions) ? o.suggestions : typeof o.suggestions === "string" ? [o.suggestions] : [];
  const suggestions = tips
    .map((tip) => clean(tip, 400))
    .filter(Boolean)
    .slice(0, 8);

  return {
    observations,
    current_situation: clean(o.current_situation, 2000),
    suggestions,
    disclaimer: DEFAULT_DISCLAIMER,
    limitations: clean(o.limitations, 1000),
    questions: Array.isArray(o.questions) ? o.questions.map((q) => clean(q, 250)).filter(Boolean).slice(0, 4) : [],
  };
}

/** Client-side guard for what comes back over the wire. */
export function isSkinHairReport(value: unknown): value is SkinHairReport {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.observations === "string" &&
    typeof r.current_situation === "string" &&
    typeof r.disclaimer === "string" &&
    typeof r.limitations === "string" &&
    Array.isArray(r.questions) && r.questions.every((q) => typeof q === "string") &&
    Array.isArray(r.suggestions) &&
    r.suggestions.every((tip) => typeof tip === "string")
  );
}

/** A model judgment only: never proof that a photo is clinically sufficient. Fail closed. */
export function imageAssessment(raw: string | null | undefined): "usable" | "unusable" | "unknown" {
  try {
    const value: unknown = JSON.parse(raw || "");
    if (!value || typeof value !== "object" || Array.isArray(value)) return "unknown";
    const usable = (value as Record<string, unknown>).isValidImage;
    return usable === true ? "usable" : usable === false ? "unusable" : "unknown";
  } catch { return "unknown"; }
}
