# PDCA Iteration Checklist -- initiative_21-dify-demo

## Plan

- [x] Confirm `PROJECT_DIR` is `/Users/mauricewen/Projects/21-dify-demo`
- [x] Confirm actual runtime shape is single-page `/` + `/api/audit`
- [x] Confirm root governance file gaps
- [x] Confirm initiative doc gaps: `deliverable.md`, `PDCA_ITERATION_CHECKLIST.md`, `ROLLING_REQUIREMENTS_AND_PROMPTS.md`, initiative indexes
- [x] Confirm existing PDCA docs drifted from actual runtime structure

## Do

- [x] Fix React 19 / Next 16 lint blockers in runtime code
- [x] Add `typecheck` script to `package.json`
- [x] Create root governance files: `AGENTS.md`, `CODEX.md`, `GEMINI.md`
- [x] Create doc indexes: `doc/index.md`, `doc/00_project/index.md`, initiative `index.md`
- [x] Create initiative closeout docs: `deliverable.md`, `PDCA_ITERATION_CHECKLIST.md`, `ROLLING_REQUIREMENTS_AND_PROMPTS.md`
- [x] Sync PDCA four docs to actual repository facts
- [x] Update `task_plan.md` and `notes.md` with this governance-completion iteration

## Check

- [x] Re-run `pnpm lint`
- [x] Re-run `pnpm typecheck`
- [x] Re-run `pnpm build`
- [x] Enumerate `doc/` tree and confirm required files now exist
- [x] Cross-check doc route map against `src/app/page.tsx` and `src/app/api/audit/route.ts`

## Act

- [x] Mark single-page `/` structure as canonical
- [x] Record remaining acceptance gaps: `ai check`, UX simulation, live-mode proof
- [x] Initialize rolling ledger for future requirements / prompts / anti-regression notes
- [x] Leave HTML snapshot regeneration and product-level manual acceptance to the next iteration if needed
