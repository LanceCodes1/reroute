# Reroute — Scope for agents (source: approved PRD)

## Core feature
Put two or three paid programs side by side and see where each one actually led for people who went before you.

## Floor (week 11, no sign-in)
- Browse programs: pay in its original unit via formatPay; "Not specified" if missing.
- Outcome evidence: "X of Y reported a job within 90 days of leaving." Y = known yes/no answers only (unknowns excluded, not failures). Approved reports only. Hidden below 3. Show source, verification, count, date. No percentages.
- Compare 2–3 programs: pay always the first row; no "best program" score.
- Ask Ari with a prewritten fallback.
- Every screen labeled "Sample data, not real opportunities."

## Full CRUD (week 12)
- Clerk navigator sign-in; role checked on the server.
- Navigators add/edit/confirm/retire programs (retire, never hard-delete).
- Participant reports saved as pending; navigators approve/reject.
- Three fictional sample routes: stipend chaser, slow and steady, smart stacker.

## Data model: two tables only (Clerk holds accounts; no User table)
- Program, OutcomeReport. Fields are decided per task (F1) with Lance.

## Pay display (formatPay, done in F2)
- Types: hourly, per_period (week/two_weeks/month), total, milestone, non_cash, not_specified. Integer cents.
- Conditions are three-state: confirmed → "(conditions apply)", reported → "(conditions may apply)", unknown (default) → nothing. Detail page shows "Requirements not listed. Ask at the info session or contact the program." when unknown.

## Ari contract
Server computes every number. Ari gets only the selected programs' computed data plus an optional "your situation" note. Fixed answer format; server rejects any number not in the input; fallback comparison on failure. Ari never recommends a program and says when the quick-cash option fits.

## Later (not now)
Doors, build-your-own route, route sharing, status taps, Flyer Drop, Reroute Inside, mixed pay types, participant-reported conditions.
