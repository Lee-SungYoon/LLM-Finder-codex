import { HubCatalogResponse, HubEvaluation, HubModel } from "./types";

const HUB_MODELS_API = "https://huggingface.co/api/models";
const SORTS = ["createdAt", "trendingScore", "downloads"] as const;
const MAX_MODELS_PER_SORT = 30;
const MAX_MODELS = 60;
const EXPAND = ["author", "cardData", "createdAt", "downloads", "disabled", "evalResults", "gated", "gguf", "lastModified", "likes", "pipeline_tag", "safetensors", "tags", "trendingScore"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function normalizeLicense(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "other" || normalized === "unknown" || !/^[a-z0-9.+-]{2,80}$/.test(normalized)) return null;
  const known: Record<string, string> = { "apache-2.0": "Apache-2.0", mit: "MIT", "bsd-3-clause": "BSD-3-Clause", "bsd-2-clause": "BSD-2-Clause", "openmdw-1.1": "OpenMDW 1.1", "cc-by-nc-4.0": "CC-BY-NC-4.0", "llama3.1": "Llama Community License" };
  return known[normalized] ?? normalized.toUpperCase();
}

function normalizeEvaluation(value: unknown): HubEvaluation | null {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.dataset)) return null;
  const dataset = value.data.dataset;
  const id = typeof dataset.id === "string" ? dataset.id : "";
  const taskId = typeof dataset.task_id === "string" ? dataset.task_id : "";
  const score = finiteNumber(value.data.value);
  if (!id || !taskId || score === null) return null;
  const normalized = `${id} ${taskId}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!/aime\s*2026|gpqa.*diamond|mmlu\s*pro/.test(normalized)) return null;
  const source = isRecord(value.data.source) ? value.data.source.url : null;
  const verified = value.verified === true;
  return {
    benchmarkId: normalized.includes("aime") ? "aime-2026" : normalized.includes("gpqa") ? "gpqa-diamond" : "mmlu-pro",
    taskId,
    score: score <= 1 ? score * 100 : score,
    verified,
    sourceUrl: typeof source === "string" && source.startsWith("https://") ? source : null,
    cohort: verified ? "verified" : "publisher-reported"
  };
}

export function normalizeHubModel(value: unknown): HubModel | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const id = value.id;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(id)) return null;
  const explicitlyUngated = value.gated === false || value.gated === "false";
  const explicitlyEnabled = value.disabled === false || value.disabled === "false";
  if (value.pipeline_tag !== "text-generation" || !explicitlyUngated || !explicitlyEnabled) return null;

  const card = isRecord(value.cardData) ? value.cardData : {};
  const safetensors = isRecord(value.safetensors) ? value.safetensors : {};
  const gguf = isRecord(value.gguf) ? value.gguf : {};
  const [author, ...nameParts] = id.split("/");
  const parameterGroups = isRecord(safetensors.parameters) ? Object.values(safetensors.parameters).map(finiteNumber).filter((n): n is number => n !== null) : [];
  const parameterCount = parameterGroups.length ? parameterGroups.reduce((sum, count) => sum + count, 0) : null;
  const formats = [finiteNumber(gguf.totalFileSize) !== null || finiteNumber(gguf.total) !== null ? "GGUF" : null, finiteNumber(safetensors.total) !== null ? "Safetensors" : null].filter((v): v is string => v !== null);
  const evalResults = Array.isArray(value.evalResults) ? value.evalResults.map(normalizeEvaluation).filter((v): v is HubEvaluation => v !== null) : [];
  const date = (candidate: unknown) => typeof candidate === "string" && !Number.isNaN(Date.parse(candidate)) ? candidate : null;

  return {
    id, author, name: nameParts.join("/"), url: `https://huggingface.co/${id}`,
    createdAt: date(value.createdAt), updatedAt: date(value.lastModified),
    downloads: finiteNumber(value.downloads) ?? 0, likes: finiteNumber(value.likes) ?? 0,
    trendingScore: finiteNumber(value.trendingScore) ?? 0, gated: false, disabled: false,
    license: normalizeLicense(card.license), parameterCount,
    artifactSizeBytes: finiteNumber(gguf.totalFileSize) ?? finiteNumber(gguf.total), formats, tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 20) : [],
    evaluations: dedupeEvaluations(evalResults)
  };
}

function dedupeEvaluations(evaluations: HubEvaluation[]): HubEvaluation[] {
  const result: Record<string, HubEvaluation> = Object.create(null);
  for (const evaluation of evaluations) result[`${evaluation.benchmarkId}:${evaluation.taskId}:${evaluation.cohort}`] = evaluation;
  return Object.values(result);
}

function requestUrl(sort: typeof SORTS[number]): string {
  const url = new URL(HUB_MODELS_API);
  url.searchParams.set("pipeline_tag", "text-generation");
  url.searchParams.set("sort", sort);
  url.searchParams.set("direction", "-1");
  url.searchParams.set("limit", String(MAX_MODELS_PER_SORT));
  for (const field of EXPAND) url.searchParams.append("expand[]", field);
  return url.toString();
}

export async function fetchLatestModels(fetcher: typeof fetch = fetch, now = new Date()): Promise<HubCatalogResponse> {
  const responses = await Promise.all(SORTS.map(async sort => {
    const response = await fetcher(requestUrl(sort), { headers: { accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(`Hugging Face returned HTTP ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) throw new Error("Hugging Face returned an invalid model list");
    return payload.map(normalizeHubModel).filter((model): model is HubModel => model !== null);
  }));

  const merged: Record<string, HubModel> = Object.create(null);
  for (const response of responses) for (const model of response) {
    const previous = merged[model.id];
    if (!previous) merged[model.id] = model;
    else merged[model.id] = {
      ...previous, ...model,
      formats: Array.from(new Set([...previous.formats, ...model.formats])),
      evaluations: dedupeEvaluations([...previous.evaluations, ...model.evaluations]),
      downloads: Math.max(previous.downloads, model.downloads), likes: Math.max(previous.likes, model.likes),
      trendingScore: Math.max(previous.trendingScore, model.trendingScore)
    };
  }
  const models = Object.values(merged).sort((a, b) => b.trendingScore - a.trendingScore || b.downloads - a.downloads || (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, MAX_MODELS);
  if (models.length === 0) throw new Error("Hugging Face returned no usable text-generation models");
  return { source: "huggingface", fetchedAt: now.toISOString(), models };
}
