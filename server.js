const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 4200);
const API_ORIGIN = 'https://doc-transcribe-api.onrender.com';
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(clean).replace(/^(\.\.[/\\])+/, '');
  return path.join(ROOT, normalized);
}

async function proxyApi(req, res) {
  const upstreamUrl = `${API_ORIGIN}${req.url.replace(/^\/api/, '')}`;
  const headers = { ...req.headers };

  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'follow',
    });

    const outHeaders = {};
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        outHeaders[key] = value;
      }
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    send(res, upstream.status, buf, outHeaders);
  } catch (err) {
    send(res, 502, JSON.stringify({ error: 'Proxy error', details: String(err) }), {
      'Content-Type': 'application/json; charset=utf-8',
    });
  }
}

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = safePath(reqPath);
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const fallback = path.join(ROOT, 'index.html');
      fs.readFile(fallback, (readErr, data) => {
        if (readErr) {
          send(res, 404, 'Not found');
          return;
        }
        send(res, 200, data, { 'Content-Type': MIME_TYPES['.html'] });
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        send(res, 500, 'Internal server error');
        return;
      }
      send(res, 200, data, { 'Content-Type': mime });
    });
  });
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    send(res, 400, 'Bad request');
    return;
  }

  if (req.url.startsWith('/api/')) {
    proxyApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
