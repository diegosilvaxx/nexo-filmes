import { rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const application = process.argv[2];
if (!['shell', 'catalog', 'movie', 'area'].includes(application))
  throw new Error('Informe shell, catalog, movie ou area.');

const buildsRoot = resolve(root, 'dist/vercel');
const outputDirectory = resolve(buildsRoot, application);
if (!outputDirectory.startsWith(`${buildsRoot}${sep}`))
  throw new Error('Diretório de build inválido.');
await rm(outputDirectory, { recursive: true, force: true });

await build({
  configFile: resolve(root, 'apps', application, 'vite.config.ts'),
  mode: 'vercel',
});

if (application === 'shell') {
  const remotes = Object.fromEntries(
    ['catalog', 'movie', 'area'].map((name) => [name, `/remotes/${name}/remoteEntry.js`]),
  );
  await writeFile(
    resolve(root, 'dist/vercel/shell/runtime-config.json'),
    JSON.stringify({ remotes }, null, 2) + '\n',
  );
}
