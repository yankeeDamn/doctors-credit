import { CURRENCIES, type CurrencyCode } from "./data";

/** Coerce anything to a finite number inside [min, max]. NaN, Infinity and junk become `min`. */
export function sanitize(value: unknown, min = 0, max = 1_000_000_000): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export type HomeMode = "self-pay" | "insured";

export type HomeInputs = {
  mode: HomeMode;
  /** Retail / billed price of the procedure at home. */
  retailPrice: number;
  /** Deductible still left to meet this plan year (insured only). */
  deductibleRemaining: number;
  /** Share of the bill you pay after the deductible, 0 to 100 (insured only). */
  coinsurancePct: number;
  /** Plan's out-of-pocket maximum (insured only). */
  outOfPocketMax: number;
};

export type HomeBreakdown = {
  retailPrice: number;
  deductiblePart: number;
  coinsurancePart: number;
  /** Amount before the out-of-pocket maximum applies. */
  beforeCap: number;
  /** True when the out-of-pocket maximum reduced what you pay. */
  capApplied: boolean;
  total: number;
};

/**
 * What you may need to pay yourself at home.
 *
 * Self-pay: the full price. Insured: deductible (never more than the bill),
 * plus co-insurance on the rest, limited by the out-of-pocket maximum.
 * The result can never exceed the bill.
 */
export function homeOutOfPocket(input: HomeInputs): HomeBreakdown {
  const retailPrice = sanitize(input.retailPrice);
  if (input.mode === "self-pay") {
    return {
      retailPrice,
      deductiblePart: 0,
      coinsurancePart: 0,
      beforeCap: retailPrice,
      capApplied: false,
      total: retailPrice,
    };
  }
  const deductiblePart = Math.min(sanitize(input.deductibleRemaining), retailPrice);
  const coinsurancePart = (retailPrice - deductiblePart) * (sanitize(input.coinsurancePct, 0, 100) / 100);
  const beforeCap = deductiblePart + coinsurancePart;
  const cap = sanitize(input.outOfPocketMax);
  const total = Math.min(beforeCap, cap);
  return { retailPrice, deductiblePart, coinsurancePart, beforeCap, capApplied: cap < beforeCap, total };
}

export type IndiaInputs = {
  hospitalPackage: number;
  travelers: 1 | 2;
  flightPerTraveler: number;
  stayDays: number;
  stayPerDay: number;
  visaConciergeTransport: number;
  aftercare: number;
  /** Medical contingency buffer as a percent of the subtotal. */
  contingencyPct: number;
};

export type IndiaLine = { key: string; label: string; amount: number };

export type IndiaBreakdown = {
  lines: IndiaLine[];
  subtotal: number;
  contingency: number;
  total: number;
};

export function indiaJourney(input: IndiaInputs): IndiaBreakdown {
  const travelers = input.travelers === 1 ? 1 : 2;
  const lines: IndiaLine[] = [
    { key: "package", label: "Hospital & doctor package", amount: sanitize(input.hospitalPackage) },
    {
      key: "flights",
      label: travelers === 1 ? "Flights (patient)" : "Flights (patient + companion)",
      amount: sanitize(input.flightPerTraveler) * travelers,
    },
    {
      key: "stay",
      label: "Pre- and post-op stay",
      amount: sanitize(input.stayDays, 0, 365) * sanitize(input.stayPerDay),
    },
    { key: "logistics", label: "Medical visa, concierge & local transport", amount: sanitize(input.visaConciergeTransport) },
    { key: "aftercare", label: "Aftercare & follow-up", amount: sanitize(input.aftercare) },
  ];
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const contingency = subtotal * (sanitize(input.contingencyPct, 0, 100) / 100);
  return { lines, subtotal, contingency, total: subtotal + contingency };
}

export type Comparison = {
  /** Positive when India costs less. */
  difference: number;
  /** Absolute difference as a share of the at-home cost, 0 when home cost is 0. */
  percent: number;
  direction: "india-lower" | "home-lower" | "even";
  waitDaysSaved: number;
  homeWaitDays: number;
};

export function compare(
  homeTotal: number,
  indiaTotal: number,
  homeWaitMonths: number,
  indiaWaitDays: number
): Comparison {
  const difference = homeTotal - indiaTotal;
  const percent = homeTotal > 0 ? (Math.abs(difference) / homeTotal) * 100 : 0;
  const direction = Math.abs(difference) < 1 ? "even" : difference > 0 ? "india-lower" : "home-lower";
  const homeWaitDays = Math.round((sanitize(homeWaitMonths, 0, 60) * 365) / 12);
  const waitDaysSaved = Math.max(0, homeWaitDays - sanitize(indiaWaitDays, 0, 365));
  return { difference, percent, direction, waitDaysSaved, homeWaitDays };
}

/** USD to a display currency. */
export function toCurrency(usd: number, code: CurrencyCode): number {
  return usd * CURRENCIES[code].rate;
}

/** A value typed in a display currency back to USD. */
export function fromCurrency(value: number, code: CurrencyCode): number {
  return value / CURRENCIES[code].rate;
}

function group(n: number) {
  // Fixed locale so server and browser render identical text.
  return Math.round(Math.abs(n)).toLocaleString("en-US");
}

/** "$35,000", "£27,650", "C$47,250". `usd` is converted first. */
export function formatMoney(usd: number, code: CurrencyCode): string {
  const value = toCurrency(usd, code);
  const sign = Math.round(value) < 0 ? "-" : "";
  return `${sign}${CURRENCIES[code].symbol}${group(value)}`;
}

/** Same as formatMoney but with the ISO code, for PDFs whose fonts lack some symbols. */
export function formatMoneyCode(usd: number, code: CurrencyCode): string {
  const value = toCurrency(usd, code);
  const sign = Math.round(value) < 0 ? "-" : "";
  return `${sign}${code} ${group(value)}`;
}

export function formatWait(months: number): string {
  const m = Math.round(months);
  if (m <= 0) return "no wait";
  return `${m} month${m === 1 ? "" : "s"}`;
}
