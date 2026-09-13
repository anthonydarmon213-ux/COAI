// Rasterise the existing, approved Story SVG; no AI generation or network call.
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { ImageResponse } = require('next/og');
const root = path.resolve(__dirname, '..');
const svg = fs.readFileSync(path.join(root, 'public/brand/coai-mark.svg'));
const src = `data:image/svg+xml;base64,${svg.toString('base64')}`;
async function render(size) {
  const result = new ImageResponse(React.createElement('div', { style: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #192b34 0%, #0a151c 60%, #292619 100%)',
  } }, React.createElement('img', { src, width: size * 0.82, height: size * 0.82 })), { width: size, height: size });
  return Buffer.from(await result.arrayBuffer());
}
(async () => {
  for (const size of [32, 180, 192, 512, 1024]) {
    const png = await render(size);
    fs.writeFileSync(path.join(root, 'public/brand', `coai-app-premium-${size}.png`), png);
    if (size === 1024) fs.writeFileSync(path.join(root, 'ios/COAI/Assets.xcassets/AppIcon.appiconset/coai-1024.png'), png);
    console.log(`COAI ${size}×${size}: ${png.length} bytes`);
  }
  require('node:child_process').execFileSync('swift', [path.join(root, 'scripts/icon-rgb.swift'),
    path.join(root, 'public/brand/coai-app-premium-1024.png'),
    path.join(root, 'ios/COAI/Assets.xcassets/AppIcon.appiconset/coai-1024.png')], { stdio: 'inherit' });
})().catch(e => { console.error(e); process.exitCode = 1; });
