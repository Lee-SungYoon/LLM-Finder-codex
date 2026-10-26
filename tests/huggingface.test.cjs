const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { fetchLatestModels } = require('../lib/huggingface.ts');

const row = (id, fields = {}) => ({ id, pipeline_tag: 'text-generation', gated: false, disabled: false, tags: ['transformers'], likes: 10, downloads: 200, createdAt: '2026-10-20T00:00:00Z', lastModified: '2026-10-22T00:00:00Z', cardData: { license: 'apache-2.0' }, gguf: { total: 4_000_000_000, totalFileSize: 3_500_000_000 }, safetensors: { total: 4_000_000_000, parameters: { BF16: 4_000_000_000 } }, evalResults: [], ...fields });

function fetcherFor(payloadBySort) {
  const calls = [];
  const fetcher = async url => {
    const parsed = new URL(url);
    calls.push(parsed);
    return new Response(JSON.stringify(payloadBySort[parsed.searchParams.get('sort')]), {status: 200, headers: {'content-type':'application/json'}});
  };
  return { fetcher, calls };
}

test('merges recent, trending, and popular Hub results and builds safe catalog metadata', async () => {
  const {fetcher, calls} = fetcherFor({createdAt:[row('org/a')], trendingScore:[row('org/a',{likes:12}),row('org/b',{pipeline_tag:'image-classification'})], downloads:[row('org/c',{gated:'manual'})]});
  const result = await fetchLatestModels(fetcher, new Date('2026-10-27T00:00:00Z'));
  assert.equal(calls.length, 3);
  assert.deepEqual(result.models.map(x=>x.id), ['org/a']);
  assert.equal(result.models[0].license, 'Apache-2.0');
  assert.equal(result.models[0].artifactSizeBytes, 3_500_000_000);
  assert.equal(result.models[0].url, 'https://huggingface.co/org/a');
  assert.equal(result.source, 'huggingface');
});

test('rejects unusable empty, malformed, rate-limited, and failed Hub responses', async t => {
  for (const [name, response] of [
    ['empty lists', () => new Response('[]',{status:200})],
    ['malformed JSON', () => new Response('{bad',{status:200})],
    ['rate limit', () => new Response('rate limited',{status:429})],
    ['server failure', () => new Response('failed',{status:503})]
  ]) await t.test(name, async () => {
    await assert.rejects(fetchLatestModels(async () => response(), new Date('2026-10-27T00:00:00Z')));
  });
});

test('keeps unknown license explicit and never trusts an external repository URL', async () => {
  const {fetcher} = fetcherFor({createdAt:[row('org/z',{url:'https://evil.example/model',cardData:{license:'other'},gated:false})],trendingScore:[],downloads:[]});
  const result = await fetchLatestModels(fetcher, new Date('2026-10-27T00:00:00Z'));
  assert.equal(result.models[0].id, 'org/z');
  assert.equal(result.models[0].license, null);
  assert.equal(result.models[0].url, 'https://huggingface.co/org/z');
});

test('rejects models with unknown gated or disabled status', async () => {
  const {fetcher} = fetcherFor({createdAt:[row('org/a',{gated:undefined})],trendingScore:[row('org/b',{disabled:undefined})],downloads:[row('org/c',{gated:'false',disabled:false})]});
  const result = await fetchLatestModels(fetcher, new Date('2026-10-27T00:00:00Z'));
  assert.deepEqual(result.models.map(x=>x.id), ['org/c']);
});

test('preserves verified and publisher-reported evaluations as separate evidence', async () => {
  const evaluation = (verified, score) => ({verified,data:{dataset:{id:'GPQA Diamond',task_id:'text-generation'},value:score,source:{url:'https://example.com/card'}}});
  const {fetcher} = fetcherFor({createdAt:[row('org/a',{evalResults:[evaluation(true,70)]})],trendingScore:[row('org/a',{evalResults:[evaluation(false,65)]})],downloads:[]});
  const result = await fetchLatestModels(fetcher, new Date('2026-10-27T00:00:00Z'));
  assert.deepEqual(result.models[0].evaluations.map(x=>x.cohort).sort(), ['publisher-reported','verified']);
});
