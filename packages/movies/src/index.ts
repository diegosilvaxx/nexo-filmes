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
import { createRequestCache, type RequestCache } from './request-cache';
export { MoviesApiError } from './errors';
export { useResource } from './useResource';

const defaultClient = createHttpClient();
const caches = new WeakMap<AxiosInstance, RequestCache>();
const ttl = { genres: 3_600_000, movies: 120_000, movie: 300_000 };

export function createMoviesApi(client: AxiosInstance = defaultClient) {
  const cache = caches.get(client) ?? createRequestCache();
  caches.set(client, cache);

  function cachedGet<T>(
    path: string,
    schema: z.ZodType<T>,
    lifetime: number,
    params?: MovieQuery,
    signal?: AbortSignal,
  ) {
    const key = JSON.stringify([
      client.defaults.baseURL ?? '',
      path,
      params ? [params.page, params.search, params.genreId ?? null, params.sort] : null,
    ]);
    return cache.get(
      key,
      lifetime,
      (sharedSignal) => get(path, schema, params, sharedSignal),
      signal,
    );
  }

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
    genres: (signal?: AbortSignal) =>
      cachedGet('/genres', z.array(genreSchema), ttl.genres, undefined, signal),
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
      return cachedGet('/movies', moviePageSchema, ttl.movies, parsed.data, signal);
    },
    movie: (id: number, signal?: AbortSignal) => {
      if (!movieIdSchema.safeParse(id).success)
        return Promise.reject(new MoviesApiError('INVALID_REQUEST', 400, 'Filme inválido.'));
      return cachedGet(`/movies/${id}`, movieDetailsSchema, ttl.movie, undefined, signal);
    },
  };
}
