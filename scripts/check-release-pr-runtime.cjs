// Combined PR 126/127/128 QA. Loopback only; never deploys or migrates.
const {spawn,spawnSync}=require('node:child_process');
const {createHmac}=require('node:crypto');
const fs=require('node:fs');
const assert=require('node:assert/strict');
assert(!fs.readdirSync('.').some(name=>/^\.env(?:\..+)?$/.test(name)&&name!=='.env.example'),
  'Refuse a checkout containing dotenv overrides');
const inspected=spawnSync('/opt/homebrew/bin/docker',['--host',
  'unix:///Users/anthonydarmon/.colima/coai-test/docker.sock','inspect','supabase_auth_coai-e2e-supabase-sloAPQ'],{encoding:'utf8'});
assert.equal(inspected.status,0,'Local QA Auth required');
const local=Object.fromEntries(JSON.parse(inspected.stdout)[0].Config.Env.map(value=>{
  const i=value.indexOf('=');return [value.slice(0,i),value.slice(i+1)];}));
assert(local.GOTRUE_JWT_SECRET);
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
function token(role){const now=Math.floor(Date.now()/1000);
  const body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({role,
    iss:local.GOTRUE_JWT_ISSUER||'supabase-demo',aud:'authenticated',iat:now,exp:now+7200});
  return body+'.'+createHmac('sha256',local.GOTRUE_JWT_SECRET).update(body).digest('base64url');}
const env={...process.env,DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  DIRECT_URL:'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:token('anon'),
  SUPABASE_SERVICE_ROLE_KEY:token('service_role'),NEXT_PUBLIC_APP_URL:'http://localhost:3052',
  COAI_APPLE_QA_ORIGIN:'http://localhost:3052',APPLE_PURCHASES_ENABLED:'false',
  APPLE_CONTENT_ACCESS_ENABLED:'false',APPLE_NOTIFICATIONS_ENABLED:'false',
  APPLE_STORE_ENVIRONMENT:'Sandbox',APPLE_ROOT_CERTIFICATES_BASE64_JSON:'',APPLE_APP_ID:''};
for(const key of ['ANTHROPIC_API_KEY','OPENAI_API_KEY','STRIPE_SECRET_KEY','RESEND_API_KEY',
  'PEXELS_API_KEY','SENTRY_AUTH_TOKEN','NEXT_PUBLIC_SENTRY_DSN','NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_META_PIXEL_ID','NEXT_PUBLIC_CLARITY_PROJECT_ID','MAKE_OUTGOING_WEBHOOK_URL','NTFY_TOPIC'])env[key]='';
async function run(args){await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,args,{env,stdio:'inherit'});
  child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('QA command failed: '+args[0])));});}
(async()=>{
  await run(['node_modules/prisma/build/index.js','generate']);
  for(const name of ['workout-owner','paris-daily-calendar','apple-catalogue','apple-delivery',
    'apple-account-route-errors','apple-transaction-policy','apple-transactions-route',
    'apple-notifications','apple-signed-transaction','effective-access'])await run(['scripts/test-'+name+'.cjs']);
  await run(['node_modules/next/dist/bin/next','build']);
  const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3052','-H','127.0.0.1'],
    {env,stdio:['ignore','pipe','pipe']});
  server.stdout.on('data',()=>{});server.stderr.on('data',()=>{});
  try{
    let ready=false;
    for(let i=0;i<100;i++){
      if(server.exitCode!==null)throw Error('Local QA server exited');
      try{if((await fetch('http://127.0.0.1:3052/sign-in')).status===200){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    assert(ready,'Local QA server unavailable');
    await run(['scripts/test-runtime-http-local.cjs']);
    await run(['scripts/test-apple-http-local.cjs']);
  }finally{if(server.exitCode===null)await new Promise(resolve=>{server.once('exit',resolve);server.kill('SIGTERM');});}
  console.log('PASS: combined PR runtime QA; no deployment, migration, purchase or paid provider.');
})().catch(error=>{console.error(error);process.exitCode=1;});
