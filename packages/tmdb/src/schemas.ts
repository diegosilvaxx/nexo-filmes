import { z } from 'zod';
import { genreSchema } from '@nexo/contracts';

const movieBase = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  poster_path: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  vote_average: z.number().min(0).max(10),
});
export const genresResponseSchema = z.object({ genres: z.array(genreSchema) });
export const moviesResponseSchema = z.object({
  page: z.number().int().min(1).max(500),
  total_pages: z.number().int().nonnegative(),
  total_results: z.number().int().nonnegative(),
  results: z.array(movieBase.extend({ genre_ids: z.array(z.number().int().positive()) })),
});
export const detailsResponseSchema = movieBase.extend({
  genres: z.array(genreSchema),
  runtime: z.number().int().nonnegative().nullable().optional(),
  overview: z.string().nullable().optional(),
  credits: z.object({
    cast: z.array(
      z.object({
        id: z.number().int().positive(),
        name: z.string(),
        character: z.string(),
        order: z.number().int().optional(),
      }),
    ),
    crew: z.array(z.object({ id: z.number().int().positive(), name: z.string(), job: z.string() })),
  }),
});
