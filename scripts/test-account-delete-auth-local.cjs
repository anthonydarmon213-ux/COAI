const {createRequire}=require('node:module');
const repo=require('node:path').resolve(__dirname,'..');
const req=createRequire(repo+'/package.json');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {randomUUID}=require('node:crypto');
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,'http://127.0.0.1:54321');
const url=new URL(process.env.DATABASE_URL);assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'54322');
const {createClient}=req('@supabase/supabase-js');
const {PrismaClient}=req('@prisma/client');
const db=new PrismaClient();
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,options);
const client=()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,options);
const fixtures=[];
async function fixture(){
 const email=`delete-local-${randomUUID()}@example.test`,password=randomUUID()+'Aa1!';
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(error,null);
 const f={id:data.user.id,email,password};fixtures.push(f);
 f.user=await db.user.create({data:{supabaseAuthId:f.id,email,profile:{create:{objectifs:'Fictif'}}}});
 f.sessions=[];
 for(let i=0;i<2;i++){const c=client();const r=await c.auth.signInWithPassword({email,password});assert.equal(r.error,null);f.sessions.push(r.data.session);}
 return f;
}
function route(f){
 const modules={
  'next/server':req('next/server'),
  '@/lib/auth/server':{getCurrentUser:async()=>{const {data}=await client().auth.getUser(f.sessions[0].access_token);return data.user;}},
  '@/lib/auth/admin':{createSupabaseAdminClient:()=>admin},
  '@/lib/db/client':{prisma:db},
  '@/lib/stripe/client':{stripe:{subscriptions:{retrieve:()=>assert.fail('No billing allowed')}}},
  '@/lib/storage/progress-photos':{deleteAllProgressPhotos:async id=>assert.equal(id,f.id)},
 };
 const box={exports:{},URL,process:{env:{NEXT_PUBLIC_APP_URL:'http://localhost:3050'}},require:n=>{assert(n in modules,n);return modules[n];}};
 vm.runInNewContext(req('typescript').transpileModule(fs.readFileSync(repo+'/src/app/api/compte/delete/route.ts','utf8'),{compilerOptions:{module:req('typescript').ModuleKind.CommonJS}}).outputText,box);
 return box.exports.POST;
}
(async()=>{
 const a=await fixture(),b=await fixture();
 const response=await route(a)(new Request('http://localhost:3050/api/compte/delete',{method:'POST',headers:{'x-coai-delete-confirmation':'1',Authorization:`Bearer ${a.sessions[0].access_token}`}}));
 const body=await response.json();const lookup=await admin.auth.admin.getUserById(a.id);console.log('Post-delete lookup',JSON.stringify({hasUser:!!lookup.data.user,errorCode:lookup.error?.code,status:lookup.error?.status}));assert.equal(response.status,200,JSON.stringify(body));assert.deepEqual(body,{success:true});
 assert.equal(await db.user.count({where:{id:a.user.id}}),0);
 assert.equal(await db.profile.count({where:{userId:a.user.id}}),0);
 for(const s of a.sessions){
  const user=await client().auth.getUser(s.access_token);assert.equal(user.data.user,null);assert(user.error);
  const refresh=await client().auth.refreshSession({refresh_token:s.refresh_token});assert.equal(refresh.data.session,null);assert(refresh.error);
 }
 const again=await client().auth.signInWithPassword({email:a.email,password:a.password});assert(again.error);
 assert.equal((await client().auth.getUser(b.sessions[0].access_token)).data.user.id,b.id);
 assert.equal(await db.user.count({where:{id:b.user.id}}),1);
 console.log('PASS actual deletion route with real local Auth/DB: user/profile removed, both sessions fail getUser/refresh, old password rejected, other account preserved');
 console.log('LIMIT: Storage mocked empty, no Stripe subscription, direct route invocation, no HTTP/UI/production validation');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(async()=>{
 for(const f of fixtures){
  if(f.user)await db.user.deleteMany({where:{id:f.user.id}});
  const found=await admin.auth.admin.getUserById(f.id);
  if(found.data.user){const r=await admin.auth.admin.deleteUser(f.id);assert.equal(r.error,null);}
 }
 await db.$disconnect();console.log('Temporary local accounts removed');
});
