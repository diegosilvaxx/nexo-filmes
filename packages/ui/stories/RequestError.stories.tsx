import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RequestError } from '../src/RequestError';

const meta = {
  title: 'Estados/Erro de requisição',
  component: RequestError,
  parameters: {
    docs: {
      description: {
        component:
          'Mensagem de erro com nova tentativa. Quando há Retry-After, o botão aguarda o prazo informado pelo servidor.',
      },
    },
  },
  args: { message: 'Não foi possível carregar os filmes. Tente novamente.', onRetry: fn() },
  argTypes: { onRetry: { control: false }, retryAt: { control: false } },
} satisfies Meta<typeof RequestError>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Indisponibilidade: Story = {};
export const LimiteDeRequisicoes: Story = {
  args: { message: 'Muitas consultas. Aguarde antes de tentar novamente.' },
  loaders: [() => ({ retryAt: Date.now() + 5_000 })],
  render: (args, { loaded }) => <RequestError {...args} retryAt={loaded.retryAt} />,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', { name: 'Tentar novamente' }),
    ).toBeDisabled();
  },
};
export const NovaTentativa: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('alert')).toHaveTextContent(args.message);
    await userEvent.click(canvas.getByRole('button', { name: 'Tentar novamente' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
