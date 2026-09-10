const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {}; cache.set(file, exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
    {exports, process, require: name => name.startsWith('@/') ? load(path.join(root,'src',name.slice(2)+'.ts')) : require(name)});
  return exports;
}
const { parseReposSeconds: repos } = load(path.join(root, 'src/lib/programmes/repos.ts'));
const cases = [['1 min 15 s',75],['0 min 45 s',45],['0 min 30 s',30],['1 min 30 sec',90],['1 minute 15 secondes',75],['1,5 min',90],['60-90 sec',90],['1-2 min',120],['1 min 15 s à 2 min',120],['1:15',75],['75',75],['0 sec',10],['99 min',600],['-20 sec',60],['inconnu',60],[null,60]];
for (const [input, expected] of cases) assert.equal(repos(input), expected, String(input));
const { construireSocleEntrainement: build } = load(path.join(root, 'src/lib/programmes-socles/catalogue.ts'));
const { socleEntrainement } = load(path.join(root, 'src/lib/programmes-socles/index.ts'));
const { exerciceAvecMediasCoai } = load(path.join(root, 'src/lib/exercices/media-coai.ts'));
const { videoCoaiPourNom, urlVideoCoai } = load(path.join(root, 'src/lib/exercices/videos-coai.ts'));
const { verifierQualiteSeance } = load(path.join(root, 'src/lib/programmes/qualite-seance.ts'));
const expected = ['Presse à cuisses (machine)','Développé couché haltères','Tirage horizontal (machine)','Superman au sol','Gainage planche','Crunch au sol'];
(async () => {
  for (const frequence of [1,2]) for (const duree of [45,60]) {
    const programme = await socleEntrainement({niveau:'Débutant',frequenceEntrainement:`${frequence} fois par semaine`,dureeSeanceMinutes:duree});
    assert.equal(programme.seances.length,frequence);
    for (const seance of programme.seances) {
      assert.deepEqual(Array.from(seance.exercices,e=>e.nom),expected);
      assert.ok(seance.dureeEstimee.startsWith(`${duree} min`));
      assert.ok(seance.echauffement.includes(duree===45?'7 min':'10 min'));
      assert.ok(seance.retourAuCalme.includes(duree===45?'6 min':'8 min'));
      assert.equal(verifierQualiteSeance(seance).erreurs.length,0);
      for (const ex of seance.exercices) {
        assert.equal(ex.series,duree===45?'2':'3');
        assert.ok(exerciceAvecMediasCoai(ex.nom),ex.nom);
        assert.ok(fs.existsSync(path.join(root,'public',urlVideoCoai(videoCoaiPourNom(ex.nom).fichier))),ex.nom);
        assert.ok(repos(ex.repos)<=75);
        assert.equal(ex.methode,['Superman au sol','Gainage planche'].includes(ex.nom)?'Isométrique':'Séries classiques');
      }
    }
  }
  assert.equal(build('BASE_DEBUTANT_2').seances[0].exercices[0].series,'3');
  // Non-régression : on ne remplace pas silencieusement les autres plans.
  assert.equal(build('MUSCLE_INTERMEDIAIRE_3').seances.length,3);
  assert.equal(build('PERFORMANCE_AVANCE_5').seances.length,5);
  console.log(`PASS: ${cases.length} formats de repos, 4 socles lus par le point d'entrée réel, 36 exercices contrôlés (médias, méthode, volume), niveaux existants conservés`);
})().catch(error=>{console.error(error);process.exitCode=1;});
