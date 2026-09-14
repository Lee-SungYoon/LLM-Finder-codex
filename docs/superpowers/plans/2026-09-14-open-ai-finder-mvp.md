# Open AI Finder MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, locally runnable Open AI Finder dashboard that ranks seeded open models by category and local hardware fit.

**Architecture:** A small Next.js App Router client app will keep the seed catalog and scoring logic in focused TypeScript modules, then render an interactive dashboard. The MVP is intentionally frontend-first: Hugging Face Live Search and native hardware detection remain clean extension points, while the UI already exposes Quick/Live mode, filters, comparison, and usage guidance.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, lucide-react.

**Spec:** User-provided Open AI Finder product definition in pasted-text.txt.

## Global Constraints

- Separate `GLOBAL BEST` from `BEST FOR MY PC`.
- Show license class, commercial use, hardware fit, quantization, and execution apps.
- Use Apple M2 Max / Unified Memory 64GB as the detected hardware example.
- Use cached seed data for QUICK mode and label LIVE SEARCH as a future live verification path.
- Keep the interface usable for non-expert users.

### Task 1: Scaffold the runnable Next.js app

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

- [ ] **Step 1: Create package and configuration files** with Next.js scripts and the lucide-react dependency.
- [ ] **Step 2: Add global design tokens** for the dark graphite canvas, lime accent, typography, cards, pills, and responsive layout.
- [ ] **Step 3: Verify the scaffold** with `npm install` and `npm run build`.

### Task 2: Add model catalog and scoring engine

**Files:**
- Create: `lib/types.ts`
- Create: `lib/models.ts`
- Create: `lib/scoring.ts`

**Interfaces:**
- `AIModel` describes catalog entries and display metadata.
- `scoreForHardware(model: AIModel, memoryGB: number): number` returns a 0–100 fit score.
- `rankModels(models: AIModel[], mode: "global" | "local"): AIModel[]` returns sorted models.

- [ ] **Step 1: Define the model and hardware types** covering categories, formats, apps, license classes, benchmarks, and scores.
- [ ] **Step 2: Seed representative models** across LLM, coding, image, video, audio, OCR, segmentation, depth, and 3D.
- [ ] **Step 3: Implement deterministic global/local scoring** with local memory penalties and explicit frontier/cloud labeling.
- [ ] **Step 4: Verify scoring** with a TypeScript compile and manual ordering check for Qwen3.8-27B versus GLM-5.3.

### Task 3: Build the interactive finder dashboard

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Add top navigation and hero state** showing the live index date, Quick/Live toggle, and hardware summary.
- [ ] **Step 2: Add category navigation, search, and filters** for Open Source, Commercial, Local Only, Apple Silicon, Quantized, and app compatibility.
- [ ] **Step 3: Add Global Best / Best for My PC tabs** and render ranked model cards with fit badges, model metadata, apps, and selection checkboxes.
- [ ] **Step 4: Add selected-model comparison drawer** with count, compare action, and reset interaction.
- [ ] **Step 5: Add usage guide panel and ASK AI composer** that updates from the selected model and category.
- [ ] **Step 6: Verify responsive rendering** with `npm run build` and a local browser smoke test.

### Task 4: Final verification and handoff

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document local setup** and explain that seed data powers Quick mode while live Hugging Face integration is the next backend step.
- [ ] **Step 2: Run `npm run build`** and confirm there are no TypeScript or route errors.
- [ ] **Step 3: Inspect the final diff** for accidental files and verify the app starts with `npm run dev`.
