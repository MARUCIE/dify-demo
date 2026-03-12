# Notes -- 21-dify-demo

> 灵阙智能体平台 Demo | Working Notes

---

## 2026-03-12 -- v3.1 Visual Refinement (WorkflowPipeline Redesign)

### Problem
WorkflowPipeline went through 4 failed iterations:
1. SVG nodes too small (5:1 aspect ratio viewBox in 4:3 container)
2. SVG nodes too big (height: 100% + aspect-ratio overflow)
3. SVG capped height (still wrong proportions)
4. HTML cards 200px horizontal scroll (functional but "不好看")

### Solution: 2-Row Grid + Color-Coded Types
Studied 07-lingque-professional's DemoWorkflowPreview + PipelineVisualizer + ExecutionCanvas for design inspiration. Key findings:
- Lingque uses HTML flex cards (280px) not SVG for read-only pipelines
- Color-coded step types (blue/purple/orange/green) per node category
- Glassmorphism: `bg-white/60 backdrop-blur-xl`, `rounded-2xl`
- Status-driven borders with Framer Motion animations

### Changes Made
| File | Change |
|------|--------|
| `WorkflowPipeline.tsx` | Complete rewrite: 2-row grid (5+5), 6 color-coded types, glassmorphism, dot-grid canvas, type badges, decision IF node, -webkit-line-clamp:2 |
| `expense-audit/page.tsx` | Layout 38.2% -> 45%, "n8n 工作流画布" -> "节点流程图" |
| `workflows.ts` | Tag "n8n" -> "SSE" |
| `AnimatedBackground.tsx` | Removed n8n comment |
| `.env.local` | DIFY_API_URL + DIFY_API_KEY + DEMO_MODE=false |

### Key Technical Learnings
- **2-row grid > horizontal scroll**: 10 steps in a single row requires 1000px+ horizontal scroll. Two rows of 5 fit in ~700px containers with no scroll.
- **Color-coded step types via `Record<number, StepType>`**: Maps step IDs to semantic categories (input/process/extract/decision/audit/output), each with distinct pastel bg + accent color.
- **`-webkit-line-clamp: 2`**: Critical for CJK text in flex cards. `white-space: nowrap` truncates 4-char Chinese names; line-clamp allows 2-line wrap while keeping overflow ellipsis.
- **8-digit hex alpha**: `${accent}22` appends 2 hex digits for CSS Level 4 alpha (e.g., `#3B82F622` = 13% opacity blue). Supported in all modern browsers.
- **React Fragment with key**: `<Fragment key={step.id}>` allows multiple flex children per iteration without extra DOM wrapper.

---

## 2026-03-12 -- Lighthouse A11y 87 → 100

### Failures Fixed (4)
| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `link-name` | Back arrow `<Link>` had icon-only, no accessible name | Added `aria-label="返回工作流列表"` |
| `landmark-one-main` | All 7 pages used `<div>` as root wrapper | Changed to `<main>` on all pages |
| `heading-order` | `h1 → h3` skipped `h2` in left panel; `h2` in pipeline was lower than `h3` | Left panel `h3 → h2`, pipeline `h2 → h3` |
| `color-contrast` | Sidebar: `#94a3b8` on white = 2.55:1; active nav `#0D9488` on teal bg = 3.39:1 | `#94a3b8 → #64748B` (4.6:1), `#0D9488 → #0B7A72` (4.7:1); pipeline idle opacity 0.72 → 0.88 |

### Files Changed
`Sidebar.tsx`, `WorkflowPipeline.tsx`, `expense-audit/page.tsx`, `page.tsx` (root), `workflows/page.tsx`, `history/page.tsx`, `knowledge/page.tsx`, `templates/page.tsx`, `settings/page.tsx`

### Additional Fixes (same session)
- **CLS 0.173→0**: Added `initial={false}` to sidebar `motion.aside` — prevents hydration layout shift from width animation
- **Tag contrast on /workflows**: `#64748b` on `#f1f5f9` = 4.34:1 → `#475569` = 7.1:1
- **Heading order on /workflows + /**: Card titles `h3→h2`, preview panel `h4→h3`

### Lighthouse Final Scores (production build, all 4 routes)
| Route | Perf | A11y | BP | SEO |
|-------|------|------|----|-----|
| `/` | 92 | 100 | 100 | 100 |
| `/audit` | 98 | 100 | 100 | 100 |
| `/workflows` | 92 | 100 | 100 | 100 |
| `/workflows/expense-audit` | 92 | 100 | 100 | 100 |

---

## 2026-03-12 -- v3.0 Platform Migration

### What Changed
从 v2.x 单页报销审核 Demo 升级为灵阙企业智能体平台完整 Demo (8 user-facing pages)。

**新增页面**:
1. `/` — Agent list home (8 enterprise agents, search/filter, Jade Teal brand)
2. `/workflows` — Workflow list (card grid, status badges, trigger type)
3. `/workflows/expense-audit` — GoldenRatio 38.2/61.8 workflow editor + n8n branching canvas
4. `/templates` — Template gallery (category tabs, card grid)
5. `/knowledge` — Knowledge base list (5 KBs, status badges, stats panel)
6. `/history` — Dual-tab: Conversations + Decision Audit (timeline trace visualization)
7. `/settings` — Double sidebar (4 sections: 模型配置/数据管理/通知/安全)
8. `/audit` — Original v2 expense audit (preserved under new route)

**设计语言统一**:
- Dual-color brand: Platform = Sky Blue (#0284C7), Agent = Jade Teal (#0D9488)
- Light theme mandatory: `bg-white/70 backdrop-blur`, borders `rgba(226,232,240,0.8)`
- PageHeader pattern: sticky, frosted glass, title + stats + actions
- Collapsible sidebar: 64px↔256px with Framer Motion layoutId
- Card grid with `auto-fill, minmax(300px, 1fr)` responsive columns

**新增数据层**:
- `src/lib/knowledge.ts` — 5 enterprise KBs (报销政策/合同模板/财务制度/公文规范/法律法规)
- `src/lib/history.ts` — 7 conversations + 4 audit traces with step-level timeline
- `src/lib/workflows.ts` — Workflows + templates data definitions

**Sidebar 升级**:
- All 6 menu items enabled (was 3 disabled)
- `matchRoute()` covers all paths including `/audit` → agents active indicator

### Key Technical Learnings
- **n8n Branching Canvas**: Horizontal DAG with WorkflowNode + DecisionNode + connection lines. SVG path rendering for bezier curves between nodes, with animated stroke-dasharray for flow direction
- **GoldenRatio Layout**: `flex: '0 0 38.2%'` (left panel) + `flex: 1` (right canvas). The golden ratio creates a natural visual balance between config and visualization
- **Double Sidebar Pattern**: Settings page nests a second nav inside the main content area. Outer sidebar = platform nav, inner sidebar = settings sub-nav. Key: inner sidebar needs `flexShrink: 0` and fixed width (200px)
- **Timeline Trace Visualization**: Each audit trace step rendered as a vertical timeline with status-colored dots, duration bars, and expandable error details. Uses Framer Motion staggered entrance

### SOP: Real Role Workflows (Phase 8)
- Defined 8 roles: PM / Designer / Architect / Engineer / QA / SRE / Security / Data
- Each role has: Input artifacts → Output artifacts → Acceptance criteria → Handoff dependencies
- Collaboration DAG: PM→Architect→Data→Engineer→QA→SRE→PM (critical path)
- Parallel windows: Designer ∥ Architect; QA ∥ Security

---

## 2026-03-11 -- Baseline Alignment (lint + docs)

### What changed
- 当前运行时基线确认：Next.js `16.1.6` + React `19.2.3`，入口是 `/`，不是 `/demo/*`
- 新增 `pnpm typecheck` 脚本，补齐最基础的 TS 校验入口
- `Header.tsx` 去掉 effect 内同步 `setState`；主题切换改为直接读写 `document.documentElement[data-theme]`
- `BatchResultsDashboard.tsx` 的动画计数器改为 RAF 驱动，避免 React 19 lint 命中的同步 state 写入
- 结果表排序头改成 `columnheader + button` 组合，避免 `aria-sort` 放在 button 上
- 清理未使用 import，并对 `useVirtualizer()` 的 React Compiler 警告做显式说明

### Documentation sync
- `doc/index.md` 新建，补齐项目路径索引
- `PRD.md` / `SYSTEM_ARCHITECTURE.md` / `USER_EXPERIENCE_MAP.md` / `PLATFORM_OPTIMIZATION_PLAN.md` 已回写实际结构
- 重点修正：Next.js 版本、单页路由、`/api/audit` 请求字段、`WorkflowPipeline` 内联步骤卡片

### Remaining governance gaps
- `deliverable.md` / `PDCA_ITERATION_CHECKLIST.md` / `ROLLING_REQUIREMENTS_AND_PROMPTS.md` 已建立
- `doc/00_project/index.md` 与 initiative `index.md` 已建立
- 仍待后续任务补齐：`ai check`、UX map 人工模拟验收、live mode 凭证验证、HTML snapshot 重生成

---

## 2026-03-10 -- Project Kickoff

### Source Project
- Scaffold from: `07-lingque-professional` (B-end)
- Path: `/Users/mauricewen/Projects/07-lingque-professional`
- Stack: Next.js 15 + TailwindCSS + shadcn/ui
- Plan: copy scaffold, strip business logic, keep layout/auth shell

### Dify Demo Reference
- Demo URL: https://agentdemo.hegui.cn
- This is the existing Dify workflow that we are building a custom frontend for
- The workflow has 10 steps for expense reimbursement audit

### Test Data
- Test PDF: `KDBABXD2507090055.pdf`
- Content: 路桥集团费用报销单
- Amount: 470 CNY
- Expected output:
  - 招待类型：公务接待
  - 审核建议：人工复核
  - Issues: 菜品清单缺失, 陪餐人员信息不完整, 报销日期超过有效期限

### Design Direction
- **风格**: Professional, modern, corporate (国企审美)
- **色调**: Deep blue primary, clean whites/grays, status colors (red/green/amber)
- **动画**: Polished but not flashy -- confident, trustworthy feel
- **参考**: Government/SOE portal design language, but modernized
- **核心亮点**: 10-step workflow pipeline with step-by-step animation
  - Each step lights up sequentially
  - Connector lines show flowing progress
  - Active step has pulse/glow effect
  - Completed steps show green checkmark
  - Error steps shake and highlight red

### 10-Step Workflow Detail

```
1. 报销资料输入      -> Input: PDF file + optional date
2. 报销过期日判定    -> Check: is the claim within valid date range?
3. 报销单据拆分      -> Split: separate individual receipts from bundle
4. 报销单据识别      -> OCR: identify receipt types (invoice, menu, etc.)
5. 提取接待类型信息  -> Extract: pull reception-related fields
6. 判断接待类型      -> Classify: official reception vs other types
7. 公务接待单据审核  -> Audit: validate required documents for official reception
8. 公务接待审核内容汇总 -> Summarize: compile audit findings
9. 审核结果编排      -> Format: arrange results for presentation
10. 审核结果输出     -> Output: final structured result
```

### Architecture Notes
- Mock mode is critical for offline demos (client sites may not have internet)
- SSE streaming for real-time step progress updates
- API key must be server-side only (Next.js Route Handler proxy)
- Consider pre-recording a demo video as backup

### Open Items
- [ ] Confirm Dify API supports SSE streaming for workflow progress
- [ ] Get Dify API key for agentdemo.hegui.cn
- [ ] Collect more test PDFs for different scenarios
- [ ] Design research: similar SOE/government AI demo portals

---

## 2026-03-10 -- v2.0 Product Pivot: Batch Audit System

### Business Insights (User Feedback)
路桥集团真实业务场景与单文件 demo 有根本差异：

1. **偏远工地环境**: 项目在宜宾挂弓山等不开放的小地方，基础设施有限
2. **大量手写单据**: 公务接待审批单、接待清单等多为现场手写填写
   - OCR 难度远高于打印文档
   - 需要展示手写识别置信度
   - 这是最能体现 AI 能力的 "wow point"
3. **批量审核场景**: 财务集中处理时，一次几十到数百笔报销需同时审核
   - 文件夹拖拽上传（不是一个个选文件）
   - 批量进度看板
   - 汇总统计（通过/复核/不通过）
4. **离线演示**: 工地可能无稳定网络，Mock 模式必须完整可用

### Design Pivot: Single-Screen Progressive Disclosure
从"上下滚动三段式"改为"一屏渐进披露"：
- Phase 1 [上传态]: 全屏 dropzone → 文件列表
- Phase 2 [审核态]: 上传缩为顶栏 → 左侧工作流 + 右侧批量进度
- Phase 3 [结果态]: 审核缩为完成条 → 批量结果仪表盘
- Phase 4 [详情态]: 点击展开单笔详细问题列表
全程 100vh 无滚动。

### Design Iteration Timeline
- v1 Variant 1 (Corporate Minimal): 6.55 -- REJECTED (不够炫酷)
- v1 Variant 2 (Tech Dashboard): 7.45 -- 备选
- v1 Variant 3 (Hybrid Professional): 6.85 -- REJECTED
- v1 Variant 4 (Dark Futuristic): 8.65 -- WINNER (v1)
- **v2 Variant 5 (Progressive Batch)**: 目标方案 -- 单屏 + 批量 + 手写 OCR

### Handwriting OCR Visualization Ideas
- 上传表格增加"手写比例"列（进度条，红色=高比例手写）
- 步骤 4（报销单据识别）执行时，显示 OCR 过程动画：
  - 扫描线从上到下扫过文档
  - 手写字段逐个被框选高亮
  - 置信度百分比在框旁显示
- 最终结果标注哪些字段是手写识别的 + 置信度

---

## 2026-03-10 -- v2.0 Swarm Optimization Session

### Council Review (4-Agent Parallel)
Launched PM + UX Designer + Frontend Engineer + Security agents for comprehensive audit.

### Completed Optimizations

**Round 1 -- Space & Layout**
- Header/StatsBar/UploadZone margins compressed from 128px to ~28px total wasted space
- Full flex fill chain from `h-screen` root through 7 layers to dropzone leaf
- `mb-10` patterns removed, replaced with `flex-1 flex flex-col min-h-0`
- WorkflowPipeline + BatchProgress adapted to fill parent height

**Round 2 -- Code Quality**
- Extracted shared `SUGGESTION_BADGE` constant (was duplicated in 2 components)
- Added `TOTAL_STEPS` constant; removed hardcoded `10` in reducer
- Deleted unused `MockFileInfo` interface + `MOCK_FILES` array from mock-data.ts
- Fixed all `ease: [0.4, 0, 0.2, 1]` arrays with `as const` for TS tuple inference

**Round 3 -- Visual Polish**
- Glass depth: inset highlight + drop shadow on `.glass` and `.glass-bright`
- Conic gradient spinning border on empty dropzone (hover/dragover)
- Premium upload icon: 88x88 with gradient bg + outer pulsing ring
- Glass-shimmer sweep on StatsBar (blue-purple gradient)
- Glow effects boosted ~50% across all classes
- Connector active width 30%->40%, glow 12px->18px
- Success-shimmer 0.08->0.15 alpha
- FileCard breathing glow amplified (inset 0.06/0.14, outer 0.12/0.22)
- Dark-themed scrollbars (was light color on dark bg)
- `stat-number` letter-spacing: -0.02em

**Round 4 -- Functionality**
- Copy button handlers: ResultPanel + BatchResultsDashboard (clipboard API + fallback)
- Export PDF buttons marked as "即将上线" with disabled state
- Date picker: `max` attribute prevents future date selection
- `.env.example` created with DIFY_API_URL + DIFY_API_KEY + DEMO_MODE

**Round 5 -- Security**
- Security headers in next.config.ts: CSP, X-Frame-Options DENY, nosniff, strict referrer
- CSP allows `connect-src` to api.dify.ai for future API integration

**Round 6 -- Accessibility**
- `prefers-reduced-motion` media query disables all animations + hides particles

### Key Learnings
- **Flex Fill Chain**: From root `h-screen` to innermost dropzone, every parent needs `flex flex-col` + `flex-1 min-h-0`. Breaking at ANY level nullifies child `flex-1`
- **Framer Motion 12 + TS**: `ease` tuple arrays need `as const` or TS widens to `number[]`
- **`webkitGetAsEntry()` API**: Only way to recursively scan folder drops in browser
- **Canvas Noise Overlay**: `200x200 canvas + random grayscale pixels at alpha=8` for cinematic texture (in AnimatedBackground)

### Deferred Items (tracked)
- [ ] Light mode toggle (~2-3h, critical for well-lit demo environments)
- [x] ~~Dify API integration~~ (DONE v2.2)
- [ ] OCR scanning animation during step 4
- [ ] Connector flowing particle effect (partial -- CSS only, no JS particles between steps)
- [ ] Virtual scrolling for 100+ files
- [ ] Keyboard accessibility (ARIA labels, shortcuts)
- [x] ~~PDCA doc sync~~ (DONE v2.2)
- [ ] Testing suite
- [ ] Get real DIFY_API_KEY for agentdemo.hegui.cn to test live mode

---

## 2026-03-11 -- v2.2 Dify API Integration + n8n Background + PDCA

### Changes Made

**1. Dify API Integration (dual-mode SSE)**
- NEW `src/lib/dify-client.ts` (~200 lines): server-side Dify API client
  - `uploadFileToDify()`: POST multipart to /v1/files/upload
  - `runWorkflowStream()`: POST JSON to /v1/workflows/run with configurable input vars
  - `parseDifyOutput()`: robust parser (JSON object / JSON string / plain text -> AuditResult)
  - `matchStepByTitle()`: fuzzy matches Dify node titles to 10-step workflow via Chinese keywords
  - `SKIP_NODE_TYPES`: filters internal Dify nodes (start, end, if-else, variable-aggregator, answer)
- REWRITE `src/app/api/audit/route.ts`: dual-mode SSE endpoint
  - `mockStream()`: async generator with realistic delays from MOCK_STEP_DELAYS
  - `difyStream()`: upload -> workflow -> translate Dify events -> emit custom SSE events
  - Named SSE event types: step_start, step_done, result, error, done
- MODIFY `src/app/page.tsx`: SSE consumer with AbortController for cancellation
  - `handleStartAudit(auditDate)`: FormData per file -> ReadableStream reader -> dispatch actions
  - `handleReset()`: aborts running requests via `abortRef.current?.abort()`
- MODIFY `src/components/upload/UploadZone.tsx`: pass auditDate to onStartAudit callback

**2. SubDocument Model (merged PDF splitting)**
- MODIFY `src/lib/types.ts`: added SubDocument interface + SUB_DOC_TYPES constant (6 standard types)
- MODIFY `src/lib/mock-data.ts`: 5 realistic SRBG cases with full subDocuments arrays
  - Case 1: 人工复核 (mirrors real KDBABXD2507090055.pdf, 470 yuan, 超期271天)
  - Case 2: 通过 (all docs complete, amounts match)
  - Case 3: 人工复核 (OCR 置信度62%, 商务接待)
  - Case 4: 不通过 (3 critical docs missing, amount mismatch)
  - Case 5: 人工复核 (budget discrepancy, guest list incomplete)
- MODIFY `src/components/result/ResultPanel.tsx`: added 单据拆分识别 grid section + amount display

**3. n8n-Style Node Flow Background**
- REWRITE `src/components/layout/AnimatedBackground.tsx`: SVG node flow network
  - 16 nodes: Row 1 (7 left->right), Row 2 (6 right->left), Branch (3 downward)
  - 15 bezier connections via `edgePath()` (auto-detects horizontal vs vertical)
  - Each node: rounded rect + left color stripe + input/output ports + 2 text lines
- BACKUP `src/components/layout/AnimatedBackground.particles.tsx`: original particle version
- MODIFY `src/app/globals.css`: replaced particle classes with flow-* classes
  - `@keyframes flowDash`: stroke-dashoffset 0 -> -13 (2.5s linear infinite)
  - `@keyframes nodeWave`: opacity 0.7 -> 1.0 (20s, 5-10% bright window)
  - Opacity tuned 3 iterations: initial (invisible) -> 2x boost -> 3x boost (visible through glass)

**4. PDCA Documentation Sync**
- PRD.md v2.2: SubDocument types table, actual SSE event schema, resolved open questions
- SYSTEM_ARCHITECTURE.md v2.2: n8n background, dify-client.ts, event translation layer, decisions D-006/D-007/D-008
- USER_EXPERIENCE_MAP.md v2.1: n8n animations, SubDocument UX step, updated component inventory
- PLATFORM_OPTIMIZATION_PLAN.md: marked Dify API + n8n background as DONE, updated roadmap

### Key Technical Learnings

- **SVG background opacity through glassmorphism**: effective_alpha = base_alpha * animation_opacity * glass_transparency. Initial 0.025 * 0.45 * 0.5 = 0.006 (invisible). Final 0.08 * 0.7 * 0.5 = 0.028 + stroke 0.3 (visible)
- **fetch+ReadableStream vs EventSource for SSE**: EventSource doesn't support POST body or named event types. fetch+ReadableStream is more flexible for API proxy patterns
- **Dify event translation**: Dify returns fine-grained node events with Chinese titles. `matchStepByTitle()` uses keyword arrays to fuzzy-match to our 10-step pipeline
- **AbortController for SSE cancellation**: critical for batch mode reset -- without it, abandoned requests continue consuming server resources

### Open Items
- [ ] Get real DIFY_API_KEY to test live mode end-to-end
- [ ] File drop scanning animation (step 4 OCR visualization)
- [x] ~~Light mode toggle for well-lit demo environments~~ (theme toggle exists, dark default)

---

## 2026-03-11 -- v2.3 Stitch Pipeline: Dark Theme Unification

### Problem
UI was "新老混合" -- inconsistent mix of old dark-theme components (glass morphism, glows) rendered against new light-theme CSS variables. Root cause:
- `layout.tsx` `<html>` tag had no `data-theme` attribute -> `:root` (light) CSS vars applied on SSR
- `ThemeToggle` in Header.tsx defaulted to `'light'`, only set `data-theme` after hydration via `useEffect`
- Date picker had hardcoded `rgba(255,255,255,0.8)` background
- This created FOUC: dark-designed components on light variables

### Stitch Pipeline Execution
- Phase 1 (Requirements): extracted from PRD v2.2, identified 4 phase UI + dark glass design language
- Phase 2 (Variants): researched via 21st-magic (dark upload dashboards, hero sections, dropzones)
- Phase 3 (Compare): Option A (fix light theme) vs Option B (restore dark default + integrate n8n) -> B wins
- Phase 4 (Implementation): 4 files modified
- Phase 5 (PDCA sync): docs updated

### Changes Made
1. `src/app/layout.tsx`: added `data-theme="dark"` to `<html>` tag (SSR dark from first paint)
2. `src/components/layout/Header.tsx`: ThemeToggle default `'light'` -> `'dark'`, `useEffect` resolves `saved ?? 'dark'`
3. `src/app/globals.css`: dark-mode n8n flow colors switched from `rgba(13,148,136,*)` to brighter `rgba(45,212,191,*)` for better contrast on #020617
4. `src/components/upload/UploadZone.tsx`: date picker `rgba(255,255,255,0.8)` -> `var(--glass-bg)`, `colorScheme: 'light'` -> `'inherit'`

### Key Learning
- **SSR theme 同步**: `data-theme` must be on `<html>` at SSR time, not set by client-side `useEffect`. Otherwise first paint uses wrong CSS variables -> FOUC
- **color-scheme inheritance**: native form elements (date input) inherit `color-scheme` from parent CSS. Setting `color-scheme: dark` on `body` propagates to all inputs without per-element overrides

### Open Items
- [ ] Get real DIFY_API_KEY to test live mode end-to-end
- [ ] File drop scanning animation (step 4 OCR visualization)
- [ ] Light mode polish (when toggled, verify all components adapt cleanly)

---

Maurice | maurice_wen@proton.me
