import { describe, expect, it } from "vitest";

import { expenseOccurrences } from "./financeMetrics";

function d(iso: string): Date {
  return new Date(iso);
}

function isoDays(dates: Date[]): string[] {
  return dates.map((date) => date.toISOString().slice(0, 10));
}

describe("expenseOccurrences", () => {
  it("recurring monthly aparece em cada mes do intervalo, respeitando o inicio", () => {
    const expense = {
      kind: "recurring",
      incurred_on: "2026-03-10",
      recurrence_start: "2026-03-10",
      recurrence_end: null,
      recurrence_interval: "monthly",
    };
    const occ = expenseOccurrences(expense, d("2026-01-01"), d("2026-06-30"));
    // Jan e Fev sao antes do inicio; Mar..Jun contam.
    expect(isoDays(occ)).toEqual([
      "2026-03-10",
      "2026-04-10",
      "2026-05-10",
      "2026-06-10",
    ]);
  });

  it("recurring monthly respeita recurrence_end", () => {
    const expense = {
      kind: "recurring",
      incurred_on: "2026-03-10",
      recurrence_start: "2026-03-10",
      recurrence_end: "2026-04-30",
      recurrence_interval: "monthly",
    };
    const occ = expenseOccurrences(expense, d("2026-01-01"), d("2026-12-31"));
    // Mar e Abr; Mai 10 ja passou do fim (30 Abr).
    expect(isoDays(occ)).toEqual(["2026-03-10", "2026-04-10"]);
  });

  it("recurring yearly aparece uma vez por ano no mes de aniversario", () => {
    const expense = {
      kind: "recurring",
      incurred_on: "2025-05-15",
      recurrence_start: "2025-05-15",
      recurrence_end: null,
      recurrence_interval: "yearly",
    };
    const occ = expenseOccurrences(expense, d("2026-01-01"), d("2026-12-31"));
    expect(isoDays(occ)).toEqual(["2026-05-15"]);
  });

  it("one_off aparece so quando incurred_on cai no intervalo", () => {
    const expense = {
      kind: "one_off",
      incurred_on: "2026-04-20",
      recurrence_start: null,
      recurrence_end: null,
      recurrence_interval: null,
    };
    expect(
      expenseOccurrences(expense, d("2026-04-01"), d("2026-04-30")).length,
    ).toBe(1);
    expect(
      expenseOccurrences(expense, d("2026-05-01"), d("2026-05-31")).length,
    ).toBe(0);
  });
});
