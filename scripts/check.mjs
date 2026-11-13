import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function checkSource() {
  const sourceRoot = resolve(projectRoot, 'src');
  const html = await readFile(resolve(sourceRoot, 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !/^(?:https?:|data:|#)/.test(path));
  const scripts = [];
  for (const reference of references) {
    const path = resolve(sourceRoot, reference);
    if (!path.startsWith(sourceRoot + sep)) throw new Error(`Ruta fuera de src: ${reference}`);
    if (!(await stat(path)).isFile()) throw new Error(`Archivo no encontrado: ${reference}`);
    if (path.endsWith('.js')) {
      const source = await readFile(path, 'utf8');
      new vm.Script(source, { filename: reference });
      scripts.push(source);
    }
  }
  // Classic scripts share their global lexical scope. Check duplicate declarations too.
  new vm.Script(scripts.join('\n;\n'), { filename: 'all-source-scripts.js' });
  console.log(`Verificado: ${references.length} recursos y ${scripts.length} scripts.`);
  return references;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkSource();
}
