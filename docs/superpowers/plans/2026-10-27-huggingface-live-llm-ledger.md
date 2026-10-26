# Implementation ledger

| Step | Verification | Outcome / ruling |
| --- | --- | --- |
| Task 1: Hub normalization | `node --test tests/huggingface.test.cjs`; production `GET /api/models` | Pass. Three bounded Hub lists merge/dedupe; malformed, empty, gated, disabled, unknown-license and unsafe-ID cases covered. Production returned 60 valid records with `Cache-Control: no-store`; 16 had GGUF size and 5 had evaluation metadata in the sampled response. |
| Task 2: Evidence ranking | `node --test tests/value-ranking.test.cjs` | Pass. Values require two models with the same ≥2 benchmark IDs, same evidence cohort, and positive GGUF file size. |
| Task 3: Freshness/fallback | `node --test tests/catalog-cache.test.cjs` | Pass. Fresh response on each page load, validated local cache, blocked-storage handling, stale cache/seed fallback and retry. |
| Task 4: UI | `npm test`, `npm run typecheck`, `npm run build`; production browser tests | Pass. Live LLMs replace static LLM/reasoning cards; gpt-oss and manually reviewed NVIDIA candidate appear in reasoning; search works; value control is disabled without common evidence. 390px emulated viewport reported `clientWidth=390`, `scrollWidth=390`. Initial mobile capture exposed toolbar overflow; wrapped the search and status and rechecked. |
| Task 5: Publish | Independent whole-branch review; `npm test`; `npm run typecheck`; `npm run build`; `git diff --check`; production HTTP smoke; remote SHA check | Review findings fixed; 19 tests pass; build, typecheck and HTTP smoke pass. Commits `ad1d062`, `95457c0`, and `990a3e2` pushed to `origin/codex/open-ai-finder-mvp`. |

## Rulings

- Ruling: Keep value rankings to a single benchmark-set/cohort group shared by at least two models. This is stricter than scoring every available pair, but avoids ranking incomparable published benchmark subsets; it can leave otherwise useful candidates unscored.
- Ruling: Do not auto-promote a reasoning model to a default from Hub popularity or publisher-only scores. NVIDIA Nemotron 3.5 Bolt E4B is included as a manually reviewed candidate, but the current Hub list API reports its license as `other` and does not expose its model-card benchmark table as structured evaluation results; the app therefore shows unknown license and no value score. The cost if this errs on the cautious side is that a useful model may not become the default until comparable structured evidence appears.
- Review resolution: Reject entries unless Hub explicitly reports `gated=false` and `disabled=false` (boolean or string form). Keep the in-memory last-good catalog visible when a retry fails, including when browser storage is unavailable. Deduplicate evaluation entries within each provenance cohort so verified and publisher-reported evidence remain distinct.
- Review note: Reviewer flagged possible parameter overcount if Hub `safetensors.parameters` buckets represent alternate dtypes. The current aggregation follows the per-dtype count convention; the app labels this as metadata and does not use it to compute value ranking. Revisit if Hub schema documentation or observed payloads show the buckets overlap.
