# PRD -- 灵阙智能体平台 Demo

> Product Requirements Document | v3.1 | 2026-03-13

---

## 1. Overview

**PROJECT_DIR**: `/Users/mauricewen/Projects/21-dify-demo`

### 1.1 Product Name
灵阙智能体平台 (LingQue Enterprise Agent Platform) -- Demo Edition

### 1.2 Product Type
企业级智能体平台 Demo 前端 -- 完整复刻 `07-lingque-professional` 的 B2B SaaS 架构，覆盖智能体管理、工作流编排、模板库、知识库、历史审计、平台设置六大模块。
**v3.0 从单页 Demo 升级为完整平台展示。**

### 1.3 Background
路桥集团业务场景特殊：
- **偏远工地**：项目在不开放的小地方（宜宾挂弓山等），基础设施有限
- **大量手写单据**：公务接待审批单、接待清单等多为手写填写，OCR 难度高
- **批量审核需求**：财务集中处理时，一次数十到数百笔报销单需同时审核
- **合规要求严格**：国企报销需经过多级审批，审核维度多、标准复杂

**v3.0 扩展**：客户不仅需要看到单个审核 Demo，更需要看到完整的企业智能体平台能力：
- 多智能体管理与监控
- 工作流可视化编排 (n8n 风格)
- 知识库管理 (向量化索引)
- 决策审计追踪 (合规要求)
- 模型配置与安全管控

### 1.4 Success Metrics
- **平台感**：从「一个 Demo」变成「一个平台」，客户能看到完整的产品形态
- **功能闭环**：每个侧栏入口都有真实页面，不存在灰色/disabled 入口
- **品牌一致**：双色系贯穿全平台 (Sky Blue 平台 + Jade Teal 智能体)
- **专业级 UX**：frosted glass + 微交互 + 60fps 动效，匹配 B2B SaaS 头部产品

### 1.5 Design Paradigm: Single-Screen Progressive Disclosure
整个 upload → processing → result 流程在 **一个视口高度** 内完成：
```
Phase 1 [上传态]: 全屏 dropzone（支持文件/文件夹拖拽）
    ↓ 动画收缩
Phase 2 [审核态]: 上传区缩为顶部条 → 工作流/批量进度占满主区域
    ↓ 动画收缩
Phase 3 [结果态]: 工作流缩为完成条 → 结果面板展开
    ↓ 点击展开
Phase 4 [详情态]: 单笔报销的详细审核报告（问题列表）
```

---

## 2. Target Users

| Persona | Description | Key Need |
|---------|-------------|----------|
| 国企合规官 | 负责企业内部合规审查 | 看到 AI 如何自动化审核流程 |
| 财务审计人员 | 日常处理报销单据 | 理解系统如何识别问题单据 |
| 技术决策者 | 评估是否采购 AI 解决方案 | 看到技术实力和用户体验 |
| 演示人员 | 在客户现场进行产品演示 | 流畅、稳定、视觉冲击力 |

---

## 3. Core Features

### 3.1 Smart Upload (智能上传) -- v2.0 升级

**功能描述**: 支持单文件、多文件、**整个文件夹拖拽**批量上传。

| Item | Spec |
|------|------|
| Upload method | Drag-and-drop zone (文件/文件夹) + click-to-browse |
| **Folder support** | **拖入文件夹自动递归扫描 PDF** |
| File types | PDF only (auto-filter non-PDF) |
| File size limit | 单文件 20MB |
| **Batch limit** | 最多 100 文件/次 |
| Date input | Optional date picker, default today, applies to all |
| Validation | File type check, size check, duplicate check |
| **Batch UX** | 文件列表表格（文件名/大小/页数/状态），带全选/删除操作 |
| **Handwriting indicator** | 扫描检测手写比例，标记"手写为主"/"打印为主" |

### 3.1.1 Progressive Disclosure -- Upload Phase
- 初始态：全屏 dropzone，大面积拖拽区域，文字引导"拖拽文件或文件夹至此"
- 有文件态：dropzone 缩小至 40% 高度，下方展示文件列表表格
- 启动后：dropzone + 列表整体缩为顶部固定条（显示"X 个文件 · 审核中"）

### 3.2 Workflow Visualization (10-step pipeline)

**功能描述**: 以动画形式展示 10 步审核流程的执行过程。

**10 Steps**:

| Step | Name (CN) | Name (EN) | Icon Suggestion |
|------|-----------|-----------|-----------------|
| 1 | 报销资料输入 | Document Input | FileUp |
| 2 | 报销过期日判定 | Expiry Check | Calendar |
| 3 | 报销单据拆分 | Receipt Splitting | Scissors |
| 4 | 报销单据识别 | Receipt Recognition | Scan |
| 5 | 提取接待类型信息 | Extract Reception Info | Search |
| 6 | 判断接待类型 | Determine Reception Type | GitBranch |
| 7 | 公务接待单据审核 | Official Reception Audit | Shield |
| 8 | 公务接待审核内容汇总 | Audit Summary | ClipboardList |
| 9 | 审核结果编排 | Result Arrangement | Layout |
| 10 | 审核结果输出 | Result Output | FileCheck |

**Step States**:

| State | Visual | Animation |
|-------|--------|-----------|
| idle | Gray, muted | None |
| active | Blue/primary, glowing | Pulse + progress ring |
| completed | Green, checkmark | Scale-in checkmark |
| error | Red, warning icon | Shake + highlight |

**Connector Animation**: Steps 之间的连线在 active 状态时显示流动粒子效果。

**Layout**: 横向流水线布局 (desktop)，支持自动换行。

### 3.3 Result Display (审核结果输出)

**功能描述**: 展示结构化的审核结果。

**Result Structure**:

```
招待类型：公务接待
审核建议：人工复核
问题列表：
  [!] 菜品清单缺失
  [!] 陪餐人员信息不完整
  [!] 报销日期超过有效期限
```

| Element | Spec |
|---------|------|
| Summary card | 招待类型 + 审核建议 (badge style) + 报销金额 + 审核耗时 |
| **Sub-document grid** | **单据拆分识别: 6 种标准单据 (费用报销单/审批单/接待清单/情况说明/发票/菜品清单) 的 found/missing 状态 + 页码** |
| Issue list | Severity-coded items (error=red, warning=amber, info=blue) with detail expansion |
| Detail panel | Expandable details per issue |
| **SubDocBar (batch dashboard)** | **Per-file sub-document verdict bar: flex-proportional color segments (green=pass, amber=warn, red=fail+missing), 72px wide, 6px height, with bold count labels** |
| Export | Copy to clipboard (structured text), PDF export (planned) |

**Sub-Document Types (单据拆分识别)**:

| # | Type | Required | Description |
|---|------|----------|-------------|
| 1 | 费用报销单 | Yes | Cover sheet with amounts, department, dates |
| 2 | 公务接待审批单 | Yes | Pre-approval record (先审批后接待) |
| 3 | 公务接待清单 | Yes | Guest list, headcount, venue, itinerary |
| 4 | 情况说明 | Yes | Activity description |
| 5 | 电子发票 | Yes | Tax invoice(s) |
| 6 | 菜品清单 | Conditional | Required when amount > 1000 or by policy |

**审核建议 Badge Colors**:

| Suggestion | Color | Meaning |
|------------|-------|---------|
| 通过 | Green | No issues found |
| 人工复核 | Orange/Amber | Issues need human review |
| 不通过 | Red | Critical issues, reject |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- LCP (Largest Contentful Paint) < 2s
- Workflow animation: 60fps, no jank
- Total bundle size < 500KB (gzipped)

### 4.2 Accessibility
- Chinese UI throughout (all labels, tooltips, messages)
- Keyboard navigation for core flows
- Screen reader labels on interactive elements

### 4.3 Visual Design
- Professional corporate aesthetics (国企风格)
- Light theme only (frosted glass + white base; see D-011)
- Dual-color brand: Sky Blue (#0284C7, platform pages) + Jade Teal (#0D9488, agent pages), neutral grays, red/green/amber for status
- Typography: system Chinese fonts (PingFang SC / Microsoft YaHei fallback)
- Subtle animations: not flashy, but polished and confident

### 4.4 Responsiveness
- Primary: Desktop (1280px+)
- Secondary: Tablet landscape (1024px+)
- Not required: Mobile (< 768px)

### 4.5 Browser Support
- Chrome 120+, Edge 120+, Safari 17+
- Firefox 120+ (nice to have)

---

## 5. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16 (App Router) | SSR + API routes, production-grade |
| Styling | TailwindCSS 4 | Utility-first, rapid iteration |
| Components | shadcn/ui | Accessible, customizable, professional |
| Animation | Framer Motion | Declarative, performant, React-native |
| Icons | Lucide React | Consistent, tree-shakeable |
| State | React hooks (useState/useReducer) | Simple enough, no external state lib |
| API | Next.js Route Handlers | Proxy to Dify API, hide API key |

---

## 6. API Design

### 6.1 Modes

| Mode | Config | Behavior |
|------|--------|----------|
| Mock | `DEMO_MODE=true` | Returns hardcoded response with simulated delays |
| Live | `DEMO_MODE=false` | Calls Dify API at `DIFY_API_URL` |

### 6.2 Endpoints

**POST /api/audit** (actual implementation)

Request: `multipart/form-data`
- `file`: PDF binary (required, max 20MB)
- `auditDate`: "2025-07-09" (optional, default today)
- `fileIndex`: number (for batch, 0-based)

Response: SSE stream (`text/event-stream`)
```
event: step_start
data: {"step":1,"message":"正在接收报销资料..."}

event: step_done
data: {"step":1,"message":"报销资料接收完成","durationMs":800}

event: result
data: {"receptionType":"公务接待","suggestion":"人工复核","amount":470,"pageCount":5,"subDocuments":[...],"issues":[...]}

event: error
data: {"message":"Dify workflow failed (500): ..."}

event: done
data: {}
```

### 6.3 Dify API Integration

- Endpoint: `https://agentdemo.hegui.cn/v1/workflows/run`
- Auth: Bearer token in `DIFY_API_KEY`
- Input mapping: PDF file -> Dify file upload -> workflow input
- Output mapping: Dify workflow nodes -> 10-step progress events

---

## 7. Information Architecture (v3.0)

```
/                           -> 智能体列表 (平台首页, 8 个企业智能体)
/audit                      -> 报销审核详情 (v2 单页审核, 4 phase progressive)
/workflows                  -> 工作流列表 (card grid + status)
/workflows/expense-audit    -> 工作流编辑器 (GoldenRatio 38.2/61.8 + n8n canvas)
/templates                  -> 模板库 (category tabs + card grid)
/knowledge                  -> 知识库列表 (5 KBs + stats panel)
/history                    -> 历史记录 (dual tab: conversations + audit traces)
/settings                   -> 平台设置 (double sidebar, 4 sections)
/api/audit                  -> SSE 审核接口 (multipart/form-data -> text/event-stream)
/_not-found                 -> 404 页面
```

**导航体系**: 左侧可收缩 Sidebar (64px↔256px) + 每页 sticky PageHeader

---

## 8. Out of Scope (v3.0)

- User authentication / login (Demo 无需登录)
- Database / persistence (全部 Mock 数据, 无持久化)
- Real-time collaboration (multi-viewer)
- Mobile responsive design (< 768px)
- i18n (English version)
- Dify workflow visual editor (仅展示, 不可编辑)
- Knowledge base CRUD (仅列表展示)
- Settings persistence (toggle 状态仅 session 级)

---

## 9. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Dify API 是否支持 SSE streaming? | RESOLVED: Yes, `response_mode: "streaming"` |
| 2 | 是否需要显示每步的具体耗时? | RESOLVED: Yes, totalDuration shown |
| 3 | Mock 模式的延迟时间? | RESOLVED: step-specific delays in MOCK_STEP_DELAYS |
| 4 | 是否需要支持重新上传/重试? | RESOLVED: Reset + AbortController |
| 5 | Dify 输入变量名? | RESOLVED: Configurable via env vars |
| 6 | v3 是否需要所有页面功能可交互? | RESOLVED: 列表/搜索/筛选可交互, CRUD 操作仅展示 |

---

## 10. Role Workflow SOP (真实岗位工作流)

### 10.1 Role Roster

| # | Role | Responsibility Boundary |
|---|------|------------------------|
| R1 | Product Manager | 需求定义、优先级排序、验收标准制定、PDCA 文档维护 |
| R2 | UI/UX Designer | 视觉设计、交互原型、设计系统、品牌一致性 |
| R3 | System Architect | 技术选型、模块划分、接口契约、架构决策记录 |
| R4 | Frontend Engineer | 页面实现、组件开发、状态管理、动效实现 |
| R5 | QA Engineer | 测试计划、用例执行、缺陷追踪、Lighthouse 审计 |
| R6 | SRE / DevOps | CI/CD pipeline、Vercel 部署、监控告警、性能基线 |
| R7 | Security Engineer | 安全审计、CSP 策略、数据保护、OWASP 检查 |
| R8 | Data Engineer | 数据模型设计、Mock 数据生成、API 集成、SSE schema |

### 10.2 Per-Role Deliverables & Acceptance Criteria

#### R1 → R2/R3/R5: PM 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| PRD.md | Markdown + HTML | 功能点 100% 覆盖, 验收标准可量化 |
| USER_EXPERIENCE_MAP.md | Markdown + HTML | 用户旅程完整, 每步有组件映射 |
| task_plan.md | Markdown | Phase/Task 粒度, 状态实时更新 |
| ROLLING_REQUIREMENTS_AND_PROMPTS.md | Markdown | 需求变更有日期+原因 |

#### R2 → R4/R5: Designer 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| 设计 Variants | 21st-magic JSON | >= 3 方案, 有评分对比 |
| 品牌规范 | CSS tokens in globals.css | 双色系 + 排版 + 间距统一 |
| 组件规范 | 代码内 inline styles | PageHeader/Card/Badge 模式一致 |

#### R3 → R4/R6/R8: Architect 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| SYSTEM_ARCHITECTURE.md | Markdown + HTML + Mermaid | 模块图 + 数据流 + 决策记录 |
| 接口契约 | TypeScript interfaces | strict mode, 无 any |
| 决策记录 D-xxx | SA.md section | pros/cons/risk 三栏 |

#### R4 → R5/R6/R7: Engineer 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| 页面组件 | .tsx files | `next build` 零错误零警告 |
| 数据层 | src/lib/*.ts | TypeScript strict, 类型导出 |
| 路由 | src/app/*/page.tsx | 匹配 Section 7 路由表 |

#### R5 → R4/R1: QA 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| Lighthouse Report | JSON/HTML | 四项 >= 90 |
| 测试报告 | Markdown | P0 用例 100% pass |
| 缺陷列表 | task_plan.md | severity + repro steps |

#### R6 → R1: SRE 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| Vercel 部署 | URL | 可访问, HTTPS, 自动部署 |
| CI 配置 | GitHub Actions | PR preview + main deploy |

#### R7 → R4/R6: Security 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| 安全审计报告 | Markdown | OWASP Top 10 检查 |
| CSP 策略 | next.config.ts | strict-dynamic, 无 unsafe-eval |

#### R8 → R4: Data 交付

| Deliverable | Format | Acceptance |
|-------------|--------|------------|
| TypeScript interfaces | src/lib/*.ts | 类型覆盖所有实体 |
| Mock 数据 | src/lib/*.ts export | 每类实体 >= 3 条 |
| API handlers | src/app/api/*/route.ts | 双模式 mock/live |

### 10.3 Collaboration Flow

```
Sprint Lifecycle:

Day 1:  R1 (PM) → PRD + UXM + task_plan
         ├─→ R2 (Designer): Stitch Pipeline 出设计稿
         └─→ R3 (Architect): Council 出架构

Day 2:  R3 → R8 (Data): 数据模型 + Mock
        R2 → R4 (Engineer): 开始实现

Day 3:  R4 (Engineer): 实现 + 自测
        R8 → R4: 数据层完成, 前端消费

Day 4:  R4 → R5 (QA): 提测
        R4 → R7 (Security): 安全审计
        R5 ∥ R7 并行执行

Day 5:  R5 → R4: 缺陷修复
        R7 → R4: 安全修复
        R4 → R6 (SRE): 部署
        R6 → R1 (PM): 上线验收
```

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-03-10 | v1.0 | Initial PRD |
| 2026-03-10 | v2.0 | Batch audit system, single-screen progressive disclosure, handwriting OCR |
| 2026-03-10 | v2.1 | Swarm optimization (council review), security headers, copy handlers |
| 2026-03-11 | v2.2 | Dify API integration (dual-mode SSE), SubDocument model, n8n background |
| 2026-03-11 | v2.3 | Stitch pipeline dark theme unification |
| 2026-03-12 | v3.0 | **Platform migration**: 8 pages, dual-color brand, role workflow SOP (Section 10), updated IA (Section 7) |
| 2026-03-13 | v3.1 | **Animation + UI polish**: removed AnimatePresence for phase transitions (D-015), added SubDocBar spec, fixed light-theme-only + dual-color descriptions in NFR section |

---

Maurice | maurice_wen@proton.me
