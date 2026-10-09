import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
import type { RuntimeConfig } from '@nexo/contracts';

export function runtimeConfigPlugin(repositoryRoot: string, mode: string): Plugin {
  function configure(server: ViteDevServer | PreviewServer, configPath: string) {
    server.middlewares.use('/runtime-config.json', async (_request, response) => {
      try {
        const defaults = JSON.parse(await readFile(configPath, 'utf8')) as RuntimeConfig;
        const environment = loadEnv(mode, repositoryRoot, 'NEXO_');
        const config: RuntimeConfig = {
          remotes: {
            catalog: environment.NEXO_CATALOG_REMOTE_URL || defaults.remotes.catalog,
            movie: environment.NEXO_MOVIE_REMOTE_URL || defaults.remotes.movie,
            area: environment.NEXO_AREA_REMOTE_URL || defaults.remotes.area,
          },
        };
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(JSON.stringify(config));
      } catch {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(JSON.stringify({ error: 'Configuração indisponível.' }));
      }
    });
  }
  return {
    name: 'nexo-runtime-config',
    configureServer(server) {
      configure(server, resolve(repositoryRoot, 'apps/shell/public/runtime-config.json'));
    },
    configurePreviewServer(server) {
      configure(server, resolve(server.config.build.outDir, 'runtime-config.json'));
    },
  };
}
