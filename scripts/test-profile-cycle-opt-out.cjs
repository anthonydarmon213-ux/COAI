// Execute the real form submission and route; no external auth, DB or webhook.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/compte/profil-form.tsx', 'utf8');
const ast = ts.createSourceFile('form.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let submit;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleSubmit') submit = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(submit);
const compile = text => ts.transpileModule(text, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let stored = { userId: 'owner', cycleMenstruelSuivi: true };
let writes = 0;
const modules = {
  'next/server': { NextResponse: Response },
  zod: require('zod'),
  '@/lib/auth/server': { getCurrentUser: async () => ({ id: 'authenticated' }) },
  '@/lib/db/client': { prisma: {
    user: { findUnique: async args => {
      assert.equal(args.where.supabaseAuthId, 'authenticated');
      return { id: 'owner' };
    } },
    profile: { upsert: async args => {
      assert.equal(args.where.userId, 'owner');
      stored = { ...stored, ...args.update }; writes++;
      return stored;
    } },
  } },
  '@/lib/whatsapp/client': { notifyMakeScenario: async () => assert.fail('No external send') },
};
const route = { exports: {}, require: name => { assert.ok(name in modules, name); return modules[name]; } };
vm.runInNewContext(compile(fs.readFileSync('src/app/api/profil/route.ts', 'utf8')), route);
async function submitChoice(choice) {
  let saved = false, refreshed = false, loading = false, error = null;
  const context = {
    objectifs: '', niveau: '', equipementDisponible: [], lieuEntrainement: '', dureeSeance: '',
    contraintesSante: '', tailleCm: '', poidsKg: '', age: '', sexe: '',
    cycleMenstruelSuivi: choice, dateDernieresRegles: '', dureeCycleJours: '', reglesDouloureuses: false,
    statutMaternite: '', dateReferenceMaternite: '', morphologie: '', frequenceEntrainement: '',
    sportsPratiques: [], habitudesAlimentaires: '', allergiesAlimentaires: '', repasParJour: '',
    hydratation: '', consommationCafe: '', consommationAlcool: '', qualiteSommeil: '',
    setLoading: value => { loading = value; }, setSaved: value => { saved = value; },
    setError: value => { error = value; }, router: { refresh: () => { refreshed = true; } },
    fetch: async (url, options) => {
      assert.equal(url, '/api/profil');
      return route.exports.PUT(new Request('https://coai.test/api/profil', options));
    },
  };
  vm.runInNewContext(compile(submit), context);
  await context.handleSubmit({ preventDefault() {} });
  assert.equal(error, null); assert.equal(saved, true); assert.equal(refreshed, true); assert.equal(loading, false);
}
(async () => {
  for (const body of ['', '{', 'null', '{"cycleMenstruelSuivi":"false"}']) {
    const response = await route.exports.PUT(new Request('https://coai.test/api/profil', { method: 'PUT', body }));
    assert.equal(response.status, 400, 'Malformed profile must return a controlled validation error');
    assert.equal(writes, 0);
  }
  await submitChoice(false);
  assert.equal(stored.cycleMenstruelSuivi, false, 'Explicit opt-out must overwrite the previous true value');
  await submitChoice(stored.cycleMenstruelSuivi);
  assert.equal(stored.cycleMenstruelSuivi, false, 'Opt-out survives form reload and another save');
  await submitChoice(true);
  assert.equal(stored.cycleMenstruelSuivi, true, 'Explicit re-enabling remains possible');
  assert.equal(writes, 3);
  console.log('PASS: actual form → route preserves false and true, including reloaded opt-out; persistence mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
