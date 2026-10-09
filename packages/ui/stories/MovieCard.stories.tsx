import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import styled from 'styled-components';
import { MovieCard } from '../src/MovieCard';
import { movie } from './movie';

const Frame = styled.div`
  width: min(100%, 220px);
`;
const meta = {
  title: 'Componentes/Card de filme',
  component: MovieCard,
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
          'Filme normalizado, favorito e nota pessoal. O link abre o detalhe; o botão comunica a intenção de favoritar ao componente responsável pelo estado.',
      },
    },
  },
  args: { movie, favorite: false, pending: false, onToggle: fn() },
  argTypes: { onToggle: { control: false }, detailsPath: { control: 'text' } },
} satisfies Meta<typeof MovieCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Favoritado: Story = { args: { favorite: true } };
export const Salvando: Story = { args: { favorite: true, pending: true } };
export const SemPoster: Story = { args: { movie: { ...movie, posterUrl: null } } };
export const InformacoesAusentes: Story = {
  args: { movie: { ...movie, year: null, genres: [], posterUrl: null } },
};
export const TituloLongo: Story = {
  args: {
    movie: { ...movie, title: 'Uma história de encontros e escolhas que atravessam o tempo' },
  },
};
export const ComNotaPessoal: Story = { args: { favorite: true, personalRating: 9.5 } };
export const SemAvaliacao: Story = { args: { favorite: true, personalRating: null } };
export const SalvandoNota: Story = {
  args: { favorite: true, personalRating: 8.5, ratingPending: true },
};
export const AcaoDeFavoritar: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: /Clube da Luta/ })).toHaveAttribute(
      'href',
      '/filme/550',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Favoritar: Clube da Luta' }));
    await expect(args.onToggle).toHaveBeenCalledOnce();
  },
};
