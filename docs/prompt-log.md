# Prompt Log — Reroute

Milestone entries: what was asked, what was done, and what was verified.

## S1 — Project scaffold, shadcn/ui, and GitHub repo (2026-11-23)

**Asked:** Stand up the project foundation.

**Done:**
- Scaffolded Next.js 16 + TypeScript + Tailwind + ESLint (App Router, `src/` dir, `@/*` alias). Commit `c767a02`.
- Initialized shadcn/ui. Commit `f8006af` "Add shadcn/ui setup".
- Added `docs/planning.md`.
- Created and pushed the public GitHub repo `LanceCodes1/reroute`.

## S2 — Connect Neon Postgres with Prisma 7 (2026-11-23)

**Asked:** Connect the app to Neon Postgres through Prisma 7 with a singleton client.

**Done:**
- Prisma 7.10.1 (stable, not the 8.0.0-rc) with `prisma7.config.ts`, `prisma/schema.prisma`, and client output at `src/generated/prisma`.
- `@prisma/adapter-pg` driver adapter wired in `src/lib/prisma.ts`. The client is cached on `globalThis` outside production so dev hot reloads reuse one pool.
- `npx prisma generate` succeeded. `npx tsc --noEmit` passes.
- Connection was already proven earlier with `prisma db execute` on `SELECT 1`.
- Removed the untracked `.windsurf/` folder (Windsurf skill copies; not used).
- Added `CLAUDE.md` at the project root, importing `AGENTS.md` and `docs/planning.md`.

**Verified:** Type-check. Connection: `SELECT 1` (earlier). Not yet verified: a live query through the singleton and the test suite (no tests exist yet).

**Pending:** Commit and push after Lance's approval.

## S3 prep — Prepare for Vercel deploy (2026-11-23)

**Asked:** Get the empty app ready to deploy to Vercel.

**Done:**
- `.gitignore` now excludes `.agents/`, `.claude/skills/`, and `skills-lock.json` (local Prisma skill copies).
- `"postinstall": "prisma generate"` so Vercel (and fresh clones) build the git-ignored client in `src/generated/prisma`. Chosen over putting it in `build` because `tsc`, `next dev`, and Vitest also need the client.
- `overrides: { effect: "3.22.5" }` fixes the 3 high ReDoS findings (GHSA-7589-6fvf-x4pw). They were one chain: `effect` pinned at 3.20.0 by `@prisma/config` (Prisma CLI config loading, not the runtime client). Rejected `npm audit fix --force`: it would downgrade Prisma to 6.12.0.
- `turbopack.root` set in `next.config.ts` to silence the stray parent-folder lockfile warning.

**Verified:** `npm audit` shows 0 high; `npx prisma generate`, `npx tsc --noEmit`, and `npm run build` all pass. No test script yet, so `npm test` is skipped.

**Known and left alone:** 4 moderate `minimatch` findings (GHSA-g3hv-75wg-m249) under `shadcn` → `ts-morph`. Tooling-only; the only npm fix is a breaking `shadcn` downgrade. Revisit when shadcn updates. Re-check the `effect` override when Prisma ships a release that bumps it.

**Deployed:** Live at https://reroute-puce.vercel.app. `DATABASE_URL` is set in Vercel as a sensitive variable for Production and Preview.

## S4 — Set up Vitest (2026-11-24)

**Asked:** Minimal Vitest setup for Next.js 16 + TypeScript with the `@/*` alias; Lance writes the first test.

**Done:**
- Installed `vitest` 5.1.1. `vitest.config.mts` uses `resolve: { tsconfigPaths: true }` (native Vite) with `environment: "node"` and `include: ["src/**/*.test.ts"]`. Skipped React/jsdom/Testing Library: core logic (`formatPay`, `programOutcomes`, `comparePrograms`) is pure TypeScript. Add them when testing components.
- Initially installed `vite-tsconfig-paths` (per the Next.js guide), then removed it after Vitest reported native support.
- `npm install` failed on a peer conflict (Vitest needs `@types/node` ^22 or >=24; project had ^20). Fixed by upgrading `@types/node` to ^24 instead of `--force`.
- Added `"engines": { "node": "24.x" }` so Vercel matches local Node 24.
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
- Lance wrote `src/lib/__tests__/smoke.test.ts` and watched it go red (deliberately wrong) then green.

**Verified:** `npm test` (1 passed), `npx tsc --noEmit`, and `npm run build` all pass. Audit unchanged: 4 moderate `minimatch` (see S3).

**Not yet verified:** the `@/*` alias inside a test. The smoke test doesn't import through it, so the first real test that uses `@/lib/...` will be the proof.

## F2 — formatPay (2026-11-24)

**Asked:** Build `formatPay`, the function that turns a program's pay info into the one string people see. Research how LA reentry programs state pay, decide the rules with Lance, tests first.

**Rules decided with Lance:**
- Six pay types: hourly, per_period (week, two weeks, month), total, milestone, non_cash, not_specified.
- Pay is shown in its original unit, never converted. Cents only when nonzero; commas for thousands.
- A missing or zero amount (or non_cash with no items, or per_period with no period) returns "Not specified", never "$0".
- A range shows only when max > amount; otherwise the single amount. One shared helper covers hourly, per_period, and total.
- Extras append as " + a, b", then conditions last.
- Three-state conditions: confirmed → "(conditions apply)", reported → "(conditions may apply)", unknown → nothing. Ignored for milestone, non_cash, and not_specified.
- Milestone pay always signals a conditional payout: "$1,200 total, paid in 3 milestones", or "paid in milestones" when the count is unknown ("1 milestone" in the singular).
- Blank strings in items and extras are dropped; extras are ignored on non_cash and apply to milestone.

**Tests:** 22 from the spec, then tests 23–28 added for edge cases: per_period with no period (23), max below the amount (24, 27), max equal to the amount (25, 26), milestone with an unknown count (28).

**TDD loop:** Stub returned "" → red 22/22, then 25/25 and 27/27 as edge cases were added → implementation → green. Test 28 was added red (1 failed, 27 passed), then the code was fixed to make it green. No test was weakened or changed to pass.

**Verified:** `npm test` (29 passed: 28 formatPay + smoke), `npx tsc --noEmit`, `npm run build`, and eslint on `src/lib` all pass. The `@/` alias is now proven: the formatPay tests import through `@/lib/formatPay`.

**Research note:** LA programs state pay as hourly wages with hour caps, stipends, wages plus incentives, or no amount at all. Sources disagreed and some looked stale, so no research figures went into the app; sample data stays fictional.

## F1 — Program and OutcomeReport schema + first migration (2026-11-24)

**Asked:** Design the two-table data model (Program, OutcomeReport; Clerk holds accounts, so no User table), commit the schema, then run the first migration.

**Fields decided with Lance (all recommendations chosen):**
1. **Duration:** one free-text field. No calculation uses it, and programs state length in days, hours, weeks, or months.
2. **Verification:** one field, three states (`self_reported` / `navigator_verified` / `org_confirmed`), same pattern as conditions. Participants report; orgs upgrade the label.
3. **Duplicate block now:** `reporterId` (Clerk id, null for sample data) plus `unique(programId, reporterId)`, so week 12 needs no schema change. Postgres treats nulls as distinct, so sample reports aren't blocked.
4. **Retire, never delete:** `status` active/retired plus `lastConfirmedAt`. The relation defaults to Restrict, so the database refuses to delete a program that has reports.
5. **Area field included:** browsing needs "where".
6. **Database enums for all fixed values:** the database rejects typos the same way tests guard code.

**Schema:** Program pay fields mirror formatPay's `PayInfo` (integer cents, original unit). Conditions are three-state. Seven enums: PayType, PayPeriod, ConditionsStatus, ProgramStatus, JobOutcome, ReportStatus, Verification. Index on `OutcomeReport(programId, status)` for the approved-reports lookup. Both tables default `isSample` to true.

**Migration:** `20261124225523_init_program_outcomereport`, run with `npx prisma migrate dev --name init_program_outcomereport`. Additive SQL only (7 enums, 2 tables, 1 unique index, 1 index, 1 foreign key). No reset prompt appeared.

**Direct vs pooled URL:** migrations use `DIRECT_URL` (Neon unpooled) via `prisma7.config.ts`, which falls back to `DATABASE_URL`. The app keeps the pooled `DATABASE_URL` through the `@prisma/adapter-pg` adapter.

**Commits:** schema committed first (`894a7eb`, before any migration, per the cadence rules); migration committed separately.

**Verified:** `npx prisma validate`, `npx tsc --noEmit`, and `npm test` (29 passed) all pass. A read-only count against Neon shows `Program` = 0 and `OutcomeReport` = 0, so both tables exist and are empty.

**Next:** seed fictional sample programs (labeled "Sample data"). Add `DIRECT_URL` to Vercel only if migrations ever run there; the deployed app doesn't need it.

## F3 — programOutcomes (Nov 24, 2026, W11)

**Goal:** Count outcome evidence honestly: X of Y got a job within 90 days of leaving.

**Decisions locked by Lance:**
- Approved reports only; pending and rejected are ignored completely.
- Too early (under 90 days since exit, including future dates) never enters Y, even a yes, and is checked before unknown. Exactly 90 days counts.
- Unknowns are excluded from Y, not counted as failures.
- Hidden when Y < 3. When hidden, every field except `hidden` is null, so numbers can't leak to the UI or Ari. 0 of 3 is shown.
- The verification mix and `latestExitDate` cover counted (Y) reports only.
- `isSample` is ignored (the caller filters). The function uses the `now` parameter, never the clock.

**Built:** `programOutcomes(reports, now)` in `src/lib/programOutcomes.ts`, with named constants `NINETY_DAYS_MS` and `MIN_KNOWN_REPORTS = 3`. Plain local types whose string values match the Prisma enums, so tests never need the database. It does not mutate its input, and input order doesn't matter.

**Verified:** Lance reviewed the 17 test cases and confirmed red (17 failed, 29 passed) before implementation.

**Tests:** 17 written first, red → green, no test changed. Final: 46 passed (17 programOutcomes, 28 formatPay, 1 smoke). `npx tsc --noEmit`, `npm run lint`, and `npm run build` all pass.

**Open (choices the 17 tests don't pin down):**
- An invalid Date for `exitDate` (or `now`) makes the age comparison false, so the report is treated as matured instead of too early.
- Duplicate reports are all counted. The input has no `reporterId`, so the function can't dedupe; it relies on the database unique constraint, which doesn't block null `reporterId` sample rows.
- Reports from mixed programs are not detected; the caller must pass one program's reports.
- An unexpected runtime value is not rejected: a `verification` outside the three states counts as `org_confirmed`, and a `jobWithin90Days` outside yes/no/unknown counts as a known "no". TypeScript and the database enums prevent this today.
- When hidden, `tooEarlyCount` is null too, so the UI can't say "N more reports are still too early to count".
- `latestExitDate` is returned as a new `Date`, not a reference to the input's date.

**Next:** Extra tests for any uncovered choice Lance approves, then F4 seed.
