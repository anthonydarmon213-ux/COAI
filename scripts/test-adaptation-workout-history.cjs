const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
let entries = [];
const prisma = {
  weeklyCheckin: { findFirst: async () => null },
  mesure: { findMany: async () => [] }, testMaxi: { findMany: async () => [] },
  programmeGenerated: { findFirst: async () => null }, repasLog: { findMany: async () => [] },
};
function load(file, imports, suffix = '') {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8') + suffix, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require(name) {
    if (Object.hasOwn(imports, name)) return imports[name];
    throw Error(`Unexpected dependency ${name}`);
  } });
  return exports;
}
const signals = load('src/lib/adaptation/signals.ts', {
  '@/lib/db/client': { prisma },
  '@/lib/suivi/workout-history': { workoutHistory: async (id, options) => {
    assert.equal(id, 'member'); assert.equal(options.order, 'desc');
    assert(Math.abs(options.from.getTime() - (Date.now() - 14 * 86400000)) < 2000);
    assert(Math.abs(options.before.getTime() - Date.now()) < 2000);
    return entries;
  } },
});
const engine = load('src/lib/adaptation/engine.ts', {
  '@/lib/db/client': { prisma }, '@/lib/ai/client': { generateWithAI() { throw Error('Paid AI forbidden'); } },
  '@/lib/programmes/generer': {}, '@/lib/programmes/paid-policy': { PROGRAMME_AI_PAID_ENABLED: false },
  '@/lib/email/client': {}, '@/lib/subscription/plan': {},
  '@/lib/ai/prompts/programme-adaptation-decision': {}, '@/lib/adaptation/signals': signals,
  '@/lib/analytics/product-events': {}, '@/lib/cycle/phase': {},
}, '\nexport const testGuard = appliquerGardeFous;');
(async () => {
  let result = await signals.collecterSignaux('member', 'ENTRAINEMENT');
  assert.equal(result.nombreSeancesRecentes, 0); assert(!signals.donneesSuffisantes(result));
  entries = [1, 2].map(id => ({ id: `daily:${id}`, date: new Date(), dailyPain: false,
    difficulte: null, energie: null, douleur: null, douleurZone: null }));
  result = await signals.collecterSignaux('member', 'ENTRAINEMENT');
  assert.equal(result.nombreSeancesRecentes, 2); assert(signals.donneesSuffisantes(result));
  assert.equal(result.moyenneDifficulte, null); assert.equal(result.moyenneEnergie, null);
  assert.equal(result.douleurRecente, null);
  entries[0].dailyPain = true;
  result = await signals.collecterSignaux('member', 'ENTRAINEMENT');
  assert.equal(result.douleurRecente.niveau, 'NON_PRECISE');
  const guarded = engine.testGuard({ decision: 'PROGRESSER', changements: [{ type: 'LOAD' }], confiance: 0.9 }, result);
  assert.equal(guarded.decision, 'GARDER'); assert.equal(guarded.changements.length, 0);
  entries[0].dailyPain = false; entries[0].douleur = 'IMPORTANTE';
  entries[0].difficulte = 8; entries[0].energie = 4;
  result = await signals.collecterSignaux('member', 'ENTRAINEMENT');
  assert.equal(result.douleurRecente.niveau, 'IMPORTANTE');
  assert.equal(result.moyenneDifficulte, 8); assert.equal(result.moyenneEnergie, 4);
  assert.equal(engine.testGuard({ decision: 'PROGRESSER', changements: [], confiance: 1 }, result).decision, 'GARDER');
  const proposed = await engine.proposerAdaptation({ id: 'member', profile: null, subscription: null }, 'ENTRAINEMENT');
  assert.equal(proposed.requiresCoachReview, true); assert.equal(proposed.adaptationId, null);
  console.log('PASS adaptation: combined activity, unknown metrics/pain preserved, progression guard, paid AI remains disabled. DB/history mocked.');
})().catch(error => { console.error(error); process.exitCode = 1; });
