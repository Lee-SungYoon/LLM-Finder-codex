import { HubCatalogResponse, HubEvaluation, HubModel } from "./types";

export const CATALOG_STORAGE_KEY = "open-ai-finder:huggingface-catalog:v1";
export type CachedCatalog = { fetchedAt: string; models: HubModel[] };
export type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHubModel(value: unknown): value is HubModel {
  if (!isRecord(value) || typeof value.id !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value.id)) return false;
  const [author, ...name] = value.id.split("/");
  return value.author === author && value.name === name.join("/") && value.url === `https://huggingface.co/${value.id}` &&
    (value.createdAt === null || typeof value.createdAt === "string") && (value.updatedAt === null || typeof value.updatedAt === "string") &&
    typeof value.downloads === "number" && Number.isFinite(value.downloads) && typeof value.likes === "number" && Number.isFinite(value.likes) &&
    typeof value.trendingScore === "number" && Number.isFinite(value.trendingScore) && value.gated === false && value.disabled === false &&
    (value.license === null || typeof value.license === "string") && (value.parameterCount === null || typeof value.parameterCount === "number") &&
    (value.artifactSizeBytes === null || typeof value.artifactSizeBytes === "number") && Array.isArray(value.formats) && value.formats.every(x => typeof x === "string") &&
    Array.isArray(value.tags) && value.tags.every(x => typeof x === "string") && Array.isArray(value.evaluations) && value.evaluations.every(isHubEvaluation);
}

function isHubEvaluation(value: unknown): value is HubEvaluation {
  return isRecord(value) && typeof value.benchmarkId === "string" && typeof value.taskId === "string" && typeof value.score === "number" && Number.isFinite(value.score) &&
    typeof value.verified === "boolean" && (value.sourceUrl === null || typeof value.sourceUrl === "string" && value.sourceUrl.startsWith("https://")) &&
    (value.cohort === "verified" || value.cohort === "publisher-reported");
}

export function isValidHubCatalogResponse(value: unknown): value is HubCatalogResponse {
  return isRecord(value) && value.source === "huggingface" && typeof value.fetchedAt === "string" && !Number.isNaN(Date.parse(value.fetchedAt)) &&
    Array.isArray(value.models) && value.models.length > 0 && value.models.every(isHubModel);
}

export function readCachedCatalog(storage: StorageLike): CachedCatalog | undefined {
  try {
    const raw = storage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return undefined;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || typeof value.fetchedAt !== "string" || Number.isNaN(Date.parse(value.fetchedAt)) || !Array.isArray(value.models) || value.models.length === 0 || !value.models.every(isHubModel)) return undefined;
    return { fetchedAt: value.fetchedAt, models: value.models };
  } catch { return undefined; }
}

export function writeCachedCatalog(storage: StorageLike, response: HubCatalogResponse): void {
  if (!isValidHubCatalogResponse(response)) return;
  try { storage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({ fetchedAt: response.fetchedAt, models: response.models })); } catch { /* Storage can be disabled or full; live results still render. */ }
}

export function readBrowserCachedCatalog(): CachedCatalog | undefined {
  try { return typeof window === "undefined" ? undefined : readCachedCatalog(window.localStorage); } catch { return undefined; }
}

export function writeBrowserCachedCatalog(response: HubCatalogResponse): void {
  try { if (typeof window !== "undefined") writeCachedCatalog(window.localStorage, response); } catch { /* Storage access may itself be blocked. */ }
}
