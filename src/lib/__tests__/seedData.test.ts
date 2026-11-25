import { describe, it, expect } from "vitest";
import { SEED_PROGRAMS, SEED_REPORTS, type SeedProgram } from "@/data/seedData";
import { formatPay, type PayInfo } from "@/lib/formatPay";
import { programOutcomes } from "@/lib/programOutcomes";

const NOW = new Date("2026-11-24T00:00:00Z");
const DEMO = new Date("2026-12-18T00:00:00Z");

// Database nulls become undefined for formatPay.
function toPayInfo(p: SeedProgram): PayInfo {
  return {
    type: p.payType,
    amountCents: p.payAmountCents ?? undefined,
    maxAmountCents: p.payMaxAmountCents ?? undefined,
    period: p.payPeriod ?? undefined,
    milestones: p.payMilestones ?? undefined,
    items: p.payItems,
    extras: p.payExtras,
    conditions: p.conditionsStatus,
  };
}

// X of Y for each program, or null when the evidence must be hidden (Y < 3).
const EXPECTED: { id: string; name: string; result: { job: number; known: number } | null }[] = [
  { id: "prog-cashout-crew", name: "CashOut Crew", result: { job: 2, known: 11 } },
  { id: "prog-gold-coast-solar", name: "Gold Coast Solar Fellowship", result: { job: 8, known: 10 } },
  { id: "prog-big-rig-academy", name: "Big Rig Academy", result: { job: 6, known: 7 } },
  { id: "prog-next-level-tech", name: "Next Level Tech Fellowship", result: null },
  { id: "prog-harbor-logistics", name: "Harbor Logistics Academy", result: { job: 5, known: 9 } },
  { id: "prog-studio-crew", name: "Studio Crew Pathway", result: { job: 3, known: 8 } },
  { id: "prog-ridgeline-fire", name: "Ridgeline Fire & Trail Crew", result: { job: 6, known: 8 } },
  { id: "prog-eastside-culinary", name: "Eastside Culinary Collective", result: { job: 0, known: 5 } },
  { id: "prog-chair-ready", name: "Chair Ready Barber Apprenticeship", result: { job: 4, known: 6 } },
  { id: "prog-chw-fellowship", name: "Community Health Worker Fellowship", result: { job: 5, known: 7 } },
];

describe("seed data: programs", () => {
  it("1. has exactly 10 unique, active sample programs", () => {
    expect(SEED_PROGRAMS).toHaveLength(10);
    expect(new Set(SEED_PROGRAMS.map((p) => p.id)).size).toBe(10);
    expect(new Set(SEED_PROGRAMS.map((p) => p.name)).size).toBe(10);
    expect(SEED_PROGRAMS.every((p) => p.isSample === true)).toBe(true);
    expect(SEED_PROGRAMS.every((p) => p.status === "active")).toBe(true);
  });

  it("1b. uses the agreed ids and names", () => {
    expect(SEED_PROGRAMS.map((p) => [p.id, p.name]).sort()).toEqual(
      EXPECTED.map((e) => [e.id, e.name]).sort(),
    );
  });
});

describe("seed data: reports", () => {
  it("2. has unique sample report ids that point at real programs", () => {
    const programIds = new Set(SEED_PROGRAMS.map((p) => p.id));
    expect(SEED_REPORTS.length).toBeGreaterThan(0); // guards against a vacuous pass on empty data
    expect(new Set(SEED_REPORTS.map((r) => r.id)).size).toBe(SEED_REPORTS.length);
    expect(SEED_REPORTS.every((r) => programIds.has(r.programId))).toBe(true);
    expect(SEED_REPORTS.every((r) => r.isSample === true)).toBe(true);
    expect(SEED_REPORTS.every((r) => r.reporterId === null)).toBe(true);
  });
});

describe("seed data: pay", () => {
  it("3. runs every program through formatPay; only Chair Ready Barber is Not specified", () => {
    const results = SEED_PROGRAMS.map((p) => ({ id: p.id, text: formatPay(toPayInfo(p)) }));
    expect(results).toHaveLength(10);
    expect(results.filter((r) => r.text === "Not specified").map((r) => r.id)).toEqual(["prog-chair-ready"]);
  });

  it("4. covers every pay shape", () => {
    const has = (fn: (p: SeedProgram) => boolean) => SEED_PROGRAMS.some(fn);
    expect(has((p) => p.payType === "hourly")).toBe(true);
    expect(has((p) => p.payType === "per_period" && p.payPeriod === "week")).toBe(true);
    expect(has((p) => p.payType === "per_period" && p.payPeriod === "two_weeks")).toBe(true);
    expect(has((p) => p.payType === "per_period" && p.payPeriod === "month")).toBe(true);
    expect(
      has((p) => p.payType === "total" && p.payMaxAmountCents !== null && p.payMaxAmountCents > (p.payAmountCents ?? 0)),
    ).toBe(true);
    expect(has((p) => p.payType === "milestone")).toBe(true);
    expect(has((p) => p.payType === "non_cash")).toBe(true);
    expect(has((p) => p.payType === "not_specified")).toBe(true);
  });
});

describe.each([
  ["now (2026-11-24)", NOW],
  ["demo date (2026-12-18)", DEMO],
])("seed data: outcomes at %s", (_label, when) => {
  it.each(EXPECTED)("5. $name", ({ id, result }) => {
    expect(SEED_PROGRAMS.some((p) => p.id === id)).toBe(true);
    const summary = programOutcomes(
      SEED_REPORTS.filter((r) => r.programId === id),
      when,
    );
    if (result === null) {
      expect(summary.hidden).toBe(true);
    } else {
      expect(summary.hidden).toBe(false);
      expect(summary.jobCount).toBe(result.job);
      expect(summary.knownCount).toBe(result.known);
    }
  });
});
