# Task Plan -- 21-dify-demo

> 灵阙智能体平台 Demo | Enterprise Agent Platform v3.0 | Full B2B SaaS Demo

## Status: active

## Objective

从单页报销审核 Demo 升级为完整的灵阙企业智能体平台 Demo，复刻 `07-lingque-professional` 的 B2B SaaS 架构，覆盖 8 个用户页面 + 完整功能闭环。

**品牌双色系**: 平台 = Sky Blue (#0284C7/#0369A1)，智能体 = Jade Teal (#0D9488/#0F766E)
**设计语言**: Light theme + frosted glass (backdrop-blur) + Framer Motion 微交互

**Current baseline (2026-03-12)**: Next.js 16 多页平台，10 条路由（8 用户页 + 1 API + 1 404）。

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

## Phase 5: Backend Integration -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Dify API integration (SSE streaming) | done | dify-client.ts + route.ts dual-mode SSE (v2.2) |
| 5.2 | Mock/Live mode toggle via DEMO_MODE | done | .env.local: DEMO_MODE=false activates real API |
| 5.3 | File upload to Dify | done | POST multipart /v1/files/upload via dify-client.ts |
| 5.4 | Error handling + retry logic | done | AbortController + named SSE error events |

---

## Phase 6: Polish & Delivery -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Light mode toggle | done | CSS vars + data-theme + ThemeToggle + overlay-bg |
| 6.2 | OCR scanning animation (step 4) | done | CSS scan line on step 4 active state |
| 6.3 | Virtual scrolling for 100+ files | done | @tanstack/react-virtual on BatchResultsDashboard |
| 6.4 | Keyboard accessibility | done | Phase 4: focus trap, Tab cycling, aria-sort, role=button, focus-visible |
| 6.5 | E2E testing suite | deferred | Needs Playwright setup; can be done post-launch |
| 6.6 | Performance audit (Lighthouse 90+) | done | Perf 98 / A11y 100 / BP 100 / SEO 100 |
| 6.7 | Deploy to Vercel | done | https://21-dify-demo.vercel.app |
| 6.8 | Demo screenshots | done | 6 screenshots: upload/light/files/workflow/results/detail |
| 6.9 | PDCA doc closeout | done | This update |

### Phase 6.10: Baseline Alignment -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.10.1 | Fix React 19 lint blockers | done | Removed synchronous setState inside effects |
| 6.10.2 | Clear obvious lint warnings | done | Unused imports + aria-sort + React Compiler warning handling |
| 6.10.3 | Sync docs to actual `/` + `/api/audit` structure | done | CLAUDE + PDCA docs + doc/index updated |

### Phase 6.11: Governance Completion -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.11.1 | Create project and initiative doc indexes | done | `doc/00_project/index.md` + initiative `index.md` |
| 6.11.2 | Create closeout docs | done | `deliverable.md` + `PDCA_ITERATION_CHECKLIST.md` |
| 6.11.3 | Initialize rolling ledger | done | `ROLLING_REQUIREMENTS_AND_PROMPTS.md` with REQ/PROMPT/AR sections |
| 6.11.4 | Update notes and doc map | done | doc inventory reflects actual canonical set |

### Phase 6 Implementation Summary

| # | Change | Files Modified |
|---|--------|---------------|
| 6.1 | CSS custom properties for theming, `data-theme` attribute, ThemeToggle component, light mode overrides for all components | globals.css, Header.tsx, page.tsx, + all 10 component files (color variable migration) |
| 6.2 | OCR scan line animation on step 4 (CSS-only, `@keyframes ocrScan`) | globals.css, StepCard.tsx |
| 6.3 | `@tanstack/react-virtual` virtualizer on results table (ROW_HEIGHT=48, VISIBLE_ROWS=10, overscan=5) | BatchResultsDashboard.tsx |
| 6.4 | Focus trap, Tab cycling, aria-sort, role=button, dropzone keyboard, focus-visible | Phase 4 work (page.tsx, UploadZone.tsx, BatchResultsDashboard.tsx, globals.css) |
| 6.6 | `<main>` landmark, aria-label text match fix, Lighthouse audit | page.tsx, UploadZone.tsx |

---

## Lighthouse Scores (2026-03-12, v3.1 production build)

| Route | Perf | A11y | BP | SEO | Target |
|-------|------|------|----|-----|--------|
| `/` | 92 | 100 | 100 | 100 | 90+ |
| `/audit` | 98 | 100 | 100 | 100 | 90+ |
| `/workflows` | 92 | 100 | 100 | 100 | 90+ |
| `/workflows/expense-audit` | 92 | 100 | 100 | 100 | 90+ |

All routes pass all targets. CLS fixed from 0.173→0 via `initial={false}` on sidebar.

### Core Web Vitals

| Metric | Value | Rating |
|--------|-------|--------|
| FCP | 0.8s | Good |
| LCP | 2.3s | Good |
| TBT | 470ms | Needs improvement |
| CLS | 0.054 | Good |

---

## Performance Baseline (2026-03-10)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Bundle (gzipped) | 217KB | < 500KB | OK (43% budget used) |
| JS chunks | 7 | -- | Turbopack auto-split |
| Largest chunk (gz) | 68.5KB | -- | Framer Motion + React |
| Build time | ~1.0s | < 10s | OK |
| Static pages | 2 (/ + /_not-found) | -- | |
| Dynamic routes | 1 (/api/audit) | -- | |

## Tech Stack

| Layer | Version | Notes |
|-------|---------|-------|
| Next.js | 16.1.6 | App Router + Turbopack |
| React | 19.2.3 | Concurrent features (useTransition) |
| Framer Motion | 12.35.2 | LazyMotion + AnimatePresence |
| TailwindCSS | 4.x | CSS variable system + custom properties |
| @tanstack/react-virtual | 3.13.21 | Virtual scrolling for results table |
| Node | 25.6.0 | |
| pnpm | 10.28.2 | |

---

## Phase 7: v3 Platform Migration -- DONE

从 v2.x 单页审核 Demo 升级为灵阙企业智能体平台完整 Demo。

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Sidebar navigation (collapsible 64px↔256px) | done | Framer Motion layoutId active indicator |
| 7.2 | Platform home page `/` (agent card grid) | done | 8 enterprise agents, status badges, search/filter |
| 7.3 | Audit detail page `/audit` (original v2 single-page) | done | Preserved all v2 功能 under new route |
| 7.4 | Workflow list `/workflows` | done | Card grid + status badges + trigger type |
| 7.5 | Workflow editor `/workflows/expense-audit` | done | GoldenRatio 38.2/61.8 + n8n branching canvas |
| 7.6 | Template gallery `/templates` | done | Category tabs + card grid + badge system |
| 7.7 | Knowledge base `/knowledge` | done | KB cards + status (active/indexing/error) + stats panel |
| 7.8 | History (dual tab) `/history` | done | Conversations + Decision Audit timeline trace |
| 7.9 | Settings (double sidebar) `/settings` | done | 4 sections: 模型配置/数据管理/通知设置/安全权限 |
| 7.10 | Sidebar route activation (all 6 items enabled) | done | matchRoute() updated for all paths |
| 7.11 | Light theme + dual-color brand system | done | Sky Blue platform + Jade Teal agent |
| 7.12 | Shared data layer (`src/lib/`) | done | knowledge.ts + history.ts + workflows.ts |

### v3 Route Map

| Route | Page | Color |
|-------|------|-------|
| `/` | Agent list (home) | Jade Teal |
| `/audit` | Expense audit (v2 preserved) | Jade Teal |
| `/workflows` | Workflow list | Sky Blue |
| `/workflows/expense-audit` | Workflow editor (GoldenRatio) | Sky Blue |
| `/templates` | Template gallery | Sky Blue |
| `/knowledge` | Knowledge base list | Sky Blue |
| `/history` | History (conversations + audit traces) | Sky Blue |
| `/settings` | Platform settings (4 sections) | Sky Blue |
| `/api/audit` | SSE audit API | -- |
| `/_not-found` | 404 | -- |

---

## Phase 8.6: Lighthouse A11y Remediation -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.6.1 | Fix `link-name`: add aria-label to back arrow Link | done | expense-audit/page.tsx |
| 8.6.2 | Fix `landmark-one-main`: all 7 pages `<div>` → `<main>` | done | page.tsx, workflows/page.tsx, expense-audit/page.tsx, history, knowledge, templates, settings |
| 8.6.3 | Fix `heading-order`: left panel h3→h2, pipeline h2→h3 | done | expense-audit/page.tsx, WorkflowPipeline.tsx |
| 8.6.4 | Fix `color-contrast`: sidebar text #94a3b8→#64748B, active nav #0D9488→#0B7A72, idle opacity 0.72→0.88 | done | Sidebar.tsx, WorkflowPipeline.tsx |

Result: A11y 87 → **100** (both `/` and `/workflows/expense-audit`)

---

## Phase 8.5: v3.1 Visual Refinement -- DONE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.5.1 | WorkflowPipeline complete redesign | done | 2-row grid (5+5), color-coded types (6 palettes), glassmorphism cards, dot-grid canvas, type badges, decision IF node |
| 8.5.2 | Layout rebalance (editor page) | done | Left panel 38.2% -> 45%, right canvas 61.8% -> 55% |
| 8.5.3 | Remove all n8n references | done | Tag "n8n" -> "SSE", comments cleaned, "n8n 工作流画布" -> "节点流程图" |
| 8.5.4 | Dify API env configuration | done | .env.local: DIFY_API_URL + DIFY_API_KEY + DEMO_MODE=false |
| 8.5.5 | Text readability (CJK line-clamp) | done | -webkit-line-clamp: 2 for step names in pipeline cards |

### WorkflowPipeline v2 Design Spec

- **Layout**: 2-row grid (5 steps per row) with centered turn connector
- **Step Types**: 6 color-coded categories (输入/处理/提取/判定/审核/输出)
- **Color Palette**: Blue #3B82F6 (input), Teal #0D9488 (process), Orange #EA580C (extract), Indigo #6366F1 (decision), Emerald #059669 (audit), Green #16A34A (output)
- **Card Design**: Glassmorphism + pastel type-colored bg (idle) / white (active/completed), 2px status-driven border, left accent stripe, 34px icon circle
- **Badges**: Type labels floating above card (top: -8px), IF badge for decision node
- **Connectors**: Horizontal chevron arrows (28px), dashed idle/active, solid completed; vertical turn connector between rows
- **Animations**: Framer Motion entrance (stagger 40ms), active pulse bar, breathing dot, status transitions
- **Decision Node**: Step 06 with indigo IF badge + branch labels (公务/商务/其他)

---

## Phase 8: SOP -- Real Role Workflows -- DONE

> 目标：为灵阙平台定义真实岗位角色、工作流、交付物与交接流程。

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Planning-with-files init + read task_plan/notes/PRD | done | This update |
| 8.2 | Define role roster + responsibility boundaries | done | 8 roles: PM/Designer/Architect/Engineer/QA/SRE/Security/Data |
| 8.3 | Define per-role input/output artifacts + acceptance criteria | done | Role Workflow Matrix in task_plan + PRD S10 |
| 8.4 | Define handoff dependencies + collaboration flow | done | Collaboration DAG + Sprint Lifecycle |
| 8.5 | Write to PRD Section 10 + deliverable.md | done | PRD v3.0 S10 + deliverable.md v3.0 |
| 8.6 | PDCA 4-doc sync | done | SA v3.0 + UXM v3.0 + POP v3.0 + PRD v3.0 all updated |

### 8.2 Role Roster

| # | Role | Boundary | Owner |
|---|------|----------|-------|
| R1 | Product Manager (PM) | 需求定义、优先级、验收标准 | Maurice |
| R2 | UI/UX Designer | 视觉设计、交互原型、设计系统 | AI (Stitch Pipeline) |
| R3 | System Architect | 技术选型、模块边界、接口契约 | AI (Council Mode) |
| R4 | Frontend Engineer | 页面实现、组件开发、状态管理 | AI (Claude Code) |
| R5 | QA Engineer | 测试计划、用例执行、缺陷追踪 | AI + Maurice |
| R6 | SRE / DevOps | CI/CD、部署、监控、性能 | AI (Vercel + GitHub Actions) |
| R7 | Security Engineer | 安全审计、CSP、数据保护 | AI (Attacker Review) |
| R8 | Data Engineer | 数据模型、API 集成、Mock 数据 | AI (Claude Code) |

### 8.3 Role Workflow Matrix

#### R1: Product Manager (PM)

| Dimension | Detail |
|-----------|--------|
| **Inputs** | 客户需求（路桥集团）、市场竞品、用户反馈、业务场景 |
| **Outputs** | PRD.md, USER_EXPERIENCE_MAP.md, task_plan.md, ROLLING_REQUIREMENTS_AND_PROMPTS.md |
| **Tools** | Claude Code (PM skills), Council brainstorm, Stitch Pipeline |
| **Acceptance** | PRD 覆盖所有功能点 + 验收标准可量化 + PDCA 4 文档一致 |
| **Handoff to** | R2 (设计需求), R3 (技术约束), R5 (测试用例) |

#### R2: UI/UX Designer

| Dimension | Detail |
|-----------|--------|
| **Inputs** | PRD 功能描述, USER_EXPERIENCE_MAP, 品牌规范 (双色系 + Light theme) |
| **Outputs** | 设计稿 (21st-magic variants), 组件规范, 交互动效定义, globals.css 设计 token |
| **Tools** | Stitch Pipeline (5-step: PRD→Variants→Compare→Implement→PDCA), 21st-magic component builder |
| **Acceptance** | 品牌一致 (Sky Blue + Jade Teal) + 响应式 1280px+ + WCAG AA + 动效 60fps |
| **Handoff to** | R4 (实现), R5 (视觉回归测试) |

#### R3: System Architect

| Dimension | Detail |
|-----------|--------|
| **Inputs** | PRD 非功能需求, 技术约束 (Next.js 16 / React 19 / Framer Motion 12) |
| **Outputs** | SYSTEM_ARCHITECTURE.md, 模块划分, 接口契约 (API schema), 决策记录 (D-xxx) |
| **Tools** | Council Mode (multi-agent), Architecture Decision Records |
| **Acceptance** | 模块职责单一 + 接口向前兼容 + 决策有 pros/cons/risk + Mermaid 图更新 |
| **Handoff to** | R4 (模块实现), R6 (部署架构), R8 (数据模型) |

#### R4: Frontend Engineer

| Dimension | Detail |
|-----------|--------|
| **Inputs** | 设计稿 (R2), 架构文档 (R3), 数据模型 (R8), PRD 功能描述 |
| **Outputs** | React 组件, 页面路由, 状态管理, 动效实现 |
| **Tools** | Claude Code, Next.js App Router, Framer Motion, TailwindCSS |
| **Acceptance** | `next build` 零错误 + Lighthouse 90+ + 浏览器验证通过 + 代码可读 |
| **Handoff to** | R5 (测试), R6 (部署), R7 (安全审计) |

#### R5: QA Engineer

| Dimension | Detail |
|-----------|--------|
| **Inputs** | PRD 验收标准, 设计稿, 实现代码 |
| **Outputs** | 测试计划, 测试用例 (功能/视觉/性能/安全), 缺陷报告, Lighthouse 报告 |
| **Tools** | Playwright (E2E), Lighthouse, `next build` (type check), browser console |
| **Acceptance** | 所有 P0 用例通过 + Lighthouse 90+ 四项 + 零控制台错误 + 视觉回归 OK |
| **Handoff to** | R4 (缺陷修复), R1 (验收签字) |

#### R6: SRE / DevOps

| Dimension | Detail |
|-----------|--------|
| **Inputs** | 架构文档 (R3), 构建产物 (R4), 测试报告 (R5) |
| **Outputs** | Vercel 部署配置, GitHub Actions CI, 域名/SSL, 监控告警 |
| **Tools** | Vercel CLI, GitHub Actions, Lighthouse CI |
| **Acceptance** | 自动部署 main→production + PR preview + build < 60s + 99.9% uptime |
| **Handoff to** | R1 (上线确认), R7 (生产安全) |

#### R7: Security Engineer

| Dimension | Detail |
|-----------|--------|
| **Inputs** | 实现代码 (R4), 部署配置 (R6), CSP policy |
| **Outputs** | 安全审计报告, CSP/CORS/CSRF 配置, 漏洞修复建议 |
| **Tools** | Attacker Review (SubAgent), OWASP checklist, CSP evaluator |
| **Acceptance** | CSP strict-dynamic + 无 XSS/CSRF + API key server-only + 安全 headers 完整 |
| **Handoff to** | R4 (修复), R6 (headers 部署) |

#### R8: Data Engineer

| Dimension | Detail |
|-----------|--------|
| **Inputs** | PRD 数据模型, 架构文档 (R3), Dify API 文档 |
| **Outputs** | TypeScript interfaces (`src/lib/*.ts`), Mock 数据, API route handlers, SSE event schema |
| **Tools** | Claude Code, Dify API client, TypeScript |
| **Acceptance** | 类型安全 (strict TS) + Mock 数据覆盖全场景 + API 双模式 (mock/live) 可切换 |
| **Handoff to** | R4 (前端消费), R5 (数据测试) |

### 8.4 Collaboration DAG (交付依赖)

```
R1 (PM: PRD + UXM)
 ├──→ R2 (Designer: 设计稿)
 │     └──→ R4 (Engineer: 实现)
 ├──→ R3 (Architect: SA + 接口)
 │     ├──→ R4 (Engineer: 模块实现)
 │     ├──→ R6 (SRE: 部署架构)
 │     └──→ R8 (Data: 数据模型)
 │           └──→ R4 (Engineer: 数据消费)
 └──→ R5 (QA: 测试计划)
       └──→ [等待 R4 实现完成]
              ├──→ R5 (QA: 执行测试)
              │     └──→ R4 (缺陷修复) ──→ R5 (回归)
              ├──→ R7 (Security: 安全审计)
              │     └──→ R4 (修复) ──→ R7 (复验)
              └──→ R6 (SRE: 部署)
                    └──→ R1 (PM: 上线验收)
```

**关键路径**: R1→R3→R8→R4→R5→R6→R1 (PM 发起 → PM 验收)
**并行窗口**: R2 与 R3 可并行；R5 与 R7 可并行

---

Maurice | maurice_wen@proton.me
