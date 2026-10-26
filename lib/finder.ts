import { models } from "./models";
import { Platform } from "./scoring";
import { AIModel, HubModel } from "./types";

export const categories = ["All models", ...Array.from(new Set(models.map(model => model.category)))];

export function isReasoningCandidate(model: Pick<HubModel, "id" | "name" | "tags" | "evaluations">): boolean {
  return /reason|thinking/i.test(`${model.id} ${model.name} ${model.tags.join(" ")}`) || model.evaluations.some(evaluation => ["aime-2026", "gpqa-diamond", "mmlu-pro"].includes(evaluation.benchmarkId));
}

export function questionQuery(question: string): string {
  const trimmed = question.trim();
  const normalized = trimmed.toLowerCase();
  if (/stt|asr|whisper|받아쓰기|음성인식|음성 인식|speech/.test(normalized)) return "STT";
  if (/ocr|문서|영수증|표 추출|document/.test(normalized)) return "OCR / Document AI";
  if (/이미지 생성|그림 생성|text.to.image|image generation/.test(normalized)) return "Image generation";
  if (/영상 생성|비디오|video generation/.test(normalized)) return "Video generation";
  if (/음악 생성|music generation|audio generation/.test(normalized)) return "Music generation";
  if (/geometry|깊이|depth/.test(normalized)) return "Depth / Geometry";
  if (/3d/.test(normalized)) return "3D generation";
  return trimmed;
}

// Route only to formats recorded in the catalog. A format search is not verification.
export function downloadFor(model: AIModel, platform: Platform) {
  const hasGGUF = model.formats.includes("GGUF") || model.formats.some(format => /^Q\d/.test(format));
  const format = platform === "mac" && model.formats.includes("MLX") ? "MLX" : hasGGUF ? "GGUF" : model.formats[0] ?? "모델 파일";
  const variantUrl = format === "MLX" ? model.mlxUrl : format === "GGUF" ? model.ggufUrl : undefined;
  const search = `${model.name}${format === "MLX" || format === "GGUF" ? ` ${format}` : ""}`;
  const url = variantUrl ?? (format === "MLX" || format === "GGUF" ? undefined : model.repoUrl) ?? `https://huggingface.co/models?search=${encodeURIComponent(search)}`;
  const filename = model.downloadFile;
  const compatibleFile = filename && (format === "MLX" ? false : format === "GGUF" ? filename.endsWith(".gguf") : !filename.endsWith(".gguf"));
  return { format, url, label: compatibleFile ? filename : `${model.name} · ${format} 파일 확인` };
}
