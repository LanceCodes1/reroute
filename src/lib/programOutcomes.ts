// Plain local types; the string values match the Prisma enums so tests never need the DB.
export type ReportStatus = "pending" | "approved" | "rejected";
export type JobOutcome = "yes" | "no" | "unknown";
export type Verification = "self_reported" | "navigator_verified" | "org_confirmed";

export interface OutcomeInput {
  status: ReportStatus;
  jobWithin90Days: JobOutcome;
  exitDate: Date;
  verification: Verification;
  isSample?: boolean;
}

export interface VerificationCounts {
  selfReported: number;
  navigatorVerified: number;
  orgConfirmed: number;
}

export interface OutcomeSummary {
  hidden: boolean;
  jobCount: number | null; // X: matured yes answers
  knownCount: number | null; // Y: matured yes/no answers
  unknownCount: number | null;
  tooEarlyCount: number | null;
  verification: VerificationCounts | null;
  latestExitDate: Date | null;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const MIN_KNOWN_REPORTS = 3;

const STATUSES: ReadonlySet<string> = new Set<ReportStatus>(["pending", "approved", "rejected"]);
const JOB_OUTCOMES: ReadonlySet<string> = new Set<JobOutcome>(["yes", "no", "unknown"]);
const VERIFICATIONS: ReadonlySet<string> = new Set<Verification>([
  "self_reported",
  "navigator_verified",
  "org_confirmed",
]);

function isValidDate(value: unknown): boolean {
  return value instanceof Date && Number.isFinite(value.getTime());
}

// Bad input throws: a loud error is better than a silently wrong number.
function validateInput(reports: OutcomeInput[], now: Date): void {
  if (!isValidDate(now)) throw new Error("programOutcomes: now is not a valid Date");

  // Every report is checked before the status filter, so bad rows are caught even if they would not count.
  reports.forEach((report, i) => {
    if (!isValidDate(report.exitDate)) {
      throw new Error(`programOutcomes: report ${i} has an invalid exitDate`);
    }
    if (!STATUSES.has(report.status)) {
      throw new Error(`programOutcomes: report ${i} has an unexpected status "${report.status}"`);
    }
    if (!JOB_OUTCOMES.has(report.jobWithin90Days)) {
      throw new Error(
        `programOutcomes: report ${i} has an unexpected jobWithin90Days "${report.jobWithin90Days}"`,
      );
    }
    if (!VERIFICATIONS.has(report.verification)) {
      throw new Error(`programOutcomes: report ${i} has an unexpected verification "${report.verification}"`);
    }
  });
}

export function programOutcomes(reports: OutcomeInput[], now: Date): OutcomeSummary {
  validateInput(reports, now);

  let jobCount = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let tooEarlyCount = 0;
  let latestExitMs: number | null = null;
  const verification: VerificationCounts = { selfReported: 0, navigatorVerified: 0, orgConfirmed: 0 };

  for (const report of reports) {
    // Only approved reports count; pending and rejected are ignored completely.
    if (report.status !== "approved") continue;

    const exitMs = report.exitDate.getTime();
    // Under 90 days since exit (or a future date) is too early, checked before unknown; exactly 90 counts.
    if (now.getTime() - exitMs < NINETY_DAYS_MS) {
      tooEarlyCount++;
      continue;
    }

    if (report.jobWithin90Days === "unknown") {
      unknownCount++;
      continue;
    }

    // Matured yes/no answers form Y; yes answers form X.
    knownCount++;
    if (report.jobWithin90Days === "yes") jobCount++;

    if (report.verification === "self_reported") verification.selfReported++;
    else if (report.verification === "navigator_verified") verification.navigatorVerified++;
    else verification.orgConfirmed++;

    if (latestExitMs === null || exitMs > latestExitMs) latestExitMs = exitMs;
  }

  // Hidden below the threshold: null every other field so no number can leak to the UI or Ari.
  if (knownCount < MIN_KNOWN_REPORTS || latestExitMs === null) {
    return {
      hidden: true,
      jobCount: null,
      knownCount: null,
      unknownCount: null,
      tooEarlyCount: null,
      verification: null,
      latestExitDate: null,
    };
  }

  return {
    hidden: false,
    jobCount,
    knownCount,
    unknownCount,
    tooEarlyCount,
    verification,
    latestExitDate: new Date(latestExitMs),
  };
}
