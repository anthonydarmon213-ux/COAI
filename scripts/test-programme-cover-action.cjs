const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/components/programme/programme-cover-action.tsx', 'utf8');
const ast = ts.createSourceFile('cover.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let handler;
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'ouvrirProgramme') handler = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast); assert(handler);
class Element {
  constructor(parentElement = null) { this.parentElement = parentElement; }
  scrollIntoView() {
    for (let node = this; node; node = node.parentElement) {
      if (node instanceof Details) assert.equal(node.open, true, 'All containing details must open before scrolling');
    }
    this.scrolled = true;
  }
}
class Details extends Element { open = false; }
for (const unlocked of [false, true]) {
  const outer = new Details(new Element());
  const middle = new Element(outer);
  const target = unlocked ? new Details(middle) : new Element(middle);
  const unrelated = new Details();
  const box = {targetId: 'target', document: {getElementById: () => target}, HTMLDetailsElement: Details};
  vm.runInNewContext(ts.transpileModule(handler, {compilerOptions: {target: ts.ScriptTarget.ES2022}}).outputText, box);
  vm.runInNewContext('ouvrirProgramme()', box);
  assert(target.scrolled);
  assert.equal(unrelated.open, false);
}
const missing = {targetId: 'missing', document: {getElementById: () => null}, HTMLDetailsElement: Details};
vm.runInNewContext(ts.transpileModule(handler, {}).outputText + '\nouvrirProgramme();', missing);
console.log('PASS actual cover handler: locked/unlocked nested disclosures open before scrolling; absent target is safe');
