import { USER_DATA_CHANGED, type MovieSummary, type UserDataChangedEvent } from '@nexo/contracts';
import type { FavoritesRepository } from './repository';

export interface FavoritesSnapshot {
  status: 'idle' | 'loading' | 'ready' | 'error';
  favorites: readonly MovieSummary[];
  pendingIds: readonly number[];
  error: string | null;
}
export const emptyFavorites: FavoritesSnapshot = {
  status: 'idle',
  favorites: [],
  pendingIds: [],
  error: null,
};

export function createFavoritesStore(
  repository: FavoritesRepository,
  events: EventTarget = new EventTarget(),
) {
  let snapshot = emptyFavorites;
  let initialization: Promise<boolean> | undefined;
  const pending = new Map<number, Promise<boolean>>();
  let refreshRequested = false;
  function publish(next: FavoritesSnapshot, reason: UserDataChangedEvent['reason']) {
    snapshot = next;
    events.dispatchEvent(
      new CustomEvent<UserDataChangedEvent>(USER_DATA_CHANGED, {
        detail: { resource: 'favorites', reason },
      }),
    );
  }
  async function load(refresh = false): Promise<boolean> {
    if (pending.size) {
      refreshRequested = true;
      return true;
    }
    if (initialization) return initialization;
    if (snapshot.status === 'ready' && !refresh) return true;
    if (snapshot.status !== 'ready')
      publish({ ...snapshot, status: 'loading', error: null }, 'loaded');
    const operation = repository
      .listFavorites()
      .then((favorites) => {
        // Uma leitura iniciada antes de uma escrita não substitui o estado otimista.
        if (pending.size) {
          refreshRequested = true;
          return true;
        }
        publish({ status: 'ready', favorites, pendingIds: [], error: null }, 'loaded');
        return true;
      })
      .catch(() => {
        publish(
          {
            ...snapshot,
            status: snapshot.status === 'ready' ? 'ready' : 'error',
            error: 'Não foi possível carregar os favoritos. Tente novamente.',
          },
          'loaded',
        );
        return false;
      })
      .finally(() => {
        initialization = undefined;
      });
    initialization = operation;
    return operation;
  }
  async function toggleFavorite(movie: MovieSummary): Promise<boolean> {
    if (snapshot.status !== 'ready' && !(await load())) return false;
    const existing = pending.get(movie.id);
    if (existing) return existing;
    if (snapshot.pendingIds.includes(movie.id)) return false;
    const previous = snapshot.favorites.find((item) => item.id === movie.id);
    const next = !previous;
    publish(
      {
        ...snapshot,
        favorites: next
          ? [...snapshot.favorites, movie]
          : snapshot.favorites.filter((item) => item.id !== movie.id),
        pendingIds: [...snapshot.pendingIds, movie.id],
        error: null,
      },
      'optimistic',
    );
    const operation = repository
      .setFavorite(movie, next)
      .then(() => {
        publish(
          { ...snapshot, pendingIds: snapshot.pendingIds.filter((id) => id !== movie.id) },
          'saved',
        );
        return true;
      })
      .catch(() => {
        const favorites = snapshot.favorites.filter((item) => item.id !== movie.id);
        if (previous) favorites.push(previous);
        publish(
          {
            ...snapshot,
            favorites,
            pendingIds: snapshot.pendingIds.filter((id) => id !== movie.id),
            error: `Não foi possível salvar “${movie.title}”. A alteração foi desfeita.`,
          },
          'rollback',
        );
        return false;
      })
      .finally(() => {
        pending.delete(movie.id);
        if (!pending.size && refreshRequested) {
          refreshRequested = false;
          void load(true);
        }
      });
    pending.set(movie.id, operation);
    return operation;
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      events.addEventListener(USER_DATA_CHANGED, listener);
      return () => events.removeEventListener(USER_DATA_CHANGED, listener);
    },
    initialize: () => load(),
    refresh: () => load(true),
    toggleFavorite,
  };
}
