import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createTmdbAdapter } from '@nexo/tmdb';
import { findRepositoryRoot, readServerConfig } from './config';
import { createBffServer } from './server';

export async function startBff(root = findRepositoryRoot(process.cwd()), mode = 'development') {
  const config = readServerConfig(root, mode);
  const server = createBffServer(createTmdbAdapter(config.token));
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, resolve);
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  startBff(undefined, process.env.NODE_ENV === 'production' ? 'production' : 'development')
    .then((server) => {
      console.log(`BFF: porta ${(server.address() as { port: number }).port}`);
      const shutdown = () => {
        server.close(() => process.exit(0));
        server.closeAllConnections();
      };
      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);
    })
    .catch(() => {
      console.error('Falha ao iniciar o BFF. Verifique o token e a porta no ambiente do servidor.');
      process.exitCode = 1;
    });
}
