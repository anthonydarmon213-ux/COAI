// Test only: compiled local Next server on 3051, simulator opens 3050.
// Restart this process before each lost-response UI test. No production target.
const http = require('node:http');
const assert = require('node:assert/strict');
let dropped = false;
const server = http.createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost:3050').pathname;
  const isMeasure = req.method === 'POST' && path === '/api/mesures';
  const upstream = http.request({ hostname: '127.0.0.1', port: 3051, path: req.url,
    method: req.method, headers: { ...req.headers, host: 'localhost:3050' } }, reply => {
    if (isMeasure && !dropped) {
      assert.equal(reply.statusCode, 201, 'Only drop a confirmed successful save');
      dropped = true;
      reply.resume();
      reply.on('end', () => {
        console.log('TEST: first measure committed (201); response connection deliberately closed');
        res.destroy();
      });
      return;
    }
    if (isMeasure) console.log('TEST: retry response status', reply.statusCode);
    res.writeHead(reply.statusCode, reply.headers); reply.pipe(res);
  });
  upstream.on('error', () => { res.writeHead(503); res.end('Local upstream unavailable'); });
  req.pipe(upstream);
});
server.listen(3050, '127.0.0.1', () => console.log('Local one-shot loss proxy ready: 3050 -> 3051'));
