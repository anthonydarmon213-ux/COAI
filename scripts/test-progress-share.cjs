// Real component handlers with simulated browser APIs. Never shares or contacts a server.
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), assert = require('node:assert/strict');
const states = []; let cursor = 0, shares = 0, events = 0, abort = false;
const navigator = { canShare: () => true, share: async () => { shares++; if (abort) throw new DOMException('cancel', 'AbortError'); } };
const box = { exports: {}, navigator, DOMException, File: class {}, URL: { createObjectURL: () => 'blob:fixture', revokeObjectURL: () => {} },
  fetch: async url => ({ ok: true, blob: async () => ({ type: 'image/png' }), json: async () => ({ lien: 'https://coai.fr/diagnostic' }) }),
  require: name => name === 'react' ? {
    useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef: initial => { const i = cursor++; return states[i] ?? (states[i] = { current: initial }); }, useEffect: () => {},
  } : name === 'next/image' ? { default: 'img' } : name.includes('funnel-events') ? { trackFunnelEvent: () => { events++; } } : require(name),
};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/suivi/share-progress-card-button.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, box);
function render() { cursor = 0; return box.exports.ShareProgressCardButton({ imageUrl: '/card', filename: 'card.png', title: 'Carte' }); }
function nodes(node, result = []) { if (Array.isArray(node)) node.forEach(n => nodes(n, result)); else if (node?.props) { result.push(node); nodes(node.props.children, result); } return result; }
function button(label) { return nodes(render()).find(n => n.type === 'button' && n.props.children === label); }
(async () => {
  await button('Partager →').props.onClick();
  assert.equal(shares, 0); assert.equal(events, 0);
  assert(nodes(render()).some(n => n.props['aria-label'] === 'Aperçu de la carte à partager'));
  await button('Partager cette carte').props.onClick();
  assert.equal(shares, 1); assert.equal(events, 1);
  abort = true;
  await button('Partager cette carte').props.onClick();
  assert.equal(events, 1); assert(!nodes(render()).some(n => n.props.role === 'alert'));
  button('Fermer l’aperçu').props.onClick();
  navigator.canShare = () => false;
  await button('Partager →').props.onClick();
  assert(!button('Partager cette carte'));
  const link = nodes(render()).find(n => n.type === 'a');
  assert.equal(link.props.href, '/card'); assert.equal(link.props.target, '_blank');
  assert.equal(events, 1);
  console.log('PASS: preview before share, explicit share, cancel, direct-link fallback; no automatic clipboard or popup');
})().catch(e => { console.error(e); process.exitCode = 1; });
