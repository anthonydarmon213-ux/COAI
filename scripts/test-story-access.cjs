const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, ...globals });
  return exports;
}
const { accessibleTraining } = load('src/lib/programmes/access.ts');
const cataloguePhotos = load('src/lib/exercices/photos-coai.ts');
const { illustrerStory } = load('src/lib/programmes/story-photos.ts', { require: () => cataloguePhotos });
for (const genre of ['homme', 'femme']) {
  for (const retourAuCalme of ["Posture de l'enfant", "Posture de l’enfant puis respiration calme"]) {
    const photo = illustrerStory({ exercices: [], echauffement: '', retourAuCalme }, genre).retourAuCalmePhoto;
    assert.equal(photo, genre === 'homme' ? '/fiche-seance/mobilite-posture-enfant-homme-v2.png' : '/exercices/mobilite-posture-enfant.jpg');
    assert(fs.existsSync(`public${photo}`));
  }
  assert.equal(illustrerStory({ exercices: [], echauffement: '', retourAuCalme: 'Marche lente' }, genre).retourAuCalmePhoto, null);
  for (const nom of ['Fentes bulgares haltères', 'Fente bulgare haltères', 'Fentes bulgares avec haltères']) {
    const photo = illustrerStory({ exercices: [{ nom }], echauffement: '', retourAuCalme: '' }, genre).exercices[0].photo;
    assert.equal(photo, `/exercices/fentes-bulgares-${genre}-coai.jpg`);
    assert(fs.existsSync(`public${photo}`));
  }
  for (const nom of ['Fentes bulgares barre', 'Fentes bulgares sans charge', 'Fentes bulgares sautées']) {
    assert.equal(illustrerStory({ exercices: [{ nom }], echauffement: '', retourAuCalme: '' }, genre).exercices[0].photo, null);
  }
  const story = illustrerStory({ exercices: ['Presse à cuisses', 'Développé couché haltères', 'Tirage horizontal machine', 'Superman au sol', 'Gainage planche', 'Crunch au sol'].map(nom => ({ nom })), echauffement: 'Mobilité des hanches', retourAuCalme: 'Respiration calme' }, genre);
  for (const src of [...story.exercices.map(ex => ex.photo), story.echauffementPhoto, story.retourAuCalmePhoto]) assert(src && fs.existsSync(`public${src}`), src);
  for (const nom of ['Développé couché barre', 'Tirage horizontal élastique', 'Presse épaules']) assert.equal(illustrerStory({ exercices: [{ nom }], echauffement: '', retourAuCalme: '' }, genre).exercices[0].photo, null);
}
assert.equal(cataloguePhotos.photoCoaiGenreStrict('Rowing TRX', 'homme'), null);
for (const statut of ['EN_ATTENTE', 'GENERE_IA', 'VALIDE']) {
  const row = { statut, contenu: 'unchanged' };
  assert.equal(accessibleTraining(null, row), row);
  assert.equal(row.statut, statut);
}
for (const statut of ['REJETE', 'REFUSE', 'UNKNOWN', '']) assert.equal(accessibleTraining(null, { statut }), null);
const validated = { statut: 'VALIDE' };
assert.equal(accessibleTraining(validated, { statut: 'EN_ATTENTE' }), validated);
assert.equal(accessibleTraining(null, null), null);
let drawn = [];
let canvas;
const context = {
  createLinearGradient: () => ({ addColorStop() {} }), fillRect() {},
  measureText: text => ({ width: text.length * 17 }),
  fillText: (text, x, y) => { assert(y < 1760); drawn.push(text); },
  drawImage: (image) => assert.equal(image.src, '/brand/coai-mark.svg'),
};
const { storySeance, renderStory } = load('src/lib/programmes/story-seance.ts', {
  require: (name) => { assert.equal(name, './repos'); return load('src/lib/programmes/repos.ts'); },
  Image: class { async decode() {} },
  document: { createElement: () => (canvas = { getContext: () => context, toBlob: (callback, type) => callback({ type }) }) },
});
(async () => {
  const input = Array.from({ length: 7 }, (_, i) => ({ nom: `Exercice ${i}`, series: 3, repetitions: '8–12 répétitions', repos: '1 min 15 s', methode: 'Classique', charge: 'SECRET', email: 'SECRET', note: 'SECRET' }));
  const data = storySeance([...input, null, []], 'Mobilité', 'Marche lente');
  for (const [repos, expected] of [['100 sec', '1 min 40 s'], ['75 sec', '1 min 15 s'], ['45 sec', '45 s'], ['120 s', '2 min'], ['1 min 15 s', '1 min 15 s']]) {
    drawn = [];
    await renderStory(storySeance([{ ...input[0], repos }], '', ''), 0);
    assert(drawn.includes(`Repos ${expected} · Classique`), expected);
  }
  assert.equal(data.exercices.length, 7);
  assert(!JSON.stringify(data).includes('SECRET'));
  for (let page = 0; page < 3; page++) {
    drawn = [];
    assert.equal((await renderStory(data, page)).type, 'image/png');
    assert.equal(canvas.width, 1080); assert.equal(canvas.height, 1920);
    assert(drawn.some(v => v.includes('COAI')));
    assert(drawn.includes('Mobilité')); assert(drawn.includes('Marche lente'));
    assert(drawn.some(v => v.includes(`Exercice ${page * 3}`)));
    assert(!drawn.some(v => v.includes('SECRET')));
  }
  console.log('PASS: review access policy, privacy whitelist, multi-page 1080x1920 Story, logo and phases.');
})().catch(e => { console.error(e); process.exitCode = 1; });
