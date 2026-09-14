export type LicenseClass = "Open Source" | "Open Weights" | "Non-Commercial" | "Restricted";
export type AppKey = "LM Studio" | "Ollama" | "ComfyUI" | "Draw Things" | "Transformers" | "MLX" | "vLLM" | "SGLang";
export interface AIModel {
  id: string; name: string; org: string; category: string; tags: string[]; description: string;
  params: string; memory: string; fit: number; license: LicenseClass; commercial: boolean | "conditional";
  formats: string[]; apps: AppKey[]; updated: string; benchmark: string; frontier?: boolean; confidence: "High" | "Medium" | "Low";
  downloadFile?: string; installTarget?: string; outputHint?: string;
  repoUrl?: string; mlxUrl?: string; ggufUrl?: string;
}
