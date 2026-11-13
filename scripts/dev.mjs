import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot } from './check.mjs';

const sourceRoot = resolve(projectRoot, 'src');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

// Development and preview share the exact directory published by Vercel.
export function createSourceServer() {
  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
      }
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      const path = resolve(sourceRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!path.startsWith(sourceRoot + sep)) {
        response.writeHead(403);
        response.end();
        return;
      }
      if (!(await stat(path)).isFile()) throw new Error('Not a file');
      const content = await readFile(path);
      response.writeHead(200, {
        'Content-Type': types[extname(path)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch {
      response.writeHead(404);
      response.end('No encontrado');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && (args[0] !== '--port' || args.length !== 2)) {
    throw new Error('Uso: node scripts/dev.mjs [--port 4173]');
  }
  const port = Number(args[1] ?? '4173');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto no válido.');
  const server = createSourceServer();
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`BubbleOs (src): http://localhost:${port}`);
  });
}
