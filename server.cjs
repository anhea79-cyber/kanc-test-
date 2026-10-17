'use strict';
// 개발용 서버: 이 컴퓨터에서만 접속할 수 있습니다.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assets = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/projects.js': ['projects.js', 'text/javascript'], '/app.js': ['app.js', 'text/javascript'] };
const server = http.createServer((req, res) => {
  const asset = assets[new URL(req.url, 'http://localhost').pathname];
  if (!asset) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(__dirname, asset[0]), (error, data) => {
    if (error) { res.writeHead(500); res.end('Read error'); return; }
    res.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(data);
  });
});
if (require.main === module) {
  server.on('error', error => { console.error('서버를 시작할 수 없습니다:', error.message); process.exitCode = 1; });
  server.listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173 (종료: Ctrl+C)'));
}
module.exports = server;
