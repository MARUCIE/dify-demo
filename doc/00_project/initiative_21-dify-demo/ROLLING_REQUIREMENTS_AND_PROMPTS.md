# Rolling Requirements and Prompts -- initiative_21-dify-demo

## Requirement Ledger

| Req ID | Date | Requirement | Type | Source | Status |
| --- | --- | --- | --- | --- | --- |
| REQ-001 | 2026-03-10 | Build a visually strong Dify workflow demo frontend for SOE reimbursement audit | Product | User input | Done |
| REQ-002 | 2026-03-10 | Support single-screen progressive disclosure across upload, running, completed, and detail phases | UX | User input | Done |
| REQ-003 | 2026-03-10 | Support batch PDF upload including folder drag-and-drop | Product | User input | Done |
| REQ-004 | 2026-03-10 | Show 10-step audit workflow animation and batch result dashboard | UX | User input | Done |
| REQ-005 | 2026-03-10 | Provide mock mode for offline demo environments | Reliability | Notes / user scenario | Done |
| REQ-006 | 2026-03-10 | Add live Dify workflow integration behind server-side proxy | Integration | User input | Done |
| REQ-007 | 2026-03-10 | Visualize handwriting-heavy reimbursement scenarios and sub-document recognition | UX | User input | Done |
| REQ-008 | 2026-03-10 | Keep Chinese UI and English code/comments/identifiers | Process | `CLAUDE.md` | Done |
| REQ-009 | 2026-03-10 | Maintain dark-first professional visual language with optional light mode | UX | User input / notes | Done |
| REQ-010 | 2026-03-10 | Maintain PDCA docs as single source of truth under `doc/00_project/initiative_21-dify-demo/` | Process | `AGENTS.md` | In Progress |
| REQ-011 | 2026-03-11 | Align docs to actual Next.js 16 single-page runtime instead of `/demo/*` assumptions | Governance | User input (`继续`) | Done |
| REQ-012 | 2026-03-11 | Clear current lint blockers and preserve green lint/typecheck/build baseline | Engineering | User input (`继续`) | Done |
| REQ-013 | 2026-03-11 | Create root governance entry files (`AGENTS.md`, `CODEX.md`, `GEMINI.md`) | Governance | User input (`继续`) | Done |
| REQ-014 | 2026-03-11 | Create missing initiative closeout docs (`deliverable.md`, `PDCA_ITERATION_CHECKLIST.md`, `ROLLING_REQUIREMENTS_AND_PROMPTS.md`) | Governance | User input (`继续`) | Done |
| REQ-015 | 2026-03-11 | Create project and initiative index docs for doc navigation and auditability | Governance | User input (`继续`) | Done |
| REQ-016 | 2026-03-11 | Keep verification evidence explicit before any success claim | Process | `verification-before-completion` skill | Done |

## Prompt Library

| Prompt ID | Purpose | Prompt Template | Last Used |
| --- | --- | --- | --- |
| P-ARCH-001 | Runtime precheck | `List actual entrypoints, route map, key source files, and identify any documentation drift before touching business logic.` | 2026-03-11 |
| P-GOV-002 | Governance completion | `Create missing project governance docs under doc/, keeping project facts, verification status, and known gaps explicit.` | 2026-03-11 |
| P-CHK-003 | Verification pass | `Run lint, typecheck, and build; report exact pass/fail state and avoid completion claims without fresh evidence.` | 2026-03-11 |
| P-API-004 | SSE contract alignment | `Document the actual multipart request fields and named SSE events exposed by /api/audit, then sync PRD and architecture docs.` | 2026-03-11 |
| P-UX-005 | Single-page UX map sync | `Describe the four phases on / and ensure UX map reflects the real component flow rather than hypothetical subroutes.` | 2026-03-11 |

## Anti-Regression Q&A

| ID | Question | Guardrail Answer | Trigger |
| --- | --- | --- | --- |
| AR-001 | Are we still documenting the app as `/demo/*`? | No. Canonical runtime is `/` plus `/api/audit`. | Any architecture or PRD update |
| AR-002 | Are docs claiming Next.js 15 while package.json runs Next.js 16? | No. Version statements must match `package.json`. | Any stack/version update |
| AR-003 | Can effect hooks synchronously `setState` just to mirror localStorage or a zero target? | No. Use direct DOM reads/writes or RAF-driven updates when the state is derivable. | React 19 lint / refactor |
| AR-004 | Can `aria-sort` live directly on a `button`? | No. Put sort semantics on a header/container role, keep the button for interaction only. | Table sorting changes |
| AR-005 | Are request docs allowed to drift from `/api/audit` actual fields? | No. Request fields must stay `file`, `auditDate`, `fileIndex`. | API doc update |
| AR-006 | Can we claim completion without fresh verification evidence? | No. Run and report exact commands first. | Any closeout |
| AR-007 | Can project docs remain incomplete because the app already works? | No. Governance docs are part of the deliverable baseline. | Any `继续` governance pass |
| AR-008 | Can agent entry docs be missing at project root after a project directory is provided? | No. Root must carry `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md` or an explicit canonical reference. | Project bootstrap / optimize |
| AR-009 | Can live-mode readiness be assumed without a real `DIFY_API_KEY` test? | No. Live integration remains unproven until tested with real credentials. | Integration closeout |
| AR-010 | Can we mark DoD complete without `ai check` and UX simulation evidence? | No. Those gates remain pending until explicitly run and recorded. | Task closeout |

## References

| Ref | Path |
| --- | --- |
| Project root spec | `CLAUDE.md` |
| Root governance entry | `AGENTS.md` |
| Project doc map | `doc/index.md` |
| Project-level index | `doc/00_project/index.md` |
| Initiative index | `doc/00_project/initiative_21-dify-demo/index.md` |
| Product requirements | `doc/00_project/initiative_21-dify-demo/PRD.md` |
| System architecture | `doc/00_project/initiative_21-dify-demo/SYSTEM_ARCHITECTURE.md` |
| UX map | `doc/00_project/initiative_21-dify-demo/USER_EXPERIENCE_MAP.md` |
| Optimization plan | `doc/00_project/initiative_21-dify-demo/PLATFORM_OPTIMIZATION_PLAN.md` |
| Working plan | `doc/00_project/initiative_21-dify-demo/task_plan.md` |
| Working notes | `doc/00_project/initiative_21-dify-demo/notes.md` |
| UI entry | `src/app/page.tsx` |
| API entry | `src/app/api/audit/route.ts` |
