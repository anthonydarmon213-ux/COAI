// Real loader with controlled filesystem outcomes. No files/accounts/network changed.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
let result, failure, builds = 0;
const fallback = () => { builds++; return { source: 'fallback' }; };
const imports = {
  'node:fs/promises': { readFile: async () => { if (failure) throw failure; return result; } },
  'node:path': require('node:path'),
  '@/lib/programmes-socles/cle': {
    cleEntrainement: () => 'training', cleNutrition: () => 'nutrition', cleRecuperation: () => 'recovery',
  },
  '@/lib/programmes-socles/catalogue': {
    construireSocleEntrainement: fallback, construireSocleNutrition: fallback, construireSocleRecuperation: fallback,
  },
};
const box = { exports: {}, process: { cwd: () => '/fixture' }, console: { info() {} },
  require(name) { assert.ok(name in imports, name); return imports[name]; },
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/programmes-socles/index.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, box);
(async () => {
  for (const name of ['socleEntrainement', 'socleNutrition', 'socleRecuperation']) {
    const load = box.exports[name];
    failure = undefined; result = '{"source":"editorial"}';
    const before = builds;
    assert.equal((await load({})).source, 'editorial');
    assert.equal(builds, before);
    failure = Object.assign(new Error('missing'), { code: 'ENOENT' });
    assert.equal((await load({})).source, 'fallback');
    assert.equal(builds, before + 1);
    for (const code of ['EACCES', 'EIO', 'EMFILE']) {
      failure = Object.assign(new Error(code), { code });
      await assert.rejects(load({}), error => error === failure);
    }
    failure = undefined; result = '{broken';
    await assert.rejects(load({}), error => error.name === 'SyntaxError');
    assert.equal(builds, before + 1, 'Unreadable editorial content must not trigger fallback');
  }
  console.log('PASS: three real pillar loaders preserve editorial content; only ENOENT allows fallback; read/JSON failures propagate.');
  console.log('LIMIT: filesystem outcomes mocked; no production or editorial suitability validation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
