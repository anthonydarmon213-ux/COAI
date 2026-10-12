const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextResponse } = require('next/server');
const jsx = require('react/jsx-runtime');
function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, Uint8Array, require(name) {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }});
  return exports;
}
const access = load('src/lib/programmes/access.ts', {});
const media = load('src/lib/exercices/media-coai.ts', {
  '@/lib/exercices/catalogue': { EXERCICES: [{ nom: 'Squat barre' }] },
  '@/lib/exercices/photos-coai': { photoCoaiPourNom: nom => nom === 'Squat barre' ? '/exercices/squat-barre.jpg' : null },
  '@/lib/exercices/videos-coai': { videoCoaiPourNom: nom => nom === 'Squat barre' ? { fichier: 'squat-barre' } : null },
});
assert.equal(media.compterExercicesSansMediasCoai({ seances: [] }), 1);
assert.equal(media.compterExercicesSansMediasCoai({ seances: [{ exercices: [{ nom: 'Squat barre' }, { nom: 'Hip thrust barre' }] }] }), 1);
assert.equal(media.compterExercicesSansMediasCoai({ seances: [{ exercices: [{ nom: 'Squat barre' }] }] }), 0);
async function scenario(file, { status = 'EN_ATTENTE', pilier = 'ENTRAINEMENT', signedIn = true, validated = false, failure = false, missingMedia = false } = {}) {
  let queries = 0, rendered;
  const latest = { statut: status, contenu: { titre: 'Test local', seances: [{ exercices: missingMedia
    ? [{ nom: 'Squat barre' }, { nom: 'Hip thrust barre' }]
    : [{ nom: 'Squat barre' }] }] }, generatedAt: new Date('2026-09-17T12:00:00Z') };
  const api = load(file, {
    'react/jsx-runtime': jsx, 'next/server': { NextResponse },
    '@/lib/programmes/access': access,
    '@/lib/auth/server': { getCurrentAppUser: async () => signedIn ? { id: 'owner-fixture', prenom: 'Test' } : null },
    '@/lib/db/client': { prisma: { programmeGenerated: { findFirst: async ({ where }) => {
      queries++;
      assert.equal(where.userId, 'owner-fixture');
      if (failure) throw new Error('PRIVATE_DATABASE_DETAIL');
      if (where.pilier !== pilier) return null;
      return where.statut === 'VALIDE' ? (validated || status === 'VALIDE' ? { ...latest, statut: 'VALIDE' } : null) : latest;
    }}}},
    '@/lib/exercices/photos-coai': { photoCoaiPourNom: () => null },
    '@/lib/exercices/media-coai': media,
    '@/lib/pdf/programme-pdf': { ProgrammePdf: () => null, ProgrammeCompletPdf: () => null },
    '@react-pdf/renderer': { renderToBuffer: async element => { rendered = element.props; return Buffer.from('%PDF-fixture'); } },
  });
  const slug = { ENTRAINEMENT: 'entrainement', NUTRITION: 'alimentation', RECUPERATION: 'recuperation' }[pilier];
  const response = await api.GET(new Request('https://coai.fr/api/programmes/fiche-complete?userId=other'), { params: { pilier: slug } });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(latest.statut, status, 'Never change review status');
  const accessible = validated || status === 'GENERE_IA' || status === 'VALIDE' || (pilier === 'ENTRAINEMENT' && status === 'EN_ATTENTE');
  const expected = !signedIn ? 401 : failure ? 503 : !accessible ? 404 : pilier === 'ENTRAINEMENT' && missingMedia ? 409 : 200;
  assert.equal(response.status, expected);
  if (!signedIn) assert.equal(queries, 0);
  if (expected === 200) {
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.match(response.headers.get('content-disposition'), /^attachment;/);
    const entry = rendered.entrees?.[0] ?? rendered;
    assert.equal(entry.reviewPending, !validated && status === 'EN_ATTENTE');
  } else {
    assert.equal(rendered, undefined);
    const bodyText = await response.text();
    if (expected === 409) {
      const body = JSON.parse(bodyText);
      assert.equal(body.code, 'WORKOUT_MEDIA_INCOMPLETE');
      assert.equal(body.missingMediaCount, 1);
    }
    assert.ok(!bodyText.includes('PRIVATE_DATABASE_DETAIL'));
  }
}
(async () => {
  let count = 0;
  for (const file of ['src/app/api/programmes/fiche-complete/route.tsx', 'src/app/api/programmes/[pilier]/pdf/route.tsx']) {
    for (const pilier of ['ENTRAINEMENT', 'NUTRITION', 'RECUPERATION']) {
      for (const status of ['EN_ATTENTE', 'GENERE_IA', 'VALIDE', 'REJETE', 'UNKNOWN']) {
        await scenario(file, { pilier, status }); count++;
      }
    }
    for (const options of [{ signedIn: false }, { failure: true }, { validated: true, status: 'REJETE' }, { missingMedia: true }]) {
      await scenario(file, options); count++;
    }
  }
  console.log(`PASS: ${count} PDF access/error cases. Auth/DB/render mocked; no production data or paid API.`);
  if (process.argv[2]) {
    const renderer = await import('@react-pdf/renderer');
    const pdf = load('src/lib/pdf/programme-pdf.tsx', { 'react/jsx-runtime': jsx, '@react-pdf/renderer': renderer });
    const generatedAt = new Date('2026-09-17T12:00:00Z');
    const document = jsx.jsx(pdf.ProgrammeCompletPdf, { prenom: 'Test local', entrees: [{
      pilier: 'ENTRAINEMENT', reviewPending: true, generatedAt,
      data: { titre: 'Contrôle export - données fictives', seances: [null, {
        nom: 'Séance fictive de contrôle', echauffement: 'Texte de préparation fictif pour vérifier la mise en page.',
        exercices: Array.from({ length: 6 }, (_, i) => ({ nom: `Exercice fictif ${i + 1}`, series: 3, repetitions: '8-12', repos: '90 s', methode: 'Séries classiques' })),
        retourAuCalme: 'Texte de retour au calme fictif pour vérifier la mise en page.',
      }] },
    }, {
      pilier: 'NUTRITION', generatedAt,
      data: { titre: 'Alimentation fictive', jours: [null, { jour: 'Jour de contrôle', repas: [null, { repas: 'Déjeuner', plat: 'Repas fictif' }] }] },
    }, {
      pilier: 'RECUPERATION', generatedAt,
      data: { titre: 'Récupération fictive', jours: [null, { jour: 'Jour de contrôle', type: 'Repos', conseil: 'Conseil fictif' }] },
    }] });
    const buffer = await renderer.renderToBuffer(document);
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
    fs.writeFileSync(process.argv[2], buffer);
    console.log('PASS: real three-pillar PDF rendered despite malformed day/session rows, locally without network images.');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
