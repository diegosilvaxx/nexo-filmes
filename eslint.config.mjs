import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    '**/__mf__virtual/**',
    'node_modules/**',
    'dist/**',
    'coverage/**',
    'storybook-static/**',
    'playwright-report/**',
    'test-results/**',
    'playwright-report-docker/**',
    'test-results-docker/**',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['**/*.tsx'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
]);
