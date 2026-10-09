import { test as base, expect, type Page } from '@playwright/test';
import type { Genre, MovieDetails, MovieSummary } from '@nexo/contracts';

export const genres: Genre[] = [
  { id: 18, name: 'Drama' },
  { id: 35, name: 'Comédia' },
  { id: 53, name: 'Thriller' },
];
export const movie: MovieSummary = {
  id: 550,
  title: 'Clube da Luta',
  year: 1999,
  posterUrl: null,
  tmdbRating: 8.4,
  genres: [genres[0]!, genres[2]!],
};
export const failingMovie: MovieSummary = {
  ...movie,
  id: 13,
  title: 'Forrest Gump',
  year: 1994,
  genres: [genres[0]!, genres[1]!],
};
const movies: MovieSummary[] = [
  movie,
  failingMovie,
  ...Array.from({ length: 38 }, (_, index) => ({
    ...movie,
    id: 1000 + index,
    title: `Filme ${String(index + 1).padStart(2, '0')}`,
    genres: [genres[index % 2]!, genres[2]!],
  })),
];
export interface MockApi {
  requests: URL[];
  delayMs: number;
  nextMovieError: 'RATE_LIMITED' | 'UPSTREAM_UNAVAILABLE' | null;
}
export const test = base.extend<{ api: MockApi }>({
  api: [
    async ({ context }, use) => {
      const api: MockApi = { requests: [], delayMs: 0, nextMovieError: null };
      const unhandled: string[] = [];
      const pageErrors: string[] = [];
      context.on('page', (page) => page.on('pageerror', (error) => pageErrors.push(error.message)));
      await context.route('**/api/**', async (route) => {
        const url = new URL(route.request().url());
        api.requests.push(url);
        if (api.delayMs) await new Promise((resolve) => setTimeout(resolve, api.delayMs));
        if (url.pathname === '/api/genres') return route.fulfill({ json: genres });
        if (url.pathname === '/api/movies') {
          if (api.nextMovieError) {
            const code = api.nextMovieError;
            api.nextMovieError = null;
            return route.fulfill({
              status: code === 'RATE_LIMITED' ? 429 : 502,
              json: {
                error: {
                  code,
                  message:
                    code === 'RATE_LIMITED'
                      ? 'Muitas consultas. Tente novamente.'
                      : 'O serviço de filmes está indisponível. Tente novamente.',
                },
              },
            });
          }
          const search = url.searchParams.get('search')?.toLocaleLowerCase('pt-BR') ?? '';
          const genreId = Number(url.searchParams.get('genreId'));
          const page = Number(url.searchParams.get('page') ?? '1');
          const selected = movies.filter(
            (item) =>
              (!search || item.title.toLocaleLowerCase('pt-BR').includes(search)) &&
              (!genreId || item.genres.some((genre) => genre.id === genreId)),
          );
          return route.fulfill({
            json: {
              items: selected.slice((page - 1) * 20, page * 20),
              page,
              totalPages: Math.ceil(selected.length / 20),
              totalItems: selected.length,
            },
          });
        }
        const id = Number(url.pathname.match(/^\/api\/movies\/(\d+)$/)?.[1]);
        const selected = movies.find((item) => item.id === id);
        if (selected) {
          const detail: MovieDetails = {
            ...selected,
            runtime: 139,
            synopsis: 'Uma história sobre encontros, escolhas e consequências.',
            directors: ['David Fincher'],
            cast: [
              { id: 1, name: 'Edward Norton', character: 'Narrador' },
              { id: 2, name: 'Brad Pitt', character: 'Tyler Durden' },
            ],
          };
          return route.fulfill({ json: detail });
        }
        if (id)
          return route.fulfill({
            status: 404,
            json: { error: { code: 'NOT_FOUND', message: 'Filme não encontrado.' } },
          });
        unhandled.push(url.pathname);
        return route.fulfill({ status: 500, json: { error: 'Rota não simulada.' } });
      });
      await use(api);
      expect(unhandled, 'Todas as chamadas de API devem ser simuladas').toEqual([]);
      expect(pageErrors, 'A aplicação não deve lançar erros sem tratamento').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
export function metric(page: Page, label: string) {
  return page
    .locator('dl > div')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('dd');
}
export function favoriteCounter(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: /Favoritos/ });
}
