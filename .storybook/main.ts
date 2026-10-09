import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../packages/ui/stories/**/*.stories.tsx', '../apps/movie/src/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  docs: { defaultName: 'Documentação' },
  core: { disableTelemetry: true },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      envDir: fileURLToPath(new URL('.', import.meta.url)),
      optimizeDeps: { include: ['storybook/theming'] },
      server: {
        watch: {
          ignored: [
            '**/coverage/**',
            '**/playwright-report/**',
            '**/test-results/**',
            '**/dist/**',
            '**/storybook-static/**',
          ],
        },
      },
      resolve: {
        dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'styled-components'],
        alias: {
          '@nexo/contracts': fileURLToPath(
            new URL('../packages/contracts/src/index.ts', import.meta.url),
          ),
          '@nexo/ui': fileURLToPath(new URL('../packages/ui/src/index.tsx', import.meta.url)),
        },
      },
    });
  },
};
export default config;
