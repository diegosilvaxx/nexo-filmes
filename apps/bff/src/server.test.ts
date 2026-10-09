// @vitest-environment node
import axios, { type AxiosInstance } from 'axios';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ServiceError, type MovieService } from '@nexo/tmdb';
import { createBffServer } from './server';
import { rawGenres, detail, page } from '../../../tests/movie-fixtures';

const service: MovieService = { genres: vi.fn(), movies: vi.fn(), movie: vi.fn() };
let server: ReturnType<typeof createBffServer>;
let http: AxiosInstance;
beforeEach(async () => {
  vi.mocked(service.genres).mockReset().mockResolvedValue(rawGenres.genres);
  vi.mocked(service.movies).mockReset().mockResolvedValue(page);
  vi.mocked(service.movie).mockReset().mockResolvedValue(detail);
  server = createBffServer(service);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  http = axios.create({
    baseURL: `http://127.0.0.1:${address.port}/api`,
    validateStatus: () => true,
  });
});
afterEach(async () => {
  const closed = new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  server.closeAllConnections();
  await closed;
});

it('disponibiliza health, gêneros, catálogo e detalhe', async () => {
  expect((await http.get('/health')).data).toEqual({ status: 'ok' });
  expect((await http.get('/genres')).data).toEqual(rawGenres.genres);
  expect(
    (await http.get('/movies', { params: { page: '2', genreId: '18', sort: 'rating' } })).data,
  ).toEqual(page);
  expect(service.movies).toHaveBeenCalledWith({ page: 2, search: '', genreId: 18, sort: 'rating' });
  const response = await http.get('/movies/550');
  expect(response.data).toEqual(detail);
  expect(response.headers['cache-control']).toBe('no-store');
  expect(response.headers['x-content-type-options']).toBe('nosniff');
  expect(service.movie).toHaveBeenCalledWith(550);
});

it.each([
  '/movies?page=0',
  '/movies?page=501',
  '/movies?search=Matrix&genreId=18',
  '/movies?url=https://external.example',
  '/movies?page=1&page=2',
  '/movies/0',
  '/movies?search=Matrix&sort=rating',
])('rejeita %s antes de acessar API externa', async (path) => {
  const response = await http.get(path);
  expect(response.status).toBe(400);
  expect(response.data.error.code).toBe('INVALID_REQUEST');
  expect(service.movies).not.toHaveBeenCalled();
  expect(service.movie).not.toHaveBeenCalled();
});

it('rejeita métodos e caminhos desconhecidos', async () => {
  const response = await http.post('/movies', { id: 550 });
  expect(response.status).toBe(405);
  expect(response.headers.allow).toBe('GET');
  expect((await http.get('/unknown')).status).toBe(404);
});

it('propaga 429 com Retry-After', async () => {
  vi.mocked(service.genres).mockRejectedValue(
    new ServiceError(429, 'RATE_LIMITED', 'Aguarde e tente novamente.', 12),
  );
  const response = await http.get('/genres');
  expect(response.status).toBe(429);
  expect(response.headers['retry-after']).toBe('12');
  expect(response.data.error).toEqual({
    code: 'RATE_LIMITED',
    message: 'Aguarde e tente novamente.',
    retryAfterSeconds: 12,
  });
});

it('não envia mensagens internas ou credenciais', async () => {
  vi.mocked(service.movie).mockRejectedValue(new Error('Bearer private-token'));
  const response = await http.get('/movies/550');
  expect(response.status).toBe(500);
  expect(JSON.stringify(response.data)).not.toContain('private-token');
  expect(response.data.error.code).toBe('INTERNAL_ERROR');
});
