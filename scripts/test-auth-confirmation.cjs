const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const helpers = {};
function load(file, mocks={}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
    exports, URL, URLSearchParams, ...mocks.globals,
    require:name => mocks[name] ?? (name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name))
  });
  return exports;
}
Object.assign(helpers,load('src/lib/auth/confirmation.ts'));
const {signupHrefForReturnTo} = load('src/lib/auth/safe-redirect.ts');
for (const [value, expected] of [
  ['/bienvenue?plan=PASS_IA&billing=ANNUAL', '/sign-up?plan=PASS_IA&billing=ANNUAL'],
  ['/pricing?selected=PASS_IA&billing=MONTHLY', '/sign-up?plan=PASS_IA&billing=MONTHLY'],
  ['/pricing?selected=PREMIUM&billing=QUARTERLY&vipSessions=3', '/sign-up?plan=PREMIUM&billing=QUARTERLY&vipSessions=3'],
  ['/pricing?selected=PASS_IA&billing=wrong&code=secret', '/sign-up?plan=PASS_IA&billing=MONTHLY'],
  ['/pricing?selected=wrong', '/sign-up'], ['/admin?plan=PASS_IA', '/sign-up'],
  ['https://evil.test/pricing?selected=PASS_IA', '/sign-up'], [null, '/sign-up'],
]) assert.equal(signupHrefForReturnTo(value), expected);
for(const [search,hash,expected] of [
  ['','','null'],['?error=otp_expired','','confirmation'],['','#error=access_denied&error_code=otp_expired','confirmation'],
  ['?error=email_not_confirmed','','confirmation'],['?error=oauth','','oauth'],['?error=bad_code_verifier','','link'],
  ['?error=flow_state_expired','','link'],['?error=flow_state_not_found','','link'],['?error=%3Cscript%3E','','link'],
  ['?error_description=arbitrary','','null']
]) assert.equal(String(helpers.authLinkIssue(search,hash)),expected);
assert.equal(new URL(helpers.confirmationCallback('http://localhost:3050','/bienvenue?source=diagnostic')).searchParams.get('redirect_to'),'/bienvenue?source=diagnostic');
for(const target of ['https://evil.test','//evil.test','/\\evil.test']) {
  assert.equal(new URL(helpers.confirmationCallback('http://localhost:3050',target)).searchParams.get('redirect_to'),'/bienvenue');
  assert.equal(helpers.authFailureDestination('http://localhost:3050',target,'otp_expired').searchParams.has('redirect_to'),false);
}
assert.equal(helpers.authFailureDestination('http://localhost:3050','/bienvenue','secret-token').searchParams.get('error'),'auth_link');
assert.ok(helpers.confirmationSendError({code:'over_email_send_rate_limit'}).includes('Patiente'));
assert.ok(!helpers.confirmationSendError({message:'secret'}).includes('secret'));

// Liens réellement rendus par l'inscription : un compte existant retrouve
// son choix tarifaire. Le nouveau compte conserve le parcours de bienvenue.
for (const [query, expected] of [
  ['plan=PASS_IA&billing=ANNUAL', '/pricing?from=signin&selected=PASS_IA&billing=ANNUAL'],
  ['plan=PASS_IA&billing=MONTHLY', '/pricing?from=signin&selected=PASS_IA&billing=MONTHLY'],
  ['plan=PASS_IA&billing=invalid', '/pricing?from=signin&selected=PASS_IA&billing=MONTHLY'],
  ['plan=https://evil.test', '/bienvenue'],
  ['', '/bienvenue'],
]) {
  const React = require('react');
  const mocks = {
    react: {...React, useState: value => [typeof value === 'function' ? value() : value, () => {}], useEffect: () => {}},
    'next/navigation': {useSearchParams: () => new URLSearchParams(query)},
    'next/link': {default: 'a'},
    '@/lib/auth/client': {createSupabaseBrowserClient: () => {throw Error('No auth call during render');}},
    '@/lib/parrainage/cookie': {storeParrainageCookie() {}},
    '@/lib/analytics/funnel-events': {trackFunnelEvent() {}},
  };
  for (const [file, name] of [['ui/button','Button'], ['ui/input','Input'], ['ui/field','Field'], ['ui/card','Card'], ['ui/section-label','SectionLabel'], ['auth/google-sign-in-button','GoogleSignInButton'], ['auth/confirmation-email','ConfirmationEmail']]) {
    mocks[`@/components/${file}`] = {[name]: name};
  }
  const page = load('src/app/(auth)/sign-up/page.tsx', mocks).default();
  const links = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node?.props) return;
    if (node.props.href?.startsWith('/sign-in?')) links.push(node.props.href);
    visit(node.props.children);
  }
  visit(page);
  assert.equal(links.length, 1);
  assert.equal(new URL(links[0], 'http://localhost').searchParams.get('redirect_to'), expected);
}

(async()=>{
  let exchangeCalls=0;
  const callback = load('src/app/auth/callback/route.ts',{
    '@/lib/auth/server':{createSupabaseServerClient:()=>({auth:{exchangeCodeForSession:async()=>{exchangeCalls++;return {data:{user:null},error:{code:'flow_state_expired'}};}}})},
    '@/lib/db/client':{prisma:{user:{findUnique:()=>{throw Error('Must not query DB on auth failure');}}}}
  });
  for(const url of ['http://localhost:3050/auth/callback?error_code=otp_expired&redirect_to=%2Fbienvenue','http://localhost:3050/auth/callback?code=expired&redirect_to=%2Fbienvenue']) {
    const response=await callback.GET(new Request(url));
    const dest=new URL(response.headers.get('location'));
    assert.equal(dest.pathname,'/sign-in');
    assert.equal(dest.searchParams.get('redirect_to'),'/bienvenue');
    assert.ok(!dest.searchParams.has('code'));
  }
  assert.equal(exchangeCalls,1);

  // Le formulaire réel ne déclenche aucun envoi au montage et bloque les
  // doubles clics pendant la requête ; aucun fournisseur appelé par ce test.
  for(const error of [null,{code:'over_email_send_rate_limit'},new Error('network')]) {
    let count=0,resolveRequest;
    const updates=[];
    const React=require('react');
    const component=load('src/components/auth/confirmation-email.tsx',{
      globals:{window:{location:{origin:'http://localhost:3050'}}},
      react:{...React,useState:initial=>[initial,value=>updates.push(value)],useRef:initial=>({current:initial}),useEffect:()=>{}},
      '@/lib/auth/client':{createSupabaseBrowserClient:()=>({auth:{resend:args=>{count++;assert.equal(args.type,'signup');assert.equal(args.email,'synthetic@example.test');assert.equal(new URL(args.options.emailRedirectTo).searchParams.get('redirect_to'),'/bienvenue');return new Promise(resolve=>{resolveRequest=()=>resolve({error});});}}})},
      '@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'}
    });
    const form=component.ConfirmationEmail({initialEmail:'synthetic@example.test',returnTo:'/bienvenue'});
    assert.equal(count,0);
    const first=form.props.onSubmit({preventDefault(){}});
    await form.props.onSubmit({preventDefault(){}});
    assert.equal(count,1);
    resolveRequest();await first;
    assert.ok(updates.includes(60),'Délai après une tentative');
    assert.ok(updates.some(value=>typeof value==='string'&&value.includes(error?'réessa':'Si cette adresse')));
    const blocked=component.ConfirmationEmail({initialEmail:'synthetic@example.test',initialCooldown:60});
    await blocked.props.onSubmit({preventDefault(){}});
    assert.equal(count,1);
  }
  console.log('PASS: codes URL/fragment, redirections internes, erreurs callback, renvoi manuel, double clic, temporisation, erreurs neutres. Aucun email externe.');
})().catch(error=>{console.error(error);process.exitCode=1;});
