const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/app/api/compte/delete/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function scenario({status='active',customer='cus_owner',retrieveError=false,cancelError=false,cancelStatus='canceled',signedIn=true,hasSubscription=true,photosError=false,hasProfile=true,profileError=false,identityError=false,identityThrows=false,identityId='auth_test',requestHeaders={},appURL='https://coai.fr'}={}) {
  const events=[],api={};
  let authCalls=0;
  vm.runInNewContext(source,{exports:api,URL,process:{env:{NEXT_PUBLIC_APP_URL:appURL}},require:name=>{
    const modules={
      'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
      '@/lib/auth/server':{getCurrentUser:async()=>{authCalls++;return signedIn?{id:'auth_test'}:null;}},
      '@/lib/auth/admin':{createSupabaseAdminClient:()=>({auth:{admin:{deleteUser:async(id)=>{assert.equal(id,'auth_test');events.push('identity');if(identityThrows)throw new Error('network');return {data:{user:identityId?{id:identityId}:null},error:identityError?new Error('failed'):null};}}}})},
      '@/lib/stripe/client':{stripe:{subscriptions:{
        retrieve:async()=>{events.push('retrieve');if(retrieveError)throw new Error('network');return {id:'sub_test',customer,status};},
        cancel:async()=>{events.push('cancel');if(cancelError)throw new Error('network');return {status:cancelStatus};}
      }}},
      '@/lib/db/client':{prisma:{user:{findUnique:async()=>hasProfile?({id:'user_test',subscription:hasSubscription?{stripeSubscriptionId:'sub_test',stripeCustomerId:'cus_owner'}:null}):null,delete:async()=>{events.push('profile');if(profileError)throw new Error('database');}}}},
      '@/lib/storage/progress-photos':{deleteAllProgressPhotos:async()=>{events.push('photos');if(photosError)throw new Error('storage');}}
    };
    if(!(name in modules))throw new Error(name);return modules[name];
  }});
  const headers=new Headers({'origin':appURL,'x-coai-delete-confirmation':'1'});
  for(const [key,value] of Object.entries(requestHeaders)) {
    if(value===null)headers.delete(key);else headers.set(key,value);
  }
  return {response:await api.POST(new Request('https://coai.fr/api/compte/delete',{method:'POST',headers})),events,authCalls};
}
(async()=>{
  for(const requestHeaders of [
    {'x-coai-delete-confirmation':null}, {'x-coai-delete-confirmation':'0'},
    {origin:null}, {origin:'null'}, {origin:'https://evil.example'},
    {origin:'https://coai.fr.evil.example'}, {origin:'http://coai.fr'},
    {origin:'https://coai.fr:8443'}, {'sec-fetch-site':'cross-site'},
    {origin:'https://evil.example',host:'evil.example','x-forwarded-host':'evil.example'},
  ]) {
    const result=await scenario({requestHeaders});
    assert.equal(result.response.status,403);assert.equal(result.authCalls,0);assert.deepEqual(result.events,[]);
  }
  for(const appURL of ['', 'invalid', 'http://coai.fr', 'https://user:secret@coai.fr']) {
    const result=await scenario({appURL});assert.equal(result.response.status,503);assert.deepEqual(result.events,[]);
  }
  for(const authorization of ['Basic token','Bearer ', 'Bearer token another']) {
    const result=await scenario({requestHeaders:{authorization}});
    assert.equal(result.response.status,401);assert.equal(result.authCalls,0);assert.deepEqual(result.events,[]);
  }
  assert.equal((await scenario({appURL:'http://localhost:3050'})).response.status,200);
  assert.equal((await scenario({requestHeaders:{origin:null,authorization:'Bearer test-token'}})).response.status,200);
  assert.equal((await scenario({signedIn:false,requestHeaders:{origin:null,authorization:'Bearer test-token'}})).response.status,401);
  for(const options of [{retrieveError:true},{cancelError:true},{customer:'cus_other'},{cancelStatus:'active'}]){
    const {response,events}=await scenario(options);
    assert.equal(response.status,503);
    assert.ok(!events.some(e=>['photos','profile','identity'].includes(e)),'No deletion before confirmed cancellation');
    if(options.customer)assert.ok(!events.includes('cancel'),'Never cancel another customer');
  }
  for(const status of ['canceled','incomplete_expired']){
    const {response,events}=await scenario({status});assert.equal(response.status,200);
    assert.deepEqual(events,['retrieve','photos','profile','identity']);
  }
  assert.deepEqual((await scenario()).events,['retrieve','cancel','photos','profile','identity']);
  assert.deepEqual((await scenario({hasSubscription:false})).events,['photos','profile','identity']);
  assert.equal((await scenario({signedIn:false})).response.status,401);
  const failedPhotos=await scenario({photosError:true});
  assert.equal(failedPhotos.response.status,503);
  assert.deepEqual(failedPhotos.events,['retrieve','cancel','photos']);
  assert.match(failedPhotos.response.body.error,/Certaines photos/);
  for(const options of [{identityError:true},{identityThrows:true},{identityId:null},{identityId:'another_user'}]){
    const result=await scenario(options);
    assert.equal(result.response.status,503,'No false success after Auth failure');
    assert.equal(result.response.body.success,undefined);
    assert.match(result.response.body.error,/suppression de ton accès/);
  }
  const failedProfile=await scenario({profileError:true});
  assert.equal(failedProfile.response.status,503);
  assert.ok(!failedProfile.events.includes('identity'));
  const resumed=await scenario({hasProfile:false});
  assert.equal(resumed.response.status,200);
  assert.deepEqual(resumed.events,['photos','identity']);
  assert.equal((await scenario({hasProfile:false,identityError:true})).response.status,503);
  assert.deepEqual((await scenario({signedIn:false,hasProfile:false})).events,[]);
  console.log('PASS deletion billing gate: unavailable Stripe, cancellation failure, wrong customer, unconfirmed status, already ended, no subscription, unauthenticated; mocked only');
})().catch(error=>{console.error(error);process.exitCode=1;});
