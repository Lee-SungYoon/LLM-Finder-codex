# Hugging Face Live LLM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the app's LLM catalog from Hugging Face on every page load and recommend compact reasoning models using comparable benchmark evidence per estimated model-file GB.

**Architecture:** A no-store Next.js Route Handler fetches bounded recent, trending, and popular public text-generation metadata and normalizes it. The browser replaces static LLM cards on valid fresh data, remembers the last successful response in local storage, and falls back to the bundled seed catalog. Only the existing bundled non-LLM categories remain unchanged.

**Tech Stack:** Next.js 14 Route Handler, React 18, TypeScript, native `fetch`, localStorage, existing Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-27-huggingface-live-llm-design.md`

## Global Constraints

- No new runtime dependency and no Hugging Face token for public model metadata.
- Every app load makes one bounded request to `/api/models`; no periodic polling.
- Use text-generation only; exclude gated and disabled repos; retain the bundled LLM fallback.
- Value score uses common AIME 2026, GPQA Diamond, and MMLU-Pro IDs, requires two shared scores, keeps verification cohorts separate, and divides mean 0–100 score by quantized artifact GiB.
- Never claim measured throughput, verified hardware execution, or open-source license from missing data.

## Review Focus

- Hub timeout/rate limit → cache or seed remains visible with source and age; test each.
- Malformed, empty, or partial Hub JSON → do not replace last-good client data.
- Repeated repos returned across three sorts → exactly one normalized record per ID.
- Gated, disabled, unknown-license, and non-text-generation models → correct filtering and license state.
- Missing, unmatched, unverified, or incomparable evaluations/size → no fabricated value index; test.

---

### Task 1: Hub model fetching and normalization

**Files:**
- Create: `app/api/models/route.ts`
- Create: `lib/huggingface.ts`
- Modify: `lib/types.ts`
- Test: `tests/huggingface.test.cjs`

**Interfaces:**
- `fetchLatestModels(fetcher: typeof fetch, now?: Date): Promise<HubCatalogResponse>`
- Response: `{ source: "huggingface", fetchedAt: string, models: HubModel[] }`
- `HubModel`: `{ id, author, name, url, createdAt, updatedAt, downloads, likes, gated, disabled, license, parameterCount, artifactSizeBytes, formats, evaluations[] }`
- Evaluation: `{ benchmarkId, taskId, score, verified, sourceUrl, cohort }`

- [x] Write failing normalization tests for API sorting, metadata shaping, ID deduplication, and filtering gated/disabled/non-text-generation entries.
- [x] Write failing tests for timeouts, HTTP 429/5xx, malformed JSON, and empty result rejection.
- [x] Run `npm test` and verify each new case fails for the expected contract.
- [x] Implement a bounded, no-store parallel fetch for `createdAt`, `trendingScore`, and `downloads`, requesting only spec fields; validate and normalize responses and return HTTP cache-control no-store from the route.
- [x] Run `npm test` and `npm run typecheck`.

### Task 2: Evidence-based value ranking

**Files:**
- Create: `lib/value-ranking.ts`
- Modify: `lib/scoring.ts`
- Test: `tests/value-ranking.test.cjs`

**Interfaces:**
- `rankByValue(models: HubModel[]): RankedHubModel[]`
- `RankedHubModel` adds optional `{ valueIndex, benchmarkCoverage, artifactSizeGiB, confidenceCohort }`.

- [ ] Test identical ≥2 benchmark subsets within a cohort; assert that one shared score is insufficient, unmatched benchmark subsets do not compare, and evidence cohorts never mix.
- [ ] Test that verified and publisher-reported cohorts never compare against each other; missing quantized file size yields no value index.
- [x] Implement the exact formula and tie-breaks in the approved spec, validating score ranges and positive finite artifact sizes.
- [x] Run the ranking tests, full `npm test`, and typecheck.

### Task 3: Per-load freshness and safe fallback

**Files:**
- Modify: `app/page.tsx`
- Create: `lib/catalog-cache.ts`
- Modify: `lib/finder.ts`
- Test: `tests/catalog-cache.test.cjs`

**Interfaces:**
- Client state: `{ models: HubModel[], source: "fresh" | "cached" | "seed", fetchedAt?: string, loading: boolean, error?: string }`.
- `readCachedCatalog(storage): CachedCatalog | undefined`
- `writeCachedCatalog(storage, response): void`

- [x] Test valid timestamped storage parse, malformed JSON rejection, stale display, and refusal to persist an empty response.
- [x] Implement page-mount fetch with `cache: "no-store"`, save only a valid non-empty response, and restore last successful response or bundled LLM seeds on failure.
- [x] Add bounded manual retry, freshness/source status, retryable error state, and Korean loading/cached/seed copy.
- [x] Keep non-LLM category records and existing search, filters, selection, and comparison behaviors intact.
- [x] Run unit tests and typecheck.

### Task 4: Live LLM and value UI

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: production browser flow

- [x] Add tests/assertions or browser checks for dynamic LLM card rendering, license unknown state, benchmark provenance, storage estimate, and no-score fallback ordering.
- [x] Replace static LLM cards with fetched records after successful refresh; keep seed LLM cards as fallback and keep non-LLM cards in existing categories.
- [x] Provide recent/trending/value sort controls; disable value sort without a comparable cohort and show exact score coverage, verification cohort, and file-GB units.
- [x] Verify 390 px layout, keyboard focus/selection, filters/search, manual retry, fallback states, and browser console.
- [x] Run `npm test`, `npm run typecheck`, `npm run build`, and production server HTTP/browser checks.

### Task 5: Publish repository update

**Files:** all approved implementation and tests.

- [x] Review final diff and `git diff --check`; confirm model metadata remains external/untrusted display data.
- [x] Commit the implementation on `codex/open-ai-finder-mvp`.
- [x] Fetch and push the branch, then verify local and remote refs match and the worktree is clean.
