import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { checkSource, projectRoot } from '../scripts/check.mjs';
import { createSourceServer } from '../scripts/dev.mjs';

let server;
let origin;
before(async () => {
  server = createSourceServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

async function sourceFiles(directory = resolve(projectRoot, 'src')) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else files.push(path);
  }
  return files;
}

test('Vercel publica src sin instalación ni build', async () => {
  const config = JSON.parse(await readFile(resolve(projectRoot, 'vercel.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
  assert.equal(config.framework, null);
  assert.equal(config.buildCommand, '');
  assert.equal(config.installCommand, '');
  assert.equal(config.outputDirectory, 'src');
  assert.equal(pkg.scripts.build, undefined);
  assert.equal(pkg.dependencies, undefined);
});

test('rutas y scripts clásicos válidos, sin transformación', async () => {
  const resources = await checkSource();
  assert.ok(resources.length > 0);
  const source = resolve(projectRoot, 'src');
  for (const file of await sourceFiles()) {
    const relative = file.slice(source.length + 1).replaceAll('\\', '/');
    const response = await fetch(`${origin}/${relative}`);
    assert.equal(response.status, 200, relative);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(file), relative);
    if (file.endsWith('.js'))
      assert.match(response.headers.get('content-type'), /^text\/javascript/);
    if (file.endsWith('.css')) assert.match(response.headers.get('content-type'), /^text\/css/);
  }
});

test('CSS: los recursos locales referenciados existen bajo src', async () => {
  const source = resolve(projectRoot, 'src');
  for (const file of await sourceFiles()) {
    if (!file.endsWith('.css')) continue;
    const css = await readFile(file, 'utf8');
    for (const match of css.matchAll(/url\(\s*['"]?([^\s'"\)]+)['"]?\s*\)/g)) {
      if (/^(https?:|data:|blob:|#|\/\/)/.test(match[1])) continue;
      const url = new URL(match[1], `${origin}/${file.slice(source.length + 1)}`);
      assert.equal((await fetch(url)).status, 200, `${file}: ${match[1]}`);
    }
  }
});

test('la raíz sirve index.html; HEAD no devuelve cuerpo', async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.equal(
    await response.text(),
    await readFile(resolve(projectRoot, 'src/index.html'), 'utf8'),
  );
  const head = await fetch(origin, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});

test('no expone archivos del proyecto ni rutas de la copia antigua', async () => {
  for (const path of ['/package.json', '/scripts/dev.mjs', '/dist/index.html', '/src/index.html']) {
    assert.equal((await fetch(origin + path)).status, 404, path);
  }
  assert.equal((await fetch(origin + '/%2e%2e%2fpackage.json')).status, 403);
  assert.equal((await fetch(origin, { method: 'POST' })).status, 405);
});
