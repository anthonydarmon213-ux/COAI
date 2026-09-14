// Actual NextRequest/NextResponse; auth refresh simulated, no real token or API.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
let signedIn = true;
const box = { exports: {}, URL, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test' } }, require: name => name === '@supabase/ssr' ? {
  createServerClient: (_, __, {cookies}) => ({ auth: { getUser: async () => {
    const updates = [{name:'session.0',value:'refreshed',options:{path:'/',httpOnly:true}}, {name:'session.1',value:'',options:{path:'/',maxAge:0}}];
    if(cookies.setAll) cookies.setAll(updates);
    else for(const c of updates) c.value ? cookies.set(c.name,c.value,c.options) : cookies.remove(c.name,c.options);
    return {data:{user:signedIn ? {id:'fixture'} : null}};
  } } }),
} : require(name) };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/middleware.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,box);
(async()=>{
  const req=new NextRequest('https://coai.fr/programme/seance-du-jour?seance=2',{headers:{cookie:'session.0=expired; session.1=old; preference=keep'}});
  const response=await box.exports.middleware(req);
  assert.equal(req.cookies.get('session.0')?.value,'refreshed','server render must receive refreshed cookie');
  assert(response.headers.get('x-middleware-request-cookie')?.includes('session.0=refreshed'));
  assert.equal(response.cookies.get('session.0')?.value,'refreshed');
  assert.equal(response.cookies.get('session.1')?.maxAge,0);
  assert.equal(req.cookies.get('preference')?.value,'keep');
  signedIn=false;
  const denied=await box.exports.middleware(new NextRequest('https://coai.fr/programme/seance-du-jour?seance=2'));
  const location=new URL(denied.headers.get('location'));
  assert.equal(location.pathname,'/sign-in');
  assert.equal(location.searchParams.get('redirect_to'),'/programme/seance-du-jour?seance=2');
  assert.equal(denied.cookies.get('session.1')?.maxAge,0);
  console.log('PASS: refreshed request/response cookies, chunk removal, unrelated cookie preserved, anonymous redirect preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
