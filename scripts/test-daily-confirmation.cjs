const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/daily/daily-experience.tsx', 'utf8');
const ast = ts.createSourceFile('daily.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const pieces = [];
function visit(node) {
  if (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => ['SLEEP', 'ENERGY', 'FEEDBACK'].includes(d.name.getText(ast)))) pieces.push(node.getText(ast));
  if (ts.isFunctionDeclaration(node) && ['isDailyConfirmation', 'post'].includes(node.name?.text)) pieces.push(node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
const code = ts.transpileModule(pieces.join('\n'), {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText;
const good = {id: 'daily-fixture', updatedAt: '2026-10-04T12:00:00.000Z', completedAt: null, sleep: 'BON', energy: 'NORMALE', pain: false, workoutRating: null, adaptedSession: {exercices: []}};
async function attempt(data, {ok = true, unreadable = false, offline = false} = {}) {
  const previous = {id: 'previous-snapshot'};
  let displayed = previous, error = '', loading = false;
  const box = {setLoading: v => {loading = v;}, setError: v => {error = v;}, setDaily: v => {displayed = v;},
    fetch: async () => {if (offline) throw Error('network unavailable'); return {ok, json: async () => {if (unreadable) throw Error('invalid JSON'); return data;}};}};
  vm.runInNewContext(code, box);
  const success = await vm.runInNewContext('post({action:"checkin"})', box);
  assert.equal(loading, false);
  return {success, error, preserved: displayed === previous, displayed};
}
(async () => {
  for (const data of [null, [], {}, {...good, updatedAt: 'invalid'}, {...good, completedAt: 'invalid'}, {...good, sleep: null}, {...good, adaptedSession: []}, {...good, workoutRating: 'UNKNOWN'}]) {
    const result = await attempt(data);
    assert.equal(result.success, false); assert(result.preserved); assert.match(result.error, /pas pu être confirmé/);
  }
  for (const options of [{unreadable: true}, {offline: true}, {ok: false}]) {
    const result = await attempt(null, options); assert.equal(result.success, false); assert(result.preserved); assert(result.error);
  }
  const rejected = await attempt({error: 'Ta séance est déjà terminée.'}, {ok: false});
  assert.equal(rejected.error, 'Ta séance est déjà terminée.');
  for (const data of [good, {...good, completedAt: good.updatedAt, workoutRating: 'BIEN_DOSEE'}]) {
    const result = await attempt(data); assert.equal(result.success, true); assert.equal(result.displayed, data); assert.equal(result.error, '');
  }
  console.log('PASS actual daily POST handler: malformed/unreadable/offline/error responses preserve snapshot; valid save and feedback accepted; retry remains enabled. Mock transport.');
})().catch(error => {console.error(error); process.exitCode = 1;});
