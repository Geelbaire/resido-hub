#!/usr/bin/env node
/**
 * FRANC NORD — Serveur Studio Local (Zéro dépendance externe)
 * Usage : node server.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4321);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm'
};

export function startStudioServer(port = PORT) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlObj = new URL(req.url, `http://127.0.0.1:${port}`);
      let pathname = decodeURIComponent(urlObj.pathname);
      if (pathname === '/') {
        res.writeHead(302, { Location: '/studio/index.html' });
        res.end();
        return;
      }

      const safePath = path.normalize(path.join(__dirname, pathname));
      if (!safePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.stat(safePath, (err, stat) => {
        if (err || !stat.isFile()) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(safePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(safePath).pipe(res);
      });
    });

    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startStudioServer(PORT).then(() => {
    console.log(`\n🧭 STUDIO FRANC NORD EN LIGNE : http://127.0.0.1:${PORT}/studio/index.html`);
    console.log(`   • Format YouTube (16:9)   : http://127.0.0.1:${PORT}/studio/index.html?format=16x9`);
    console.log(`   • Format Facebook (9:16)  : http://127.0.0.1:${PORT}/studio/index.html?format=9x16\n`);
  });
}
