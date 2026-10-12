/**
 * CareJourney India: procedure benchmarks and display currencies.
 *
 * Every number here is a representative planning estimate, not a quote.
 * `homeUsd` is a typical self-pay / private price in a high-cost market and
 * `indiaUsd` is a typical all-in hospital and surgeon package at an accredited
 * partner hospital. Final pricing needs a clinical record review.
 */

export type CurrencyCode = "USD" | "GBP" | "CAD" | "AUD" | "EUR";

export type CurrencyInfo = {
  code: CurrencyCode;
  /** Symbol shown in the UI. */
  symbol: string;
  name: string;
  /** Units of this currency per 1 USD. Indicative and fixed, not live. */
  rate: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US dollar", rate: 1 },
  GBP: { code: "GBP", symbol: "£", name: "British pound", rate: 0.79 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian dollar", rate: 1.35 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian dollar", rate: 1.53 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
};

export const CURRENCY_ORDER: CurrencyCode[] = ["USD", "GBP", "CAD", "AUD", "EUR"];

export const RATES_NOTE =
  "Currency conversion uses indicative fixed rates for illustration, not live market rates.";

export type Procedure = {
  id: string;
  name: string;
  /** Short label for compact UI. */
  short: string;
  /** Typical self-pay / private price at home, in USD. */
  homeUsd: number;
  /** Typical all-in hospital and doctor package in India, in USD. */
  indiaUsd: number;
  /** Typical wait for planned care in a high-wait system, in months. */
  homeWaitMonths: number;
  /** Planning assumption: days to schedule once records are cleared and the visa is issued. */
  indiaWaitDays: number;
  /** Stay in India (before and after the procedure) in days. */
  stay: { min: number; max: number; typical: number };
  /** Optional safety note shown beside the procedure. */
  clinicalNote?: string;
};

export const PROCEDURES: Procedure[] = [
  {
    id: "knee-replacement",
    name: "Total Knee Replacement",
    short: "Knee replacement",
    homeUsd: 35000,
    indiaUsd: 5800,
    homeWaitMonths: 6,
    indiaWaitDays: 3,
    stay: { min: 10, max: 21, typical: 12 },
  },
  {
    id: "hip-replacement",
    name: "Total Hip Replacement",
    short: "Hip replacement",
    homeUsd: 32000,
    indiaUsd: 6200,
    homeWaitMonths: 5,
    indiaWaitDays: 3,
    stay: { min: 10, max: 21, typical: 12 },
  },
  {
    id: "cabg",
    name: "Cardiac Bypass / CABG",
    short: "Cardiac bypass",
    homeUsd: 75000,
    indiaUsd: 7500,
    homeWaitMonths: 4,
    indiaWaitDays: 3,
    stay: { min: 12, max: 25, typical: 14 },
    clinicalNote:
      "Cardiac surgery is time-sensitive. Travel is only appropriate after your cardiologist confirms your condition is stable enough to fly.",
  },
  {
    id: "dental-implants",
    name: "Full-Mouth Dental Implants (All-on-4)",
    short: "Dental implants",
    homeUsd: 24000,
    indiaUsd: 4500,
    homeWaitMonths: 3,
    indiaWaitDays: 2,
    stay: { min: 5, max: 14, typical: 7 },
  },
  {
    id: "ivf",
    name: "IVF Cycle",
    short: "IVF cycle",
    homeUsd: 16000,
    indiaUsd: 3200,
    homeWaitMonths: 2,
    indiaWaitDays: 2,
    stay: { min: 10, max: 21, typical: 14 },
  },
  {
    id: "lasik",
    name: "Laser Eye Surgery / LASIK",
    short: "LASIK",
    homeUsd: 4500,
    indiaUsd: 1100,
    homeWaitMonths: 1,
    indiaWaitDays: 2,
    stay: { min: 2, max: 7, typical: 3 },
  },
];

/** Planning defaults for everything that is not procedure-specific. All USD. */
export const DEFAULTS = {
  /** Round-trip economy flight per traveler. */
  flightPerTraveler: 820,
  /** Serviced apartment or hotel per night (one room shared with a companion). */
  stayPerDay: 95,
  /** Medical visa support, airport concierge and local transport, whole trip. */
  visaConciergeTransport: 640,
  /** Pre-op tests, follow-up consults and physiotherapy not in the package. */
  aftercare: 390,
  contingencyPct: 10,
  /** Typical plan-math example for the insured scenario. */
  insured: { deductibleRemaining: 2500, coinsurancePct: 20, outOfPocketMax: 9000 },
} as const;

export function procedureById(id: string): Procedure {
  return PROCEDURES.find((p) => p.id === id) ?? PROCEDURES[0];
}
