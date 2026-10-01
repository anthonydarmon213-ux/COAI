// Local native QA only. First training-page GET receives a synthetic HTTP 503;
// subsequent requests reach the real Next server. No remote target or credentials.
const http = require('node:http');
let failed = false;
http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost:3050').pathname;
  if (!failed && req.method === 'GET' && path === '/programme/entrainement') {
    failed = true;
    res.writeHead(503, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end('<html><body>LOCAL_SYNTHETIC_503</body></html>');
    console.log('TEST: initial training page returned HTTP 503');
    return;
  }
  const upstream = http.request({ hostname: '127.0.0.1', port: 3051,
    path: req.url, method: req.method, headers: { ...req.headers, host: 'localhost:3050' } }, reply => {
    if (path === '/programme/entrainement' || path === '/sign-in') {
      console.log('TEST: real page response', path, reply.statusCode);
    }
    res.writeHead(reply.statusCode, reply.headers);
    reply.pipe(res);
  });
  upstream.on('error', () => { res.writeHead(503); res.end('Local upstream unavailable'); });
  req.pipe(upstream);
}).listen(3050, '127.0.0.1', () => console.log('Local HTTP page failure proxy: 3050 -> 3051'));
