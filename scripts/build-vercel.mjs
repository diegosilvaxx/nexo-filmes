import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const application = process.argv[2];
if (!['shell', 'catalog', 'movie', 'area'].includes(application))
  throw new Error('Informe shell, catalog, movie ou area.');

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
