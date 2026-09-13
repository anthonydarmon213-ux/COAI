// Local visual QA fixture only: no account, database or external service.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'src/lib/programmes/story-seance.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const data = {
  exercices: [
    { nom: 'Presse à cuisses', photo: '/fiche-seance/presse-a-cuisses-machine-homme.png' },
    { nom: 'Développé couché haltères', photo: '/exercices/developpe-couche-halteres.jpg' },
    { nom: 'Tirage horizontal machine', photo: '/fiche-seance/tirage-horizontal-machine-homme.png' },
    { nom: 'Superman au sol', photo: '/exercices/superman-au-sol.jpg', repetitions: '15–20 s', methode: 'Isométrique' },
    { nom: 'Gainage planche', photo: '/fiche-seance/gainage-planche-homme.png', repetitions: '30–45 s', methode: 'Isométrique' },
    { nom: 'Crunch au sol', photo: '/fiche-seance/crunch-au-sol-homme.png' },
  ].map(e => ({ series: '3', repetitions: '8–12 répétitions', repos: '1 min 15 s', methode: 'Séries classiques', ...e })),
  echauffement: 'Cardio léger, mobilité des hanches et des épaules. Approches progressives.',
  retourAuCalme: 'Marche lente puis respiration calme. Mobilité douce si agréable.',
  echauffementPhoto: '/fiche-seance/mobilite-etirement-psoas-fente-homme.png',
  retourAuCalmePhoto: '/programmes/recuperation/respiration-diaphragmatique-homme-v1.png',
};
http.createServer((req, res) => {
  if (req.url !== '/') {
    const file = path.resolve(root, 'public', `.${req.url}`);
    if (!file.startsWith(path.join(root, 'public') + path.sep) || !/\.(svg|png|jpg)$/.test(file) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.png') ? 'image/png' : 'image/jpeg');
    return fs.createReadStream(file).pipe(res);
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<html><meta charset="utf-8"><title>COAI · aperçu local illustré</title><body style="background:#111;margin:0"><script>const exports={};${code}; const data=${JSON.stringify(data)}; (async()=>{for(let page=0;page<2;page++){const blob=await exports.renderStory(data,page);const img=new Image();img.src=URL.createObjectURL(blob);img.alt='Story illustrée '+(page+1);img.style='height:100vh;display:block;margin:auto';document.body.append(img)}})();</script></body></html>`);
}).listen(3062, '127.0.0.1', () => console.log('Local fixture: http://localhost:3062'));
