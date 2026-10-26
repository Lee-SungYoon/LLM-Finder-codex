import { HubEvaluation, HubModel, RankedHubModel } from "./types";

const COMMON = ["aime-2026", "gpqa-diamond", "mmlu-pro"] as const;
const BENCHMARK_SETS = [[...COMMON], [COMMON[0], COMMON[1]], [COMMON[0], COMMON[2]], [COMMON[1], COMMON[2]]];
const GIB = 1024 ** 3;
type Cohort = HubEvaluation["cohort"];

function cohortFor(model: HubModel): Cohort {
  return model.evaluations.some(evaluation => evaluation.cohort === "verified") ? "verified" : "publisher-reported";
}

export function rankByValue(models: HubModel[]): RankedHubModel[] {
  const base: RankedHubModel[] = models.map(model => ({ ...model, benchmarkCoverage: new Set(model.evaluations.filter(e => e.cohort === cohortFor(model) && COMMON.includes(e.benchmarkId as typeof COMMON[number])).map(e => e.benchmarkId)).size, confidenceCohort: cohortFor(model) }));
  const cohorts: Cohort[] = ["verified", "publisher-reported"];
  for (const cohort of cohorts) {
    const candidates = models.filter(model => model.artifactSizeBytes !== null && Number.isFinite(model.artifactSizeBytes) && model.artifactSizeBytes! > 0 && cohortFor(model) === cohort);
    let matched: HubModel[] = [];
    let shared: string[] = [];
    for (const benchmarkSet of BENCHMARK_SETS) {
      const group = candidates.filter(model => benchmarkSet.every(id => model.evaluations.some(e => e.benchmarkId === id && e.cohort === cohort && Number.isFinite(e.score) && e.score >= 0 && e.score <= 100)));
      if (group.length >= 2) { matched = group; shared = benchmarkSet; break; }
    }
    if (matched.length < 2) continue;
    for (const model of matched) {
      const scores = shared.map(id => model.evaluations.find(e => e.benchmarkId === id && e.cohort === cohort)!.score);
      const entry = base.find(candidate => candidate.id === model.id)!;
      entry.benchmarkCoverage = shared.length;
      entry.benchmarkIds = shared;
      entry.confidenceCohort = cohort;
      entry.artifactSizeGiB = model.artifactSizeBytes! / GIB;
      entry.valueIndex = scores.reduce((sum, score) => sum + score, 0) / scores.length / entry.artifactSizeGiB;
    }
  }
  return base.sort((a, b) => {
    if (a.confidenceCohort !== b.confidenceCohort) return a.confidenceCohort === "verified" ? -1 : 1;
    if (a.valueIndex !== undefined && b.valueIndex !== undefined) return b.valueIndex - a.valueIndex || b.trendingScore - a.trendingScore || b.downloads - a.downloads;
    if (a.valueIndex !== undefined) return -1;
    if (b.valueIndex !== undefined) return 1;
    return b.trendingScore - a.trendingScore || b.downloads - a.downloads;
  });
}
