import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { MoviesApiError } from '@nexo/movies';
import { UIProvider } from '@nexo/ui';
import { detail } from '../../../tests/movie-fixtures';
import { App } from './App';
const mocks = vi.hoisted(() => ({
  movie: vi.fn(),
  toggle: vi.fn(),
  reviews: vi.fn(),
  retry: vi.fn(),
}));
vi.mock('@nexo/movies', async (original) => ({
  ...(await original<typeof import('@nexo/movies')>()),
  createMoviesApi: () => ({ movie: mocks.movie }),
}));
vi.mock('@nexo/user-data', () => ({
  useFavorites: () => ({
    status: 'ready',
    favorites: [],
    pendingIds: [],
    error: null,
    toggleFavorite: mocks.toggle,
  }),
  useReviews: mocks.reviews,
}));
beforeEach(() => {
  mocks.movie.mockReset().mockResolvedValue(detail);
  mocks.reviews.mockReset().mockReturnValue({
    status: 'ready',
    reviews: [],
    pendingIds: [],
    error: null,
    saveReview: vi.fn(),
    deleteReview: vi.fn(),
    retry: mocks.retry,
  });
});
function Navigation() {
  const go = useNavigate();
  return <button onClick={() => go('/filme/1')}>Outro filme</button>;
}
function mount(path = '/filme/550') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <UIProvider>
        <Routes>
          <Route path="/filme/:id" element={<App />} />
        </Routes>
        <Navigation />
      </UIProvider>
    </MemoryRouter>,
  );
}
it('mostra todos os dados normalizados e permite favoritar no detalhe', async () => {
  mount();
  expect(await screen.findByRole('heading', { name: 'Clube da Luta' })).toBeVisible();
  expect(screen.getByRole('img', { name: 'Pôster de Clube da Luta' })).toHaveAttribute(
    'src',
    detail.posterUrl,
  );
  for (const text of [
    '1999',
    '139 min',
    'TMDB · 8,4/10',
    'Uma sinopse.',
    'David Fincher',
    'Brad Pitt',
    'Tyler',
    'Edward Norton',
    'Narrador',
  ])
    expect(screen.getByText(text)).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Sua avaliação' })).toBeVisible();
  expect(document.title).toBe('Clube da Luta · Nexo Filmes');
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Adicionar Clube da Luta aos favoritos' }));
  expect(mocks.toggle).toHaveBeenCalledWith(detail);
});
it.each(['/filme/abc', '/filme/0', '/filme/9007199254740992'])(
  'rejeita ID inválido antes de consultar: %s',
  (path) => {
    mount(path);
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
    expect(mocks.movie).not.toHaveBeenCalled();
  },
);
it('mostra 404 quando o filme não existe', async () => {
  mocks.movie.mockRejectedValue(new MoviesApiError('NOT_FOUND', 404, 'Filme não encontrado.'));
  mount();
  expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
});
it('permite repetir falha de serviço sem perder a navegação', async () => {
  mocks.movie.mockRejectedValueOnce(
    new MoviesApiError('UPSTREAM_TIMEOUT', 504, 'O serviço demorou para responder.'),
  );
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('O serviço demorou');
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('heading', { name: 'Clube da Luta' })).toBeVisible();
  expect(mocks.movie).toHaveBeenCalledTimes(2);
});
it('ignora resposta antiga ao navegar para outro filme e cancela a chamada', async () => {
  let complete!: (value: typeof detail) => void;
  mocks.movie
    .mockReturnValueOnce(
      new Promise<typeof detail>((resolve) => {
        complete = resolve;
      }),
    )
    .mockResolvedValue({ ...detail, id: 1, title: 'Outro título' });
  mount();
  await waitFor(() => expect(mocks.movie).toHaveBeenCalledTimes(1));
  const signal = mocks.movie.mock.calls[0]?.[1] as AbortSignal;
  await userEvent.setup().click(screen.getByRole('button', { name: 'Outro filme' }));
  expect(await screen.findByRole('heading', { name: 'Outro título' })).toBeVisible();
  expect(signal.aborted).toBe(true);
  await act(async () => {
    complete(detail);
  });
  expect(screen.queryByRole('heading', { name: 'Clube da Luta' })).not.toBeInTheDocument();
});
it('apresenta estados vazios e isola falha na leitura das avaliações', async () => {
  mocks.movie.mockResolvedValue({
    ...detail,
    posterUrl: null,
    synopsis: '',
    year: null,
    runtime: null,
    genres: [],
    directors: [],
    cast: [],
  });
  mocks.reviews.mockReturnValue({
    status: 'error',
    reviews: [],
    pendingIds: [],
    error: 'Não foi possível carregar as avaliações.',
    retry: mocks.retry,
  });
  mount();
  await screen.findByRole('heading', { name: 'Clube da Luta' });
  for (const text of [
    'Sem pôster',
    'Ano não informado',
    'Duração não informada',
    'Gênero não informado',
    'Sinopse não disponível.',
    'Direção não informada.',
    'Elenco não disponível.',
  ])
    expect(screen.getByText(text)).toBeVisible();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(mocks.retry).toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: 'Adicionar Clube da Luta aos favoritos' }),
  ).toBeEnabled();
});
it('permite abrir o elenco completo sem ocultar a avaliação', async () => {
  mocks.movie.mockResolvedValue({
    ...detail,
    cast: Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      name: `Ator ${index + 1}`,
      character: '',
    })),
  });
  mount();
  await screen.findByRole('heading', { name: 'Clube da Luta' });
  expect(screen.getByText('Ator 6')).toBeVisible();
  expect(screen.getByText('Ator 7')).not.toBeVisible();
  await userEvent.setup().click(screen.getByText('Ver elenco completo (8)'));
  expect(screen.getByText('Ator 7')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Sua avaliação' })).toBeVisible();
});
