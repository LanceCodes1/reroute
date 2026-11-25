import type { OutcomeReport, Program } from "@/generated/prisma/client";

// Seed rows leave out the database-managed timestamps; everything else matches the schema.
export type SeedProgram = Omit<Program, "createdAt" | "updatedAt">;
export type SeedReport = Omit<OutcomeReport, "createdAt">;

// Fictional "Sample data" only: no real programs, organizations, or people.
const LAST_CONFIRMED = new Date("2026-11-01T00:00:00Z");

// Fields every sample program shares; each program overrides what differs.
function program(p: Partial<SeedProgram> & Pick<SeedProgram, "id" | "name" | "orgName" | "area" | "shortDescription" | "duration">): SeedProgram {
  return {
    infoUrl: null,
    payType: "not_specified",
    payAmountCents: null,
    payMaxAmountCents: null,
    payPeriod: null,
    payMilestones: null,
    payItems: [],
    payExtras: [],
    conditionsStatus: "unknown",
    conditionsNote: null,
    conditionsSource: null,
    status: "active",
    lastConfirmedAt: LAST_CONFIRMED,
    isSample: true,
    ...p,
  };
}

export const SEED_PROGRAMS: SeedProgram[] = [
  program({
    id: "prog-cashout-crew",
    name: "CashOut Crew",
    orgName: "Westbrook Community Partners",
    area: "South LA",
    shortDescription: "Start Monday. Paid weekly. No experience needed.",
    duration: "8 weeks",
    payType: "hourly",
    payAmountCents: 2200,
    payMaxAmountCents: 2800,
    conditionsStatus: "confirmed",
    conditionsNote: "Top rate requires perfect weekly attendance",
  }),
  program({
    id: "prog-gold-coast-solar",
    name: "Gold Coast Solar Fellowship",
    orgName: "Harborview Workforce Alliance",
    area: "Long Beach",
    shortDescription: "Install the panels powering LA. Union apprenticeship pathway.",
    duration: "12 weeks",
    payType: "hourly",
    payAmountCents: 2500,
  }),
  program({
    id: "prog-big-rig-academy",
    name: "Big Rig Academy",
    orgName: "Foothill Trades Institute",
    area: "Pomona",
    shortDescription: "Walk out with a license that pays $70K+.",
    duration: "6 weeks",
    payType: "non_cash",
    payItems: ["Class A CDL training ($6,000 value)", "DOT physical"],
  }),
  program({
    id: "prog-next-level-tech",
    name: "Next Level Tech Fellowship",
    orgName: "Bunker Hill Learning Lab",
    area: "Downtown LA",
    shortDescription: "Get paid to learn AI and IT support.",
    duration: "6 months",
    payType: "per_period",
    payAmountCents: 250000,
    payPeriod: "month",
    payExtras: ["laptop"],
  }),
  program({
    id: "prog-harbor-logistics",
    name: "Harbor Logistics Academy",
    orgName: "Pacific Docks Training Council",
    area: "Wilmington",
    shortDescription: "Forklift + OSHA certs. $3K for finishing.",
    duration: "10 weeks",
    payType: "milestone",
    payAmountCents: 300000,
    payMilestones: 3,
  }),
  program({
    id: "prog-studio-crew",
    name: "Studio Crew Pathway",
    orgName: "Magnolia Production Arts Fund",
    area: "Burbank",
    shortDescription: "Behind the scenes of film and TV.",
    duration: "16 weeks",
    payType: "per_period",
    payAmountCents: 75000,
    payPeriod: "week",
    conditionsStatus: "reported",
  }),
  program({
    id: "prog-ridgeline-fire",
    name: "Ridgeline Fire & Trail Crew",
    orgName: "Ridgeline Conservation Corps",
    area: "San Fernando Valley",
    shortDescription: "Wildland fire crew. Pathway to fire agencies.",
    duration: "6 months",
    payType: "per_period",
    payAmountCents: 120000,
    payPeriod: "two_weeks",
    payExtras: ["lunch"],
  }),
  program({
    id: "prog-eastside-culinary",
    name: "Eastside Culinary Collective",
    orgName: "Mariposa Kitchen Project",
    area: "Boyle Heights",
    shortDescription: "Train in a real restaurant kitchen.",
    duration: "12 weeks",
    payType: "total",
    payAmountCents: 400000,
    payMaxAmountCents: 500000,
  }),
  program({
    id: "prog-chair-ready",
    name: "Chair Ready Barber Apprenticeship",
    orgName: "Crenshaw Barber Guild",
    area: "Inglewood",
    shortDescription: "Earn your license. Build your chair.",
    duration: "9 months",
  }),
  program({
    id: "prog-chw-fellowship",
    name: "Community Health Worker Fellowship",
    orgName: "Lakeshore Health Outreach",
    area: "Compton",
    shortDescription: "Help people coming home, like you did.",
    duration: "4 months",
    payType: "hourly",
    payAmountCents: 2000,
  }),
];

type Job = SeedReport["jobWithin90Days"];
type Status = SeedReport["status"];
type Verif = SeedReport["verification"];

interface ReportGroup {
  job: Job;
  count: number;
  status?: Status; // defaults to approved
  verification?: Verif; // defaults to self_reported
  tooEarly?: boolean; // exit in the last 90-day window instead of matured
}

const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEWED_AT = new Date("2026-11-20T00:00:00Z");

// Matured exits spread over 2026-02-01 to 2026-07-31; too-early exits over 2026-10-15 to 2026-11-15.
function exitDate(tooEarly: boolean, programIndex: number, n: number): Date {
  const start = Date.UTC(2026, tooEarly ? 9 : 1, tooEarly ? 15 : 1);
  const offsetDays = tooEarly ? (programIndex * 7 + n * 9) % 32 : (programIndex * 37 + n * 23) % 181;
  return new Date(start + offsetDays * DAY_MS);
}

// Expands compact groups into report rows with fixed ids like "rep-cashout-01".
function reports(programId: string, slug: string, programIndex: number, groups: ReportGroup[]): SeedReport[] {
  const rows: SeedReport[] = [];
  let n = 0;
  for (const g of groups) {
    for (let i = 0; i < g.count; i++) {
      n++;
      const status = g.status ?? "approved";
      rows.push({
        id: `rep-${slug}-${String(n).padStart(2, "0")}`,
        programId,
        exitDate: exitDate(g.tooEarly ?? false, programIndex, n),
        jobWithin90Days: g.job,
        status,
        verification: g.verification ?? "self_reported",
        reporterId: null,
        reviewedAt: status === "pending" ? null : REVIEWED_AT,
        isSample: true,
      });
    }
  }
  return rows;
}

export const SEED_REPORTS: SeedReport[] = [
  // 2 of 11
  ...reports("prog-cashout-crew", "cashout", 1, [
    { job: "yes", count: 2 },
    { job: "no", count: 9 },
  ]),
  // 8 of 10
  ...reports("prog-gold-coast-solar", "solar", 2, [
    { job: "yes", count: 5 },
    { job: "yes", count: 3, verification: "navigator_verified" },
    { job: "no", count: 1 },
    { job: "no", count: 1, verification: "navigator_verified" },
  ]),
  // 6 of 7
  ...reports("prog-big-rig-academy", "bigrig", 3, [
    { job: "yes", count: 6, verification: "navigator_verified" },
    { job: "no", count: 1, verification: "navigator_verified" },
  ]),
  // hidden: 2 matured known answers, the rest too early
  ...reports("prog-next-level-tech", "tech", 4, [
    { job: "yes", count: 1 },
    { job: "no", count: 1 },
    { job: "yes", count: 2, tooEarly: true },
    { job: "unknown", count: 2, tooEarly: true },
  ]),
  // 5 of 9
  ...reports("prog-harbor-logistics", "harbor", 5, [
    { job: "yes", count: 5 },
    { job: "no", count: 4 },
  ]),
  // 3 of 8 (plus 1 unknown)
  ...reports("prog-studio-crew", "studio", 6, [
    { job: "yes", count: 3 },
    { job: "no", count: 5 },
    { job: "unknown", count: 1 },
  ]),
  // 6 of 8
  ...reports("prog-ridgeline-fire", "ridgeline", 7, [
    { job: "yes", count: 6, verification: "org_confirmed" },
    { job: "no", count: 2, verification: "org_confirmed" },
  ]),
  // 0 of 5
  ...reports("prog-eastside-culinary", "culinary", 8, [{ job: "no", count: 5 }]),
  // 4 of 6; pending and rejected reports must not count
  ...reports("prog-chair-ready", "chair", 9, [
    { job: "yes", count: 4 },
    { job: "no", count: 2 },
    { job: "yes", count: 2, status: "pending" },
    { job: "yes", count: 1, status: "rejected" },
  ]),
  // 5 of 7 (plus 3 unknown)
  ...reports("prog-chw-fellowship", "chw", 10, [
    { job: "yes", count: 5, verification: "navigator_verified" },
    { job: "no", count: 2, verification: "navigator_verified" },
    { job: "unknown", count: 3, verification: "navigator_verified" },
  ]),
];
