import type { CurrencyCode } from "./data";
import { RATES_NOTE } from "./data";
import { formatMoneyCode, formatWait, type Comparison, type HomeBreakdown, type IndiaBreakdown } from "./engine";

export const COMPARISON_DISCLAIMER =
  "Deductibles and out-of-pocket calculations are representative examples of standard private health plans. India figures are estimated journey totals, not formal medical quotes. Final pricing requires clinical record review.";

export type PdfInput = {
  procedureName: string;
  currency: CurrencyCode;
  homeMode: "self-pay" | "insured";
  home: HomeBreakdown;
  india: IndiaBreakdown;
  comparison: Comparison;
  homeWaitMonths: number;
  indiaWaitDays: number;
  stayDays: number;
  travelers: 1 | 2;
  /** Overrides the default clinical or planning notes. */
  notes?: string[];
};

export function pdfFileName(procedureName: string) {
  const slug = procedureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `carejourney-india-${slug || "comparison"}.pdf`;
}

/** Plain-text headline used in the PDF and in the lead summary. */
export function headline(input: PdfInput) {
  const { comparison, currency } = input;
  const amount = formatMoneyCode(Math.abs(comparison.difference), currency);
  const pct = Math.round(comparison.percent);
  if (comparison.direction === "india-lower") return `Estimated savings: ${amount} (${pct}% less than at home)`;
  if (comparison.direction === "home-lower") return `At these inputs, home costs ${amount} less (${pct}% less than India)`;
  return "At these inputs, the two totals are about the same";
}

/**
 * Builds and downloads an A4 PDF. jsPDF is loaded on click so it never weighs
 * on the first page load. Amounts use ISO codes (USD, GBP...) because the
 * built-in PDF fonts do not cover every currency symbol.
 */
export async function downloadComparisonPdf(input: PdfInput) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  const money = (usd: number) => formatMoneyCode(usd, input.currency);
  let y = 0;

  const ensure = (needed: number) => {
    if (y + needed > H - 60) {
      doc.addPage();
      y = M;
    }
  };

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("CareJourney India", M, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Cost comparison: at home vs. a complete India medical journey", M, 60);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), W - M, 40, { align: "right" });
  y = 118;

  // Procedure + headline
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(input.procedureName, M, y);
  y += 22;
  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  const lines = doc.splitTextToSize(headline(input), W - M * 2);
  doc.text(lines, M, y);
  y += lines.length * 15 + 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const { comparison } = input;
  doc.text(
    `Wait time: about ${input.indiaWaitDays} day${input.indiaWaitDays === 1 ? "" : "s"} to schedule in India vs. ${formatWait(input.homeWaitMonths)} at home` +
      (comparison.waitDaysSaved > 0 ? ` (about ${comparison.waitDaysSaved} days sooner).` : "."),
    M,
    y,
    { maxWidth: W - M * 2 }
  );
  y += 30;

  const section = (title: string) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title, M, y);
    y += 6;
    doc.setDrawColor(203, 213, 225);
    doc.line(M, y, W - M, y);
    y += 16;
  };

  const row = (label: string, value: string, opts: { bold?: boolean; muted?: boolean } = {}) => {
    ensure(18);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(opts.muted ? 100 : 30, opts.muted ? 116 : 41, opts.muted ? 139 : 59);
    doc.text(label, M, y);
    doc.text(value, W - M, y, { align: "right" });
    y += 16;
  };

  section("Summary");
  row("Estimated cost at home" + (input.homeMode === "self-pay" ? " (self-pay)" : " (private insurance)"), money(input.home.total), { bold: true });
  row("Estimated complete India journey", money(input.india.total), { bold: true });
  row(
    comparison.direction === "home-lower" ? "Difference (home is lower)" : "Difference (India is lower)",
    money(Math.abs(comparison.difference)),
    { bold: true }
  );
  y += 8;

  section("At home");
  row("Procedure price", money(input.home.retailPrice));
  if (input.homeMode === "insured") {
    row("Deductible you pay", money(input.home.deductiblePart));
    row("Co-insurance you pay", money(input.home.coinsurancePart));
    if (input.home.capApplied) row("Limited by your out-of-pocket maximum", money(input.home.total), { muted: true });
  }
  row("Estimated out-of-pocket", money(input.home.total), { bold: true });
  y += 8;

  section("Complete India care journey");
  for (const line of input.india.lines) row(line.label, money(line.amount));
  row("Medical contingency buffer", money(input.india.contingency), { muted: true });
  row("Estimated journey total", money(input.india.total), { bold: true });
  y += 8;

  section("Assumptions");
  const assumptions = [
    `Stay in India: ${input.stayDays} days, ${input.travelers === 2 ? "patient and one companion" : "patient only"}.`,
    "India hospital packages are indicative partner-rate estimates.",
    RATES_NOTE,
    ...(input.notes ?? []),
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  for (const a of assumptions) {
    const wrapped = doc.splitTextToSize(`- ${a}`, W - M * 2);
    ensure(wrapped.length * 13 + 2);
    doc.text(wrapped, M, y);
    y += wrapped.length * 13 + 2;
  }
  y += 10;

  // Disclaimer box
  const disc = doc.splitTextToSize(COMPARISON_DISCLAIMER + " This document is not medical advice.", W - M * 2 - 20);
  const boxH = disc.length * 12 + 20;
  ensure(boxH + 10);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(M, y, W - M * 2, boxH, 6, 6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(disc, M + 10, y + 16);

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CareJourney India | dcredit.in | care@dcredit.in | +91 99864 18638", M, H - 28);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 28, { align: "right" });
  }

  doc.save(pdfFileName(input.procedureName));
}
