import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SiteLayout } from '../src/SiteLayout';
import { NavigationLink, FavoriteCount } from '../src/application.styles';
import { Intro, MovieGrid, PageHeading, SectionHeader } from '../src/movie.styles';
import { MovieCard } from '../src/MovieCard';
import { movie } from './movie';

const meta = {
  title: 'Navegação/Layout do portal',
  component: SiteLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cabeçalho, menu, atalho para o conteúdo e rodapé. Os exemplos utilizam conteúdo e contador locais, sem carregar remotes.',
      },
    },
  },
  args: {
    navigation: [
      { to: '/filmes', label: 'Filmes' },
      { to: '/painel', label: 'Painel' },
    ],
    headerSlot: (
      <NavigationLink to="/favoritos">
        Favoritos<FavoriteCount aria-label="2 favoritos">2</FavoriteCount>
      </NavigationLink>
    ),
    children: (
      <>
        <SectionHeader>
          <PageHeading>Encontre seu próximo filme.</PageHeading>
          <Intro>Explore o catálogo e guarde os filmes que quer assistir.</Intro>
        </SectionHeader>
        <MovieGrid>
          {[movie, { ...movie, id: 551, title: 'Um novo encontro', posterUrl: null }].map(
            (item) => (
              <MovieCard
                key={item.id}
                movie={item}
                favorite={item.id === 550}
                pending={false}
                onToggle={() => undefined}
              />
            ),
          )}
        </MovieGrid>
      </>
    ),
  },
  argTypes: { children: { control: false }, headerSlot: { control: false } },
} satisfies Meta<typeof SiteLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Desktop: Story = {};
export const Celular: Story = { globals: { viewport: { value: 'mobile', isRotated: false } } };
export const Teclado: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skipLink = canvas.getByRole('link', { name: 'Ir para o conteúdo' });
    await expect(skipLink).toHaveAttribute('href', '#content');
    skipLink.focus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Nexo Filmes, início' })).toHaveFocus();
    await expect(canvas.getByRole('link', { name: 'Favoritos 2 favoritos' })).toHaveAttribute(
      'href',
      '/favoritos',
    );
  },
};
