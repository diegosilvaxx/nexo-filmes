import { useEffect, useSyncExternalStore } from 'react';
import { FAVORITES_STORAGE_KEY } from '@nexo/contracts';
import { createUserRepository, readSimulationConfig } from './repository';
import { createFavoritesStore, emptyFavorites } from './store';

export { createUserRepository, readSimulationConfig, type FavoritesRepository } from './repository';
export { createFavoritesStore, type FavoritesSnapshot } from './store';

export const favoritesStore = createFavoritesStore(
  createUserRepository({ simulation: readSimulationConfig(import.meta.env) }),
  typeof window === 'undefined' ? new EventTarget() : window,
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === FAVORITES_STORAGE_KEY || event.key === null) void favoritesStore.refresh();
  });
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
