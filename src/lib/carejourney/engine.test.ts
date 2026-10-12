import assert from "node:assert/strict";
import test from "node:test";
import { CURRENCIES, CURRENCY_ORDER, DEFAULTS, PROCEDURES } from "./data";
import {
  compare,
  formatMoney,
  formatMoneyCode,
  formatWait,
  fromCurrency,
  homeOutOfPocket,
  indiaJourney,
  sanitize,
  toCurrency,
} from "./engine";

const insured = { mode: "insured" as const, deductibleRemaining: 2500, coinsurancePct: 20, outOfPocketMax: 9000 };

test("sanitize turns junk into a safe number", () => {
  assert.equal(sanitize(NaN), 0);
  assert.equal(sanitize(Infinity), 0);
  assert.equal(sanitize("abc"), 0);
  assert.equal(sanitize(-50), 0);
  assert.equal(sanitize("1200"), 1200);
  assert.equal(sanitize(250, 0, 100), 100);
});

test("self-pay at home is the full price", () => {
  const r = homeOutOfPocket({ ...insured, mode: "self-pay", retailPrice: 35000 });
  assert.equal(r.total, 35000);
  assert.equal(r.capApplied, false);
});

test("insured: deductible + co-insurance, limited by the out-of-pocket maximum", () => {
  // 2,500 + 20% of 32,500 = 9,000 -> exactly the cap
  const a = homeOutOfPocket({ ...insured, retailPrice: 35000 });
  assert.equal(a.beforeCap, 9000);
  assert.equal(a.total, 9000);
  // Higher cap, higher co-insurance: 7,500 + 30% of 27,500 = 15,750
  const b = homeOutOfPocket({ mode: "insured", retailPrice: 35000, deductibleRemaining: 7500, coinsurancePct: 30, outOfPocketMax: 18000 });
  assert.equal(b.total, 15750);
  assert.equal(b.capApplied, false);
  // Cap bites
  const c = homeOutOfPocket({ mode: "insured", retailPrice: 35000, deductibleRemaining: 7500, coinsurancePct: 30, outOfPocketMax: 10000 });
  assert.equal(c.total, 10000);
  assert.equal(c.capApplied, true);
});

test("insured: you never pay more than the bill (old calculator bug)", () => {
  // Deductible bigger than the bill used to push the result above the bill.
  const r = homeOutOfPocket({ mode: "insured", retailPrice: 2000, deductibleRemaining: 4000, coinsurancePct: 20, outOfPocketMax: 8500 });
  assert.equal(r.total, 2000);
  assert.equal(r.coinsurancePart, 0);
});

test("insured: bad inputs are clamped", () => {
  const over = homeOutOfPocket({ mode: "insured", retailPrice: 10000, deductibleRemaining: 0, coinsurancePct: 250, outOfPocketMax: 99999 });
  assert.equal(over.total, 10000); // 250% clamps to 100%
  const neg = homeOutOfPocket({ mode: "insured", retailPrice: -5, deductibleRemaining: -1, coinsurancePct: -10, outOfPocketMax: -3 });
  assert.equal(neg.total, 0);
  const nan = homeOutOfPocket({ mode: "insured", retailPrice: NaN, deductibleRemaining: NaN, coinsurancePct: NaN, outOfPocketMax: NaN });
  assert.equal(nan.total, 0);
});

test("India journey adds every line and a 10% contingency", () => {
  const j = indiaJourney({
    hospitalPackage: 5800,
    travelers: 2,
    flightPerTraveler: DEFAULTS.flightPerTraveler,
    stayDays: 12,
    stayPerDay: DEFAULTS.stayPerDay,
    visaConciergeTransport: DEFAULTS.visaConciergeTransport,
    aftercare: DEFAULTS.aftercare,
    contingencyPct: 10,
  });
  // 5,800 + 1,640 + 1,140 + 640 + 390
  assert.equal(j.subtotal, 9610);
  assert.equal(j.contingency, 961);
  assert.equal(j.total, 10571);
  assert.equal(j.lines.length, 5);
});

test("companion toggle changes flights only", () => {
  const base = {
    hospitalPackage: 1000, flightPerTraveler: 800, stayDays: 5, stayPerDay: 100,
    visaConciergeTransport: 0, aftercare: 0, contingencyPct: 0,
  };
  const one = indiaJourney({ ...base, travelers: 1 });
  const two = indiaJourney({ ...base, travelers: 2 });
  assert.equal(two.total - one.total, 800);
});

test("compare: direction, percent, and no NaN when home cost is zero", () => {
  const cheaper = compare(35000, 10571, 6, 3);
  assert.equal(cheaper.direction, "india-lower");
  assert.equal(Math.round(cheaper.percent), 70);
  assert.equal(cheaper.homeWaitDays, 183);
  assert.equal(cheaper.waitDaysSaved, 180);

  const dearer = compare(9000, 10571, 6, 3);
  assert.equal(dearer.direction, "home-lower");
  assert.ok(dearer.difference < 0);

  const zero = compare(0, 5000, 0, 3);
  assert.equal(zero.percent, 0);
  assert.ok(Number.isFinite(zero.percent));
  assert.equal(zero.waitDaysSaved, 0);

  assert.equal(compare(1000, 1000, 1, 1).direction, "even");
});

test("currency conversion round-trips and formats with the right symbol", () => {
  for (const code of CURRENCY_ORDER) {
    assert.ok(Math.abs(fromCurrency(toCurrency(1234, code), code) - 1234) < 1e-9);
  }
  assert.equal(formatMoney(35000, "USD"), "$35,000");
  assert.equal(formatMoney(35000, "GBP"), `£${Math.round(35000 * CURRENCIES.GBP.rate).toLocaleString("en-US")}`);
  assert.ok(formatMoney(1000, "CAD").startsWith("C$"));
  assert.ok(formatMoney(1000, "AUD").startsWith("A$"));
  assert.ok(formatMoney(1000, "EUR").startsWith("€"));
  assert.equal(formatMoney(-1200, "USD"), "-$1,200");
  assert.equal(formatMoneyCode(1000, "USD"), "USD 1,000");
});

test("formatWait", () => {
  assert.equal(formatWait(0), "no wait");
  assert.equal(formatWait(1), "1 month");
  assert.equal(formatWait(6), "6 months");
});

test("procedure data is complete and consistent", () => {
  assert.equal(PROCEDURES.length, 6);
  assert.equal(new Set(PROCEDURES.map((p) => p.id)).size, PROCEDURES.length);
  for (const p of PROCEDURES) {
    assert.ok(p.homeUsd > p.indiaUsd, `${p.id}: home price should exceed the India package`);
    assert.ok(p.stay.min <= p.stay.typical && p.stay.typical <= p.stay.max, `${p.id}: stay range`);
    assert.ok(p.homeWaitMonths > 0 && p.indiaWaitDays > 0);
  }
  const knee = PROCEDURES[0];
  assert.deepEqual([knee.homeUsd, knee.indiaUsd], [35000, 5800]);
});
