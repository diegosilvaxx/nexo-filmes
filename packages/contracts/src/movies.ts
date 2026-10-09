import { z } from 'zod';

export const genreSchema = z.object({ id: z.number().int().positive(), name: z.string() });
export const movieSummarySchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  year: z.number().int().nullable(),
  posterUrl: z.url().nullable(),
  tmdbRating: z.number().min(0).max(10),
  genres: z.array(genreSchema),
});
export const movieDetailsSchema = movieSummarySchema.extend({
  runtime: z.number().int().nonnegative().nullable(),
  synopsis: z.string(),
  directors: z.array(z.string()),
  cast: z.array(
    z.object({ id: z.number().int().positive(), name: z.string(), character: z.string() }),
  ),
});
export const moviePageSchema = z.object({
  items: z.array(movieSummarySchema),
  page: z.number().int().min(1).max(500),
  totalPages: z.number().int().nonnegative().max(500),
  totalItems: z.number().int().nonnegative(),
});
export const movieQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(500).default(1),
    search: z.string().trim().max(200).default(''),
    genreId: z.coerce.number().int().positive().optional(),
    sort: z.enum(['popular', 'rating', 'newest', 'title']).default('popular'),
  })
  .strict()
  .refine((query) => !query.search || query.genreId === undefined, {
    message: 'A busca por título não pode ser combinada com gênero.',
    path: ['genreId'],
  })
  .refine((query) => !query.search || query.sort === 'popular', {
    message: 'A busca por título utiliza a ordem de relevância.',
    path: ['sort'],
  });
export const movieIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      'INVALID_REQUEST',
      'NOT_FOUND',
      'RATE_LIMITED',
      'UPSTREAM_UNAVAILABLE',
      'UPSTREAM_TIMEOUT',
      'INVALID_RESPONSE',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
    retryAfterSeconds: z.number().nonnegative().optional(),
  }),
});

export type Genre = z.infer<typeof genreSchema>;
export type MovieSummary = z.infer<typeof movieSummarySchema>;
export type MovieDetails = z.infer<typeof movieDetailsSchema>;
export type MoviePage = z.infer<typeof moviePageSchema>;
export type MovieQuery = z.infer<typeof movieQuerySchema>;
export type MovieSort = MovieQuery['sort'];
export type ApiErrorCode = z.infer<typeof apiErrorSchema>['error']['code'];
