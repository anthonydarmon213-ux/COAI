const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const postcss = require('postcss');
const tailwind = require('tailwindcss');

const compiled = ts.transpileModule(fs.readFileSync('tailwind.config.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const configModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(require, configModule, configModule.exports);
const config = configModule.exports.default;
assert.equal(config.theme.extend.colors.cyan.DEFAULT, '#38BDF8');
assert.equal(config.theme.extend.colors.cyan[200], '#a5f3fc');

(async () => {
  const result = await postcss([tailwind({ ...config, content: [{ raw:
    'bg-cyan bg-cyan-200 text-cyan-200 border-cyan-300', extension: 'html' }] })])
    .process('@tailwind utilities;', { from: undefined });
  for (const selector of ['.bg-cyan', '.bg-cyan-200', '.text-cyan-200', '.border-cyan-300']) {
    assert(result.css.includes(`${selector} {`), `Missing generated utility: ${selector}`);
  }
  const luminance = (rgb) => rgb.map(v => v / 255).map(v =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((total, v, i) => total + v * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (luminance([165, 243, 252]) + 0.05) / (luminance([17, 18, 22]) + 0.05);
  assert(contrast >= 4.5, `Insufficient dashboard CTA contrast: ${contrast}`);
  console.log(`PASS: brand cyan preserved, numbered utilities generated, CTA contrast ${contrast.toFixed(1)}:1`);
})().catch(error => { console.error(error); process.exitCode = 1; });
