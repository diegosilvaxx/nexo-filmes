import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { runtimeConfigPlugin } from './runtime-config.ts';

export type ApplicationName = 'shell' | 'catalog' | 'movie' | 'area';
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const ports = { shell: 4100, catalog: 4101, movie: 4102, area: 4103 } as const;

export function createAppConfig(application: ApplicationName) {
  const root = resolve(repositoryRoot, 'apps', application);
  return defineConfig(({ mode }) => ({
    root,
    envDir: repositoryRoot,
    plugins: [
      react(),
      federation({
        name: application,
        filename: 'remoteEntry.js',
        manifest: true,
        dts: false,
        shareStrategy: 'loaded-first',
        exposes:
          application === 'shell'
            ? {}
            : {
                './App': './src/App.tsx',
                ...(application === 'area'
                  ? { './FavoritesCounter': './src/FavoritesCounter.tsx' }
                  : {}),
              },
        shared: {
          react: { singleton: true, requiredVersion: '19.3.0' },
          'react/': { singleton: true, requiredVersion: '19.3.0' },
          'react-dom': { singleton: true, requiredVersion: '19.3.0' },
          'react-dom/': { singleton: true, requiredVersion: '19.3.0' },
          'react-router-dom': { singleton: true, requiredVersion: '7.18.4' },
          'react-router': { singleton: true, requiredVersion: '7.18.4' },
          'styled-components': { singleton: true, requiredVersion: '6.5.3' },
        },
      }),
      ...(application === 'shell' ? [runtimeConfigPlugin(repositoryRoot, mode)] : []),
    ],
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'styled-components'],
      alias: [
        { find: /^@nexo\/ui$/, replacement: resolve(repositoryRoot, 'packages/ui/src/index.tsx') },
        {
          find: /^@nexo\/http$/,
          replacement: resolve(repositoryRoot, 'packages/http/src/index.ts'),
        },
        {
          find: /^@nexo\/contracts$/,
          replacement: resolve(repositoryRoot, 'packages/contracts/src/index.ts'),
        },
      ],
    },
    server: {
      host: '127.0.0.1',
      port: ports[application],
      strictPort: true,
      origin: `http://127.0.0.1:${ports[application]}`,
      cors: true,
      fs: { allow: [repositoryRoot] },
    },
    preview: { host: '127.0.0.1', port: ports[application], strictPort: true, cors: true },
    build: {
      target: 'es2022',
      outDir: resolve(repositoryRoot, 'dist', application),
      emptyOutDir: true,
    },
  }));
}
