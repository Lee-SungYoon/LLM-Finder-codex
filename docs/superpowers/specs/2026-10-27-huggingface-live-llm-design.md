# Hugging Face Live LLM Catalog and Value Recommendations

## Intent

Replace the app's stale, hand-maintained LLM recommendations with current Hugging Face Hub data whenever a visitor opens the app. Keep the curated non-LLM model categories. Help the user's example Apple M2 Max / 64 GB profile identify a compact reasoning model with strong published benchmark results, while making the evidence and limitations visible.

## Approaches

1. **Fetch from a Next.js server route on every app load (selected).** The server can call Hugging Face without browser CORS or exposing credentials, can normalize untrusted metadata, and can return an explicit freshness status. If it fails, the browser uses its last successful response and then the bundled catalog. This satisfies “latest on launch” without new infrastructure.
2. **Scheduled catalog snapshots.** A scheduled job gives a stable local feed but changes only on its schedule and needs a deployed scheduler and persisted storage. It does not meet the per-launch freshness requirement.
3. **Call Hugging Face directly from the browser.** This avoids the route but exposes the app to CORS, rate limits, provider response changes, and repeated browser requests without a validation boundary.

## Goals

- On every app page load, request current public text-generation models from Hugging Face.
- Combine recent releases with currently trending and popular candidates so “latest” does not mean “most popular only.”
- Replace the static LLM recommendation cards with normalized Hub records when fresh data is available; retain non-LLM seed categories.
- Rank reasoning value from comparable, published evaluations and estimated local model storage, with source and coverage shown to the user.
- Keep the application useful if Hugging Face is unavailable or returns unusable data.
- Report the data retrieval time and whether the screen shows fresh, cached, or bundled data.

## Non-goals

- Running or downloading model weights as part of catalog refresh.
- Claiming a model is fastest or measuring tokens per second. Hugging Face listing metadata does not measure throughput on the user's Apple Silicon hardware.
- Treating likes, downloads, or trending position as a reasoning-quality benchmark.
- Automatically treating user-written model-card content as executable instructions or verified facts.
- Refreshing image, speech, video, and other non-LLM categories from this API.

## Data and behavior

### Hub retrieval

Add `GET /api/models` as a Next.js Route Handler. On each browser page load, call it with `cache: "no-store"`. The server concurrently requests bounded public lists for `pipeline_tag=text-generation` sorted by `createdAt`, `trendingScore`, and `downloads`; it merges duplicate repository IDs, then returns a capped, normalized result. Request only needed Hub metadata (repository ID, author, creation and modification times, pipeline tag, tags, gated state, license, likes, downloads, parameter or GGUF size, evaluation results, and file-format indicators). Do not fetch full repository trees or model files.

Apply a server timeout and reject malformed responses. Exclude gated, disabled, non-text-generation, and duplicate records. Unknown licenses remain visible as unknown and cannot receive a commercial-use badge. Construct Hugging Face links only from validated repository IDs. Treat all Hub content and evaluation metadata as untrusted data.

### Fallback and freshness

On a successful non-empty response, the client stores normalized records and `fetchedAt` in local storage. If the request fails, show the last successful response with its older retrieval time; on a first visit without cached data, show the bundled LLM seed list. A failed refresh must never replace a good cached response with an empty list. The UI labels fresh, cached, and bundled states distinctly and allows a manual retry.

### Recommendation and replacement

The current LLM static seed cards are the fallback only. A fresh Hub response becomes the LLM list. Non-LLM catalog records remain in the existing categories. Keep separate “latest,” “trending,” and “best reasoning value” sort choices; default to recent/trending. Disable value sorting unless at least two models share a comparable benchmark cohort and file-size metadata; explain that evidence is incomplete when unavailable.

For the value sort, use only the common benchmark IDs AIME 2026, GPQA Diamond, and MMLU-Pro. Keep benchmark task IDs distinct; compare only the same dataset and task. Convert scores to a 0–100 percentage scale using the source benchmark metadata. A model receives a value index only inside a comparison cohort where at least two eligible models share the same set of two or more approved benchmark IDs; average exactly that shared set for every ranked model in that cohort. Keep verified leaderboard results and publisher-reported card results in separate evidence cohorts; do not combine a verified result for one model with a publisher-reported result for another. Models outside the selected comparable cohort keep no value index. This conservative grouping can leave a model unranked even when it has two scores that do not match another model’s evidence set. Display the exact benchmark coverage and verification source.

Calculate `valueIndex = mean(sharedScoresOn0To100) / estimatedQuantizedArtifactGiB`. Compare only models in the same evidence cohort with the same selected shared benchmark set; sort within that comparable group. Keep verified and publisher-reported groups separate. Ties favor more recent release. Label it “benchmark points per estimated model-file GB,” not inference speed or measured cost. This simple size ratio is an explicit proxy for model quality per download/storage cost and does not claim proportional runtime memory. If comparable scores or quantized size are missing, do not invent a value score; keep the model in recency/trending lists with evidence marked unavailable.

Initial candidate to evaluate for the 64 GB profile: `nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB`. Its Hub card reports Q4_K_M reasoning, tool-use, and instruction-following comparisons against small models, and the Hub model metadata reports a quantized artifact around 7.5 GB. The card's results are publisher-reported, and its OpenMDW license is not Apache/MIT; label both limitations. It is a candidate for the compact recommendation, not an automatically proven winner. Keep it in the reasoning shortlist as a manually reviewed candidate; its card results are not the approved shared benchmark set and do not enable the value index. Compare it with current compact alternatives and `Qwen/Qwen3.8-27B` before replacing the default value pick.

## UI requirements

- Keep the existing search, filters, and non-LLM cards working.
- In the LLM category, show each dynamic record's publisher, exact Hub repository link, release/update time, license status, downloads/likes, estimated storage when available, supported format evidence, and benchmark score provenance.
- Provide status text for last refresh and the active fallback source.
- Label storage and hardware-fit values as estimates; do not display “runs on this computer” as a verified guarantee.
- Give empty, loading, network-error, stale-data, and unknown-license states understandable Korean copy.
- Keep cards keyboard-accessible and responsive at a 390 px viewport.

## Constraints

- Use the existing Next.js 14 / React 18 / TypeScript stack; no new package unless the implementation proves one is necessary.
- Do not require a Hugging Face token for public metadata.
- Make one bounded refresh per page load and a bounded manual retry; do not poll continuously.
- Preserve the existing search, category, and hardware filters over normalized live LLM records.
- Never silently delete the bundled seed fallback.

## Acceptance checks

- Fresh app load calls the local route and renders valid current Hub LLM records.
- Recent, trending, and download-ranked candidates merge without duplicates.
- Hub timeout, rate-limit response, malformed JSON, empty data, and an unknown license preserve safe cached or seed content and show its source/time.
- A model with no comparable evaluations or no artifact size is not assigned a fabricated value rank.
- Comparable verified scores are compared only on shared benchmark IDs; unverified card claims stay visibly marked as publisher-reported.
- Search, category, filter, recommendation button, keyboard navigation, model comparison, and mobile layout remain usable.
- `npm test`, `npm run typecheck`, `npm run build`, production browser checks, and GitHub branch comparison pass.

## Research references

- Hugging Face Hub API model listing and available sort/expand fields: https://huggingface.co/docs/huggingface_hub/main/en/package_reference/hf_api
- Official benchmark leaderboard API, verified status, and model evaluation metadata: https://huggingface.co/docs/hub/leaderboard-data-guide
- Current catalog candidate, publisher benchmark claims, license, and GGUF details: https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB
- Current large-model comparison candidate and its publisher-reported benchmarks/storage: https://huggingface.co/Nanbeige/Nanbeige4.3-33B
- Existing 27B comparison baseline and structured evaluations: https://huggingface.co/Qwen/Qwen3.8-27B
