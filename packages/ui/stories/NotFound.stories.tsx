import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { NotFound } from '../src/NotFound';

const meta = {
  title: 'Navegação/Página não encontrada',
  component: NotFound,
  parameters: {
    docs: {
      description: {
        component:
          'Página 404 com link de retorno configurável para o portal e para a entrada independente do filme.',
      },
    },
  },
} satisfies Meta<typeof NotFound>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Portal: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('link', { name: 'Voltar ao início' }),
    ).toHaveAttribute('href', '/filmes');
  },
};
export const FilmeIndependente: Story = { args: { homePath: '/filme/550' } };
