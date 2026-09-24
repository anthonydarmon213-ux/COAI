const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
const source = fs.readFileSync('src/components/dashboard/weekly-checkin-card.tsx', 'utf8');
const ast = ts.createSourceFile('card.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let submit;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleSubmit') submit = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast); assert.ok(submit);
async function attempt(values = {}, outcome = 'success') {
  let calls = 0, done = 0, error = null, sent;
  const box = {sommeil: '', energie: null, stress: null, faim: null, motivation: null,
    poidsKg: '', douleurs: null, seancesRealisees: '', repasMaison: '', repasRestaurant: '', commentaire: '',
    loading: false, ...values, Error, TypeError,
    setLoading: value => {box.loading = value;}, setError: value => {error = value;}, onDone: () => {done++;},
    fetch: async (_, request) => { calls++; sent = JSON.parse(request.body);
      if (outcome === 'offline') throw new TypeError('Failed to fetch');
      return {ok: outcome === 'success', status: outcome === 'expired' ? 401 : 503};
    },
  };
  vm.runInNewContext(ts.transpileModule(submit, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, box);
  await box.handleSubmit();
  return {calls, done, error, sent, box};
}
(async () => {
  for (const values of [{}, {commentaire: '   '}]) {
    const result = await attempt(values);
    assert.equal(result.calls, 0); assert.equal(result.done, 0);
    assert.match(result.error, /au moins une réponse/); assert.equal(result.box.loading, false);
  }
  for (const values of [{douleurs: false}, {seancesRealisees: '0'}, {repasMaison: '0'}, {energie: 3}]) {
    const result = await attempt(values); assert.equal(result.calls, 1); assert.equal(result.done, 1);
  }
  for (const outcome of ['offline', 'expired', 'failure']) {
    const result = await attempt({commentaire: 'Ma semaine', energie: 2}, outcome);
    assert.equal(result.done, 0); assert.equal(result.box.loading, false);
    assert.equal(result.box.commentaire, 'Ma semaine'); assert.equal(result.box.energie, 2);
    assert.ok(result.error);
  }
  assert.equal((await attempt({loading: true, energie: 3})).calls, 0);
  console.log('PASS weekly form handler: blank blocked before network, false/zero accepted, errors preserve answers and release loading. Handler test, not browser/iPhone UI.');
})().catch(error => {console.error(error); process.exitCode = 1;});
