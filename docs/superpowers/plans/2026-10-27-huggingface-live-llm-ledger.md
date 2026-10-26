# Implementation ledger

| Step | Verification | Outcome / ruling |
| --- | --- | --- |
| Hub normalization | `node --test tests/huggingface.test.cjs` | Public metadata only; bounded 3-sort fetch; dedupe/filter/URL checks pass. Actual Hub route returned 60 models. |
| Value ranking | `node --test tests/value-ranking.test.cjs` | Requires 2+ common approved benchmark IDs, same evidence cohort, positive GGUF size; no fabricated score. |
| Cache fallback | `node --test tests/catalog-cache.test.cjs` | Invalid/empty storage is ignored; stale successful catalogs remain usable; empty response is not written. |
| Production browser | `http://localhost:3003` | Fresh status rendered, 60 Hub models were visible, static task categories remained, value/file metadata showed unknown where evidence was absent. |
| Production build | `npm run build` | Passed before final UI wording and size-display correction; repeat before push. |
| Full verification | Pending | Run full tests/typecheck/build, production API and browser smoke checks after final edits. |
