import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { projectRoot, checkSource } from './check.mjs';

await checkSource();
const source = resolve(projectRoot, 'src');
const destination = resolve(projectRoot, 'dist');
const temporary = resolve(projectRoot, '.build-output');
await rm(temporary, { recursive: true, force: true });
await mkdir(temporary, { recursive: true });
await cp(source, temporary, { recursive: true });
await writeFile(
  resolve(temporary, 'GENERATED.txt'),
  'Generado desde src con npm run build. No editar dist directamente.\n',
);
await rm(destination, { recursive: true, force: true });
await cp(temporary, destination, { recursive: true });
await rm(temporary, { recursive: true, force: true });
console.log('Sitio generado en dist/.');
