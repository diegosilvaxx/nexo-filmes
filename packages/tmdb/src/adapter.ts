import axios, { type AxiosInstance } from 'axios';
import type { Genre, MovieDetails, MoviePage, MovieQuery } from '@nexo/contracts';
import { movieIdSchema, movieQuerySchema } from '@nexo/contracts';
import { detailsResponseSchema, genresResponseSchema, moviesResponseSchema } from './schemas';
import { ServiceError, toServiceError } from './errors';

const sorting = {
  popular: 'popularity.desc',
  rating: 'vote_average.desc',
  newest: 'primary_release_date.desc',
  title: 'title.asc',
} as const;

export interface MovieService {
  genres(): Promise<Genre[]>;
  movies(query: MovieQuery): Promise<MoviePage>;
  movie(id: number): Promise<MovieDetails>;
}

function poster(path: string | null | undefined, size: 'w342' | 'w500') {
  return path && /^\/[a-zA-Z0-9._-]+$/.test(path)
    ? `https://image.tmdb.org/t/p/${size}${path}`
    : null;
}
function year(date: string | null | undefined) {
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? Number(date.slice(0, 4)) : null;
}

export function createTmdbAdapter(token: string, client?: AxiosInstance): MovieService {
  if (!token.trim()) throw new Error('Configure TMDB_READ_ACCESS_TOKEN no ambiente do servidor.');
  const http =
    client ??
    axios.create({
      baseURL: 'https://api.themoviedb.org/3',
      timeout: 12_000,
      maxRedirects: 0,
      headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
      params: { language: 'pt-BR' },
    });
  let cachedGenres: Promise<Genre[]> | undefined;
  const genres = () => {
    cachedGenres ??= http
      .get<unknown>('/genre/movie/list')
      .then((response) => genresResponseSchema.parse(response.data).genres)
      .catch((error: unknown) => {
        cachedGenres = undefined;
        throw toServiceError(error);
      });
    return cachedGenres;
  };
  return {
    genres,
    async movies(input) {
      const parsed = movieQuerySchema.safeParse(input);
      if (!parsed.success)
        throw new ServiceError(
          400,
          'INVALID_REQUEST',
          'Consulta inválida. Verifique os filtros e a paginação.',
        );
      const query = parsed.data;
      try {
        const availableGenres = await genres();
        if (
          query.genreId !== undefined &&
          !availableGenres.some((genre) => genre.id === query.genreId)
        )
          throw new ServiceError(400, 'INVALID_REQUEST', 'Gênero inválido.');
        const response = await http.get<unknown>(
          query.search ? '/search/movie' : '/discover/movie',
          {
            params: query.search
              ? { query: query.search, page: query.page, include_adult: false }
              : {
                  page: query.page,
                  include_adult: false,
                  include_video: false,
                  sort_by: sorting[query.sort],
                  ...(query.genreId !== undefined ? { with_genres: query.genreId } : {}),
                  ...(query.sort === 'rating' ? { 'vote_count.gte': 200 } : {}),
                },
          },
        );
        const data = moviesResponseSchema.parse(response.data);
        const byId = new Map(availableGenres.map((genre) => [genre.id, genre]));
        return {
          page: data.page,
          totalPages: Math.min(data.total_pages, 500),
          totalItems: data.total_results,
          items: data.results.map((movie) => ({
            id: movie.id,
            title: movie.title,
            year: year(movie.release_date),
            posterUrl: poster(movie.poster_path, 'w342'),
            tmdbRating: movie.vote_average,
            genres: movie.genre_ids.flatMap((id) => {
              const genre = byId.get(id);
              return genre ? [genre] : [];
            }),
          })),
        };
      } catch (error) {
        throw toServiceError(error);
      }
    },
    async movie(id) {
      if (!movieIdSchema.safeParse(id).success)
        throw new ServiceError(400, 'INVALID_REQUEST', 'Filme inválido.');
      try {
        const response = await http.get<unknown>(`/movie/${id}`, {
          params: { append_to_response: 'credits' },
        });
        const movie = detailsResponseSchema.parse(response.data);
        return {
          id: movie.id,
          title: movie.title,
          year: year(movie.release_date),
          posterUrl: poster(movie.poster_path, 'w500'),
          tmdbRating: movie.vote_average,
          genres: movie.genres,
          runtime: movie.runtime && movie.runtime > 0 ? movie.runtime : null,
          synopsis: movie.overview ?? '',
          directors: [
            ...new Set(
              movie.credits.crew
                .filter((person) => person.job === 'Director')
                .map((person) => person.name),
            ),
          ],
          cast: [...movie.credits.cast]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(({ id, name, character }) => ({ id, name, character })),
        };
      } catch (error) {
        throw toServiceError(error);
      }
    },
  };
}
