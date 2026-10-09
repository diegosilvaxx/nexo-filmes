import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState, type ComponentProps } from 'react';
import styled from 'styled-components';
import { FavoriteToggle } from '../src/FavoriteToggle';

const Frame = styled.div`
  width: min(100%, 220px);
`;
function ToggleDemo(args: ComponentProps<typeof FavoriteToggle>) {
  const [favorite, setFavorite] = useState(args.favorite);
  return (
    <FavoriteToggle
      {...args}
      favorite={favorite}
      onToggle={() => {
        args.onToggle();
        setFavorite((current) => !current);
      }}
    />
  );
}
const meta = {
  title: 'Componentes/Botão de favorito',
  component: FavoriteToggle,
  decorators: [
    (Story) => (
      <Frame>
        <Story />
      </Frame>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Alternância com aria-pressed, nome acessível específico do filme e bloqueio durante a gravação.',
      },
    },
  },
  args: {
    title: 'Clube da Luta',
    favorite: false,
    pending: false,
    disabled: false,
    onToggle: fn(),
  },
  argTypes: { onToggle: { control: false } },
} satisfies Meta<typeof FavoriteToggle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Favoritado: Story = { args: { favorite: true } };
export const Salvando: Story = { args: { favorite: true, pending: true } };
export const Indisponivel: Story = { args: { disabled: true } };
export const Alternancia: Story = {
  render: (args) => <ToggleDemo key={String(args.favorite)} {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onToggle).toHaveBeenCalledTimes(2);
  },
};
