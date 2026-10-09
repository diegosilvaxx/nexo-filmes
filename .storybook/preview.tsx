import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { themes } from 'storybook/theming';
import { UIProvider } from '../packages/ui/src/UIProvider';

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <UIProvider>
        <MemoryRouter initialEntries={[context.parameters.initialPath ?? '/filmes']}>
          <Story />
        </MemoryRouter>
      </UIProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: { theme: themes.dark },
    a11y: { test: 'error' },
    controls: { expanded: true },
    backgrounds: { disable: true },
    viewport: {
      options: {
        mobile: {
          name: 'Celular · 360 px',
          styles: { width: '360px', height: '800px' },
          type: 'mobile',
        },
        desktop: {
          name: 'Desktop · 1440 px',
          styles: { width: '1440px', height: '900px' },
          type: 'desktop',
        },
      },
    },
    options: { storySort: { order: ['Componentes', 'Estados', 'Navegação', 'Filme'] } },
  },
};
export default preview;
