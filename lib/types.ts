export type LicenseClass = "Open Source" | "Open Weights" | "Non-Commercial" | "Restricted";
export type AppKey = "LM Studio" | "Ollama" | "ComfyUI" | "Draw Things" | "Transformers" | "MLX" | "vLLM" | "SGLang";
export type HubEvaluation = { benchmarkId: string; taskId: string; score: number; verified: boolean; sourceUrl: string | null; cohort: "verified" | "publisher-reported" };
export type HubModel = { id: string; author: string; name: string; url: string; createdAt: string | null; updatedAt: string | null; downloads: number; likes: number; trendingScore: number; gated: false; disabled: false; license: string | null; parameterCount: number | null; artifactSizeBytes: number | null; formats: string[]; tags: string[]; evaluations: HubEvaluation[] };
export type HubCatalogResponse = { source: "huggingface"; fetchedAt: string; models: HubModel[] };
export type RankedHubModel = HubModel & { valueIndex?: number; benchmarkCoverage: number; benchmarkIds?: string[]; artifactSizeGiB?: number; confidenceCohort?: HubEvaluation["cohort"] };
export interface AIModel {
  id: string; name: string; org: string; category: string; tags: string[]; description: string;
  params: string; memory: string; fit: number; license: LicenseClass; commercial: boolean | "conditional";
  formats: string[]; apps: AppKey[]; updated: string; benchmark: string; frontier?: boolean; confidence: "High" | "Medium" | "Low";
  downloadFile?: string; installTarget?: string; outputHint?: string;
  repoUrl?: string; mlxUrl?: string; ggufUrl?: string;
}
