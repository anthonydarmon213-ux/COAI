import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const repo=process.cwd();
const require=createRequire(`${repo}/package.json`);
const ts=require('typescript');
function load(file, imports) {
 const box={exports:{},Date,process:{env:{}},require(name){if(name in imports)return imports[name];throw Error(`Unmocked import ${name}`);}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(`${repo}/${file}`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,box);
 return box.exports;
}
let writes=[], auth={id:'auth-A'}, user={id:'user-A'}, retrieved=0;
const sub={id:'sub_test',customer:'cus_test',status:'trialing',metadata:{plan:'PASS_IA'},items:{data:[{price:{id:'price_test',unit_amount:1999,currency:'eur',recurring:{interval:'month',interval_count:1}}}]},trial_end:1800000000,cancel_at_period_end:false};
let session;
const prisma={subscription:{upsert:async x=>writes.push(x)},user:{findUnique:async()=>user,update:async x=>writes.push(x)}};
const sync=load('src/lib/stripe/subscription-sync.ts',{'@/lib/db/client':{prisma}});
const {POST}=load('src/app/api/stripe/confirm-session/route.ts',{
 'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
 '@/lib/auth/server':{getCurrentUser:async()=>auth},
 '@/lib/db/client':{prisma},
 '@/lib/stripe/client':{stripe:{checkout:{sessions:{retrieve:async()=>{retrieved++;return session;}}},subscriptions:{retrieve:async()=>sub}}},
 '@/lib/stripe/subscription-sync':sync,
});
const request=body=>({json:async()=>body});
function reset(){writes=[];retrieved=0;auth={id:'auth-A'};user={id:'user-A'};session={status:'complete',mode:'subscription',client_reference_id:'user-A',subscription:sub};}
reset();auth=null;
assert.equal((await POST(request({sessionId:'cs_test'}))).status,401);assert.equal(retrieved,0);
reset();assert.equal((await POST(request({sessionId:'invalid'}))).status,400);assert.equal(retrieved,0);
reset();user=null;assert.equal((await POST(request({sessionId:'cs_test'}))).status,404);
for(const patch of [{client_reference_id:'user-B'},{status:'open'},{mode:'payment'},{subscription:null}]){
 reset();Object.assign(session,patch);assert.equal((await POST(request({sessionId:'cs_test'}))).status,409);assert.equal(writes.length,0);
}
reset();assert.equal((await POST(request({sessionId:'cs_test'}))).status,200);
assert.equal(writes[0].create.userId,'user-A');assert.equal(writes[0].create.status,'ACTIVE');assert.equal(writes[0].create.amountCents,1999);
reset();session.subscription='sub_test';assert.equal((await POST(request({sessionId:'cs_test'}))).status,200);
for(const [input,expected] of [['active','ACTIVE'],['trialing','ACTIVE'],['past_due','PAST_DUE'],['unpaid','PAST_DUE'],['canceled','CANCELED'],['incomplete','INCOMPLETE'],['incomplete_expired','INCOMPLETE'],['paused','INCOMPLETE']]) assert.equal(sync.mapStripeStatus(input),expected);
console.log('PASS: authentication, invalid ID, missing profile, ownership, incomplete session, wrong mode, missing subscription, expanded/unexpanded subscription, 8 subscription states. No network or database connection.');
for(const body of [null,0,false,[],{},'cs_test']) {
 reset();assert.equal((await POST(request(body))).status,400);assert.equal(retrieved,0);assert.equal(writes.length,0);
}
console.log('PASS: malformed JSON shapes rejected with 400 before Stripe or persistence.');
