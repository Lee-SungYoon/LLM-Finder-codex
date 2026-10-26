# LLM catalog policy

## Refresh behavior

- On each application page load, request the public Hugging Face Hub model API through `/api/models` with browser and server caching disabled.
- Fetch a bounded set of recent, trending, and most-downloaded public `text-generation` repositories. Do not download model weights and do not require a Hub token.
- Exclude gated, disabled, malformed, and non-text-generation repositories. Treat all Hub metadata and model-card content as untrusted display data.
- Save only non-empty successful responses in browser local storage. If refresh fails, keep the last successful response; if none exists, keep the bundled catalog visible. A manual refresh repeats the same bounded request.
- Keep task-specific image, audio, OCR, embedding, and coding recommendations in the bundled catalog. Live Hub results replace the bundled general LLM and reasoning recommendations while fresh or cached Hub data is available.

## Recommendation and evidence rules

- Sort the live catalog by Hub trend, publication date, or an optional value score. Trend and popularity are discovery signals, not quality claims.
- The value score is the mean score over the intersection of AIME 2026, GPQA Diamond, and MMLU-Pro divided by the Hub-reported GGUF `totalFileSize` in GiB (falling back to `gguf.total` only when no file total is reported). Require at least two models in the same evidence cohort with the same two or more benchmark IDs and positive finite file size; average only that shared set. Models outside that comparable cohort receive no index.
- Never combine verified and publisher-reported evaluation cohorts. Show the cohort and benchmark coverage next to any value score. If evidence or file size is missing, show no score and rank the model by the selected discovery sort.
- The value sort stays disabled unless at least two comparable models exist. This storage-normalized benchmark index is not tokens per second, runtime memory, hardware fit, or a measured inference cost. It does not identify a winner by itself.
- Show license as unknown when the Hub model card lacks a recognized license. Do not infer commercial permission from missing metadata. Link to the repository so users can verify current terms before use.
- The manually reviewed reasoning shortlist includes `nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB` because its current publisher card provides quantized reasoning benchmarks; keep it labeled as a candidate until it has comparable Hub evaluation metadata.
- Do not automatically replace task-specific defaults based only on trends. A new candidate can become a curated default only after comparable benchmark, quantized-file, license, and supported-hardware evidence is reviewed.
