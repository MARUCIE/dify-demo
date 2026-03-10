# CLAUDE.md -- 21-dify-demo

> 路桥报销审核智能体 | Dify Workflow Demo Frontend

## Identity

- **Project**: 21-dify-demo
- **Description**: 国企 Dify 工作流展示前端，替代 Dify 原生 UI，展示 10 步费用报销审核智能体
- **Type**: Demo / Showcase application
- **Language**: Chinese UI, English code

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS 4 + shadcn/ui
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Package Manager**: pnpm
- **Node**: 20+

## Key Commands

```bash
pnpm dev          # Dev server (http://localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
```

## Environment Variables

```bash
DEMO_MODE=true           # true = mock data, false = real Dify API
DIFY_API_URL=            # Dify API endpoint
DIFY_API_KEY=            # Dify API bearer token
```

## Doc Read Priority

```
1. PRD.md (product requirements)
2. notes.md (working notes, decisions)
3. task_plan.md (current phase & tasks)
4. SYSTEM_ARCHITECTURE.md (when created)
5. USER_EXPERIENCE_MAP.md (when created)
```

All docs: `doc/00_project/initiative_21-dify-demo/`

## Coding Rules

- Readability > Correctness > Performance > Brevity
- Chinese for all user-facing text (labels, messages, tooltips)
- English for all code, comments, identifiers
- No emoji in code or comments
- No backward compatibility layers
- shadcn/ui components as base; customize via TailwindCSS
- Framer Motion for all animations (no CSS transitions for complex sequences)

## Source Project

Scaffolded from `07-lingque-professional` B-end. Stripped to minimal shell.

---

Maurice | maurice_wen@proton.me
