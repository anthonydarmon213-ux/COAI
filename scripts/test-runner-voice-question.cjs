// Actual handler; speech events and network simulated. No paid API calls.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const consentBox = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/ai/coach-consent.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, consentBox);
const consent = consentBox.exports;
const source = fs.readFileSync('src/components/programme/seance-runner.tsx', 'utf8');
const ast = ts.createSourceFile('runner.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'poserQuestionAuCoach') handler = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert.ok(handler);
const routeSource = fs.readFileSync('src/app/api/coach/ask/route.ts', 'utf8');
const routeAST = ts.createSourceFile('route.ts', routeSource, ts.ScriptTarget.Latest, true);
const schemaStatements = routeAST.statements.filter(node => ts.isVariableStatement(node)
  && node.declarationList.declarations.some(declaration => ['contextSchema', 'bodySchema'].includes(declaration.name.getText(routeAST))));
assert.equal(schemaStatements.length, 2);
const schemaBox = { z: require('zod').z };
vm.runInNewContext(schemaStatements.map(node => node.getText(routeAST)).join('\n') + '\nglobalThis.schema = bodySchema;', schemaBox);
async function scenario(mode, exerciseStep = false) {
  let creations = 0, requests = 0, busy = false, answer, resolve;
  const payloads = [];
  const reco = { start() { if (mode === 'start-error') throw Error('denied'); } };
  const box = {
    coachAIAgreed: mode !== 'no-consent', setCoachConsentOpen(value) { assert.equal(value, true); },
    aiCoachConsentHeaders: consent.aiCoachConsentHeaders,
    questionEnCours: false, questionEnCoursRef: {current:false},
    creerReconnaissance: () => { creations++; return reco; },
    setQuestionEnCours: value => { busy = value; }, setReponseCoach: value => {answer=value;},
    setCoachParle() {}, stopperVoix() {}, parler() {},
    step: exerciseStep ? {type:'set', nom:'Squat', exercice:{series:'3', repetitions:'10', repos:'60 s', charge:'Confortable'}} : {type:'echauffement'}, nomSeance:'Test',
    substitutions: {},
    window: {setTimeout() {}},
    withRequestDeadline: async operation => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20);
      try { return await operation(controller.signal); } finally { clearTimeout(timer); }
    },
    fetch: (_url, options) => {
      requests++;
      assert(consent.hasAICoachConsent(new Headers(options.headers)));
      payloads.push(JSON.parse(options.body));
      return new Promise((done, reject) => {
        resolve = () => done(Response.json({answer:'Réponse test'}));
        options.signal.addEventListener('abort', () => reject(Error('timeout')));
      });
    },
  };
  vm.runInNewContext(ts.transpileModule(handler+'\nglobalThis.run=poserQuestionAuCoach;', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText, box);
  box.run();
  if (mode === 'no-consent') {
    assert.equal(creations, 0); assert.equal(requests, 0); assert.equal(busy, false); return;
  }
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
  for (const payload of payloads) {
    const result = schemaBox.schema.safeParse(payload);
    assert.equal(result.success, true, 'Actual coach API contract: ' + JSON.stringify(result.error?.issues));
    assert.equal(payload.context.source, 'DAILY_WORKOUT');
    if (exerciseStep) assert.equal(payload.context.exerciseName, 'Squat');
  }
  assert.equal(busy,false); assert.equal(box.questionEnCoursRef.current,false);
  assert.match(answer,mode === 'ok' ? /Réponse test/ : /Connexion impossible/);
  box.run(); assert.equal(creations,2,'manual retry available'); reco.onend();
}
(async () => {
  for (const mode of ['ok','timeout','start-error','no-result','denied','no-consent']) await scenario(mode);
  await scenario('ok', true);
  console.log('PASS vocal coach: real API schema accepts warmup and exercise context; double tap/result, microphone end while pending, response, timeout, denied/start failure, manual retry. Speech and network simulated.');
})().catch(error => {console.error(error);process.exitCode=1;});
