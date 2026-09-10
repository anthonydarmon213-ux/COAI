// Intégration volontairement locale : crée un compte fictif et deux emails
// Mailpit. Ne lit ni .env ni clés de production. Aucune confirmation forcée.
const {execFileSync} = require('node:child_process');
const {randomUUID} = require('node:crypto');
const assert = require('node:assert/strict');
const {createClient} = require('@supabase/supabase-js');
const workdir=process.argv[2];
if(!workdir || !workdir.startsWith('/tmp/coai-e2e-supabase-')) throw Error('Dossier de test local explicite requis');
const env={PATH:process.env.PATH,HOME:process.env.HOME,DOCKER_HOST:'unix:///Users/anthonydarmon/.colima/coai-test/docker.sock'};
const config=JSON.parse(execFileSync('npx',['--yes','supabase@2.117.0','status','--workdir',workdir,'--output','json'],{env,encoding:'utf8',stdio:['ignore','pipe','ignore']}));
assert.equal(config.API_URL,'http://127.0.0.1:54321');
const mail='http://127.0.0.1:54324';
const callback='http://localhost:3050/auth/callback?redirect_to=%2Fbienvenue';
const email=`confirmation-${randomUUID()}@example.test`;
const client=createClient(config.API_URL,config.ANON_KEY,{auth:{flowType:'pkce',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
async function messages(){
  const response=await fetch(`${mail}/api/v1/messages`);assert.ok(response.ok);
  const json=await response.json();
  return json.messages.filter(message=>message.To.some(to=>to.Address===email));
}
(async()=>{
  const signup=await client.auth.signUp({email,password:`Local-test-${randomUUID()}!`,options:{emailRedirectTo:callback}});
  assert.equal(signup.error,null);
  assert.equal(signup.data.session,null,'Email non confirmé : aucune session délivrée');
  const first=await messages();
  assert.equal(first.length,1,'Premier email reçu dans Mailpit');
  console.log('PASS local: compte fictif non confirmé, premier email reçu. Attente du délai de renvoi du fournisseur.');
  await new Promise(resolve=>setTimeout(resolve,61000));
  const resend=await client.auth.resend({type:'signup',email,options:{emailRedirectTo:callback}});
  assert.equal(resend.error,null);
  const after=await messages();
  assert.equal(after.length,2,'Renvoi effectivement reçu dans Mailpit');
  const latest=after.find(message=>message.ID!==first[0].ID);
  const response=await fetch(`${mail}/api/v1/message/${latest.ID}`);
  assert.ok(response.ok);
  const content=await response.json();
  const html=String(content.HTML||content.Text||'');
  assert.ok(html.includes('127.0.0.1:54321/auth/v1/verify'),'Lien Auth local présent');
  assert.ok(html.includes('localhost%3A3050')||html.includes('localhost:3050'),'Retour local conservé');
  assert.ok(html.includes('bienvenue'),'Destination bienvenue conservée');
  console.log('PASS local: renvoi reçu, lien de vérification et destination contrôlés. Aucun compte réel ni email externe.');
})().catch(error=>{console.error('FAIL local:',error.message);process.exitCode=1;});
