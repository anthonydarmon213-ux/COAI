// Fault injection strictly for local iOS UI tests: Next on 3051, simulator on 3050.
// Let the real API persist one daily check-in, then corrupt only its first acknowledgement.
const http = require('node:http');
let injected = false;

http.createServer((req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    let isCheckin = false;
    if (req.method === 'POST' && new URL(req.url, 'http://localhost:3050').pathname === '/api/daily') {
      try { isCheckin = JSON.parse(body.toString('utf8')).action === 'checkin'; } catch {}
    }
    const upstream = http.request({ hostname: '127.0.0.1', port: 3051, path: req.url,
      method: req.method, headers: { ...req.headers, host: 'localhost:3050' } }, reply => {
      if (isCheckin && !injected && reply.statusCode === 200) {
        injected = true;
        reply.resume();
        reply.on('end', () => {
          console.log('TEST: real check-in saved (200); first acknowledgement replaced with invalid JSON object.');
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ echecs: 0 }));
        });
        return;
      }
      if (isCheckin) console.log('TEST: retry check-in response', reply.statusCode);
      res.writeHead(reply.statusCode, reply.headers);
      reply.pipe(res);
    });
    upstream.on('error', () => { if (!res.headersSent) res.writeHead(503); res.end('Local upstream unavailable'); });
    upstream.end(body);
  });
}).listen(3050, '127.0.0.1', () => console.log('Local daily confirmation proxy: 3050 -> 3051'));
