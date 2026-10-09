import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MoviesApiError } from '@nexo/movies';
import { UIProvider } from '@nexo/ui';
import { rawGenres, summary } from '../../../tests/movie-fixtures';
import { App } from './App';
const mocks = vi.hoisted(() => ({ genres: vi.fn(), movies: vi.fn(), toggleFavorite: vi.fn() }));
vi.mock('@nexo/movies', async (original) => ({
  ...(await original<typeof import('@nexo/movies')>()),
  createMoviesApi: () => ({ genres: mocks.genres, movies: mocks.movies }),
}));
vi.mock('@nexo/user-data', () => ({
  useFavorites: () => ({
    status: 'ready',
    favorites: [],
    pendingIds: [],
    error: null,
    toggleFavorite: mocks.toggleFavorite,
  }),
}));
const results = { items: [summary], page: 1, totalPages: 3, totalItems: 60 };
function Location() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>Voltar</button>
    </>
  );
}
function mount(path = '/filmes') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <UIProvider>
        <App />
        <Location />
      </UIProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  mocks.genres.mockReset().mockResolvedValue(rawGenres.genres);
  mocks.movies.mockReset().mockResolvedValue(results);
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  vi.useRealTimers();
});
it('exibe dados normalizados, navega pelo gênero e paginação com foco no título', async () => {
  const user = userEvent.setup();
  mount();
  expect(await screen.findByRole('link', { name: /Clube da Luta/ })).toHaveAttribute(
    'href',
    '/filme/550',
  );
  await user.selectOptions(screen.getByLabelText('Gênero'), '18');
  await screen.findByRole('link', { name: /Clube da Luta/ });
  await user.selectOptions(screen.getByLabelText('Ordenar por'), 'rating');
  await screen.findByRole('link', { name: /Clube da Luta/ });
  await user.click(screen.getByRole('button', { name: 'Próxima' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/filmes?page=2&genreId=18&sort=rating');
  expect(screen.getByRole('heading', { name: 'Encontre seu próximo filme.' })).toHaveFocus();
  await waitFor(() =>
    expect(mocks.movies).toHaveBeenLastCalledWith(
      { page: 2, genreId: 18, search: '', sort: 'rating' },
      expect.any(AbortSignal),
    ),
  );
  await user.click(screen.getByRole('button', { name: 'Voltar' }));
  expect(screen.getByTestId('url')).toHaveTextContent('/filmes?genreId=18&sort=rating');
});
it('espera 400ms após a última tecla e reinicia filtros e página ao buscar', async () => {
  mount('/filmes?page=2&genreId=18&sort=rating');
  await screen.findByText('Clube da Luta');
  vi.useFakeTimers();
  const input = screen.getByRole('searchbox');
  fireEvent.change(input, { target: { value: 'Mat' } });
  await act(() => vi.advanceTimersByTimeAsync(300));
  fireEvent.change(input, { target: { value: 'Matrix' } });
  await act(() => vi.advanceTimersByTimeAsync(399));
  expect(mocks.movies).toHaveBeenCalledTimes(1);
  await act(() => vi.advanceTimersByTimeAsync(1));
  expect(screen.getByTestId('url')).toHaveTextContent('/filmes?search=Matrix');
  expect(screen.getByLabelText('Gênero')).toBeDisabled();
  expect(screen.getByLabelText('Ordenar por')).toBeDisabled();
  expect(mocks.movies).toHaveBeenLastCalledWith(
    { page: 1, search: 'Matrix', sort: 'popular' },
    expect.any(AbortSignal),
  );
});
it('ignora resposta antiga quando a consulta muda e cancela a requisição anterior', async () => {
  let complete!: (value: typeof results) => void;
  mocks.movies
    .mockReturnValueOnce(
      new Promise<typeof results>((resolve) => {
        complete = resolve;
      }),
    )
    .mockResolvedValue({ ...results, items: [{ ...summary, id: 1, title: 'Outro filme' }] });
  mount();
  await waitFor(() => expect(mocks.movies).toHaveBeenCalledTimes(1));
  const signal = mocks.movies.mock.calls[0]?.[1] as AbortSignal;
  await userEvent.setup().selectOptions(screen.getByLabelText('Gênero'), '18');
  expect(await screen.findByText('Outro filme')).toBeVisible();
  expect(signal.aborted).toBe(true);
  await act(async () => {
    complete(results);
  });
  expect(screen.queryByText('Clube da Luta')).not.toBeInTheDocument();
});
it('normaliza gênero desconhecido antes da consulta e preserva parâmetros externos', async () => {
  mount('/filmes?page=2&genreId=999&sort=title&source=link');
  await screen.findByText('Clube da Luta');
  expect(screen.getByTestId('url')).toHaveTextContent('/filmes?source=link&sort=title');
  expect(mocks.movies).toHaveBeenCalledTimes(1);
  expect(mocks.movies).toHaveBeenCalledWith(
    { page: 1, search: '', sort: 'title' },
    expect.any(AbortSignal),
  );
});
it('permite limpar busca sem resultados e favoritar pelo contrato do filme', async () => {
  mocks.movies.mockResolvedValueOnce({ ...results, items: [], totalPages: 0, totalItems: 0 });
  mount('/filmes?search=Inexistente');
  const user = userEvent.setup();
  expect(await screen.findByText(/Nenhum filme encontrado/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
  await screen.findByText('Clube da Luta');
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.getByLabelText('Gênero')).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Favoritar: Clube da Luta' }));
  expect(mocks.toggleFavorite).toHaveBeenCalledWith(summary);
});
it('apresenta 429, respeita Retry-After e repete apenas por ação do usuário', async () => {
  mocks.movies.mockRejectedValueOnce(
    new MoviesApiError('RATE_LIMITED', 429, 'Limite de requisições atingido.', 2),
  );
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Limite de requisições atingido.');
  const retry = screen.getByRole('button', { name: 'Tentar novamente' });
  expect(retry).toBeDisabled();
  await waitFor(() => expect(retry).toBeEnabled(), { timeout: 3500 });
  expect(mocks.movies).toHaveBeenCalledTimes(1);
  await userEvent.setup().click(retry);
  await screen.findByText('Clube da Luta');
  expect(mocks.movies).toHaveBeenCalledTimes(2);
});
