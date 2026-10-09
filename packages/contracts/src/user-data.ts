import { z } from 'zod';
import { movieIdSchema, movieSummarySchema } from './movies';

export const FAVORITES_STORAGE_KEY = 'nexo-filmes:favorites:v1';
export const REVIEWS_STORAGE_KEY = 'nexo-filmes:reviews:v1';
export const USER_DATA_CHANGED = 'nexo:user-data-changed';
export const favoritesSchema = z.object({
  version: z.literal(1),
  favorites: z.array(movieSummarySchema),
});
const ratingSchema = z
  .number()
  .min(0.5, 'A nota deve ser de 0,5 a 10.')
  .max(10, 'A nota deve ser de 0,5 a 10.')
  .multipleOf(0.5, 'Use uma nota em passos de 0,5.');
const commentSchema = z.string().max(500, 'O comentário deve ter até 500 caracteres.');
export const reviewInputSchema = z.object({
  rating: z.coerce.number({ error: 'Informe uma nota de 0,5 a 10.' }).pipe(ratingSchema),
  comment: commentSchema.trim().default(''),
});
export const reviewSchema = z.object({
  movieId: movieIdSchema,
  rating: ratingSchema,
  comment: commentSchema,
});
export const reviewsSchema = z.object({ version: z.literal(1), reviews: z.array(reviewSchema) });
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type Review = z.infer<typeof reviewSchema>;
export interface UserDataChangedEvent {
  resource: 'favorites' | 'reviews';
  reason: 'loaded' | 'optimistic' | 'saved' | 'rollback';
}
