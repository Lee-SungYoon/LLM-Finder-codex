# Open AI Finder

A local-first dashboard for browsing an example AI model catalog and comparing estimated hardware fit.

## Run locally

Validated with Node.js 24.22.1. Install dependencies, then start:

```bash
npm ci
npm run dev
```

Open http://localhost:3000. If the port is occupied, use `npm run dev -- --port 3002`.

## Validate and run production

```bash
npm test
npm run typecheck
npm run build
npm start -- --port 3002
```

Stop the development server before building: both commands write to `.next`.

## Current behavior and limits

- Search, category and license filters run against the bundled catalog. Task prompts route to a related category; no AI service or file analysis is connected.
- Categories derive from the catalog, including Reasoning and Embedding.
- OS selection prioritizes recorded MLX/GGUF formats. Download links open a repository or format search; they do not verify file availability.
- Hardware scores use an **example Apple M2 Max / 64 GB profile**. Browser OS detection does not detect GPU or RAM, and fit is not an execution guarantee.
- Catalog model names, dates, licenses, benchmarks and filenames are seed data, not a verified current index. Confirm these on the model publisher's page before downloading.
- Selected models show separate installation guidance. Input/output compatibility between models is not automatically checked.

The next backend integration is Hugging Face Hub verification and an explicitly supplied or detected hardware profile.
