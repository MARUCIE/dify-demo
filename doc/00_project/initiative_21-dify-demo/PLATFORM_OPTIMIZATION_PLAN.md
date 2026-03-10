# PLATFORM_OPTIMIZATION_PLAN -- 21-dify-demo

> 平台优化与扩展计划 | 性能目标、优化策略、未来路线图

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
| DatePicker | Main bundle | Page load |
| WorkflowPipeline | Main bundle | Page load |
| StepCard | Main bundle | Page load |
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
EventSource configuration:
  - Automatic reconnection (browser default)
  - Custom retry interval: 3s
  - Error boundary: display error state in WorkflowPipeline
  - Timeout: 120s (workflow max duration)
  - Cleanup: close EventSource on component unmount
```

关键实现要点:
- 使用 `EventSource` API（非 `fetch` + `ReadableStream`）以获得自动重连
- 每个 SSE event 解析后立即更新对应 StepCard 状态
- 连接断开时保留已接收数据，重连后从断点继续
- 组件卸载时必须调用 `eventSource.close()` 防止内存泄漏

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
| 1 | ~~Batch Processing~~ | 100 文件批量上传+逐文件审核+仪表盘汇总 | Medium | DONE (v2.0) |
| 2 | Light Mode Toggle | 亮色主题，适应强光演示环境 | Medium | Pending |
| 3 | Dify API Integration | SSE streaming 对接真实工作流 | Medium | Pending |
| 4 | Export to PDF Report | html2pdf 导出格式化审核报告 | Medium | Pending |
| 5 | OCR Scanning Animation | 步骤 4 手写识别过程可视化 | Medium | Pending |
| 6 | Virtual Scrolling | 100+ 文件列表性能优化 | Low | Pending |
| 7 | History / Audit Trail | localStorage 保存历史 | Low | Pending |
| 8 | Workflow Customization | 拖拽编辑器 | High | Deferred |
| 9 | Real-time Collaboration | 多人同看演示 | High | Deferred |

### Roadmap

```
v2.0 (current)     v2.5              v3.0
     |                |                 |
  Batch Demo     Light Mode +      Collab + Custom
  Glassmorphism  Dify API Live     WebSocket
  Copy/Export    OCR Animation     Drag-drop editor
  Security HDR   PDF Export        Multi-viewer
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

Maurice | maurice_wen@proton.me
