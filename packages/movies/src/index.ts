import axios, { type AxiosInstance } from 'axios';
import { z } from 'zod';
import { createHttpClient } from '@nexo/http';
import {
  apiErrorSchema,
  genreSchema,
  movieDetailsSchema,
  movieIdSchema,
  moviePageSchema,
  movieQuerySchema,
  type MovieQuery,
} from '@nexo/contracts';

import { MoviesApiError } from './errors';
export { MoviesApiError } from './errors';
export { useResource } from './useResource';

export function createMoviesApi(client: AxiosInstance = createHttpClient()) {
  async function get<T>(
    path: string,
    schema: z.ZodType<T>,
    params?: MovieQuery,
    signal?: AbortSignal,
  ) {
    try {
      const response = await client.get<unknown>(path, {
        ...(params ? { params } : {}),
        ...(signal ? { signal } : {}),
      });
      const parsed = schema.safeParse(response.data);
      if (!parsed.success)
        throw new MoviesApiError(
          'INVALID_RESPONSE',
          502,
          'Não foi possível ler os dados dos filmes.',
        );
      return parsed.data;
    } catch (error) {
      if (axios.isCancel(error) || error instanceof MoviesApiError) throw error;
      if (axios.isAxiosError(error)) {
        const parsed = apiErrorSchema.safeParse(error.response?.data);
        if (parsed.success) {
          const detail = parsed.data.error;
          throw new MoviesApiError(
            detail.code,
            error.response?.status ?? 0,
            detail.message,
            detail.retryAfterSeconds,
          );
        }
        throw new MoviesApiError(
          error.response ? 'UPSTREAM_UNAVAILABLE' : 'NETWORK_ERROR',
          error.response?.status ?? 0,
          'Não foi possível carregar os filmes. Tente novamente.',
        );
      }
      throw new MoviesApiError(
        'NETWORK_ERROR',
        0,
        'Não foi possível carregar os filmes. Tente novamente.',
      );
    }
  }
  return {
    genres: (signal?: AbortSignal) => get('/genres', z.array(genreSchema), undefined, signal),
    movies: (query: Partial<MovieQuery> = {}, signal?: AbortSignal) => {
      const parsed = movieQuerySchema.safeParse(query);
      if (!parsed.success)
        return Promise.reject(
          new MoviesApiError(
            'INVALID_REQUEST',
            400,
            'Consulta inválida. Verifique os filtros e a paginação.',
          ),
        );
      return get('/movies', moviePageSchema, parsed.data, signal);
    },
    movie: (id: number, signal?: AbortSignal) => {
      if (!movieIdSchema.safeParse(id).success)
        return Promise.reject(new MoviesApiError('INVALID_REQUEST', 400, 'Filme inválido.'));
      return get(`/movies/${id}`, movieDetailsSchema, undefined, signal);
    },
  };
}
