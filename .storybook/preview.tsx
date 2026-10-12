import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { themes } from 'storybook/theming';
import { UIProvider } from '../packages/ui/src/UIProvider';

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Tema do portal',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Escuro' },
          { value: 'light', title: 'Claro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark' },
  decorators: [
    (Story, context) => (
      <UIProvider
        key={context.globals.theme}
        initialMode={context.globals.theme === 'light' ? 'light' : 'dark'}
      >
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
