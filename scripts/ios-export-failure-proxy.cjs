// Local native test only. Never forwards outside the loopback Next server.
const http = require('node:http');
let injected = false;
http.createServer((req, res) => {
  const isExport = req.method === 'GET'
    && new URL(req.url, 'http://localhost:3050').pathname === '/api/compte/export';
  const upstream = http.request({ hostname: '127.0.0.1', port: 3051,
    path: req.url, method: req.method,
    headers: { ...req.headers, host: 'localhost:3050' } }, reply => {
    if (isExport && !injected && reply.statusCode === 200) {
      injected = true;
      reply.resume();
      reply.on('end', () => {
        console.log('TEST: authenticated export 200 replaced with invalid JSON object');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: 'LOCAL_SYNTHETIC_INVALID_EXPORT' }));
      });
      return;
    }
    if (isExport) console.log('TEST: export retry status', reply.statusCode);
    res.writeHead(reply.statusCode, reply.headers); reply.pipe(res);
  });
  upstream.on('error', () => { res.writeHead(503); res.end('Local upstream unavailable'); });
  req.pipe(upstream);
}).listen(3050, '127.0.0.1', () => console.log('Local export proxy: 3050 -> 3051'));
