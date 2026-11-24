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
