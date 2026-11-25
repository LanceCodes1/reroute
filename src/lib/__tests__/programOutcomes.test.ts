import { describe, it, expect } from "vitest";
import {
  programOutcomes,
  type JobOutcome,
  type OutcomeInput,
  type ReportStatus,
  type Verification,
} from "@/lib/programOutcomes";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-11-24T00:00:00Z");
const OLD = 120; // days ago: safely past the 90-day mark

// Builds a report that exited `daysAgo` days before NOW (negative = in the future).
function report(
  job: JobOutcome,
  daysAgo: number,
  status: ReportStatus = "approved",
  verification: Verification = "self_reported",
  isSample?: boolean,
): OutcomeInput {
  return {
    status,
    jobWithin90Days: job,
    exitDate: new Date(NOW.getTime() - daysAgo * DAY_MS),
    verification,
    ...(isSample === undefined ? {} : { isSample }),
  };
}

const HIDDEN = {
  hidden: true,
  jobCount: null,
  knownCount: null,
  unknownCount: null,
  tooEarlyCount: null,
  verification: null,
  latestExitDate: null,
};

describe("programOutcomes: hidden below 3", () => {
  it("1. returns hidden with every other field null for no reports", () => {
    expect(programOutcomes([], NOW)).toEqual(HIDDEN);
  });

  it("4. hides when only 2 known answers exist, even with many unknowns", () => {
    const reports = [
      report("yes", OLD),
      report("yes", OLD),
      ...Array.from({ length: 5 }, () => report("unknown", OLD)),
    ];
    expect(programOutcomes(reports, NOW)).toEqual(HIDDEN);
  });

  it("6. hides when a pending report would have made 3", () => {
    const reports = [report("yes", OLD), report("yes", OLD), report("yes", OLD, "pending")];
    expect(programOutcomes(reports, NOW)).toEqual(HIDDEN);
  });

  it("10. treats 89 days as too early, so Y stays 2 and the result is hidden", () => {
    const reports = [report("yes", OLD), report("yes", OLD), report("yes", 89)];
    expect(programOutcomes(reports, NOW)).toEqual(HIDDEN);
  });

  it("15. hides when the same reports are viewed 60 days earlier (all too early)", () => {
    const reports = [report("yes", 100), report("yes", 100), report("yes", 100)];
    const earlier = new Date(NOW.getTime() - 60 * DAY_MS);
    expect(programOutcomes(reports, earlier)).toEqual(HIDDEN);
  });
});

describe("programOutcomes: counting matured answers", () => {
  it("2. counts X of Y from yes, yes, no", () => {
    const summary = programOutcomes([report("yes", OLD), report("yes", OLD), report("no", OLD)], NOW);
    expect(summary.hidden).toBe(false);
    expect(summary.jobCount).toBe(2);
    expect(summary.knownCount).toBe(3);
  });

  it("3. shows 0 of 3 instead of hiding it", () => {
    const summary = programOutcomes([report("no", OLD), report("no", OLD), report("no", OLD)], NOW);
    expect(summary.hidden).toBe(false);
    expect(summary.jobCount).toBe(0);
    expect(summary.knownCount).toBe(3);
  });

  it("5. counts unknowns separately from Y", () => {
    const reports = [
      report("yes", OLD),
      report("yes", OLD),
      report("yes", OLD),
      report("unknown", OLD),
      report("unknown", OLD),
    ];
    const summary = programOutcomes(reports, NOW);
    expect(summary.jobCount).toBe(3);
    expect(summary.knownCount).toBe(3);
    expect(summary.unknownCount).toBe(2);
  });

  it("17. counts sample and non-sample reports together", () => {
    const reports = [
      report("yes", OLD, "approved", "self_reported", true),
      report("yes", OLD, "approved", "self_reported", false),
      report("no", OLD, "approved", "self_reported"),
    ];
    const summary = programOutcomes(reports, NOW);
    expect(summary.knownCount).toBe(3);
    expect(summary.jobCount).toBe(2);
  });
});

describe("programOutcomes: only approved reports count", () => {
  it("7. ignores a rejected report completely", () => {
    const reports = [
      report("yes", OLD),
      report("yes", OLD),
      report("yes", OLD),
      report("yes", OLD, "rejected"),
    ];
    const summary = programOutcomes(reports, NOW);
    expect(summary.knownCount).toBe(3);
    expect(summary.unknownCount).toBe(0);
    expect(summary.tooEarlyCount).toBe(0);
  });
});

describe("programOutcomes: too early (under 90 days)", () => {
  const threeOld = () => [report("yes", OLD), report("yes", OLD), report("no", OLD)];

  it("8. keeps a yes at 30 days out of Y and counts it as too early", () => {
    const summary = programOutcomes([...threeOld(), report("yes", 30)], NOW);
    expect(summary.knownCount).toBe(3);
    expect(summary.tooEarlyCount).toBe(1);
  });

  it("9. counts exactly 90 days as matured", () => {
    const summary = programOutcomes([report("yes", 90), report("yes", 90), report("yes", 90)], NOW);
    expect(summary.hidden).toBe(false);
    expect(summary.knownCount).toBe(3);
  });

  it("11. treats a future exit date as too early", () => {
    const summary = programOutcomes([...threeOld(), report("yes", -10)], NOW);
    expect(summary.knownCount).toBe(3);
    expect(summary.tooEarlyCount).toBe(1);
  });

  it("12. checks too early before unknown, so an early unknown is not counted as unknown", () => {
    const summary = programOutcomes([...threeOld(), report("unknown", 30)], NOW);
    expect(summary.tooEarlyCount).toBe(1);
    expect(summary.unknownCount).toBe(0);
  });
});

describe("programOutcomes: verification and latest exit cover counted reports only", () => {
  it("13. tallies verification for counted reports, ignoring a pending one", () => {
    const reports = [
      report("yes", OLD, "approved", "self_reported"),
      report("yes", OLD, "approved", "self_reported"),
      report("no", OLD, "approved", "navigator_verified"),
      report("yes", OLD, "pending", "org_confirmed"),
    ];
    expect(programOutcomes(reports, NOW).verification).toEqual({
      selfReported: 2,
      navigatorVerified: 1,
      orgConfirmed: 0,
    });
  });

  it("14. uses the latest counted exit date and ignores a too-early report", () => {
    const reports = [report("yes", 100), report("no", 120), report("yes", 200), report("yes", 30)];
    const expected = new Date(NOW.getTime() - 100 * DAY_MS);
    expect(programOutcomes(reports, NOW).latestExitDate).toEqual(expected);
  });
});

describe("programOutcomes: purity", () => {
  it("16. gives the same result for shuffled input and does not mutate the input", () => {
    const reports = [
      report("yes", 100, "approved", "navigator_verified"),
      report("no", 150, "approved", "self_reported"),
      report("yes", 200, "approved", "org_confirmed", true),
      report("unknown", 130),
      report("yes", 30),
      report("yes", 150, "pending"),
      report("no", 150, "rejected"),
    ];
    const snapshot = structuredClone(reports);

    const original = programOutcomes(reports, NOW);
    const reversed = programOutcomes([...reports].reverse(), NOW);
    const rotated = programOutcomes([...reports.slice(3), ...reports.slice(0, 3)], NOW);

    expect(reversed).toEqual(original);
    expect(rotated).toEqual(original);
    expect(reports).toEqual(snapshot);
  });
});
