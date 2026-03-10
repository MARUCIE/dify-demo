# Notes -- 21-dify-demo

> 路桥报销审核智能体 | Working Notes

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
- [ ] Dify API integration (~4-6h, backend still placeholder)
- [ ] OCR scanning animation during step 4
- [ ] Connector flowing particle effect (partial -- CSS only, no JS particles between steps)
- [ ] Virtual scrolling for 100+ files
- [ ] Keyboard accessibility (ARIA labels, shortcuts)
- [ ] PDCA doc sync (SYSTEM_ARCHITECTURE, USER_EXPERIENCE_MAP, PLATFORM_OPTIMIZATION_PLAN)
- [ ] Testing suite

---

Maurice | maurice_wen@proton.me
