import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview, type PreviewServer } from 'vite';

export default async function globalSetup() {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const applications = [
    { name: 'catalog', port: 4301 },
    { name: 'movie', port: 4302 },
    { name: 'area', port: 4303 },
    { name: 'shell', port: 4300 },
  ];
  for (const application of applications) {
    if (application.name !== 'shell')
      process.env[`NEXO_${application.name.toUpperCase()}_REMOTE_URL`] =
        `http://127.0.0.1:${application.port}/remoteEntry.js`;
  }
  process.env.NEXO_BFF_URL = 'http://127.0.0.1:4309';
  process.env.VITE_PORTAL_URL = 'http://127.0.0.1:4300';
  process.env.VITE_USER_DATA_DELAY_MIN_MS = '500';
  process.env.VITE_USER_DATA_DELAY_MAX_MS = '500';
  process.env.VITE_USER_DATA_FAIL_WRITES = 'true';
  const servers: PreviewServer[] = [];
  const shutdown = async () => {
    await Promise.all(
      servers.map(
        (server) =>
          new Promise<void>((done, reject) => {
            if ('closeAllConnections' in server.httpServer) server.httpServer.closeAllConnections();
            server.httpServer.close((error) => (error ? reject(error) : done()));
          }),
      ),
    );
  };
  try {
    for (const application of applications) {
      const options = {
        configFile: resolve(root, 'apps', application.name, 'vite.config.ts'),
        root: resolve(root, 'apps', application.name),
        envDir: resolve(root, 'tests/e2e'),
        mode: 'e2e',
        logLevel: 'warn' as const,
        build: { outDir: resolve(root, 'dist/e2e', application.name), emptyOutDir: true },
        preview: { host: '127.0.0.1', port: application.port, strictPort: true },
      };
      await build(options);
      servers.push(await preview(options));
    }
    return shutdown;
  } catch (error) {
    await shutdown();
    throw error;
  }
}
