const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const React = require('react');

(async () => {
  const renderer = await import('@react-pdf/renderer');
  const exported = {};
  const source = fs.readFileSync('src/lib/pdf/programme-pdf.tsx', 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText, { exports: exported, require: name => name === '@react-pdf/renderer' ? renderer : require(name) });
  const markers = [];
  const mark = text => { markers.push(text); return text; };
  const seances = Array.from({ length: 3 }, (_, s) => ({
    nom: mark(`SEANCE_${s}`),
    echauffement: 'Preparation '.repeat(25) + mark(`FIN_ECHAUFFEMENT_${s}`),
    retourAuCalme: 'Recuperation '.repeat(20) + mark(`FIN_RETOUR_${s}`),
    exercices: Array.from({ length: 7 }, (_, e) => ({ nom: mark(`EXERCICE_${s}_${e}`), series: 3,
      repetitions: '8-12', repos: '75 sec', methode: 'Classique', charge: mark(`CHARGE_${s}_${e}`) })),
  }));
  const nutrition = Array.from({ length: 3 }, (_, d) => ({ jour: mark(`NUTRITION_${d}`),
    repas: Array.from({ length: 5 }, (_, r) => ({ nom: mark(`REPAS_${d}_${r}`), quantite: '100 g', photoQuery: 'INTERNAL_ONLY' })),
  }));
  const recuperation = Array.from({ length: 4 }, (_, d) => ({ jour: mark(`RECUPERATION_${d}`),
    sommeil: mark(`SOMMEIL_${d}`), photoQueryJour: 'INTERNAL_ONLY', mobiliteEtirements: 'Mobilite douce' }));
  const entrees = [
    { pilier: 'ENTRAINEMENT', data: { titre: 'Entrainement test', seances }, reviewPending: true },
    { pilier: 'NUTRITION', data: { titre: 'Nutrition test', jours: nutrition } },
    { pilier: 'RECUPERATION', data: { titre: 'Recuperation test', jours: recuperation } },
  ].map(e => ({ ...e, generatedAt: new Date('2026-09-23T12:00:00Z') }));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coai-pdf-regression-'));
  const file = path.join(dir, 'complet.pdf');
  fs.writeFileSync(file, await renderer.renderToBuffer(React.createElement(exported.ProgrammeCompletPdf, { entrees })));
  const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  for (const marker of markers) assert.ok(text.includes(marker), `Missing PDF content: ${marker}`);
  assert.ok(!text.includes('INTERNAL_ONLY'));
  assert.ok(!text.includes('PHOTO QUERY'));
  assert.ok(text.includes('1 min 15 s'));
  assert.ok(text.includes('Relecture individuelle non effectuée.'));
  assert.ok(!text.includes("par l’IA COAI"));
  const info = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
  assert.ok(Number(info.match(/Pages:\s+(\d+)/)[1]) > 3, 'Full export must paginate');
  console.log(`PASS: ${markers.length} content markers preserved, private metadata hidden, charge/rest/review included. ${file}`);
})().catch(error => { console.error(error); process.exitCode = 1; });
