import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    pool: 'threads',
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['apps/**/*.test.{ts,tsx}', 'packages/**/*.test.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['packages/*/src/**/*.{ts,tsx}', 'apps/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/main.tsx', '**/vite-env.d.ts'],
      thresholds: {
        'apps/movie/src/ReviewForm.tsx': { lines: 70 },
        'packages/user-data/src/**': { lines: 70 },
        'apps/catalog/src/query.ts': { lines: 70 },
        'packages/tmdb/src/**': { lines: 70 },
        'packages/movies/src/**': { lines: 70 },
      },
    },
  },
  resolve: {
    alias: {
      '@nexo/user-data': fileURLToPath(
        new URL('./packages/user-data/src/index.ts', import.meta.url),
      ),
      '@nexo/movies': fileURLToPath(new URL('./packages/movies/src/index.ts', import.meta.url)),
      '@nexo/tmdb': fileURLToPath(new URL('./packages/tmdb/src/index.ts', import.meta.url)),
      '@nexo/ui': fileURLToPath(new URL('./packages/ui/src/index.tsx', import.meta.url)),
      '@nexo/http': fileURLToPath(new URL('./packages/http/src/index.ts', import.meta.url)),
      '@nexo/contracts': fileURLToPath(
        new URL('./packages/contracts/src/index.ts', import.meta.url),
      ),
    },
  },
});
