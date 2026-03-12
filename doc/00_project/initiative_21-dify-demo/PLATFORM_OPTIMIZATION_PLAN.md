# PLATFORM_OPTIMIZATION_PLAN -- 灵阙智能体平台 Demo

> 平台优化与扩展计划 | v3.1 | 2026-03-13 | 性能目标、优化策略、未来路线图

---

## 1. Performance Targets

| Metric | Target | Measurement Tool | Rationale |
|--------|--------|-----------------|-----------|
| LCP (Largest Contentful Paint) | < 2s | Lighthouse | 演示场景下首屏加载必须快速，避免冷场 |
| FID (First Input Delay) | < 100ms | Web Vitals | 点击"运行"按钮必须即时响应 |
| CLS (Cumulative Layout Shift) | < 0.1 | Web Vitals | 步骤动画展开时不能造成页面跳动 |
| Bundle Size | < 500KB gzipped | Build output (`next build`) | 保证弱网环境（会议室 Wi-Fi）也能快速加载 |
| Animation FPS | 60fps | Chrome DevTools Performance | StepCard 动画必须流畅，不能卡顿 |

### Lighthouse Score Targets

| Category | Target |
|----------|--------|
| Performance | >= 90 |
| Accessibility | >= 90 |
| Best Practices | >= 95 |
| SEO | >= 80 |

---

## 2. Optimization Strategies

### 2.1 Code Splitting

```
-- Dynamic import for ResultPanel (not needed until workflow completes)
-- Dynamic import for IssueCard detail expansion
-- Keep UploadZone and WorkflowPipeline in main bundle (critical path)
```

| Component | Loading Strategy | Trigger |
|-----------|-----------------|---------|
| UploadZone | Main bundle | Page load |
| WorkflowPipeline | Main bundle | Page load |
| BatchProgress | Main bundle | Phase enters `running` |
| ResultPanel | Dynamic import | Workflow complete event |
| IssueCard | Dynamic import | ResultPanel render |

### 2.2 Image Optimization

- 使用 Next.js `<Image>` component 处理所有静态资源
- Logo 和图标使用 SVG（矢量，无损缩放）
- 背景装饰元素使用 CSS gradients 替代图片
- 如需截图/示例图，使用 WebP 格式 + `srcSet` 多分辨率

### 2.3 Animation Performance

核心原则: 仅使用 GPU 加速属性，避免触发 layout/paint。

| Allowed Properties | Forbidden Properties |
|-------------------|---------------------|
| `transform` | `width` / `height` |
| `opacity` | `top` / `left` / `margin` |
| `filter` (limited) | `padding` / `border-width` |

实现方式:
- StepCard 展开: `transform: scaleY()` + `opacity`
- Connector 动画: `stroke-dashoffset` (SVG) or `transform: scaleX()`
- Spinner: CSS `@keyframes rotate` with `transform: rotate()`
- 使用 `will-change` 提示浏览器预分配 GPU 层（仅对动画中元素）
- **Phase transitions**: 使用 plain div conditional render 替代 AnimatePresence (D-015)。framer-motion 12 + React 19 下 AnimatePresence mode="wait" 的 exit/enter 序列化失效，改为即时切换 + 组件级动画 (stagger cards, animated counters, slide-in rows) 提供流畅体验

### 2.4 Font Loading

- 系统字体栈，零网络字体下载:

```css
font-family:
  -apple-system, BlinkMacSystemFont,
  "PingFang SC", "Microsoft YaHei", "Noto Sans SC",
  "Segoe UI", Roboto, "Helvetica Neue", Arial,
  sans-serif;
```

- 代码字体: `"SF Mono", "Fira Code", "Cascadia Code", monospace`
- 不引入 Google Fonts 或其他 CDN 字体

### 2.5 SSE Handling

```
fetch + ReadableStream configuration (actual):
  - POST /api/audit with FormData (file + auditDate + fileIndex)
  - ReadableStream reader with TextDecoder for SSE parsing
  - Named event types: step_start | step_done | result | error | done
  - AbortController for request cancellation on reset
  - Per-file sequential processing in batch mode
```

关键实现要点:
- 使用 `fetch` + `ReadableStream` (非 EventSource): POST body 支持 + 命名 event types
- AbortController: `abortRef.current?.abort()` 在 reset 时取消所有进行中的请求
- SSE 解析: 按 `\n` 分割，检测 `event: ` 和 `data: ` 前缀，JSON.parse data
- Dify 事件翻译: `node_started/node_finished` -> `step_start/step_done` (via `matchStepByTitle`)

---

## 3. Build & Bundle Analysis

### Build Pipeline

```
pnpm build
  -> Next.js compiler (SWC)
  -> Tree shaking (unused exports)
  -> Code splitting (dynamic imports)
  -> Minification (Terser/SWC)
  -> Gzip/Brotli compression
```

### Bundle Budget Breakdown

**Planned Budget**:

| Chunk | Max Size (gzipped) | Contents |
|-------|-------------------|----------|
| Main | 150KB | React, Next.js runtime, core components |
| Vendor | 100KB | Tailwind CSS runtime, utilities |
| WorkflowPipeline | 80KB | StepCard, Connector, animation logic |
| ResultPanel | 100KB | IssueCard, formatting, expand/collapse |
| Shared | 70KB | Common utilities, types, constants |
| **Total** | **< 500KB** | |

**Actual (v2.1, Turbopack auto-split)**:

| Chunk | Raw Size | Gzipped | Likely Contents |
|-------|----------|---------|-----------------|
| 8b72cfc40036c827.js | 219KB | 68.5KB | Framer Motion + React runtime |
| cf0395033399cc8b.js | 185KB | 56.2KB | App components (all phases) |
| 0a3176ca43c1cc1d.js | 158KB | 40.3KB | Next.js framework |
| a6dad97d9634a72d.js | 110KB | 38.5KB | Lucide icons + utilities |
| f158c7f222525f61.js | 30KB | 7.2KB | Shared lib (types, constants) |
| a6cbfff8230b0019.js | 13KB | 4.8KB | Route config |
| turbopack runtime | 10KB | 3.9KB | Chunk loader |
| **Total** | **725KB** | **217KB** | **43% of 500KB budget** |

---

## 4. Future Enhancements

| # | Enhancement | Description | Complexity | Status |
|---|------------|-------------|------------|--------|
| 1 | ~~Batch Processing~~ | 100 文件批量上传+审核+仪表盘汇总 | Medium | DONE (v2.0) |
| 2 | ~~Dark Theme → Light Theme~~ | v2.3 dark unification → v3.0 light mandatory | Medium | DONE (v3.0) |
| 3 | ~~Dify API Integration~~ | SSE streaming 对接真实工作流 | Medium | DONE (v2.2) |
| 4 | Export to PDF Report | html2pdf 导出格式化审核报告 | Medium | Pending |
| 5 | OCR Scanning Animation | 步骤 4 手写识别过程可视化 | Medium | Pending |
| 6 | ~~Virtual Scrolling~~ | 100+ 文件列表 @tanstack/react-virtual | Low | DONE (v2.0) |
| 7 | ~~History / Audit Trail~~ | 对话记录 + 决策审计追踪 (dual tab) | Medium | DONE (v3.0) |
| 8 | ~~Workflow Editor~~ | GoldenRatio 可视化编辑器 (展示模式) | High | DONE (v3.0, read-only) |
| 9 | Real-time Collaboration | 多人同看演示 | High | Deferred |
| 10 | ~~n8n Node Flow Background~~ | SVG 节点流动画 | Low | DONE (v2.2) |
| 11 | ~~SubDocument Recognition~~ | 6 types found/missing 网格 | Low | DONE (v2.2) |
| 12 | ~~Knowledge Base Management~~ | KB 列表 + 状态 + 统计 | Medium | DONE (v3.0) |
| 13 | ~~Settings Panel~~ | 模型/数据/通知/安全 4 section | Medium | DONE (v3.0) |
| 14 | ~~Template Gallery~~ | Category tabs + 模板卡片 | Low | DONE (v3.0) |
| 15 | ~~Platform Sidebar~~ | 收缩式导航 + active indicator | Low | DONE (v3.0) |
| 16 | User Authentication | Login / RBAC / Token | High | Deferred |
| 17 | Database Persistence | PostgreSQL + Prisma ORM | High | Deferred |
| 18 | Knowledge CRUD | 知识库创建/编辑/删除 + 文件上传 | Medium | Pending |
| 19 | Workflow CRUD | 工作流创建/编辑/保存 | High | Deferred |

### Roadmap

```
v2.0            v2.2           v2.3           v3.0 (current)     v3.5              v4.0
  |               |              |              |                  |                 |
Batch Demo    Dify API      Dark Theme     Platform Shell     Auth + DB         Full CRUD
Glassmorphism n8n BG        Unification    8 Pages            KB Upload         Drag-drop editor
Copy/Export   SubDoc Model  SSR dark       Dual-color brand   OCR Animation     Collab/WebSocket
Security      5 Mock Cases  Stitch         Role Workflow SOP  PDF Export        Production deploy
```

---

## 5. Deployment Options

| Platform | Pros | Cons | Recommended For |
|----------|------|------|----------------|
| Vercel | Zero config, edge functions, preview deployments | Cost at scale, vendor lock-in | 快速迭代、演示环境 |
| Cloudflare Pages | Free tier generous, fast global CDN, Workers | Limited server-side functions, build limits | 长期稳定部署、成本敏感 |
| Docker (self-hosted) | Self-hosted, air-gapped capable, full control | More ops work, need infra | 国企内网部署、数据安全要求高 |

### Deployment Decision Matrix

| Scenario | Recommended Platform |
|----------|---------------------|
| 开发和内部测试 | Vercel (preview per PR) |
| 外部演示（互联网可达） | Vercel or CF Pages |
| 国企客户现场演示（内网） | Docker (air-gapped) |
| 长期 SaaS 化运营 | CF Pages + Workers |

### Docker Deployment Spec

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
# ... build steps ...

FROM node:20-alpine AS runner
# ... production image ...
# Final image target: < 200MB
```

环境变量:
- `DIFY_API_BASE_URL`: Dify API endpoint
- `DIFY_API_KEY`: Dify API key (runtime secret, never bake into image)
- `NEXT_PUBLIC_APP_TITLE`: 可自定义的应用标题

---

## 6. Monitoring & Observability (Production)

| Layer | Tool | Metric |
|-------|------|--------|
| Frontend Performance | Web Vitals API | LCP, FID, CLS, TTFB |
| Error Tracking | Sentry (or console fallback) | JS errors, SSE failures |
| API Health | Uptime check | Dify API availability |
| Usage Analytics | Plausible (privacy-first) | Page views, workflow runs |

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-03-10 | v1.0 | Initial optimization plan |
| 2026-03-11 | v2.3 | Dify API + n8n background + dark theme done |
| 2026-03-12 | v3.0 | **Platform migration**: 8 pages done, roadmap extended to v3.5/v4.0, 7 new enhancements (#12-19) |
| 2026-03-13 | v3.1 | **Animation optimization (D-015)**: phase transitions changed from AnimatePresence to plain div swaps, reducing animation bundle; SubDocBar readability improvements (72px width, 6px height, bold 700 counts) |

---

Maurice | maurice_wen@proton.me
