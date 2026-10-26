# Validation — 2026-10-27

## Repository comparison

Fetched `origin` and compared the default branch `codex/open-ai-finder-mvp` with local HEAD `92c8f7d`. Local history was three commits ahead, but the tracked source trees were identical. No remote files were missing locally and no user edits needed overwriting.

## Reproduced and repaired

- Clicking a suggested question used the previous React state. Pass the question directly, and clear unrelated filters before task search.
- Depth questions routed to 3D generation. Split depth/geometry and 3D routing.
- Reasoning and Embedding were missing from category controls. Derive categories from the catalog.
- OS-specific links and filenames disagreed (MLX labels with GGUF files; non-MLX models searched as MLX). Centralize format, URL and label resolution without inventing exact filenames.
- Search with no results lacked recovery. Add an empty state and reset action.
- Guide buttons did not reveal the selected guide or open installation evidence. Scroll to the selected guide and provide the model documentation link.
- Live Search and detected hardware labels implied unimplemented functionality. Display local catalog and example hardware status explicitly.
- Arbitrary selected models were presented as a compatible pipeline. State that input/output compatibility needs separate verification.
- A late desktop CSS override prevented the hero's mobile single-column layout. Restore the responsive override, constrain long model labels and wrap the comparison bar.

## Checks

- Five regression tests reproduce the original category, routing and download failures and pass after repair.
- TypeScript check and production build pass.
- Production browser checks: one-click STT search (2 models), no-result recovery (20 models restored), Embedding category (1 model), Windows GGUF route, two-model comparison, commercial filter (12 models, no restricted license), search shortcut and 390px mobile viewport.
- Model weights, external repository availability, licenses and hardware execution were not verified; this remains an example catalog.

Runtime: local production server uses port 3002 because 3001 belongs to another project. Dependencies are installed in this project rather than linked to a temporary directory.
