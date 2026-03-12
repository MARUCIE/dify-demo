# AGENTS.md -- 21-dify-demo

## Canonical Spec

- Primary project rules live in `CLAUDE.md`.
- Project docs live under `doc/`.

## Project Root

- `PROJECT_DIR`: `/Users/mauricewen/Projects/21-dify-demo`

## Read Order

1. `CLAUDE.md`
2. `doc/index.md`
3. `doc/00_project/initiative_21-dify-demo/PRD.md`
4. `doc/00_project/initiative_21-dify-demo/SYSTEM_ARCHITECTURE.md`
5. `doc/00_project/initiative_21-dify-demo/USER_EXPERIENCE_MAP.md`
6. `doc/00_project/initiative_21-dify-demo/task_plan.md`
7. `doc/00_project/initiative_21-dify-demo/notes.md`

## Runtime Map

- `/` -> `src/app/page.tsx`
- `/api/audit` -> `src/app/api/audit/route.ts`
- Root layout -> `src/app/layout.tsx`

## Delivery Notes

- This repo is a Next.js 16 single-page demo frontend.
- User-facing copy stays Chinese; code/comments/identifiers stay English.
- Do not reintroduce `/demo/*` route assumptions; the app currently runs on `/`.
