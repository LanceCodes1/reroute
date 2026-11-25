import type { Program } from "@/generated/prisma/client";
import { formatPay } from "@/lib/formatPay";
import {
  programOutcomes,
  type OutcomeInput,
  type OutcomeSummary,
  type VerificationCounts,
} from "@/lib/programOutcomes";

// Program row fields the comparison needs (nullable shapes straight from Prisma), plus its reports.
export type CompareInput = Pick<
  Program,
  | "id"
  | "name"
  | "orgName"
  | "area"
  | "duration"
  | "payType"
  | "payAmountCents"
  | "payMaxAmountCents"
  | "payPeriod"
  | "payMilestones"
  | "payItems"
  | "payExtras"
  | "conditionsStatus"
> & { reports: OutcomeInput[] };

// Row keys only; the UI owns the display labels.
export type ComparisonRow =
  | { key: "pay"; cells: string[] }
  | { key: "outcome"; cells: OutcomeSummary[] }
  | { key: "verification"; cells: (VerificationCounts | null)[] }
  | { key: "duration"; cells: string[] }
  | { key: "area"; cells: string[] };

export interface Comparison {
  programs: { id: string; name: string; orgName: string }[]; // column headers, input order
  rows: ComparisonRow[];
  anyHidden: boolean; // true if any program's outcome evidence is hidden
}

const MIN_PROGRAMS = 2;
const MAX_PROGRAMS = 3;
const NOT_LISTED = "Not listed";

// Blank or missing text shows as "Not listed".
function listed(text: string | null): string {
  const trimmed = text?.trim();
  return trimmed ? trimmed : NOT_LISTED;
}

export function comparePrograms(programs: CompareInput[], now: Date): Comparison {
  // Compare 2 to 3 programs, each id once; anything else is a caller bug, so fail loudly.
  if (programs.length < MIN_PROGRAMS) {
    throw new Error(`Pick at least ${MIN_PROGRAMS} programs to compare (got ${programs.length}).`);
  }
  if (programs.length > MAX_PROGRAMS) {
    throw new Error(`Pick at most ${MAX_PROGRAMS} programs to compare (got ${programs.length}).`);
  }
  const seen = new Set<string>();
  for (const p of programs) {
    if (seen.has(p.id)) throw new Error(`Duplicate program id "${p.id}" in comparison.`);
    seen.add(p.id);
  }

  // Outcome errors from programOutcomes propagate: bad data stays loud.
  const outcomes = programs.map((p) => programOutcomes(p.reports, now));

  return {
    // Columns stay in input order: never sorted by results, and there is no score or rank.
    programs: programs.map((p) => ({ id: p.id, name: p.name, orgName: p.orgName })),
    rows: [
      {
        key: "pay",
        cells: programs.map((p) =>
          formatPay({
            type: p.payType,
            amountCents: p.payAmountCents ?? undefined,
            maxAmountCents: p.payMaxAmountCents ?? undefined,
            period: p.payPeriod ?? undefined,
            milestones: p.payMilestones ?? undefined,
            items: p.payItems,
            extras: p.payExtras,
            conditions: p.conditionsStatus,
          }),
        ),
      },
      { key: "outcome", cells: outcomes },
      { key: "verification", cells: outcomes.map((o) => o.verification) },
      { key: "duration", cells: programs.map((p) => listed(p.duration)) },
      { key: "area", cells: programs.map((p) => listed(p.area)) },
    ],
    // The comparison needs a caveat if any column's outcome evidence is hidden.
    anyHidden: outcomes.some((o) => o.hidden),
  };
}
