import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const applications = [
  { folder: 'shell', label: 'Shell', port: 4100 },
  { folder: 'catalog', label: 'Catálogo', port: 4101 },
  { folder: 'movie', label: 'Filme', port: 4102 },
  { folder: 'area', label: 'Minha área', port: 4103 },
];
const servers = [];
let closing = false;

async function shutdown(exitCode = 0) {
  if (closing) return;
  closing = true;
  await Promise.allSettled(servers.map((server) => server.close()));
  process.exit(exitCode);
}

process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

try {
  for (const application of applications) {
    const server = await createServer({
      configFile: resolve(repositoryRoot, 'vite.config.ts'),
      root: resolve(repositoryRoot, 'apps', application.folder),
      server: { port: application.port, strictPort: true },
    });
    servers.push(server);
    await server.listen();
    console.log(`${application.label}: http://127.0.0.1:${application.port}`);
  }
  console.log('\nNexo Filmes — quatro aplicações locais. Pressione Ctrl+C para encerrar.');
} catch (error) {
  console.error('Falha ao iniciar o workspace:', error);
  await shutdown(1);
}
