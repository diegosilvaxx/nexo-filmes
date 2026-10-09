import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { createFavoritesStore, createReviewsStore } from '@nexo/user-data';
import { UIProvider } from '@nexo/ui';
import type { Review } from '@nexo/contracts';
import { summary } from '../../../tests/movie-fixtures';
import { App } from './App';

const savedReviews: Review[] = [
  { movieId: 550, rating: 8, comment: '' },
  { movieId: 999, rating: 8.5, comment: '' },
];
const mocks = vi.hoisted(() => ({
  favorites: null as ReturnType<typeof createFavoritesStore> | null,
  reviews: null as ReturnType<typeof createReviewsStore> | null,
  listFavorites: vi.fn(),
  setFavorite: vi.fn(),
  listReviews: vi.fn(),
  saveReview: vi.fn(),
  deleteReview: vi.fn(),
}));
vi.mock('@nexo/user-data', async (original) => {
  const React = await import('react');
  return {
    ...(await original<typeof import('@nexo/user-data')>()),
    useFavorites: () => {
      const store = mocks.favorites!;
      const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
      React.useEffect(() => {
        void store.initialize();
      }, [store]);
      return { ...state, retry: store.refresh };
    },
    useReviews: () => {
      const store = mocks.reviews!;
      const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
      React.useEffect(() => {
        void store.initialize();
      }, [store]);
      return { ...state, retry: store.refresh };
    },
  };
});
beforeEach(() => {
  mocks.listFavorites.mockReset().mockResolvedValue([summary]);
  mocks.setFavorite.mockReset().mockResolvedValue(undefined);
  mocks.listReviews.mockReset().mockResolvedValue(savedReviews);
  mocks.saveReview.mockReset().mockResolvedValue(undefined);
  mocks.deleteReview.mockReset().mockResolvedValue(undefined);
  mocks.favorites = createFavoritesStore({
    listFavorites: mocks.listFavorites,
    setFavorite: mocks.setFavorite,
  });
  mocks.reviews = createReviewsStore({
    listReviews: mocks.listReviews,
    saveReview: mocks.saveReview,
    deleteReview: mocks.deleteReview,
  });
});
function mount(standalone = false) {
  render(
    <MemoryRouter initialEntries={['/painel']}>
      <UIProvider>
        <App standalone={standalone} />
      </UIProvider>
    </MemoryRouter>,
  );
}
function metric(label: string) {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
it('abre pelo App, exibe totais independentes e formata a média com uma casa decimal', async () => {
  mount();
  await waitFor(() => expect(metric('Nota média')).toHaveTextContent(/^8,3/));
  expect(metric('Favoritos')).toHaveTextContent(/^1/);
  expect(metric('Filmes avaliados')).toHaveTextContent(/^2/);
  expect(metric('Gênero mais frequente')).toHaveTextContent(/^Drama/);
  expect(document.title).toBe('Painel · Nexo Filmes');
  expect(screen.getByRole('link', { name: 'Ver favoritos' })).toHaveAttribute('href', '/favoritos');
  expect(screen.getByRole('link', { name: 'Explorar filmes' })).toHaveAttribute('href', '/filmes');
});
it('mostra estados vazios sem inventar média ou gênero e resolve links no remote independente', async () => {
  mocks.listFavorites.mockResolvedValue([]);
  mocks.listReviews.mockResolvedValue([]);
  mount(true);
  expect(await screen.findByText(/Salve seus filmes favoritos/)).toBeVisible();
  expect(metric('Favoritos')).toHaveTextContent(/^0/);
  expect(metric('Filmes avaliados')).toHaveTextContent(/^0/);
  expect(metric('Nota média')).toHaveTextContent(/^—/);
  expect(metric('Gênero mais frequente')).toHaveTextContent(/^—/);
  expect(screen.getByRole('link', { name: 'Explorar filmes' })).toHaveAttribute(
    'href',
    'http://127.0.0.1:4100/filmes',
  );
});
it('mostra carregamento por recurso sem apresentar zero como um total já carregado', async () => {
  const loading = deferred<(typeof summary)[]>();
  mocks.listFavorites.mockReturnValue(loading.promise);
  mount();
  expect(screen.getByText('Carregando estatísticas dos favoritos…')).toBeVisible();
  expect(metric('Favoritos')).toHaveTextContent(/^…/);
  await waitFor(() => expect(metric('Nota média')).toHaveTextContent(/^8,3/));
  await act(async () => {
    loading.resolve([summary]);
  });
  expect(metric('Favoritos')).toHaveTextContent(/^1/);
});
it.each(['favorites', 'reviews'] as const)(
  'isola falha de leitura de %s e recupera pelo botão de nova tentativa',
  async (resource) => {
    const failed = resource === 'favorites' ? mocks.listFavorites : mocks.listReviews;
    failed.mockRejectedValueOnce(new Error('blocked'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    expect(metric(resource === 'favorites' ? 'Favoritos' : 'Nota média')).toHaveTextContent(
      /^Indisponível/,
    );
    await waitFor(() =>
      expect(metric(resource === 'favorites' ? 'Nota média' : 'Favoritos')).toHaveTextContent(
        resource === 'favorites' ? /^8,3/ : /^1/,
      ),
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(metric('Nota média')).toHaveTextContent(/^8,3/));
    expect(metric('Favoritos')).toHaveTextContent(/^1/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);
it('acompanha alterações otimistas, reverte favorito que falha e atualiza avaliações sem recarregar', async () => {
  const favoriteWrite = deferred<void>();
  const reviewWrite = deferred<Review>();
  mocks.setFavorite.mockReturnValue(favoriteWrite.promise);
  mocks.saveReview.mockReturnValue(reviewWrite.promise);
  mount();
  await waitFor(() => expect(metric('Nota média')).toHaveTextContent(/^8,3/));
  let favoriteOperation!: Promise<boolean>;
  let reviewOperation!: Promise<boolean>;
  await act(async () => {
    favoriteOperation = mocks.favorites!.toggleFavorite(summary);
    reviewOperation = mocks.reviews!.saveReview(550, { rating: 9.5, comment: '' });
  });
  expect(metric('Favoritos')).toHaveTextContent(/^0/);
  expect(metric('Gênero mais frequente')).toHaveTextContent(/^—/);
  expect(metric('Filmes avaliados')).toHaveTextContent(/^2/);
  expect(metric('Nota média')).toHaveTextContent(/^9,0/);
  expect(screen.getByText('Salvando alterações…')).toBeVisible();
  await act(async () => {
    favoriteWrite.reject(new Error('failure'));
    reviewWrite.resolve({ movieId: 550, rating: 9.5, comment: '' });
    await Promise.all([favoriteOperation, reviewOperation]);
  });
  expect(metric('Favoritos')).toHaveTextContent(/^1/);
  expect(metric('Gênero mais frequente')).toHaveTextContent(/^Drama/);
  expect(metric('Nota média')).toHaveTextContent(/^9,0/);
  expect(screen.getByRole('alert')).toHaveTextContent('A alteração foi desfeita');
  expect(screen.queryByText('Salvando alterações…')).not.toBeInTheDocument();
  await act(() => mocks.reviews!.deleteReview(550));
  expect(metric('Filmes avaliados')).toHaveTextContent(/^1/);
  expect(metric('Nota média')).toHaveTextContent(/^8,5/);
  expect(metric('Favoritos')).toHaveTextContent(/^1/);
});
it('informa ausência de gêneros sem descartar o total de favoritos', async () => {
  mocks.listFavorites.mockResolvedValue([{ ...summary, genres: [] }]);
  mount();
  expect(await screen.findByText(/ainda não têm gêneros informados/)).toBeVisible();
  expect(metric('Favoritos')).toHaveTextContent(/^1/);
  expect(metric('Gênero mais frequente')).toHaveTextContent(/^—/);
});
