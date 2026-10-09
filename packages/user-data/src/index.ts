import { useEffect, useSyncExternalStore } from 'react';
import { FAVORITES_STORAGE_KEY, REVIEWS_STORAGE_KEY } from '@nexo/contracts';
import { createUserRepository, readSimulationConfig } from './repository';
import { createFavoritesStore, emptyFavorites } from './store';
import { createReviewsStore, emptyReviews } from './reviews-store';

export {
  createUserRepository,
  readSimulationConfig,
  type FavoritesRepository,
  type ReviewsRepository,
} from './repository';
export { createFavoritesStore, type FavoritesSnapshot } from './store';
export { createReviewsStore, type ReviewsSnapshot } from './reviews-store';

const repository = createUserRepository({ simulation: readSimulationConfig(import.meta.env) });
const events = typeof window === 'undefined' ? new EventTarget() : window;
export const favoritesStore = createFavoritesStore(repository, events);
export const reviewsStore = createReviewsStore(repository, events);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === null) void favoritesStore.refresh();
    if (event.key === REVIEWS_STORAGE_KEY || event.key === null) void reviewsStore.refresh();
  });
}

export function useReviews() {
  const state = useSyncExternalStore(
    reviewsStore.subscribe,
    reviewsStore.getSnapshot,
    () => emptyReviews,
  );
  useEffect(() => {
    void reviewsStore.initialize();
  }, []);
  return {
    ...state,
    saveReview: reviewsStore.saveReview,
    deleteReview: reviewsStore.deleteReview,
    retry: reviewsStore.refresh,
  };
}

export function useFavorites() {
  const state = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    () => emptyFavorites,
  );
  useEffect(() => {
    void favoritesStore.initialize();
  }, []);
  return { ...state, toggleFavorite: favoritesStore.toggleFavorite, retry: favoritesStore.refresh };
}
