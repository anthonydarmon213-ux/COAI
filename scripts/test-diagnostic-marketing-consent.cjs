// Actual route + suppression on LOCAL PostgreSQL; all external sends mocked.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
const {PrismaClient} = require('@prisma/client');
const db = new PrismaClient({datasources:{db:{url:'postgresql://postgres:postgres@127.0.0.1:54322/postgres'}}});
const prefix = `consent-${crypto.randomUUID()}`;
const emails = ['refused','accepted','missing','old','phone','invalid'].map(v=>`${prefix}-${v}@example.test`);
const quiz=fs.readFileSync('src/components/marketing/diagnostic-quiz.tsx','utf8');
const ast=ts.createSourceFile('quiz.tsx',quiz,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let eligibility;
function visit(node) {
  if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='canContinue') eligibility=node.initializer.arguments[0];
  ts.forEachChild(node,visit);
}
visit(ast);
assert.ok(eligibility);
const browser={step:'email',email:'test@example.test',telephone:'',consentEmail:false,
  isValidEmail:v=>v.includes('@'),isValidTelephone:()=>false};
vm.runInNewContext(ts.transpileModule(`const eligible=${eligibility.getText(ast)};`,{
  compilerOptions:{target:ts.ScriptTarget.ES2022},
}).outputText,browser);
assert.equal(vm.runInNewContext('eligible()',browser),true);
browser.email='invalid';assert.equal(vm.runInNewContext('eligible()',browser),false);
assert.match(quiz,/marketingConsent: consentEmail/);
let sent=0, crm=0, admin=0;
function load(file, imports) {
  const box={exports:{},process:{env:{}},console,require:n=>{assert.ok(n in imports,n);return imports[n];}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText,box);
  return box.exports;
}
const suppression=load('src/lib/email/diagnostic-suppression.ts',{
  '@/lib/db/client':{prisma:db}, './diagnostic-cadence':{},
});
const route=load('src/app/api/diagnostic-lead/route.ts',{
  'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
  zod:require('zod'), '@/lib/db/client':{prisma:db},
  '@/lib/email/client':{sendAdminNotification:async()=>{admin++;},sendEmail:async()=>{sent++;return true;}},
  '@/lib/email/lead-notification':{buildNouveauLeadEmailHtml:()=>'',buildWhatsAppLinkVersLead:()=>''},
  '@/lib/diagnostic/mini-diagnostic':{buildMiniDiagnostic:()=>({indiceCoai:{score:50,niveau:'test'},recommandation:{label:'test',raison:'test'},pointsATravailler:[],pointsResolus:[]}),miniDiagnosticEnTexte:()=> 'fixture result'},
  '@/lib/analytics/product-events':{trackServerEvent:()=>{}},
  '@/lib/hubspot/contact':{synchroniserLeadHubSpot:async()=>{crm++;}},
  '@/lib/email/diagnostic-suppression':suppression,
});
async function post(email, extras={}) {
  return route.POST(new Request('http://localhost/api/diagnostic-lead',{method:'POST',body:JSON.stringify({email,reponses:{fixture:true,marketingConsent:true},...extras})}));
}
(async()=>{
 try {
  let r=await post(emails[0],{marketingConsent:false});
  assert.equal(r.status,201); assert.ok(r.body.optedOutAt); assert.equal(r.body.reponses.marketingConsent,false);
  assert.equal(sent,1); assert.equal(crm,0); assert.equal(admin,0);
  assert.equal(await suppression.hasDiagnosticOptOut(emails[0].toUpperCase()),true);
  r=await post(emails[1],{marketingConsent:true});
  assert.equal(r.body.optedOutAt,null); assert.equal(crm,1); assert.equal(admin,1); assert.equal(sent,2);
  r=await post(emails[2]);
  assert.ok(r.body.optedOutAt); assert.equal(r.body.reponses.marketingConsent,false); assert.equal(sent,3);
  await db.diagnosticLead.create({data:{email:emails[3],reponses:{fixture:true},optedOutAt:new Date()}});
  r=await post(emails[3],{marketingConsent:true});
  assert.ok(r.body.optedOutAt); assert.equal(crm,1); assert.equal(admin,1); assert.equal(sent,4);
  await post(emails[4],{marketingConsent:false,telephone:'+33600000000'});
  assert.equal(crm,1); assert.equal(admin,2); assert.equal(sent,5);
  assert.equal((await post(emails[5],{marketingConsent:'true'})).status,400);
  console.log('PASS actual route/local DB: optional opt-in, absent=false, result sent on refusal, CRM suppressed, old opt-out preserved, phone request separate, forged nested consent overwritten');
 } finally {
  await db.diagnosticLead.deleteMany({where:{email:{in:emails}}});
  await db.$disconnect();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
