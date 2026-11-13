import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { projectRoot } from './check.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--'))
    throw new Error(`Falta valor para ${name}`);
  return args[index + 1];
};
const directory = option('--directory', 'src');
if (!['src', 'dist'].includes(directory)) throw new Error('Usa --directory src o dist.');
const root = resolve(projectRoot, directory);
const port = Number(option('--port', '4173'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto no válido.');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (!(await stat(path)).isFile()) throw new Error('Not a file');
    const body = await readFile(path);
    response.writeHead(200, {
      'Content-Type': types[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404);
    response.end('No encontrado');
  }
});
server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () =>
  console.log(`PAPEL OS (${directory}): http://localhost:${port}`),
);
