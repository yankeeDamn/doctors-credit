import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_DISCLAIMER,
  JPEG_DATA_URL_PREFIX,
  MAX_DESCRIPTION_CHARS,
  MAX_IMAGE_DATA_URL_CHARS,
  isJpegDataUrl,
  isSkinHairReport,
  parseReport,
  validateAnalyzeRequest,
} from "./skin-hair";

// "/9j/" is how base64 spells a JPEG's FF D8 FF header.
const jpeg = (body = "A".repeat(200)) => `${JPEG_DATA_URL_PREFIX}/9j/${body}`;

test("isJpegDataUrl accepts a compressed JPEG data URL", () => {
  assert.equal(isJpegDataUrl(jpeg()), true);
  assert.equal(isJpegDataUrl(jpeg("AbC+/9".repeat(30) + "==")), true);
});

test("isJpegDataUrl rejects everything else", () => {
  assert.equal(isJpegDataUrl(undefined), false);
  assert.equal(isJpegDataUrl(42), false);
  assert.equal(isJpegDataUrl(""), false);
  assert.equal(isJpegDataUrl(`data:image/png;base64,/9j/${"A".repeat(200)}`), false, "wrong media type");
  assert.equal(isJpegDataUrl(`${JPEG_DATA_URL_PREFIX}iVBORw0KGgo${"A".repeat(200)}`), false, "PNG bytes labelled as JPEG");
  assert.equal(isJpegDataUrl(`${JPEG_DATA_URL_PREFIX}/9j/${"A".repeat(10)}`), false, "too short to be a photo");
  assert.equal(isJpegDataUrl(`${jpeg()}<script>`), false, "non-base64 characters");
  assert.equal(isJpegDataUrl("https://example.com/photo.jpg"), false, "a remote URL must never be passed to the model");
  assert.equal(isJpegDataUrl(jpeg("A".repeat(MAX_IMAGE_DATA_URL_CHARS))), false, "over the size ceiling");
});

test("validateAnalyzeRequest trims the description and allows it to be empty", () => {
  const ok = validateAnalyzeRequest({ consent: true, focus: "skin", image: jpeg(), description: "  itchy scalp  " });
  assert.deepEqual(ok, { ok: true, image: jpeg(), description: "itchy scalp", focus: "skin" });

  const empty = validateAnalyzeRequest({ consent: true, focus: "skin", image: jpeg() });
  assert.equal(empty.ok && empty.description, "");
});

test("validateAnalyzeRequest rejects bad bodies", () => {
  for (const body of [null, undefined, "text", 7, [], {}, { description: "no photo" }]) {
    assert.equal(validateAnalyzeRequest(body).ok, false);
  }
  assert.equal(validateAnalyzeRequest({ consent: true, focus: "skin", image: jpeg(), description: 5 }).ok, false);
  assert.equal(validateAnalyzeRequest({ consent: true, focus: "skin", image: jpeg(), description: "x".repeat(MAX_DESCRIPTION_CHARS + 1) }).ok, false);
  assert.equal(validateAnalyzeRequest({ consent: true, focus: "skin", image: jpeg(), description: "x".repeat(MAX_DESCRIPTION_CHARS) }).ok, true);
});

test("parseReport reads the structure the system prompt asks for", () => {
  const report = parseReport(
    JSON.stringify({
      observations: " Mild redness across both cheeks. ",
      current_situation: "Consistent with irritation after shaving.",
      suggestions: ["Use a fragrance-free moisturiser", "Shave with the grain", ""],
      disclaimer: "AI analysis only. See a doctor.",
    })
  );
  assert.deepEqual(report, {
    observations: "Mild redness across both cheeks.",
    current_situation: "Consistent with irritation after shaving.",
    suggestions: ["Use a fragrance-free moisturiser", "Shave with the grain"],
    disclaimer: DEFAULT_DISCLAIMER,
  });
});

test("parseReport always supplies a disclaimer", () => {
  const report = parseReport(JSON.stringify({ observations: "Thinning at the crown.", suggestions: ["Gentle shampoo"] }));
  assert.equal(report?.disclaimer, DEFAULT_DISCLAIMER);
  assert.match(DEFAULT_DISCLAIMER, /not a medical diagnosis/i);
  assert.match(DEFAULT_DISCLAIMER, /doctor/i);
});

test("parseReport copes with the model drifting from the exact shape", () => {
  const drift = parseReport(
    JSON.stringify({
      observations: ["Redness.", "Flaking at the hairline."],
      current_situation: 12,
      suggestions: "Use a gentle cleanser",
    })
  );
  assert.equal(drift?.observations, "Redness. Flaking at the hairline.");
  assert.equal(drift?.current_situation, "");
  assert.deepEqual(drift?.suggestions, ["Use a gentle cleanser"]);

  const many = parseReport(JSON.stringify({ observations: "x", suggestions: Array.from({ length: 20 }, (_, i) => `tip ${i}`) }));
  assert.equal(many?.suggestions.length, 8);
});

test("parseReport returns null for unusable output", () => {
  for (const raw of [null, undefined, "", "not json", "[]", "null", "12", "{}", JSON.stringify({ observations: "   " })]) {
    assert.equal(parseReport(raw), null, String(raw));
  }
});

test("isSkinHairReport guards the client against a bad response", () => {
  const good = { observations: "a", current_situation: "b", suggestions: ["c"], disclaimer: "d" };
  assert.equal(isSkinHairReport(good), true);
  assert.equal(isSkinHairReport({ ...good, suggestions: "c" }), false);
  assert.equal(isSkinHairReport({ ...good, suggestions: [1] }), false);
  assert.equal(isSkinHairReport({ ...good, disclaimer: undefined }), false);
  assert.equal(isSkinHairReport(null), false);
});

 test("consent and focus cannot be bypassed", () => {
  for (const consent of [undefined, false, "true", 1]) {
    assert.equal(validateAnalyzeRequest({ image: jpeg(), focus: "skin", consent }).ok, false);
  }
  assert.equal(validateAnalyzeRequest({ image: jpeg(), consent: true, focus: "diagnosis" }).ok, false);
  assert.equal(validateAnalyzeRequest({ image: jpeg(), consent: true, focus: "hair" }).ok, true);
});
test("model cannot replace the medical disclaimer", () => {
  assert.equal(parseReport(JSON.stringify({ observations: "Visible texture", disclaimer: "You are completely healthy" }))?.disclaimer, DEFAULT_DISCLAIMER);
});
