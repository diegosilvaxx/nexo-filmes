import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingState } from '../src/RecoveryBoundary';

const meta = {
  title: 'Estados/Carregamento',
  component: LoadingState,
  parameters: {
    docs: {
      description: {
        component: 'Mensagem de progresso com região viva educada para leitores de tela.',
      },
    },
  },
  args: { label: 'Carregando filmes…' },
} satisfies Meta<typeof LoadingState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Catalogo: Story = {};
export const Favoritos: Story = { args: { label: 'Carregando favoritos…' } };
export const Salvamento: Story = { args: { label: 'Salvando alterações…' } };
