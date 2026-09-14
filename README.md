# Open AI Finder

Open AI Finder is a local-first discovery dashboard for finding open AI models and understanding which ones a computer can realistically run.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The MVP uses a curated seed catalog and an example Apple M2 Max / 64 GB hardware profile. Quick Search ranks the local catalog; Live Search is represented in the interface as the integration point for Hugging Face verification. The next backend step is to connect the catalog adapter to the Hugging Face Hub API and replace the static hardware profile with platform-specific detection.
