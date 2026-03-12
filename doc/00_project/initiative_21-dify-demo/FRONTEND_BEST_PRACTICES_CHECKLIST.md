# Frontend Best Practices Checklist -- 21-dify-demo

> 前端最佳实践 Checklist | v1.0 | 2026-03-10
> Synthesized from 4 parallel research streams: SOE Design, Performance, Accessibility, Security

---

## Research Sources

| Stream | Agent | Key References |
|--------|-------|---------------|
| SOE Design Patterns | Research Analyst | Ant Design, 政务网站设计规范, Carbon Design System |
| Next.js 16 Performance | Research Analyst | React 19 docs, Framer Motion bundle guide, TanStack Virtual |
| Accessibility Standards | Research Analyst | WCAG 2.2, GB/T 37668-2019, ARIA Authoring Practices |
| Security Best Practices | Research Analyst | OWASP File Upload, CSP Level 3, China PIPL/DSL |

---

## Priority Tiers

### CRITICAL -- Must implement before next demo

| # | Item | Category | Impact | Effort | Status |
|---|------|----------|--------|--------|--------|
| C1 | Remove Google Fonts, use system font stack only | Performance | Bundle -50KB, LCP -0.5s | 15min | done |
| C2 | Add `optimizePackageImports` for lucide-react | Performance | Tree-shaking, bundle -20KB | 5min | done |
| C3 | Framer Motion `LazyMotion` + `m` component (page.tsx) | Performance | Bundle -200KB uncompressed | 2-3h | done |
| C4 | `useReducedMotion` via `MotionConfig` | Perf+A11y | Dual: accessibility + skip expensive animations | 30min | done |
| C5 | Detail overlay: `role="dialog"` + `aria-modal` + Escape key | Accessibility | Modal accessibility barrier | 1h | done |
| C6 | ARIA live region for workflow progress | Accessibility | Screen readers can't perceive step changes | 30min | done |
| C7 | Focus-visible styles + sr-only utility | Accessibility | Keyboard users can't see focus | 20min | done |
| C8 | PDF magic byte validation (`%PDF-` header check) | Security | File extension bypass prevention | 30min | done |

### HIGH -- Implement within 1-2 weeks

| # | Item | Category | Impact | Effort | Status |
|---|------|----------|--------|--------|--------|
| H1 | `useTransition()` for phase state updates | Performance | Non-blocking phase transitions | 1h | done |
| H2 | TanStack Virtual for 100+ file list | Performance | DOM nodes 100→12, 90% paint reduction | 3-4h | done |
| H3 | GPU acceleration: `will-change` + `transform3d(0,0,0)` on animated elements | Performance | 60fps glassmorphism | 1h | done |
| H4 | `layoutId` for phase container transitions | Performance | CLS < 0.05, smooth morphing | 1-2h | pending |
| H5 | Dark theme contrast audit (4.5:1 minimum on glass panels) | Accessibility | WCAG AA compliance | 2h | done |
| H6 | Keyboard navigation: Tab order through all phases | Accessibility | Keyboard-only users blocked | 2h | done |
| H7 | CSP refinement: remove `unsafe-eval`, add nonce for scripts | Security | XSS mitigation | 1-2h | done |
| H8 | API rate limiting on /api/audit route | Security | Abuse prevention | 1h | done |
| H9 | CJK line-height: 1.7 minimum for Chinese text | SOE Design | Readability for Han characters | 30min | done |
| H10 | Status badges: icon + text always (not color-only) | A11y+SOE | Colorblind safety | 30min | done |

### RESEARCH-DRIVEN ADDITIONS (from 4 parallel research agents)

| # | Item | Category | Source | Effort | Status |
|---|------|----------|--------|--------|--------|
| R1 | `prefers-reduced-transparency` media query (glass → solid fallback) | Accessibility | A11y Research H3 | 15min | done |
| R2 | `aria-sort` on sortable table headers | Accessibility | A11y Research H4 | 30min | done |
| R3 | Focus trap in detail modal (Tab cycling within dialog) | Accessibility | A11y Research C3 | 1h | done |
| R4 | PIPL consent tracking for file uploads | Security+Legal | Security Research C5 | 2h | pending (Phase 5) |
| R5 | SSE authentication (CSRF token for EventSource) | Security | Security Research C4 | 2h | pending (Phase 5) |
| R6 | Data classification schema (PUBLIC/INTERNAL/CONFIDENTIAL) | Security | Security Research H4 | 3h | pending (Phase 5) |

### MEDIUM -- Backlog

| # | Item | Category | Impact | Effort | Status |
|---|------|----------|--------|--------|--------|
| M1 | Dynamic import for ResultPanel + BatchResultsDashboard | Performance | Code splitting, smaller initial chunk | 1h | done |
| M2 | React.memo on StepCard + IssueCard | Performance | Reduce re-renders during workflow | 1h | done |
| M3 | Bundle analyzer (Next.js 16.1 experimental) | Performance | Identify bloat sources | 30min | pending |
| M4 | Web Worker for PDF metadata extraction | Performance | Main thread freed | 4h | pending |
| M5 | `content-visibility: auto` for off-screen phases | Performance | Skip rendering hidden phases | 30min | pending |
| M6 | Skip-to-main-content link | Accessibility | Screen reader navigation | 15min | done |
| M7 | DOMPurify for rendering API responses | Security | XSS prevention in result display | 1h | pending |
| M8 | Docker air-gapped deployment hardening | Security | SOE intranet security | 4h | pending |
| M9 | Date format: Chinese locale (YYYY年MM月DD日) | SOE Design | Enterprise convention | 30min | pending |
| M10 | Table text alignment: right-align numerics | SOE Design | Chinese business convention | 15min | done |

---

## Implementation Details

### C1: Remove Google Fonts

**Problem**: `layout.tsx` imports `Geist` and `Geist_Mono` from `next/font/google`. These are Latin-only fonts that add network requests and don't help Chinese text rendering.

**Fix**: Remove Google Font imports, rely on system font stack already defined in `globals.css`:
```css
font-family: "Inter", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
```

**Files**: `src/app/layout.tsx`

### C2: optimizePackageImports

**Problem**: `lucide-react` has 1000+ icons. Without optimization, all icon metadata is bundled.

**Fix**: Add to `next.config.ts`:
```typescript
experimental: {
  optimizePackageImports: ['lucide-react', 'framer-motion'],
}
```

**Files**: `next.config.ts`

### C3: Framer Motion LazyMotion

**Problem**: Full `motion` import includes drag, gestures, layout — features not all needed. Represents ~30-40% of bundle.

**Fix**: Replace `motion` with `m` + `LazyMotion` wrapper:
```typescript
import { LazyMotion, domAnimation, m } from 'framer-motion';

// Wrap app in LazyMotion
<LazyMotion features={domAnimation}>
  <m.div animate={{ opacity: 1 }}>...</m.div>
</LazyMotion>
```

**Files**: All component files using `motion`

### C4: MotionConfig reducedMotion

**Problem**: `prefers-reduced-motion` is CSS-only in `globals.css`. Framer Motion animations still run.

**Fix**: Add `MotionConfig` wrapper in layout or page:
```typescript
import { MotionConfig } from 'framer-motion';
<MotionConfig reducedMotion="user">...</MotionConfig>
```

**Files**: `src/app/page.tsx` or `src/app/layout.tsx`

### C5: Detail Overlay Accessibility

**Problem**: Modal overlay at line 447-507 in `page.tsx` lacks:
- `role="dialog"` and `aria-modal="true"`
- `aria-label` or `aria-labelledby`
- Focus trap (Tab cycles within modal)
- Escape key handler

**Fix**: Add ARIA attributes, useEffect for Escape key, focus trap logic.

**Files**: `src/app/page.tsx`

### C6: ARIA Live Region for Workflow Progress

**Problem**: When steps change from idle→active→completed, screen readers have no way to know.

**Fix**: Add `aria-live="polite"` region that announces step changes:
```html
<div role="status" aria-live="polite" className="sr-only">
  步骤 {currentStep}/{totalSteps} -- {stepName} -- {status}
</div>
```

**Files**: `src/components/workflow/WorkflowPipeline.tsx`, `src/components/batch/BatchProgress.tsx`

### C7: Focus-Visible Styles

**Problem**: No visible focus indicator for keyboard navigation. Buttons, dropzone, table rows have no `:focus-visible` styles.

**Fix**: Add global focus-visible style in `globals.css`:
```css
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

**Files**: `src/app/globals.css`

### C8: PDF Magic Byte Validation

**Problem**: File validation only checks MIME type and extension. Attackers can rename malicious files to `.pdf`.

**Fix**: Read first 5 bytes of uploaded file and verify `%PDF-` header:
```typescript
async function isPdfMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 5).arrayBuffer();
  const header = new TextDecoder().decode(buffer);
  return header.startsWith('%PDF-');
}
```

**Files**: `src/components/upload/UploadZone.tsx`

---

## Verification Commands

```bash
# Build and check bundle size
pnpm build

# Lighthouse audit (after deployment)
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse.json

# Accessibility audit
npx axe-core http://localhost:3000

# Check contrast ratios
# Manual: Chrome DevTools > Elements > Computed > contrast ratio
```

---

## Cross-Reference to PDCA Docs

| Checklist Item | PRD Section | UX Map Section | Architecture Section | Platform Opt Section |
|----------------|-------------|----------------|---------------------|---------------------|
| C1 Google Fonts | 5. Tech Stack | 4.4 Typography | -- | 2.4 Font Loading |
| C3 LazyMotion | 5. Tech Stack | 4.3 Animation | 4.2 Components | 3. Build & Bundle |
| C5 Dialog A11y | 4.2 Accessibility | 3.4 Phase 4 | -- | -- |
| C6 ARIA Live | 4.2 Accessibility | 3.2 Phase 2 | -- | -- |
| H2 Virtual Scroll | -- | -- | -- | 4. Future #6 |
| H5 Contrast | 4.3 Visual Design | 4.1 Color Palette | -- | 1. Performance |

---

Maurice | maurice_wen@proton.me
