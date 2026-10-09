import { z } from 'zod';
import { movieSummarySchema } from './movies';

export const FAVORITES_STORAGE_KEY = 'nexo-filmes:favorites:v1';
export const USER_DATA_CHANGED = 'nexo:user-data-changed';
export const favoritesSchema = z.object({
  version: z.literal(1),
  favorites: z.array(movieSummarySchema),
});
export interface UserDataChangedEvent {
  resource: 'favorites';
  reason: 'loaded' | 'optimistic' | 'saved' | 'rollback';
}
