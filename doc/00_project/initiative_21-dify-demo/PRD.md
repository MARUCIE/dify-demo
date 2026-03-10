# PRD -- 路桥报销审核智能体 Demo

> Product Requirements Document | v2.0 | 2026-03-10

---

## 1. Overview

### 1.1 Product Name
路桥报销审核智能体 (Road & Bridge Expense Reimbursement Audit Agent)

### 1.2 Product Type
Dify Workflow 展示前端 -- 替代 Dify 原生 UI，为国企客户提供专业级演示体验。
**v2.0 升级为批量审核作战系统，对标路桥集团真实业务场景。**

### 1.3 Background
路桥集团业务场景特殊：
- **偏远工地**：项目在不开放的小地方（宜宾挂弓山等），基础设施有限
- **大量手写单据**：公务接待审批单、接待清单等多为手写填写，OCR 难度高
- **批量审核需求**：财务集中处理时，一次数十到数百笔报销单需同时审核
- **合规要求严格**：国企报销需经过多级审批，审核维度多、标准复杂

当前 Dify 原生 UI 过于通用，缺乏行业定制感、动画效果和批量处理能力。

### 1.4 Success Metrics
- **Aha Moment**：客户第一眼产生「卧槽」级震撼
- **批量效率感**：拖入文件夹 → 自动识别 → 批量审核 → 仪表盘级汇总
- **手写识别 wow**：可视化展示 AI 读取手写单据的过程和置信度
- **单屏体验**：全流程在一屏内渐进披露，无需滚动

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
| Summary card | 招待类型 + 审核建议 (badge style) |
| Issue list | Red-highlighted items with icons |
| Detail panel | Expandable details per issue |
| Export | Copy to clipboard, print-friendly view |

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
- Dark mode + Light mode (system preference + manual toggle)
- Color palette: deep blue primary, neutral grays, red/green/amber for status
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
| Framework | Next.js 15 (App Router) | SSR + API routes, production-grade |
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

**POST /api/audit**

Request:
```json
{
  "file": "<base64 PDF or multipart>",
  "date": "2025-07-09"
}
```

Response (SSE stream):
```json
{"step": 1, "status": "active", "message": "正在接收报销资料..."}
{"step": 1, "status": "completed", "message": "报销资料接收完成"}
{"step": 2, "status": "active", "message": "正在判定报销过期日..."}
...
{"step": 10, "status": "completed", "result": {
  "reception_type": "公务接待",
  "suggestion": "人工复核",
  "issues": [
    {"severity": "error", "message": "菜品清单缺失"},
    {"severity": "warning", "message": "陪餐人员信息不完整"},
    {"severity": "error", "message": "报销日期超过有效期限"}
  ]
}}
```

### 6.3 Dify API Integration

- Endpoint: `https://agentdemo.hegui.cn/v1/workflows/run`
- Auth: Bearer token in `DIFY_API_KEY`
- Input mapping: PDF file -> Dify file upload -> workflow input
- Output mapping: Dify workflow nodes -> 10-step progress events

---

## 7. Information Architecture

```
/                     -> Redirect to /demo
/demo                 -> Upload page (step 1 entry)
/demo/workflow/:id    -> Workflow visualization (steps 1-10 animated)
/demo/result/:id      -> Result display page
```

Single-page flow is also acceptable (upload -> workflow -> result on one page with section transitions).

---

## 8. Out of Scope (v2.0)

- User authentication / login
- ~~Multi-file batch processing~~ (DONE in v2.0)
- History / audit trail (localStorage)
- Dify workflow editor integration
- Mobile responsive design (< 768px)
- i18n (English version)
- Database / persistence
- Real-time collaboration (multi-viewer)

---

## 9. Open Questions

| # | Question | Status |
|---|----------|--------|
| 1 | Dify API 是否支持 SSE streaming? | TBD -- need to test |
| 2 | 是否需要显示每步的具体耗时? | TBD -- ask client |
| 3 | Mock 模式的延迟时间如何设定? | Proposed: 1-3s per step, randomized |
| 4 | 是否需要支持重新上传/重试? | Proposed: yes, reset button |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-03-10 | v1.0 | Initial PRD |
| 2026-03-10 | v2.0 | Batch audit system, single-screen progressive disclosure, handwriting OCR |
| 2026-03-10 | v2.1 | Swarm optimization (council review), security headers, copy handlers, date validation |

---

Maurice | maurice_wen@proton.me
