const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,
  '../src/app/api/seances/route.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
async function check(expected, signedIn=true) {
  const api={}, calls=[];
  const modules={
    'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200,headers:options?.headers})}},
    zod:require('zod'),
    '@/lib/auth/server':{getCurrentUser:async()=>signedIn?{id:'auth-fixture'}:null},
    '@/lib/db/client':{prisma:{user:{findUnique:async()=>({id:'member-current'})},
      $transaction:async()=>{calls.push('write');throw Error('reached-write');}}},
    '@/lib/analytics/product-events':{trackServerEvent:async()=>{}},
  };
  vm.runInNewContext(source,{exports:api,require:name=>{assert(name in modules,name);return modules[name];}});
  const headers={'Content-Type':'application/json'};
  if(expected!==null)headers['X-COAI-Expected-Owner']=expected;
  try { return {response:await api.POST(new Request('http://localhost/api/seances',{
    method:'POST',headers,body:JSON.stringify({date:'2026-10-15T10:00:00.000Z',exercices:[]})})),calls}; }
  catch(error){assert.equal(error.message,'reached-write');return {calls};}
}
(async()=>{
  for(const owner of ['member-old','']){
    const r=await check(owner);assert.equal(r.response.status,409);assert.deepEqual(r.calls,[]);
    assert.match(r.response.headers['Cache-Control'],/private.*no-store/);
  }
  for(const owner of ['member-current',null])assert.deepEqual((await check(owner)).calls,['write']);
  const anonymous=await check('member-current',false);assert.equal(anonymous.response.status,401);assert.deepEqual(anonymous.calls,[]);
  console.log('PASS: wrong/empty owner denied before writes, same owner and legacy web allowed, authentication required (mocked).');
})().catch(error=>{console.error(error);process.exitCode=1;});
