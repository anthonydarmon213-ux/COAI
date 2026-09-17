const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/app/api/compte/delete/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function scenario({status='active',customer='cus_owner',retrieveError=false,cancelError=false,cancelStatus='canceled',signedIn=true,hasSubscription=true,photosError=false,hasProfile=true,profileError=false,identityError=false,identityThrows=false,identityId='auth_test'}={}) {
  const events=[],api={};
  vm.runInNewContext(source,{exports:api,require:name=>{
    const modules={
      'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status??200})}},
      '@/lib/auth/server':{getCurrentUser:async()=>signedIn?{id:'auth_test'}:null},
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
  return {response:await api.POST(),events};
}
(async()=>{
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
