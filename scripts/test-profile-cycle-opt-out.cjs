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
const clearableTextFields = ['niveau', 'equipementDisponible', 'lieuEntrainement', 'sportsPratiques',
  'habitudesAlimentaires', 'allergiesAlimentaires', 'repasParJour', 'hydratation',
  'consommationCafe', 'consommationAlcool', 'qualiteSommeil'];
let stored = { userId: 'owner', cycleMenstruelSuivi: true, tailleCm: 175, poidsKg: 70, age: 30,
  ...Object.fromEntries(clearableTextFields.map(key => [key, 'ancienne valeur'])) };
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
async function submitChoice(choice, values = {}, invalid = false) {
  let saved = false, refreshed = false, loading = false, error = null;
  const context = {
    objectifs: '', niveau: '', equipementDisponible: [], lieuEntrainement: '', dureeSeance: '',
    contraintesSante: '', tailleCm: '', poidsKg: '', age: '', sexe: '',
    cycleMenstruelSuivi: choice, dateDernieresRegles: '', dureeCycleJours: '', reglesDouloureuses: false,
    statutMaternite: '', dateReferenceMaternite: '', morphologie: '', frequenceEntrainement: '',
    sportsPratiques: [], habitudesAlimentaires: '', allergiesAlimentaires: '', repasParJour: '',
    hydratation: '', consommationCafe: '', consommationAlcool: '', qualiteSommeil: '',
    ...values,
    setLoading: value => { loading = value; }, setSaved: value => { saved = value; },
    setError: value => { error = value; }, router: { refresh: () => { refreshed = true; } },
    fetch: async (url, options) => {
      assert.equal(url, '/api/profil');
      return route.exports.PUT(new Request('https://coai.test/api/profil', options));
    },
  };
  vm.runInNewContext(compile(submit), context);
  await context.handleSubmit({ preventDefault() {} });
  if (invalid) {
    assert.match(error, /Vérifie la valeur du champ/);
    assert.equal(saved, false); assert.equal(refreshed, false);
  } else {
    assert.equal(error, null); assert.equal(saved, true); assert.equal(refreshed, true);
  }
  assert.equal(loading, false);
}
(async () => {
  for (const body of ['', '{', 'null', '{"cycleMenstruelSuivi":"false"}']) {
    const response = await route.exports.PUT(new Request('https://coai.test/api/profil', { method: 'PUT', body }));
    assert.equal(response.status, 400, 'Malformed profile must return a controlled validation error');
    assert.equal(writes, 0);
  }
  await submitChoice(false);
  for (const key of ['tailleCm', 'poidsKg', 'age']) assert.equal(stored[key], null, `Explicit numerical deletion: ${key}`);
  for (const key of clearableTextFields) assert.equal(stored[key], '', `Cleared field must not keep stale data: ${key}`);
  assert.equal(stored.cycleMenstruelSuivi, false, 'Explicit opt-out must overwrite the previous true value');
  await submitChoice(stored.cycleMenstruelSuivi);
  assert.equal(stored.cycleMenstruelSuivi, false, 'Opt-out survives form reload and another save');
  for (const key of clearableTextFields) assert.equal(stored[key], '', key);
  await submitChoice(true);
  assert.equal(stored.cycleMenstruelSuivi, true, 'Explicit re-enabling remains possible');
  await submitChoice(true, { niveau: 'Débutant', equipementDisponible: ['Kettlebell', 'TRX'],
    sportsPratiques: ['Natation'], hydratation: '2L ou plus par jour', allergiesAlimentaires: 'déclaration utilisateur' });
  assert.equal(stored.niveau, 'Débutant');
  assert.equal(stored.equipementDisponible, 'Kettlebell, TRX');
  assert.equal(stored.sportsPratiques, 'Natation');
  assert.equal(stored.hydratation, '2L ou plus par jour');
  assert.equal(stored.allergiesAlimentaires, 'déclaration utilisateur');
  assert.equal(writes, 4);
  await submitChoice(false, { tailleCm: '176', poidsKg: '72.5', age: '31' });
  assert.equal(stored.tailleCm, 176); assert.equal(stored.poidsKg, 72.5); assert.equal(stored.age, 31);
  const partial = await route.exports.PUT(new Request('https://coai.test/api/profil', {
    method: 'PUT', body: JSON.stringify({ objectifs: 'nouvel objectif' }),
  }));
  assert.equal(partial.status, 200);
  assert.equal(stored.tailleCm, 176); assert.equal(stored.poidsKg, 72.5); assert.equal(stored.age, 31);
  const beforeInvalid = writes;
  for (const values of [{ tailleCm: 'abc' }, { poidsKg: 'Infinity' }, { age: 'NaN' }]) {
    await submitChoice(false, values, true);
    assert.equal(writes, beforeInvalid, 'Non-finite input must not be serialized as deletion');
  }
  for (const data of [{ tailleCm: 0 }, { poidsKg: -1 }, { age: 2.5 }, { tailleCm: 301 }, { poidsKg: 401 }, { age: 121 }]) {
    const response = await route.exports.PUT(new Request('https://coai.test/api/profil', { method: 'PUT', body: JSON.stringify(data) }));
    assert.equal(response.status, 400); assert.equal(writes, beforeInvalid);
  }
  console.log('PASS: actual form → route preserves opt-out, explicit cleared text and populated choices; persistence mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
