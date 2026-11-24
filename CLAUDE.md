# CLAUDE.md — Reroute

@AGENTS.md
@docs/planning.md

## How we work
- Lance is the human in the loop: propose, explain tradeoffs, recommend. Lance decides.
- One feature at a time. Ask when unsure; never guess.
- Show commands before running anything that installs, deletes, or touches the database.
- At milestones: a 5-bullet-max explain-back in plain language.

## Hard rules
- Tests first for core logic (formatPay, programOutcomes, comparePrograms). Watch them fail first.
- Never weaken a failing test. A wrong test changes only with Lance's OK and a logged reason.
- Code owns the facts; Ari owns the words. The server computes every number.
- Never read, print, or commit .env or keys.
- No destructive DB commands (migrate reset, --force-reset, DROP) without approval.
- Prisma migrations only. Seed fictional data only, labeled "Sample data."
- Store UTC, display Pacific.

## Stack notes
- Prisma 7.10.1 (stable), NOT Prisma 8 RC. Config: prisma7.config.ts. Client output: src/generated/prisma. Adapter: @prisma/adapter-pg.
- Next.js 16 App Router, src/ dir, `@/*` alias. Tailwind + shadcn/ui.

## Code style
- One-line comments on key logic only (core functions, data rules), not every line.

## Commits and logs
- Commit and push at milestones with clear messages.
- Add a docs/prompt-log.md entry at each milestone.
- Core logic (formatPay, programOutcomes, comparePrograms, Ari contract, role checks):
  commit after each red→green cycle — one commit per function with its tests.
- Before anything risky (schema change, migration, big refactor): commit first.
- UI: one commit per working screen.
- main must always build and pass tests: every push deploys live.
- At each natural commit point, stop and propose the commit message; don't wait to be asked.

## Before deploy
npx tsc --noEmit → npm test → npm run build → check the live URL.
