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
