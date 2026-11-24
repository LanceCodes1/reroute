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
