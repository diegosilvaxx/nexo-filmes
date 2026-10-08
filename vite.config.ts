import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => ({
  plugins: [react()],
  envDir: repositoryRoot,
  resolve: {
    dedupe: ['react', 'react-dom', 'styled-components'],
    alias: [
      { find: /^@nexo\/ui$/, replacement: resolve(repositoryRoot, 'packages/ui/src/index.tsx') },
      { find: /^@nexo\/http$/, replacement: resolve(repositoryRoot, 'packages/http/src/index.ts') },
      {
        find: /^@nexo\/contracts$/,
        replacement: resolve(repositoryRoot, 'packages/contracts/src/index.ts'),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    strictPort: true,
    fs: { allow: [repositoryRoot] },
  },
  preview: { host: '127.0.0.1', strictPort: true },
  build: {
    target: 'es2022',
    outDir: resolve(repositoryRoot, 'dist', basename(process.cwd())),
    emptyOutDir: command === 'build',
  },
}));
