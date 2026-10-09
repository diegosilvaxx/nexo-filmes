import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
export default defineConfig({
  resolve: {
    alias: {
      '@nexo/tmdb': resolve(repositoryRoot, 'packages/tmdb/src/index.ts'),
      '@nexo/contracts': resolve(repositoryRoot, 'packages/contracts/src/index.ts'),
    },
  },
  ssr: { noExternal: ['@nexo/tmdb', '@nexo/contracts'] },
  build: {
    ssr: './src/main.ts',
    target: 'node22',
    outDir: resolve(repositoryRoot, 'dist/bff'),
    emptyOutDir: true,
    rollupOptions: { output: { entryFileNames: 'server.js' } },
  },
});
