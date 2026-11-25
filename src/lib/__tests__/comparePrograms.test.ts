import { describe, it, expect } from "vitest";
import { SEED_PROGRAMS, SEED_REPORTS } from "@/data/seedData";
import { comparePrograms, type CompareInput } from "@/lib/comparePrograms";
import type { JobOutcome, OutcomeInput, Verification } from "@/lib/programOutcomes";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-11-24T00:00:00Z");
const OLD = 120; // days ago: safely matured

// An approved, matured report.
function report(job: JobOutcome, verification: Verification = "self_reported"): OutcomeInput {
  return {
    status: "approved",
    jobWithin90Days: job,
    exitDate: new Date(NOW.getTime() - OLD * DAY_MS),
    verification,
  };
}

// `yes` yes-answers followed by `no` no-answers.
function reports(yes: number, no: number, verification: Verification = "self_reported"): OutcomeInput[] {
  return [
    ...Array.from({ length: yes }, () => report("yes", verification)),
    ...Array.from({ length: no }, () => report("no", verification)),
  ];
}

// A simple hourly program with 3 matured yes reports unless overridden.
function program(id: string, overrides: Partial<CompareInput> = {}): CompareInput {
  return {
    id,
    name: `Program ${id}`,
    orgName: `Org ${id}`,
    area: "Test Area",
    duration: "8 weeks",
    payType: "hourly",
    payAmountCents: 2000,
    payMaxAmountCents: null,
    payPeriod: null,
    payMilestones: null,
    payItems: [],
    payExtras: [],
    conditionsStatus: "unknown",
    reports: reports(3, 0),
    ...overrides,
  };
}

describe("comparePrograms: columns and validation", () => {
  it("1. returns one column per program, in input order", () => {
    const result = comparePrograms([program("b"), program("a")], NOW);
    expect(result.programs).toEqual([
      { id: "b", name: "Program b", orgName: "Org b" },
      { id: "a", name: "Program a", orgName: "Org a" },
    ]);
  });

  it("2. keeps input order even when the last program has the strongest outcome", () => {
    const weak = program("weak", { reports: reports(1, 2) });
    const mid = program("mid", { reports: reports(2, 1) });
    const strong = program("strong", { reports: reports(3, 0) });
    expect(comparePrograms([weak, mid, strong], NOW).programs.map((p) => p.id)).toEqual(["weak", "mid", "strong"]);
  });

  it("3. throws for fewer than 2 programs", () => {
    expect(() => comparePrograms([program("a")], NOW)).toThrow(/2/);
  });

  it("4. throws for more than 3 programs", () => {
    const four = ["a", "b", "c", "d"].map((id) => program(id));
    expect(() => comparePrograms(four, NOW)).toThrow(/3/);
  });

  it("5. throws when the same id appears twice", () => {
    expect(() => comparePrograms([program("a"), program("a")], NOW)).toThrow(/duplicate/i);
  });
});

describe("comparePrograms: rows", () => {
  it("6. has exactly the row keys pay, outcome, verification, duration, area, in that order", () => {
    const result = comparePrograms([program("a"), program("b")], NOW);
    expect(result.rows.map((r) => r.key)).toEqual(["pay", "outcome", "verification", "duration", "area"]);
  });

  it("7. formats pay with formatPay, including a range and confirmed conditions", () => {
    const cashOut = program("cashout", {
      payType: "hourly",
      payAmountCents: 2200,
      payMaxAmountCents: 2800,
      conditionsStatus: "confirmed",
    });
    const pay = comparePrograms([cashOut, program("b")], NOW).rows[0];
    expect(pay.key).toBe("pay");
    expect(pay.cells[0]).toBe("$22–$28/hr (conditions apply)");
  });

  it("8. gives each program's outcome from programOutcomes (8 yes, 2 no)", () => {
    const outcome = comparePrograms([program("a", { reports: reports(8, 2) }), program("b")], NOW).rows[1];
    expect(outcome.key).toBe("outcome");
    expect(outcome.cells[0]).toMatchObject({ hidden: false, jobCount: 8, knownCount: 10 });
  });

  it("11. shows Not listed for a missing duration and a blank area", () => {
    const sparse = program("a", { duration: null, area: "  " });
    const result = comparePrograms([sparse, program("b")], NOW);
    expect(result.rows[3].cells[0]).toBe("Not listed");
    expect(result.rows[4].cells[0]).toBe("Not listed");
  });
});

describe("comparePrograms: hidden evidence", () => {
  it("9. flags a hidden program: outcome hidden, verification null, anyHidden true", () => {
    const thin = program("thin", { reports: reports(1, 1) }); // only 2 known answers
    const result = comparePrograms([program("full"), thin], NOW);
    expect(result.rows[1].cells[1]).toMatchObject({ hidden: true });
    expect(result.rows[2].cells[1]).toBeNull();
    expect(result.rows[2].cells[0]).not.toBeNull();
    expect(result.anyHidden).toBe(true);
  });

  it("10. leaves anyHidden false when no program is hidden", () => {
    expect(comparePrograms([program("a"), program("b")], NOW).anyHidden).toBe(false);
  });
});

describe("comparePrograms: no ranking, bad data, purity", () => {
  it("12. never includes score, rank, best, or percent anywhere in the result", () => {
    const result = comparePrograms([program("a"), program("b", { reports: reports(2, 1) })], NOW);
    expect(JSON.stringify(result)).not.toMatch(/score|rank|best|percent|%/i);
  });

  it("13. lets a programOutcomes error propagate for a bad verification value", () => {
    const bad: OutcomeInput = { ...report("yes"), verification: "bogus" as unknown as Verification };
    const broken = program("a", { reports: [...reports(3, 0), bad] });
    expect(() => comparePrograms([broken, program("b")], NOW)).toThrow(/verification/);
  });

  it("14. gives the same result twice and does not mutate the input", () => {
    const input = [
      program("a", { reports: reports(2, 1, "navigator_verified"), payExtras: ["lunch"] }),
      program("b", { duration: null }),
    ];
    const snapshot = structuredClone(input);
    const first = comparePrograms(input, NOW);
    const second = comparePrograms(input, NOW);
    expect(second).toEqual(first);
    expect(input).toEqual(snapshot);
  });
});

describe("comparePrograms: the demo trio from the seed data", () => {
  it("15. compares CashOut Crew, Gold Coast Solar, and Big Rig exactly as the demo shows", () => {
    const ids = ["prog-cashout-crew", "prog-gold-coast-solar", "prog-big-rig-academy"];
    const trio: CompareInput[] = ids.map((id) => {
      const row = SEED_PROGRAMS.find((p) => p.id === id);
      if (!row) throw new Error(`seed program ${id} is missing`);
      return { ...row, reports: SEED_REPORTS.filter((r) => r.programId === id) };
    });

    const result = comparePrograms(trio, NOW);
    expect(result.rows[0].cells).toEqual([
      "$22–$28/hr (conditions apply)",
      "$25/hr",
      "No cash — Class A CDL training ($6,000 value), DOT physical",
    ]);
    const outcomes = result.rows[1].cells as { jobCount: number; knownCount: number }[];
    expect(outcomes.map((o) => [o.jobCount, o.knownCount])).toEqual([
      [2, 11],
      [8, 10],
      [6, 7],
    ]);
    expect(result.anyHidden).toBe(false);
  });
});
