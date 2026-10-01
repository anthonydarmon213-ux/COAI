// Local fault injection only: real Next on 3051, simulator on 3050.
// Replace exactly one successful programme acknowledgement, AFTER commit.
const http = require('node:http');
let injected = false;
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:3050');
  const target = req.method === 'POST' && url.pathname === '/api/programmes/generate';
  const upstream = http.request({ hostname: '127.0.0.1', port: 3051, path: req.url,
    method: req.method, headers: { ...req.headers, host: 'localhost:3050' } }, reply => {
    if (target && !injected && reply.statusCode === 201) {
      injected = true;
      reply.resume();
      reply.on('end', () => {
        console.log('TEST: programme committed (201); replacing confirmation with incomplete JSON.');
        res.writeHead(201, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ echecs: 0 }));
      });
      return;
    }
    if (target) console.log('TEST: retry programme response', reply.statusCode);
    res.writeHead(reply.statusCode, reply.headers); reply.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) res.writeHead(503); res.end('Local upstream unavailable'); });
  req.pipe(upstream);
}).listen(3050, '127.0.0.1', () => console.log('Local programme confirmation proxy: 3050 -> 3051'));
