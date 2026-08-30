#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const HOST = process.env.VITRINEVERSE_HOST || '127.0.0.1';
const PORT = Number(process.env.VITRINEVERSE_PORT || 8098);
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${HOST}:${PORT}`).pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const absolutePath = path.resolve(ROOT, relativePath);
  const relativeToRoot = path.relative(ROOT, absolutePath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) return null;
  return absolutePath;
}

const server = http.createServer((request, response) => {
  let filePath;
  try {
    filePath = resolveRequestPath(request.url || '/');
  } catch {
    response.writeHead(400).end('Requête invalide');
    return;
  }
  if (!filePath) {
    response.writeHead(403).end('Accès refusé');
    return;
  }
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404).end('Introuvable');
      return;
    }
    const headers = {
      'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    };
    if (path.basename(filePath) === 'sw.js') headers['Service-Worker-Allowed'] = '/';
    response.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`VITRINE//VERSE servi sur http://${HOST}:${PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
