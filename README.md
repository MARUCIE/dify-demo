# 21-dify-demo

Road & Bridge Expense Reimbursement Audit Agent -- Dify Workflow Demo Frontend

## Overview

A visually polished frontend for a 10-step Dify AI workflow that audits expense reimbursement documents for state-owned enterprises (SOE). Replaces the default Dify UI with animated workflow visualization and professional result display.

## Features

- PDF document upload with drag-and-drop
- 10-step workflow visualization with step-by-step animation
- Structured audit result display with issue highlighting
- Mock mode for offline demos + live Dify API integration
- Dark/Light mode support
- Chinese UI throughout

## Tech Stack

Next.js 15 | TailwindCSS 4 | shadcn/ui | Framer Motion

## Quick Start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Environment

```bash
DEMO_MODE=true           # Mock data mode
DIFY_API_URL=            # Dify API endpoint (live mode)
DIFY_API_KEY=            # Dify API key (live mode)
```

---

Maurice | maurice_wen@proton.me
