const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { rankByValue } = require('../lib/value-ranking.ts');
const evals = (ids, cohort='publisher-reported') => ids.map((benchmarkId, i) => ({benchmarkId, taskId:benchmarkId, score:80+i, verified:cohort==='verified', sourceUrl:null, cohort}));
const model = (id, evaluations, artifactSizeBytes=1024**3) => ({id,author:'org',name:id,url:'https://huggingface.co/org/'+id,createdAt:null,updatedAt:null,downloads:1,likes:1,trendingScore:1,gated:false,disabled:false,license:null,parameterCount:null,artifactSizeBytes,formats:['GGUF'],tags:[],evaluations});
test('value ranking compares only a shared benchmark set within the same cohort', () => {
 const shared = ['aime-2026','gpqa-diamond'];
 const ranked = rankByValue([
  model('two', evals(shared), 1024**3),
  model('two-b', evals(shared), 2*1024**3),
  model('one', evals(['aime-2026'])),
  model('mixed', [...evals(['aime-2026']), ...evals(['gpqa-diamond'],'verified')]),
  model('verified-a', evals(shared, 'verified'), 1024**3),
  model('verified-b', evals(shared, 'verified'), 2*1024**3),
  model('different-set', evals(['gpqa-diamond','mmlu-pro']), 1024**3),
  model('no-size', evals(shared), null)
 ]);
 assert.equal(ranked.find(x=>x.id==='two').valueIndex, 80.5);
 assert.equal(ranked.find(x=>x.id==='two-b').valueIndex, 40.25);
 assert.equal(ranked.find(x=>x.id==='verified-a').confidenceCohort, 'verified');
 assert.equal(ranked.find(x=>x.id==='verified-a').benchmarkIds.length, 2);
 assert.equal(ranked.find(x=>x.id==='one').valueIndex, undefined);
 assert.equal(ranked.find(x=>x.id==='mixed').valueIndex, undefined);
 assert.equal(ranked.find(x=>x.id==='different-set').valueIndex, undefined);
 assert.equal(ranked.find(x=>x.id==='no-size').valueIndex, undefined);
 assert.ok(ranked.indexOf(ranked.find(x=>x.id==='two')) < ranked.indexOf(ranked.find(x=>x.id==='two-b')));
});
