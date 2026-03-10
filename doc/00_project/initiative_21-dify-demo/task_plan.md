# Task Plan -- 21-dify-demo

> 路桥报销审核智能体 | Dify Workflow Demo for SOE | v2.0 Batch Audit System

## Status: active

## Objective

为路桥集团国企客户构建"卧槽级"视觉冲击的 Dify 工作流展示前端。
核心卖点：10 步审核流程动画 + 批量文件处理 + 手写 OCR 可视化 + 单屏渐进披露。

---

## Phase 1: Project Setup -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Scaffold from Next.js 16 + TailwindCSS v4 + shadcn/ui | done | Not from 07-lingque; fresh scaffold |
| 1.2 | Configure dark futuristic theme | done | CSS custom properties + glassmorphism system |
| 1.3 | Setup Framer Motion 12 | done | Page transitions + step animations |
| 1.4 | Git init + initial structure | done | |

---

## Phase 2: Core Implementation -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | State machine (useReducer, 12 actions, 4 phases) | done | upload/running/completed/detail |
| 2.2 | AnimatedBackground (grid + radials + particles + noise) | done | Canvas noise overlay, CSS grid pulse |
| 2.3 | Header + StatsBar (compact, shimmer) | done | py-3 compressed layout |
| 2.4 | UploadZone (drag-drop files + folders, validation) | done | webkitGetAsEntry recursive scanning |
| 2.5 | File list table (name/size/pages/handwriting ratio) | done | Animated handwriting ratio bars |
| 2.6 | WorkflowPipeline (10 steps, 2x5 grid, connectors) | done | Horizontal + vertical connectors |
| 2.7 | StepCard (idle/active/completed/error states) | done | Framer Motion animations per state |
| 2.8 | BatchProgress (circular progress + file cards) | done | Per-file step dots + breathing glow |
| 2.9 | BatchResultsDashboard (summary cards + sortable table) | done | Animated counters + sort by 6 fields |
| 2.10 | ResultPanel (detail overlay for single file) | done | Issue cards + suggestion badges |
| 2.11 | Mock data system | done | 3 mock results + randomized step delays |

---

## Phase 3: Swarm Optimization -- DONE

Council: PM + UX Designer + Frontend Engineer + Security

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Space optimization (128px→28px wasted margins) | done | Flex fill chain from h-screen to dropzone |
| 3.2 | Code deduplication (SUGGESTION_BADGE, TOTAL_STEPS) | done | Extracted to shared constants.ts |
| 3.3 | Glass depth system (inset highlight + shadows) | done | 4-layer depth on .glass/.glass-bright |
| 3.4 | Conic gradient dropzone border | done | Rotating border on hover/dragover |
| 3.5 | Premium upload icon (88px + ring animation) | done | Gradient bg + pulsing outer ring |
| 3.6 | Glow effects boost (~50% across all classes) | done | Blue/green/amber/red glows + text-glow |
| 3.7 | Success-shimmer + glass-shimmer | done | Green sweep on results, blue-purple on stats |
| 3.8 | FileCard breathing glow amplified | done | inset 0.06/0.14, outer 0.12/0.22 |
| 3.9 | Dark scrollbars | done | Matches dark theme |
| 3.10 | Copy/export button handlers | done | Clipboard API + fallback |
| 3.11 | Date picker validation (max=today) | done | Prevents future date selection |
| 3.12 | Security headers (CSP, XFO, nosniff) | done | next.config.ts |
| 3.13 | prefers-reduced-motion | done | Disables animations + hides particles |
| 3.14 | .env.example | done | DIFY_API_URL + DIFY_API_KEY + DEMO_MODE |
| 3.15 | Framer Motion TS fixes (ease as const) | done | 6 occurrences across components |

---

## Phase 4: Frontend Best Practices Research -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | SOE design patterns research | done | Ant Design, 政务网站设计规范, Carbon Design |
| 4.2 | Next.js 16 performance optimization research | done | React 19, Framer Motion bundle, TanStack Virtual |
| 4.3 | Accessibility standards research | done | WCAG 2.2, GB/T 37668, ARIA live regions |
| 4.4 | Security best practices research | done | PDF magic bytes, CSP, PIPL/DSL |
| 4.5 | Synthesize research into checklist/baseline | done | FRONTEND_BEST_PRACTICES_CHECKLIST.md (28 items, 3 tiers) |
| 4.6 | Update PDCA docs | done | task_plan + checklist doc synced |
| 4.7 | Implement Critical-tier improvements (8/8) | done | C1-C8 all implemented, build verified |
| 4.8 | Implement High-tier improvements (8/10) | done | H1,H3,H5-H10 done; H2,H4 deferred |

### Phase 4 Implementation Summary (Critical Tier)

| # | Change | Files Modified |
|---|--------|---------------|
| C1 | Removed Google Fonts (Geist/Geist_Mono), system font stack only | layout.tsx |
| C2 | Added `optimizePackageImports` for lucide-react + framer-motion | next.config.ts |
| C3 | LazyMotion + `m` component in page.tsx phase containers | page.tsx |
| C4 | MotionConfig `reducedMotion="user"` wrapper | page.tsx |
| C5 | Detail overlay: role="dialog", aria-modal, aria-label, Escape key | page.tsx |
| C6 | ARIA live region for workflow progress (sr-only) | page.tsx |
| C7 | Focus-visible styles + sr-only utility class | globals.css |
| C8 | PDF magic byte validation (%PDF- header) | UploadZone.tsx |

Build: 2.9s → 1.0s (66% improvement)

### Phase 4 Implementation Summary (High Tier)

| # | Change | Files Modified |
|---|--------|---------------|
| H1 | `useTransition()` for non-blocking phase dispatches | page.tsx |
| H3 | `will-change: transform` + `translateZ(0)` on glass/step/batch elements | globals.css |
| H5 | Contrast audit: `#64748b`→`#94a3b8` (6.8:1), `#475569`→`#7c8ca0` (5.0:1) | 10 component files + globals.css |
| H6 | Keyboard: dropzone `role=button`+tabIndex, result rows Enter/Space, aria-labels | UploadZone.tsx, BatchResultsDashboard.tsx |
| H7 | Removed `unsafe-eval` from CSP script-src | next.config.ts |
| H8 | Token bucket rate limiter (10 req/min per IP) on /api/audit | route.ts |
| H9 | CJK line-height 1.7 on body | globals.css |
| H10 | Status badges already include icon + text (verified) | -- |

Deferred: H2 (TanStack Virtual — requires new dep, Phase 6), H4 (layoutId — lower impact)

### Phase 4 Implementation Summary (Research-Driven Additions)

| # | Change | Files Modified |
|---|--------|---------------|
| R1 | `prefers-reduced-transparency` media query — glass panels fall back to solid bg | globals.css |
| R2 | `aria-sort` on sortable table headers (ascending/descending/none) | BatchResultsDashboard.tsx |
| R3 | Focus trap in detail modal — Tab cycles within dialog, auto-focus on open | page.tsx |

Phase 4 Final Score: 19/24 checklist items done (8 Critical + 8 High + 3 Research-driven)

---

## Phase 5: Backend Integration -- PENDING

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Dify API integration (SSE streaming) | pending | Route handler proxy at /api/audit |
| 5.2 | Mock/Live mode toggle via DEMO_MODE | pending | .env.example created |
| 5.3 | File upload to Dify | pending | PDF base64 or multipart |
| 5.4 | Error handling + retry logic | pending | Network errors, timeout |

---

## Phase 6: Polish & Delivery -- PENDING

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Light mode toggle | pending | Critical for well-lit demo environments |
| 6.2 | OCR scanning animation (step 4) | pending | Handwriting recognition visualization |
| 6.3 | Virtual scrolling for 100+ files | pending | Performance for large batch uploads |
| 6.4 | Keyboard accessibility | pending | Tab order, ARIA, shortcuts |
| 6.5 | E2E testing suite | pending | Happy path + error cases |
| 6.6 | Performance audit (Lighthouse 90+) | pending | |
| 6.7 | Deploy to Vercel/CF Pages | pending | |
| 6.8 | Demo recording / screenshots | pending | For client presentation |
| 6.9 | PDCA doc closeout | pending | Three-end consistency |

---

## Performance Baseline (2026-03-10)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Bundle (gzipped) | 217KB | < 500KB | OK (43% budget used) |
| JS chunks | 7 | -- | Turbopack auto-split |
| Largest chunk (gz) | 68.5KB | -- | Framer Motion + React |
| Build time | ~3s | < 10s | OK |
| Static pages | 2 (/ + /_not-found) | -- | |
| Dynamic routes | 1 (/api/audit) | -- | |

## Tech Stack

| Layer | Version | Notes |
|-------|---------|-------|
| Next.js | 16.1.6 | App Router + Turbopack |
| React | 19.2.3 | Concurrent features available |
| Framer Motion | 12.35.2 | Layout animations + AnimatePresence |
| TailwindCSS | 4.x | CSS variable system |
| Node | 25.6.0 | |
| pnpm | 10.28.2 | |

---

Maurice | maurice_wen@proton.me
