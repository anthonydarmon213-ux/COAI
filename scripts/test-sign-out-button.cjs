const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/compte/sign-out-button.tsx', 'utf8');
const ast = ts.createSourceFile('button.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'handleSignOut') handler = node;
  ts.forEachChild(node, visit);
}
visit(ast); assert.ok(handler);
const compiled = ts.transpileModule(handler.getText(ast), {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
(async () => {
  for (const failure of ['returned', 'thrown', 'client', null]) {
    let calls = 0, release, loading = false, error = false;
    const navigation = [];
    const box = {pending:{current:false}, setLoading:v=>loading=v, setError:v=>error=v,
      createSupabaseBrowserClient:()=>{
        if (failure === 'client') throw new Error('configuration');
        return {auth:{signOut:async()=>{
          calls++; await new Promise(resolve=>release=resolve);
          if (failure === 'thrown') throw new Error('network');
          return {error:failure === 'returned' ? new Error('service') : null};
        }}};
      }, router:{replace:route=>navigation.push(route), refresh:()=>navigation.push('refresh')}};
    vm.runInNewContext(compiled, box);
    const first = box.handleSignOut();
    if (failure !== 'client') {
      assert.equal(loading, true);
      await box.handleSignOut(); assert.equal(calls, 1, 'No duplicate request');
      release();
    }
    await first;
    if (failure) {
      assert.equal(error, true); assert.equal(loading, false);
      assert.equal(box.pending.current, false); assert.deepEqual(navigation, []);
    } else {
      assert.equal(error, false); assert.equal(box.pending.current, true);
      assert.deepEqual(navigation, ['/sign-in','refresh']);
    }
  }
  assert.match(source, /role="alert"/);
  assert.match(source, /h-11 w-11/);
  console.log('PASS sign-out: returned error, thrown error, client failure, success, duplicate prevention; isolated handler, not live session revocation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
