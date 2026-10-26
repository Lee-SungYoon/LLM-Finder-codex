const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { CATALOG_STORAGE_KEY, readCachedCatalog, writeCachedCatalog, readBrowserCachedCatalog, writeBrowserCachedCatalog, isValidHubCatalogResponse } = require('../lib/catalog-cache.ts');
const makeStorage = value => ({value, getItem(){return this.value;}, setItem(_key,v){this.value=v;}});
const model = {id:'org/a',author:'org',name:'a',url:'https://huggingface.co/org/a',createdAt:null,updatedAt:null,downloads:1,likes:1,trendingScore:1,gated:false,disabled:false,license:'MIT',parameterCount:null,artifactSizeBytes:null,formats:[],tags:[],evaluations:[]};
const valid = {source:'huggingface', fetchedAt:'2026-10-27T00:00:00Z', models:[model]};
test('cache reads timestamped valid catalogs and rejects malformed, empty, or unsafe models', () => {
 assert.equal(readCachedCatalog(makeStorage(JSON.stringify({fetchedAt:'2020-01-01',models:[model]}))).models.length, 1);
 assert.equal(readCachedCatalog(makeStorage('{bad')), undefined);
 assert.equal(readCachedCatalog(makeStorage(JSON.stringify({fetchedAt:'2026-10-27',models:[]}))), undefined);
 assert.equal(readCachedCatalog(makeStorage(JSON.stringify({fetchedAt:'2026-10-27',models:[{...model,url:'javascript:alert(1)'}]}))), undefined);
});
test('cache writes only valid nonempty catalogs', () => {
 const storage=makeStorage(null); writeCachedCatalog(storage, valid); assert.ok(storage.value.includes('2026-10-27'));
 const before=storage.value; writeCachedCatalog(storage,{...valid,models:[]}); assert.equal(storage.value,before);
 assert.equal(isValidHubCatalogResponse({...valid,models:[{...model,id:'bad'}]}),false);
 assert.equal(CATALOG_STORAGE_KEY,'open-ai-finder:huggingface-catalog:v1');
});
test('browser storage access failures never turn a live response into an application error', () => {
 const previous = global.window;
 Object.defineProperty(global, 'window', { configurable:true, value:Object.defineProperty({}, 'localStorage', {get(){throw new Error('blocked');}}) });
 assert.equal(readBrowserCachedCatalog(), undefined);
 assert.doesNotThrow(() => writeBrowserCachedCatalog(valid));
 if(previous === undefined) delete global.window; else Object.defineProperty(global,'window',{configurable:true,value:previous});
});
