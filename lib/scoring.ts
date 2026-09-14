import { AIModel } from "./types";

export type Platform = "mac" | "windows" | "linux";

export function scoreForHardware(model: AIModel, memoryGB: number): number {
  if (model.frontier) return Math.max(8, Math.min(35, Math.round(memoryGB / 2)));
  const base = model.fit;
  if (memoryGB >= 64) return Math.min(100, base + 8);
  if (memoryGB >= 32) return Math.max(0, base - 4);
  return Math.max(0, base - 16);
}

export function rankModels(models: AIModel[], mode: "global" | "local", memoryGB = 64, platform: Platform = "mac"): AIModel[] {
  return [...models].sort((a, b) => {
    const platformScore = (model: AIModel) => {
      const preferred = platform === "mac" ? "MLX" : "GGUF";
      const compatible = model.formats.includes(preferred);
      return compatible ? 8 : model.formats.length > 0 ? 2 : 0;
    };
    const aScore = (mode === "local" ? scoreForHardware(a, memoryGB) : a.frontier ? 99 : a.fit) + platformScore(a);
    const bScore = (mode === "local" ? scoreForHardware(b, memoryGB) : b.frontier ? 99 : b.fit) + platformScore(b);
    return bScore - aScore;
  });
}
