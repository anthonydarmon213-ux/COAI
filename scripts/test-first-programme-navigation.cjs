const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let states, cursor, calls, navigations, response;
const router = { refresh: () => navigations.push('refresh'), replace: url => navigations.push(url) };
const box = { exports: {}, fetch: async (url, options) => { calls.push([url, options.method]); return response; }, require: name => {
  if (name === 'react') return { useState: initial => {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], next => { states[index] = next; }];
  } };
  if (name === 'next/navigation') return { useRouter: () => router };
  if (name.startsWith('@/')) return new Proxy({}, { get: () => 'button' });
  return require(name);
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/programme/regenerate-button.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, box);
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function render(hasExisting) { cursor = 0; return nodes(box.exports.RegenerateButton({ hasExisting })); }
function reset(result = { echecs: 0 }, ok = true) {
  states = []; calls = []; navigations = [];
  response = { ok, json: async () => result };
}
(async () => {
  reset();
  await render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick();
  assert.deepEqual(calls, [['/api/programmes/generate?mode=onboarding', 'POST']]);
  assert.deepEqual(navigations, ['/programme/entrainement?onboarding=1#seance-du-jour', 'refresh']);
  reset();
  await render(true).find(n => n.props?.children === 'Recréer mes 3 piliers').props.onClick();
  assert.equal(calls.length, 0, 'Existing versions require confirmation');
  await render(true).find(n => n.props?.children === 'Oui, recréer les 3 piliers').props.onClick();
  assert.deepEqual(calls, [['/api/programmes/generate', 'POST']]);
  assert.deepEqual(navigations, ['refresh']);
  for (const [body, ok] of [[{ error: 'Relecture requise' }, false], [{ echecs: 1 }, true]]) {
    reset(body, ok);
    await render(false).find(n => n.props?.children === 'Créer mon programme complet').props.onClick();
    assert.deepEqual(navigations, [], 'Failure must not announce a ready workout');
    assert(render(false).some(n => n.props?.children === 'Créer mon programme complet' && !n.props.disabled));
  }
  console.log('PASS real creation handler: resumable first request, first-session navigation, explicit recreation confirmation, failure stays recoverable.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
