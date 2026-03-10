# USER_EXPERIENCE_MAP -- 路桥报销审核智能体

> 用户体验地图 | v2.0 | 单屏渐进披露 + 批量审核

---

## 1. Design Paradigm: Single-Screen Progressive Disclosure

整个用户流程在 **一个视口高度 (100vh)** 内完成，通过 4 个 Phase 渐进式披露内容。
无页面跳转、无滚动，Phase 之间通过 Framer Motion 动画过渡 (0.35s ease)。

```
Phase 1 [upload]     Phase 2 [running]      Phase 3 [completed]    Phase 4 [detail]
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Header (紧凑)│    │ Header (紧凑)    │    │ Header (紧凑)    │    │ Header (紧凑)    │
├─────────────┤    ├─────────────────┤    ├─────────────────┤    │                 │
│ StatsBar    │    │ Collapsed Bar   │    │ Section Header  │    │ ┌─────────────┐ │
│ (4 KPI)     │    │ (文件数 + 进度)  │    │ (完成状态)       │    │ │ Detail      │ │
├─────────────┤    ├────────┬────────┤    ├─────────────────┤    │ │ Overlay     │ │
│             │    │Workflow│ Batch  │    │ Summary Cards   │    │ │ (ResultPanel)│ │
│ UploadZone  │    │Pipeline│Progress│    │ (通过/复核/不通过)│    │ │             │ │
│ (全屏 drop) │    │(10步)  │(文件列表)│    ├─────────────────┤    │ │ IssueCards  │ │
│             │    │        │        │    │ Stats Row       │    │ │ + Actions   │ │
│ + FileList  │    │        │        │    │ (4 指标)         │    │ └─────────────┘ │
│ + CTA       │    │  3:2   │  2:3   │    ├─────────────────┤    │                 │
│             │    │  ratio │  ratio │    │ Results Table   │    │ Backdrop blur   │
├─────────────┤    ├────────┴────────┤    │ (可排序)         │    │ click=close     │
│ Footer      │    │ Step Detail Bar │    ├─────────────────┤    └─────────────────┘
└─────────────┘    └─────────────────┘    │ Action Bar      │
                                          └─────────────────┘
```

---

## 2. Phase Transition Map

| From | To | Trigger | Animation | Duration |
|------|----|---------|-----------|----------|
| upload | running | Click "启动批量审核" | Fade up + slide | 0.35s |
| running | completed | All files processed | Fade up + slide | 0.35s |
| completed | detail | Click file row or "查看详情" | Scale + fade overlay | 0.3s |
| detail | completed | Click backdrop or close button | Scale down + fade | 0.3s |
| any | upload | Click "重新审核" | Full reset | 0.35s |

---

## 3. User Journey

### 3.1 Phase 1: Upload (上传态)

**用户目标**: 快速批量上传报销 PDF 文件

| Step | User Action | System Response | Emotional State |
|------|-------------|-----------------|-----------------|
| 1.1 | 打开页面 | 全屏深色主题 + 动画背景 + KPI 统计 | "这看起来很专业" |
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
| 4.2 | 查看审核结论 | 招待类型 + 建议 badge + 耗时 | "结论清晰" |
| 4.3 | 查看问题列表 | 严重(红)/警告(黄) issue cards | "问题分类明确" |
| 4.4 | 复制结果 | 结构化文本复制 + "已复制"反馈 | "可以直接分享" |
| 4.5 | 关闭 overlay | 点击背景或 X 按钮返回 Phase 3 | -- |

**关键交互**:
- Overlay: `backdrop-filter: blur(8px)` + 深色半透明背景
- 进入动画: scale(0.9) + y(30) → scale(1) + y(0)
- 关闭: 点击 backdrop 或 X 按钮

---

## 4. Visual Design System

### 4.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | #020617 | Page background |
| Surface | rgba(15,23,42,0.55) | Glass panels |
| Surface Bright | rgba(30,41,59,0.45) | Elevated glass panels |
| Primary | #3b82f6 → #2563eb | Active states, CTAs |
| Success | #4ade80 → #059669 | Completed, passed |
| Warning | #fbbf24 → #d97706 | Review needed |
| Danger | #f87171 → #dc2626 | Errors, rejected |
| Purple | #c084fc → #7c3aed | Accent, gradients |
| Text Primary | #e2e8f0 | Main text |
| Text Secondary | #94a3b8 | Supporting text |
| Text Muted | #64748b | Labels, hints |
| Border | rgba(59,130,246,0.12) | Glass borders |

### 4.2 Glassmorphism Depth System

| Layer | Background | Blur | Border | Shadow |
|-------|-----------|------|--------|--------|
| .glass | rgba(15,23,42,0.55) | 20px | blue 0.12 | inset 0.03 + shadow 0.2 |
| .glass-bright | rgba(30,41,59,0.45) | 24px | blue 0.18 | inset 0.04 + shadow 0.25 |

### 4.3 Animation System

| Category | Duration | Easing | Notes |
|----------|----------|--------|-------|
| Phase transitions | 0.35s | [0.4, 0, 0.2, 1] | Framer Motion variants |
| Step state changes | 0.5-0.6s | cubic-bezier(0.4,0,0.2,1) | CSS transition |
| Glow breathing | 2-3s | easeInOut | Infinite loop |
| Connector particles | 1.2-1.8s | linear | Infinite flow |
| Grid pulse | 5s | ease-in-out | Background texture |
| Counter animation | 0.8-1s | ease-out cubic | requestAnimationFrame |

### 4.4 Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Section heading | 18px | 700 | #e2e8f0 |
| KPI number | 24-42px | 800 | theme color |
| Body text | 13-14px | 400-500 | #e2e8f0 |
| Label | 11-12px | 500-600 | #64748b |
| Badge | 11-13px | 600 | theme color |

Font stack: `"Inter", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`

---

## 5. Component Inventory

| Component | Location | Phase | Props |
|-----------|----------|-------|-------|
| AnimatedBackground | layout/ | all | -- |
| Header | layout/ | all | -- |
| StatsBar | layout/ | upload | -- |
| UploadZone | upload/ | upload | files, onFilesAdd, onFileRemove, onStartAudit, disabled |
| WorkflowPipeline | workflow/ | running | steps, stepStates |
| StepCard | workflow/ | running | step, state, index |
| BatchProgress | batch/ | running | files, steps |
| BatchResultsDashboard | batch/ | completed | files, summary, onViewDetail, onReset |
| ResultPanel | result/ | detail | result, onReset |
| IssueCard | result/ | detail | issue, index |

---

## 6. Interaction States Matrix

| Component | Idle | Hover | Active | Focus | Disabled | Error |
|-----------|------|-------|--------|-------|----------|-------|
| Dropzone | dashed border | conic gradient spin | dragover glow | -- | -- | -- |
| StepCard | gray, muted | -- | blue pulse + glow | -- | -- | red shake |
| FileCard | transparent | -- | blue breathing glow | -- | gray | red border |
| CTA Button | gradient blue | translateY(-2px) + shine | translateY(0) | -- | opacity 0.4 | -- |
| Result Row | glass | translateX(4px) | -- | -- | -- | -- |
| Badge | colored bg | -- | -- | -- | -- | -- |
| Sort Header | gray text | -- | white text + arrow | -- | -- | -- |

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
| prefers-reduced-motion | done | Disables all animations + hides particles |
| Keyboard navigation | pending | Tab order, focus indicators |
| ARIA labels | pending | Buttons, progress, live regions |
| Color contrast | partial | Dark theme needs audit |
| Screen reader | pending | Chinese content labels |

---

## 9. Performance Budget

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Bundle (gzip) | < 500KB | 217KB | OK |
| LCP | < 2s | TBD | Pending Lighthouse |
| CLS | < 0.1 | TBD | Pending Lighthouse |
| FPS (animation) | 60 | TBD | Pending Chrome DevTools |

---

Maurice | maurice_wen@proton.me
