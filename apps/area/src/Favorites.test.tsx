import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { createFavoritesStore, createReviewsStore } from '@nexo/user-data';
import { UIProvider } from '@nexo/ui';
import { summary } from '../../../tests/movie-fixtures';
import { Favorites } from './Favorites';
import { FavoritesCounter } from './FavoritesCounter';

const mocks = vi.hoisted(() => ({
  store: null as ReturnType<typeof createFavoritesStore> | null,
  list: vi.fn(),
  write: vi.fn(),
  reviewStore: null as ReturnType<typeof createReviewsStore> | null,
  reviewList: vi.fn(),
  reviewWrite: vi.fn(),
}));
vi.mock('@nexo/user-data', async (original) => {
  const React = await import('react');
  return {
    ...(await original<typeof import('@nexo/user-data')>()),
    useFavorites: () => {
      const store = mocks.store!;
      const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
      React.useEffect(() => {
        void store.initialize();
      }, [store]);
      return { ...state, toggleFavorite: store.toggleFavorite, retry: store.refresh };
    },
    useReviews: () => {
      const store = mocks.reviewStore!;
      const state = React.useSyncExternalStore(store.subscribe, store.getSnapshot);
      React.useEffect(() => {
        void store.initialize();
      }, [store]);
      return {
        ...state,
        saveReview: store.saveReview,
        deleteReview: store.deleteReview,
        retry: store.refresh,
      };
    },
  };
});
beforeEach(() => {
  mocks.list.mockReset().mockResolvedValue([summary]);
  mocks.write.mockReset().mockResolvedValue(undefined);
  mocks.store = createFavoritesStore({ listFavorites: mocks.list, setFavorite: mocks.write });
  mocks.reviewList.mockReset().mockResolvedValue([]);
  mocks.reviewWrite.mockReset().mockResolvedValue(undefined);
  mocks.reviewStore = createReviewsStore({
    listReviews: mocks.reviewList,
    saveReview: mocks.reviewWrite,
    deleteReview: vi.fn(),
  });
});
it('atualiza nota pessoal imediatamente e restaura a nota anterior se a gravação falhar', async () => {
  let reject!: (reason: Error) => void;
  mocks.reviewWrite.mockReturnValue(
    new Promise((_, no) => {
      reject = no;
    }),
  );
  mount();
  expect(await screen.findByText('Sem avaliação')).toBeVisible();
  let operation!: Promise<boolean>;
  await act(async () => {
    operation = mocks.reviewStore!.saveReview(550, { rating: 8.5, comment: 'Bom' });
  });
  expect(screen.getByText(/Sua nota: 8,5/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Favoritos 1 favoritos' })).toBeVisible();
  await act(async () => {
    reject(new Error('failure'));
    await operation;
  });
  expect(screen.getByText('Sem avaliação')).toBeVisible();
});
it('mantém os favoritos disponíveis quando as notas falham e permite tentar a leitura novamente', async () => {
  mocks.reviewList
    .mockRejectedValueOnce(new Error('blocked'))
    .mockResolvedValue([{ movieId: 550, rating: 9, comment: '' }]);
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar as avaliações.',
  );
  expect(screen.getByRole('button', { name: 'Remover Clube da Luta dos favoritos' })).toBeEnabled();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByText('Sua nota: 9,0')).toBeVisible();
});
function mount() {
  render(
    <MemoryRouter>
      <UIProvider>
        <FavoritesCounter />
        <Favorites />
      </UIProvider>
    </MemoryRouter>,
  );
}
it('compartilha o estado da lista e contador e remove imediatamente durante a gravação', async () => {
  let resolve!: () => void;
  mocks.write.mockReturnValue(
    new Promise<void>((done) => {
      resolve = done;
    }),
  );
  mount();
  expect(
    await screen.findByRole('button', { name: 'Remover Clube da Luta dos favoritos' }),
  ).toBeEnabled();
  expect(screen.getByRole('link', { name: 'Favoritos 1 favoritos' })).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Remover Clube da Luta dos favoritos' }));
  expect(screen.getByRole('link', { name: 'Favoritos 0 favoritos' })).toBeVisible();
  expect(screen.queryByText('Clube da Luta')).not.toBeInTheDocument();
  expect(screen.getByText('Salvando favoritos…')).toBeVisible();
  await act(async () => {
    resolve();
  });
  expect(screen.queryByText('Salvando favoritos…')).not.toBeInTheDocument();
});
it('restaura filme e contador e mostra erro quando a remoção falha', async () => {
  mocks.write.mockRejectedValue(new Error('failure'));
  mount();
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'Remover Clube da Luta dos favoritos' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('A alteração foi desfeita.');
  expect(screen.getByRole('link', { name: 'Favoritos 1 favoritos' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Remover Clube da Luta dos favoritos' })).toBeEnabled();
});
it('recupera falha de leitura pelo botão de nova tentativa sem apagar dados', async () => {
  mocks.list.mockRejectedValueOnce(new Error('blocked')).mockResolvedValue([]);
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar os favoritos.',
  );
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('link', { name: 'Explorar filmes' })).toHaveAttribute(
    'href',
    '/filmes',
  );
  expect(screen.getByRole('link', { name: 'Favoritos 0 favoritos' })).toBeVisible();
});
