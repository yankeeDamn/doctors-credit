import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { DEFAULT_DISCLAIMER, JPEG_DATA_URL_PREFIX } from "@/lib/skin-hair";

const valid = { image: `${JPEG_DATA_URL_PREFIX}/9j/${"A".repeat(200)}`, description: "Dry scalp", consent: true, focus: "hair" };
function request(body: unknown) {
  return new NextRequest("https://example.com/api/analyze-patient", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
}

test("analyzer rejects unavailable config and invalid inputs; handles Azure responses without storing data", async (t) => {
  const names = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_KEY", "AZURE_DEPLOYMENT_NAME"] as const;
  const previous = names.map((name) => process.env[name]);
  t.after(() => names.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; }));
  names.forEach((name) => delete process.env[name]);
  assert.equal((await POST(request(valid))).status, 503);
  process.env.AZURE_OPENAI_ENDPOINT = "https://test.openai.azure.com";
  process.env.AZURE_OPENAI_KEY = "fake-test-key";
  process.env.AZURE_DEPLOYMENT_NAME = "test-vision";
  assert.equal((await POST(request({ ...valid, consent: false }))).status, 400);
  assert.equal((await POST(request({ ...valid, image: "https://example.com/photo.jpg" }))).status, 400);
  assert.equal((await POST(request({ ...valid, image: "x".repeat(1_020_001) }))).status, 413);

  let finishReason = "stop";
  let content = JSON.stringify({ observations: "Visible flaking", suggestions: ["Discuss persistent symptoms with a clinician"], disclaimer: "No medical problem" });
  const mocked = t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init?: RequestInit) => {
    assert.match(String(url), /test.openai.azure.com/);
    const payload = JSON.parse(String(init?.body));
    assert.equal(payload.model, "test-vision");
    assert.match(payload.messages[1].content[0].text, /focus: hair/);
    return new Response(JSON.stringify({ choices: [{ finish_reason: finishReason, message: { content } }] }), { headers: { "content-type": "application/json" } });
  });
  const success = await POST(request(valid));
  assert.equal(success.status, 200);
  assert.equal(success.headers.get("cache-control"), "no-store");
  assert.equal((await success.json()).report.disclaimer, DEFAULT_DISCLAIMER);
  finishReason = "length";
  assert.equal((await POST(request(valid))).status, 422);
  finishReason = "stop";
  content = "invalid json";
  assert.equal((await POST(request(valid))).status, 502);
  assert.equal(mocked.mock.callCount(), 3);
});
