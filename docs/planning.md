# Reroute — Planning

**Waze for reentry learn-and-earn.** Next Chapter Fall '26 capstone. PRD approved Nov 2026.

## Problem
People in their first year home from prison need income now, but stable jobs usually require training they can't afford to do unpaid. Paid learn-and-earn programs exist, but they're scattered and passed by word of mouth, with no easy way to see which ones actually lead to a job. So people hop from stipend to stipend and burn out by month six to eight.

## Core feature
Put two or three paid programs side by side and see where each one actually led for people who went before you.

## Scope
- **Floor (week 11):** browse programs, honest outcome evidence ("X of Y reported a job within 90 days"; hidden below 3), compare 2–3 programs, Ask Ari with fallback, deployed demo.
- **Full CRUD (week 12):** Clerk navigator sign-in, program CRUD, pending reports approved by navigators, three sample routes.
- **Bold add-on:** Reroute MCP server (backup: Talk to Ari).

## Stack
Next.js + TypeScript · Tailwind + shadcn/ui · Neon Postgres + Prisma · Clerk · Claude API · Vitest · Motion · Vercel

## Rules
- Code owns the facts; Ari owns the words.
- Tests first for core logic. Never weaken a failing test.
- Fictional data only, labeled "Sample data."
- Never commit keys or `.env` files.