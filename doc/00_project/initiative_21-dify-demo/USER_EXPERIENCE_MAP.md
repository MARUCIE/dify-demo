# USER_EXPERIENCE_MAP -- 灵阙智能体平台 Demo

> 用户体验地图 | v3.1 | 2026-03-13 | 完整平台导航 + 8 页面功能闭环

---

## 1. Design Paradigm: Multi-Page Platform with Frosted Glass

**PROJECT_DIR**: `/Users/mauricewen/Projects/21-dify-demo`

v3.0 从单页渐进披露升级为完整的 B2B SaaS 平台体验。用户通过左侧可收缩 Sidebar 导航访问 8 个功能页面。

```
┌────────┬──────────────────────────────────────────────┐
│        │  PageHeader (sticky, frosted glass)          │
│  S     │  ┌──────────────────────────────────────────┐│
│  i     │  │ Title + Stats + Actions                  ││
│  d     │  └──────────────────────────────────────────┘│
│  e     ├──────────────────────────────────────────────┤
│  b     │  Content Area (scrollable)                   │
│  a     │  ┌───────────────────────────────────────┐   │
│  r     │  │  Search / Filter Bar                  │   │
│        │  ├───────────────────────────────────────┤   │
│  64px  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │   │
│   ↕    │  │  │Card │ │Card │ │Card │ │Card │    │   │
│ 256px  │  │  └─────┘ └─────┘ └─────┘ └─────┘    │   │
│        │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │   │
│        │  │  │Card │ │Card │ │Card │ │Card │    │   │
│        │  │  └─────┘ └─────┘ └─────┘ └─────┘    │   │
│        │  └───────────────────────────────────────┘   │
│        ├──────────────────────────────────────────────┤
│        │  Footer (灵阙智能体平台 v3.0)                 │
└────────┴──────────────────────────────────────────────┘
```

**一致的页面结构**: 所有页面遵循 PageHeader → Search/Filter → Content Grid → Footer 模式。

### 1.1 Audit Page 保留: Single-Screen Progressive Disclosure

`/audit` 路由保留 v2 的单屏渐进披露体验 (4 Phase: upload→running→completed→detail)。

---

## 2. Phase Transition Map

| From | To | Trigger | Animation | Duration |
|------|----|---------|-----------|----------|
| upload | running | Click "启动批量审核" | Instant swap (plain div) | -- |
| running | completed | All files processed | Instant swap (plain div) | -- |
| completed | detail | Click file row or "查看详情" | Scale + fade overlay (AnimatePresence) | 0.3s |
| detail | completed | Click backdrop or close button | Scale down + fade (AnimatePresence) | 0.3s |
| any | upload | Click "重新审核" | Instant reset (plain div) | -- |

> **Note (D-015)**: Phase transitions use plain div conditional rendering instead of AnimatePresence. framer-motion 12 + React 19 breaks AnimatePresence `mode="wait"` exit/enter sequencing. AnimatePresence is retained only for the detail modal overlay (fixed inset-0 z-50 dialog), where simple show/hide works reliably.

---

## 3. Platform Navigation Journey (v3.0)

### 3.0 Platform Entry & Navigation

**用户目标**: 浏览平台功能，找到所需智能体或工具

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| 0.1 | 打开平台 | 展示 Agent List (/) + 左侧 Sidebar | "这是一个完整的平台" |
| 0.2 | 浏览 8 个智能体卡片 | 状态 badge + 标签 + 描述 | "功能很丰富" |
| 0.3 | 搜索特定智能体 | 实时过滤匹配 | "搜索很方便" |
| 0.4 | 点击 Sidebar 导航 | 页面切换，active indicator 跟随 | "导航清晰" |
| 0.5 | 收起 Sidebar | 64px 图标模式，更多空间 | "空间利用灵活" |

**Page Transitions**: Sidebar nav items 使用 Next.js `<Link>` 路由，layoutId 动画指示当前页面。

### 3.0.1 Knowledge Base (`/knowledge`)

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| K.1 | 进入知识库页面 | 5 个 KB 卡片 + 状态 badges + 统计概览 | "知识管理很完善" |
| K.2 | 查看 KB 状态 | 已激活(绿)/索引中(黄, spin)/异常(红) | "状态一目了然" |
| K.3 | 搜索知识库 | 实时过滤 (名称/描述/模型) | "快速定位" |
| K.4 | 查看概览面板 | 知识库总数/已激活/总文档/总分块 4 项指标 | "数据透明" |

### 3.0.2 History (`/history`)

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| H.1 | 进入历史记录 | 默认显示"对话记录" Tab | "有完整的使用记录" |
| H.2 | 浏览对话卡片 | Agent 名称 badge + 标题 + 消息数/耗时/Token | "数据详实" |
| H.3 | 切换到"决策审计" Tab | 审计追踪列表 | "合规审计很重要" |
| H.4 | 点击审计追踪卡片 | 右侧滑入 TraceDetail 面板 (timeline) | "每一步都可追溯" |
| H.5 | 查看步骤详情 | 状态图标 + 耗时 + 错误/警告详情 | "问题定位精准" |

### 3.0.3 Settings (`/settings`)

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| S.1 | 进入设置页面 | 左侧 sub-nav (4 sections) + 右侧内容 | "配置项丰富" |
| S.2 | 模型配置 | 5 个 AI Provider 卡片 (品牌色图标) | "支持多模型" |
| S.3 | 通知设置 | 4 个 toggle 开关 (交互式) | "可自定义通知" |
| S.4 | 安全权限 | 访问控制 + 审计日志 + 数据加密卡片 | "安全管控到位" |

### 3.0.4 Workflows (`/workflows` + `/workflows/expense-audit`)

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| W.1 | 进入工作流列表 | 工作流卡片 + 状态/触发类型 | "流程管理清晰" |
| W.2 | 点击"报销审核工作流" | 进入 GoldenRatio 编辑器 | "编辑器很专业" |
| W.3 | 查看左侧配置面板 (38.2%) | 基本信息 + 变量 + 节点列表 + 执行记录 | "配置项完整" |
| W.4 | 查看右侧画布 (61.8%) | n8n 风格分支 DAG (流程节点 + 决策节点) | "可视化编排直观" |

### 3.0.5 Templates (`/templates`)

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| T.1 | 进入模板库 | Category tabs + 模板卡片 | "模板库丰富" |
| T.2 | 切换分类 tab | 卡片过滤 + 动画 | "分类清晰" |
| T.3 | 查看模板详情 | 难度/时间/标签 badges | "信息完整" |

---

### 3.1 Audit Journey: Phase 1 Upload (上传态) -- `/audit`

**用户目标**: 快速批量上传报销 PDF 文件

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| 1.1 | 打开页面 | n8n 风格节点流动画背景 (16 节点 + 15 虚线流动连接) + KPI 统计 | "这看起来很专业" |
| 1.2 | 拖拽文件/文件夹至 dropzone | conic gradient 旋转边框 + dragover 高亮 | "交互很流畅" |
| 1.3 | 文件验证 (PDF, <20MB, <100个) | 错误文件红色提示 (5s 自动消失) | "有错误提示很放心" |
| 1.4 | 查看文件列表 | 表格显示文件名/大小/页数/手写比例 | "手写比例检测很酷" |
| 1.5 | 设置审核基准日期 | 日期选择器 (不允许未来日期) | -- |
| 1.6 | 点击"启动批量审核" | Phase 过渡动画开始 | "期待看到 AI 工作" |

**关键交互**:
- Dropzone 状态: 空(全屏) → 有文件(缩小+显示列表)
- 文件夹递归扫描: `webkitGetAsEntry()` API
- 手写比例: 上传时随机模拟 (demo); 实际接入后由 OCR 引擎返回
- 文件列表: 带 hover 高亮 + 动画进入 + 删除按钮

### 3.2 Phase 2: Running (审核态)

**用户目标**: 观看 AI 逐步审核每个文件的过程

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| 2.1 | 观察左侧工作流 | 10 步流水线依次激活/完成 | "流程清晰可见" |
| 2.2 | 观察右侧批量进度 | 文件卡片逐个处理, 呼吸光效 | "批量处理效率高" |
| 2.3 | 查看活跃步骤详情 | 底部详情栏显示当前步骤描述 | "知道 AI 在做什么" |
| 2.4 | 查看总体进度 | 顶部进度条 + 百分比 + 圆形进度 | "进度一目了然" |

**关键交互**:
- 工作流: 步骤图标 idle→active(蓝色脉冲)→completed(绿色对勾)/error(红色)
- 连线: active 时流动粒子效果 (CSS animation), completed 变绿
- 文件卡片: 活跃卡片有蓝色呼吸光效 + typing cursor 显示当前步骤
- 步骤点阵: 10 个小圆点实时反映每个步骤状态

### 3.3 Phase 3: Completed (结果态)

**用户目标**: 查看批量审核汇总结果

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| 3.1 | 查看总览 | 3 张汇总卡片 (通过/复核/不通过) + 动画计数器 | "一目了然的汇总" |
| 3.2 | 查看统计 | 4 项指标 (文件数/总耗时/平均耗时/问题数) | "数据详实" |
| 3.3 | 排序/筛选结果表 | 点击表头排序 (6 列均可排序) | "操作灵活" |
| 3.4 | 点击"查看详情" | 进入 Phase 4 详情 overlay | "深入了解" |
| 3.5 | 点击"复制汇总" | 结构化文本复制到剪贴板 + "已复制"反馈 | "方便分享" |
| 3.6 | 点击"重新审核" | 重置回 Phase 1 | -- |

**关键交互**:
- 汇总卡片: 渐变背景 + 装饰光球 + 动画数字递增 + 百分比条
- 结果表: hover 右移效果 + 建议 badge 颜色编码
- 排序: 6 列可排序, 升序/降序切换, 活跃列高亮

### 3.4 Phase 4: Detail (详情态)

**用户目标**: 查看单个文件的详细审核结果

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| 4.1 | 查看文件信息 | 文件名 + 手写比例 badge | "知道是哪个文件" |
| 4.2 | 查看审核结论 | 招待类型 + 建议 badge + 金额 + 耗时 | "结论清晰" |
| 4.2b | 查看单据拆分 | 6 种标准单据 found/missing 网格 + 页码 | "单据识别很智能" |
| 4.3 | 查看问题列表 | 严重(红)/警告(黄) issue cards | "问题分类明确" |
| 4.4 | 复制结果 | 结构化文本复制 + "已复制"反馈 | "可以直接分享" |
| 4.5 | 关闭 overlay | 点击背景或 X 按钮返回 Phase 3 | -- |

**关键交互**:
- Overlay: `backdrop-filter: blur(8px)` + 深色半透明背景
- 进入动画: scale(0.9) + y(30) → scale(1) + y(0)
- 关闭: 点击 backdrop 或 X 按钮

---

## 4. Visual Design System (v3.0)

### 4.1 Dual-Color Brand System

| Token | Value | Usage |
|-------|-------|-------|
| **Sky Blue (Platform)** | #0284C7 / #0369A1 | 工作流、模板、知识库、历史、设置 |
| **Jade Teal (Agent)** | #0D9488 / #0F766E | 智能体列表、审核、Sidebar active |
| Background | white / rgba(255,255,255,0.85) | Page + Sidebar |
| Surface | rgba(255,255,255,0.7) | Frosted glass cards |
| Border | rgba(226,232,240,0.8) | Card borders |
| Shadow | rgba(0,0,0,0.04) | Card elevation |
| Text Primary | #1e293b | Headings |
| Text Secondary | #64748b | Body text |
| Text Muted | #94a3b8 | Labels, hints |
| Text Pale | #cbd5e1 | Timestamps |
| Success | #0f766e / rgba(13,148,136,0.08) | Active, passed |
| Warning | #b45309 / rgba(245,158,11,0.08) | Review, indexing |
| Danger | #dc2626 / rgba(220,38,38,0.08) | Error, rejected |

### 4.2 Frosted Glass System

| Layer | Background | Blur | Border | Shadow |
|-------|-----------|------|--------|--------|
| Sidebar | rgba(255,255,255,0.85) | 20px | right 1px slate-200 | 4px 0 24px rgba(0,0,0,0.04) |
| PageHeader | rgba(255,255,255,0.7) | 20px | bottom 1px slate-200 | 0 1px 3px rgba(0,0,0,0.03) |
| Card | rgba(255,255,255,0.7) | 16px | 1px slate-200 | 0 4px 24px rgba(0,0,0,0.04) |
| Stats pill | rgba(255,255,255,0.8) | -- | 1px slate-200 | -- |

### 4.3 Animation System

| Category | Duration | Easing | Notes |
|----------|----------|--------|-------|
| Page mount | 0.4-0.6s | spring | Card stagger (0.05s delay per item) |
| Card hover | 0.3s | ease | y: -2, scale: 1.01 |
| Sidebar collapse | 0.2s | [0.4, 0, 0.2, 1] | Width 256→64 + text fade |
| Sidebar active | spring | stiffness:380 damping:30 | layoutId indicator |
| Tab switch | 0.2s | ease | opacity + translateY |
| TraceDetail slide | 0.3s | spring | Slide in from right |
| Audit phase transitions | -- (instant) | -- | Plain div conditional render (D-015); individual component animations provide smooth UX |
| Detail modal overlay | 0.3s | spring | AnimatePresence scale+fade (only surviving AnimatePresence usage) |

### 4.4 Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Page heading | 14-16px | 700 | #1e293b |
| Card title | 15-16px | 700 | #1e293b |
| Body text | 13-14px | 400-500 | #64748b |
| Label | 11-12px | 500-600 | #94a3b8 |
| Badge | 11-13px | 600 | theme color |
| Logo | 15px | 700 | #1e293b |
| Logo sub | 10px | 400 | #94a3b8 |

Font stack: system-default (`-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`)

---

## 5. Component Inventory (v3.0)

**Platform Shell**:

| Component | File | Scope |
|-----------|------|-------|
| Sidebar | workspace/Sidebar.tsx | All pages -- collapsible 64↔256px, 6 nav items |

**Page Components** (each page is self-contained):

| Page | Route | Key Internal Components |
|------|-------|----------------------|
| Agent List | `/` | AgentCard (inline), search bar, filter tags |
| Expense Audit | `/audit` | AnimatedBackground, Header, StatsBar, UploadZone, WorkflowPipeline, BatchProgress, BatchResultsDashboard, ResultPanel |
| Workflow List | `/workflows` | WorkflowCard (inline), status badges |
| Workflow Editor | `/workflows/expense-audit` | GoldenRatio layout, n8n canvas (WorkflowNode + DecisionNode), config panels |
| Templates | `/templates` | Category tabs, TemplateCard (inline) |
| Knowledge Base | `/knowledge` | KBCard (inline), status badges, stats overview |
| History | `/history` | Tab switcher, ConvCard (inline), TraceCard (inline), TraceDetail panel (timeline) |
| Settings | `/settings` | Sub-nav, ProviderCard (inline), toggles, config sections |

---

## 6. Interaction States Matrix (v3.0)

| Component | Idle | Hover | Active | Disabled |
|-----------|------|-------|--------|----------|
| Sidebar item | slate-500 text | bg slate-100/80 | Teal bg + left indicator | opacity 0.4 |
| Platform card | white/70 glass | y:-2, scale:1.01 | -- | -- |
| CTA Button | gradient fill | slight lift | -- | opacity 0.5 |
| Search input | slate border | -- | focus ring | -- |
| Tab | slate text | -- | brand color + underline | -- |
| Toggle | gray circle | -- | brand-colored slide | -- |
| KB status badge | colored bg+border | -- | -- | -- |
| Trace timeline dot | colored circle | -- | -- | -- |

---

## 7. Error & Edge Cases

| Scenario | System Response | UI Feedback |
|----------|----------------|-------------|
| Non-PDF file dropped | Filter out, show validation error | Red alert with file name (5s auto-dismiss) |
| File > 20MB | Reject, show validation error | Red alert with file size |
| 100+ files | Cap at limit, show warning | "已达上限" amber badge |
| Empty submit | Button disabled | opacity 0.4, cursor: not-allowed |
| Future date selected | HTML5 `max` attribute blocks | Native date picker restriction |
| Copy failed | Fallback to textarea+execCommand | Still shows "已复制" feedback |

---

## 8. Accessibility Requirements

| Requirement | Status | Notes |
|-------------|--------|-------|
| prefers-reduced-motion | done | Disables all animations + hides n8n flow network (`display: none`) |
| Keyboard navigation | done | Dropzone、结果表、详情弹层均支持键盘操作 |
| ARIA labels | done | Buttons、dialog、sort status、progress 文案已补齐 |
| Color contrast | done | 关键 Slate/文本对比度已在 Phase 4 调整 |
| Screen reader | partial | 核心流程已覆盖，未做完整真实读屏巡检 |

---

## 9. Performance Budget

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Bundle (gzip) | < 500KB | 217KB | OK |
| LCP | < 2s | TBD | Pending Lighthouse |
| CLS | < 0.1 | TBD | Pending Lighthouse |
| FPS (animation) | 60 | TBD | Pending Chrome DevTools |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-03-10 | v1.0 | Initial UXM (single-page 4-phase) |
| 2026-03-11 | v2.3 | n8n background, SubDocument, dark theme |
| 2026-03-12 | v3.0 | **Platform UXM**: 8-page navigation, dual-color brand, frosted glass system, per-page journey maps (Knowledge/History/Settings/Workflows/Templates) |
| 2026-03-13 | v3.1 | **Animation architecture (D-015)**: phase transitions changed from AnimatePresence fade+slide to instant plain div swaps; AnimatePresence retained only for detail modal; SubDocBar polish |

---

Maurice | maurice_wen@proton.me
