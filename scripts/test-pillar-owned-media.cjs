const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
let externalCalls = 0;
const content = { titre: 'Ancien programme', photoQuery: 'external-query', jours: [] };
const user = { id: 'local-owner', profile: { sexe: 'Homme' } };
const records = Object.fromEntries(['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION'].map(pilier => [pilier,
  { id: pilier, pilier, statut: 'GENERE_IA', version: 1, generatedAt: new Date(), contenu: content }]));
const modules = {
  '@/lib/server/request-time': { requestTime: () => Date.now() },
  '@/lib/auth/server': { getCurrentAppUser: async () => user },
  '@/lib/db/client': { prisma: {
    programmeGenerated: { findFirst: async ({ where }) => where.statut ? null : records[where.pilier] },
    dailySession: { findMany: async () => [] },
  } },
  '@/lib/subscription/content-access': { contentAccessFor: async () => ({ programme: true, plan: 'PASS_IA' }) },
  '@/lib/programmes/access': { accessibleTraining: (valid, last) => valid || last },
  '@/lib/insight/score-sommeil': { calculerScoreSommeil: () => null },
  '@/lib/whatsapp': { buildWhatsAppLink: () => null },
  '@/lib/media/pexels': { getStockPhotos: async () => { externalCalls++; return {}; } },
};
const box = { exports: {}, require: name => {
  if (name in modules) return modules[name];
  if (name === 'react/jsx-runtime') return require(name);
  // Leaves are not rendered: this test executes the real server-page orchestration.
  if (name.startsWith('@/components/') || name.startsWith('next/')) return new Proxy({}, { get: () => () => null });
  throw new Error('Unexpected dependency: ' + name);
} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/programme/pilier-page.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText, box);
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
(async () => {
  for (const pilierActif of Object.keys(records)) {
    const tree = await box.exports.PilierPage({ pilierActif });
    assert.equal(externalCalls, 0, pilierActif + ' must not wait for unused stock photos');
    const descendants = nodes(tree);
    assert.ok(descendants.some(node => node.props?.data === content), 'Stored content preserved');
    if (pilierActif === 'RECUPERATION') assert.ok(descendants.some(node =>
      node.props?.href === '/programme/programmes-prets?categorie=RECUPERATION'));
  }
  console.log('PASS real server-page orchestration: three pillars preserve content without stock-photo requests; recovery link is filtered.');
})().catch(error => { console.error(error); process.exitCode = 1; });
