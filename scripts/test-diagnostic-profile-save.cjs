const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx', 'utf8');
const ast = ts.createSourceFile('quiz.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'appliquerAuProfil') handler = node;
  ts.forEachChild(node, visit);
}
visit(ast);
assert(handler);
async function scenario(responses, existing = false) {
  const state = { cleared: 0 }, calls = [];
  const box = {
    aDejaUnProgramme: existing,
    reponsesEnProfil: () => ({ age: 35 }),
    setApplyStatus: value => { state.status = value; },
    setApplyErrorMessage: value => { state.message = value; },
    setApplyNeedsFormule: value => { state.offer = value; },
    setApplyNeedsReview: value => { state.review = value; },
    trackFunnelEvent: () => {},
    clearDiagnosticProgress: () => { state.cleared++; },
    fetch: async (url) => {
      calls.push(url);
      const response = responses.shift();
      assert(response, 'No unexpected request');
      if (response instanceof Error) throw response;
      return { ok: response.status < 400, status: response.status, json: async () => response.body };
    },
  };
  vm.runInNewContext(ts.transpileModule(handler.getText(ast), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText, box);
  await vm.runInNewContext('appliquerAuProfil()', box);
  return { state, calls };
}
(async () => {
  for (const response of [new Error('offline'), { status: 503 }, { status: 400 }]) {
    const { state, calls } = await scenario([response]);
    assert.equal(state.status, 'idle', 'Keep the save action available');
    assert.equal(state.cleared, 0, 'Failed saves must retain the resumable result');
    assert(state.message, 'A failed profile save must not silently reset the button');
    assert.deepEqual(calls, ['/api/profil']);
  }
  const existing = await scenario([{ status: 200 }], true);
  assert.equal(existing.state.status, 'done');
  assert.equal(existing.state.cleared, 1);
  assert.equal(existing.calls.length, 1, 'Do not regenerate an existing programme');
  const free = await scenario([{ status: 200 }, { status: 403, body: { error: 'Choisir une offre' } }]);
  assert.equal(free.state.offer, true);
  assert.equal(free.state.cleared, 1, 'Profile persisted even when programme access is denied');
  assert.equal(free.state.status, 'erreur');
  assert.equal(free.state.message, 'Choisir une offre');
  assert.match(source, /role="alert">\{applyErrorMessage\}/);
  console.log('PASS actual save handler: visible failure, retry available, no generation after failed save, existing programme preserved, access refusal actionable. Requests simulated.');
})().catch(error => { console.error(error); process.exitCode = 1; });
