const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { models } = require('../lib/models.ts');
const finder = require('../lib/finder.ts');

test('every catalog category is reachable', () => {
  assert.ok(finder.categories.includes('Reasoning'));
  assert.ok(finder.categories.includes('Embedding'));
  for (const model of models) assert.ok(finder.categories.includes(model.category));
});
test('question routing distinguishes depth from 3D generation', () => {
  assert.equal(finder.questionQuery('깊이 추정 모델 추천'), 'Depth / Geometry');
  assert.equal(finder.questionQuery('3D 생성'), '3D generation');
  assert.equal(finder.questionQuery('한국어 STT'), 'STT');
  assert.equal(finder.questionQuery('  MiniLM  '), 'MiniLM');
});
test('download format, link and label agree on each platform', () => {
  const model = models.find(m => m.id === 'qwen-coder-30b');
  const mac = finder.downloadFor(model, 'mac');
  assert.equal(mac.format, 'MLX');
  assert.ok(!mac.label.endsWith('.gguf'));
  assert.match(mac.url, /MLX/i);
  const win = finder.downloadFor(model, 'windows');
  assert.equal(win.format, 'GGUF');
  assert.match(win.label, /\.gguf$/);
  assert.match(win.url, /GGUF/i);
});
test('models without MLX do not get an invented MLX search', () => {
  const download = finder.downloadFor(models.find(m => m.id === 'sam-31'), 'mac');
  assert.equal(download.format, 'FP16');
  assert.ok(!decodeURIComponent(download.url).includes('MLX'));
});
test('Q4 formats prefer GGUF on Windows and missing formats remain safe', () => {
  const qwen = finder.downloadFor(models[0], 'windows');
  assert.equal(qwen.format, 'GGUF');
  assert.match(qwen.url, /GGUF/i);
  assert.doesNotThrow(() => finder.downloadFor({...models[0], formats:[]}, 'linux'));
});

test('reasoning candidates include Hugging Face benchmark evidence even without reasoning tags', () => {
  const { isReasoningCandidate } = require('../lib/finder.ts');
  const base = { id:'org/general', name:'general', tags:['text-generation'], evaluations:[] };
  assert.equal(isReasoningCandidate(base), false);
  assert.equal(isReasoningCandidate({...base, id:'openai/gpt-oss-20b', evaluations:[{benchmarkId:'gpqa-diamond'}]}), true);
  assert.equal(isReasoningCandidate({...base, tags:['reasoning']}), true);
  assert.equal(isReasoningCandidate({...base, id:'nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB', name:'NVIDIA-Nemotron-3.5-Bolt-E4B-4GB'}), true);
});
