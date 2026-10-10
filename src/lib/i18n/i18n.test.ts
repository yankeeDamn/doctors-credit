import assert from "node:assert/strict";
import test from "node:test";
import { COMMON } from "./common";
import { LANGUAGES, isLang } from "./config";
import { PAGES } from "./pages";
import {
  DEFAULT_CONTACT_E164,
  phoneDisplay,
  phoneHref,
  resolveWhatsappNumber,
  whatsappHref,
} from "../contact";

type Json = string | Json[] | { [key: string]: Json };

/** Same keys, same array lengths, strings where English has strings. */
function assertSameShape(a: Json, b: Json, path: string) {
  if (typeof a === "string") {
    assert.equal(typeof b, "string", `${path} should be a string`);
    return;
  }
  if (Array.isArray(a)) {
    assert.ok(Array.isArray(b), `${path} should be an array`);
    assert.equal((b as Json[]).length, a.length, `${path} length differs from English`);
    a.forEach((item, i) => assertSameShape(item, (b as Json[])[i], `${path}[${i}]`));
    return;
  }
  assert.ok(typeof b === "object" && !Array.isArray(b), `${path} should be an object`);
  assert.deepEqual(
    Object.keys(b as object).sort(),
    Object.keys(a).sort(),
    `${path} keys differ from English`
  );
  for (const key of Object.keys(a)) {
    assertSameShape(a[key], (b as Record<string, Json>)[key], `${path}.${key}`);
  }
}

function strings(value: Json, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  return Object.entries(value).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k));
}

test("every language has the same structure as English", () => {
  for (const { code } of LANGUAGES) {
    assertSameShape(COMMON.en as unknown as Json, COMMON[code] as unknown as Json, `COMMON.${code}`);
    assertSameShape(PAGES.en as unknown as Json, PAGES[code] as unknown as Json, `PAGES.${code}`);
  }
});

test("copy follows the content rules: no em dashes, no empty strings", () => {
  const optionalEmpty = new Set(["home.heroAfter"]);
  for (const { code } of LANGUAGES) {
    const all = [
      ...strings(COMMON[code] as unknown as Json, `COMMON.${code}`),
      ...strings(PAGES[code] as unknown as Json, `PAGES.${code}`),
    ];
    for (const [path, text] of all) {
      assert.ok(!text.includes("—"), `${path} contains an em dash`);
      const key = path.replace(/^PAGES\.[a-z]+\./, "");
      if (!optionalEmpty.has(key)) assert.ok(text.trim().length > 0, `${path} is empty`);
    }
  }
});

test("isLang only accepts supported codes", () => {
  assert.ok(isLang("en") && isLang("es") && isLang("hi"));
  assert.ok(!isLang("fr") && !isLang("") && !isLang(undefined) && !isLang("EN"));
});

test("whatsappHref builds a wa.me link with the encoded greeting for each language", () => {
  for (const { code } of LANGUAGES) {
    const greeting = COMMON[code].whatsapp.greeting;
    const href = whatsappHref(greeting, "1234567890");
    assert.ok(href.startsWith("https://wa.me/1234567890?text="), href);
    assert.ok(!href.includes(" "), "URL must not contain raw spaces");
    const text = new URL(href).searchParams.get("text");
    assert.equal(text, greeting, `${code} greeting should round-trip`);
  }
  assert.equal(whatsappHref("hi", ""), "");
});

test("quick-contact number is +91 99864 18638 by default", () => {
  assert.equal(DEFAULT_CONTACT_E164, "919986418638");
  assert.equal(resolveWhatsappNumber(undefined), "919986418638");
  assert.equal(resolveWhatsappNumber(""), "919986418638");
  assert.equal(phoneDisplay("919986418638"), "+91 99864 18638");
  assert.equal(phoneHref("919986418638"), "tel:+919986418638");
  assert.ok(
    whatsappHref("hi", "919986418638").startsWith("https://wa.me/919986418638?text=")
  );
});

test("a configured number wins and is normalised to digits only", () => {
  assert.equal(resolveWhatsappNumber("+44 7700 900123"), "447700900123");
  assert.equal(resolveWhatsappNumber("+91 98765 43210"), "919876543210");
});

test("placeholders and junk fall back to the default number", () => {
  for (const bad of ["1234567890", "910000000000", "91xxxxxxxxxx", "12", "abc", "1".repeat(20)]) {
    assert.equal(resolveWhatsappNumber(bad), DEFAULT_CONTACT_E164, bad);
  }
});
