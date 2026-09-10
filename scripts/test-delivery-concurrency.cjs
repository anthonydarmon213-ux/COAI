// Real registry + real Prisma adapter, two separate PostgreSQL clients.
// Local existing schema only. No migration, no provider, no customer data.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {randomUUID} = require('node:crypto');
const ts = require('typescript');
const {PrismaClient} = require('@prisma/client');
const url = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const clients = [0,1].map(()=>new PrismaClient({datasources:{db:{url}}}));
function load(file, imports={}) {
 const box={exports:{},require:name=>{assert.ok(name in imports,name);return imports[name];}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS},
 }).outputText,box);
 return box.exports;
}
const registry = load('src/lib/email/delivery-registry.ts');
const adapters = clients.map(prisma=>load('src/lib/email/registry-prisma.ts',{'@/lib/db/client':{prisma}}).registryDatabase);
const recipients=[];
const recipient=()=>{const key=`test-concurrency:${randomUUID()}`;recipients.push(key);return key;};
(async()=>{
 try {
  for(let round=0;round<3;round++) {
   let sends=0;const key=recipient();
   const request={recipientKey:key,deliveryKey:`${key}:reminder`,kind:'test',eligible:async()=>true,send:async()=>{sends++;return true;}};
   const results=await Promise.all([0,1,0,1].map(i=>registry.deliverOnce(adapters[i],request)));
   assert.equal(sends,1);assert.equal(results.filter(value=>value==='SENT').length,1);
   const rows=await clients[0].$queryRawUnsafe('SELECT state FROM email_deliveries WHERE "recipientKey"=$1',key);
   assert.equal(rows.length,1);assert.equal(rows[0].state,'SENT');
  }
  // Different messages racing for the same recipient respect the gate.
  const key=recipient();let sends=0;
  const results=await Promise.all(adapters.map((db,i)=>registry.deliverOnce(db,{
   recipientKey:key,deliveryKey:`${key}:${i}`,kind:'test',eligible:async()=>true,send:async()=>{sends++;return true;},
  })));
  assert.equal(sends,1);assert.equal(results.filter(value=>value==='SENT').length,1);
  // Provider outcome unknown: another connection must not retry blindly.
  const uncertain=recipient();let attempts=0;
  const request={recipientKey:uncertain,deliveryKey:`uncertain:${uncertain}`,kind:'test',eligible:async()=>true,
   send:async()=>{attempts++;throw Error('simulated provider timeout');}};
  await assert.rejects(registry.deliverOnce(adapters[0],request),/simulated/);
  assert.equal(await registry.deliverOnce(adapters[1],request),'SKIPPED');
  assert.equal(attempts,1);
  const rows=await clients[1].$queryRawUnsafe('SELECT state FROM email_deliveries WHERE "recipientKey"=$1',uncertain);
  assert.equal(rows[0].state,'UNCERTAIN');
  console.log('PASS: PostgreSQL local, two clients; concurrent identical/different reminders, one send, uncertain outcome blocks duplicate');
  console.log('LIMIT: no real email, no killed process, and callers not using this registry remain unprotected');
 } finally {
  // Only random test-owned identifiers, including if an assertion fails.
  for(const key of recipients) {
   await clients[0].$executeRawUnsafe('DELETE FROM email_deliveries WHERE "recipientKey"=$1',key);
   await clients[0].$executeRawUnsafe('DELETE FROM email_recipient_gates WHERE "recipientKey"=$1',key);
  }
  await Promise.all(clients.map(db=>db.$disconnect()));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
