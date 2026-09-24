// Actual handler; speech events and network simulated. No paid API calls.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const ast = ts.createSourceFile('runner.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'poserQuestionAuCoach') handler = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(handler);
async function scenario(mode) {
  let creations = 0, requests = 0, busy = false, answer, resolve;
  const reco = { start() { if (mode === 'start-error') throw Error('denied'); } };
  const box = {
    questionEnCours: false, questionEnCoursRef: {current:false},
    creerReconnaissance: () => { creations++; return reco; },
    setQuestionEnCours: value => { busy = value; }, setReponseCoach: value => {answer=value;},
    setCoachParle() {}, stopperVoix() {}, parler() {},
    step: {type:'echauffement'}, nomSeance:'Test',
    window: {setTimeout() {}},
    withRequestDeadline: async operation => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20);
      try { return await operation(controller.signal); } finally { clearTimeout(timer); }
    },
    fetch: (_url, options) => {
      requests++;
      return new Promise((done, reject) => {
        resolve = () => done(Response.json({answer:'Réponse test'}));
        options.signal.addEventListener('abort', () => reject(Error('timeout')));
      });
    },
  };
  vm.runInNewContext(ts.transpileModule(handler+'\nglobalThis.run=poserQuestionAuCoach;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText, box);
  box.run();
  if (mode === 'start-error') {
    assert.equal(busy,false); assert.match(answer,/microphone/); assert.equal(requests,0); return;
  }
  box.run(); assert.equal(creations,1,'double tap before render is ignored');
  if (mode === 'no-result' || mode === 'denied') {
    reco[mode === 'denied' ? 'onerror' : 'onend']();
    assert.equal(busy,false); assert.equal(box.questionEnCoursRef.current,false); assert.equal(requests,0); return;
  }
  const event = {results:[[{transcript:'Ma question'}]]};
  const pending = reco.onresult(event);
  reco.onend(); reco.onerror();
  assert.equal(busy,true,'microphone end/error must not unlock pending response');
  box.run(); await reco.onresult(event);
  assert.equal(creations,1); assert.equal(requests,1,'duplicate transcript ignored');
  if (mode === 'ok') resolve();
  await pending;
  assert.equal(busy,false); assert.equal(box.questionEnCoursRef.current,false);
  assert.match(answer,mode === 'ok' ? /Réponse test/ : /Connexion impossible/);
  box.run(); assert.equal(creations,2,'manual retry available'); reco.onend();
}
(async () => {
  for (const mode of ['ok','timeout','start-error','no-result','denied']) await scenario(mode);
  console.log('PASS vocal coach: double tap/result, microphone end while pending, response, timeout, denied/start failure, manual retry. Simulated only.');
})().catch(error => {console.error(error);process.exitCode=1;});
