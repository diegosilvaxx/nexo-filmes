// @vitest-environment node
import axios, { AxiosError, CanceledError } from 'axios';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createMoviesApi } from './index';
import { rawGenres, detail, page } from '../../../tests/movie-fixtures';

const response = vi.fn();
function client() {
  return axios.create({
    baseURL: '/api',
    adapter: async (config) => ({
      data: await response(config),
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }),
  });
}
function api() {
  return createMoviesApi(client());
}
beforeEach(() => {
  response.mockReset();
});
afterEach(() => vi.useRealTimers());

it('consulta contratos normalizados com um AbortSignal para a chamada compartilhada', async () => {
  response
    .mockResolvedValueOnce(rawGenres.genres)
    .mockResolvedValueOnce(page)
    .mockResolvedValueOnce(detail);
  const movies = api();
  const controller = new AbortController();
  expect(await movies.genres()).toEqual(rawGenres.genres);
  expect(await movies.movies({ genreId: 18 }, controller.signal)).toEqual(page);
  expect(await movies.movie(550)).toEqual(detail);
  expect(response).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      url: '/movies',
      baseURL: '/api',
      signal: expect.any(AbortSignal),
      params: { page: 1, search: '', genreId: 18, sort: 'popular' },
    }),
  );
});

it('compartilha o cache entre instâncias da API que utilizam o mesmo cliente HTTP', async () => {
  response.mockResolvedValue(detail);
  const http = client();
  const a = createMoviesApi(http);
  const b = createMoviesApi(http);
  expect(await Promise.all([a.movie(550), b.movie(550)])).toEqual([detail, detail]);
  await b.movie(550);
  expect(response).toHaveBeenCalledTimes(1);
});

it('normaliza a chave e distingue página, gênero, busca e ordenação', async () => {
  response.mockResolvedValue(page);
  const movies = api();
  await movies.movies();
  await movies.movies({ sort: 'popular', page: 1, search: '' });
  expect(response).toHaveBeenCalledTimes(1);
  await movies.movies({ page: 2 });
  await movies.movies({ genreId: 18 });
  await movies.movies({ sort: 'rating' });
  await movies.movies({ search: 'Matrix' });
  expect(response).toHaveBeenCalledTimes(5);
});

it.each([
  { resource: 'genres', lifetime: 3_600_000, data: rawGenres.genres },
  { resource: 'movies', lifetime: 120_000, data: page },
  { resource: 'movie', lifetime: 300_000, data: detail },
] as const)('expira $resource após $lifetime ms', async ({ resource, lifetime, data }) => {
  vi.useFakeTimers({ toFake: ['Date'] });
  response.mockResolvedValue(data);
  const movies = api();
  const read = () => (resource === 'movie' ? movies.movie(550) : movies[resource]());
  await read();
  vi.setSystemTime(Date.now() + lifetime - 1);
  await read();
  expect(response).toHaveBeenCalledTimes(1);
  vi.setSystemTime(Date.now() + 1);
  await read();
  expect(response).toHaveBeenCalledTimes(2);
});

it('não guarda respostas que falharam na validação Zod', async () => {
  response.mockResolvedValueOnce({ id: 'wrong' }).mockResolvedValue(detail);
  const movies = api();
  await expect(movies.movie(550)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  expect(await movies.movie(550)).toEqual(detail);
  await movies.movie(550);
  expect(response).toHaveBeenCalledTimes(2);
});

it('isola clientes HTTP diferentes e mudanças na URL base', async () => {
  response.mockResolvedValue(detail);
  const http = client();
  const movies = createMoviesApi(http);
  await movies.movie(550);
  await api().movie(550);
  http.defaults.baseURL = '/another-api';
  await movies.movie(550);
  expect(response).toHaveBeenCalledTimes(3);
});

it('rejeita resposta inválida', async () => {
  response.mockResolvedValue({ id: 'wrong' });
  await expect(api().movie(550)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});

it('valida consultas antes de chamar o BFF', async () => {
  const movies = api();
  await expect(movies.movies({ page: 501 })).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  await expect(movies.movies({ search: 'Matrix', genreId: 18 })).rejects.toMatchObject({
    code: 'INVALID_REQUEST',
  });
  await expect(movies.movie(NaN)).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
  expect(response).not.toHaveBeenCalled();
});

it('mantém 429 e prazo para nova tentativa', async () => {
  response.mockImplementation((config) => {
    throw new AxiosError('error', 'ERR_BAD_RESPONSE', config, undefined, {
      status: 429,
      statusText: '',
      headers: {},
      config,
      data: {
        error: {
          code: 'RATE_LIMITED',
          message: 'Aguarde e tente novamente.',
          retryAfterSeconds: 10,
        },
      },
    });
  });
  await expect(api().genres()).rejects.toMatchObject({
    code: 'RATE_LIMITED',
    status: 429,
    retryAfterSeconds: 10,
  });
});

it.each([new AxiosError('offline'), new Error('unexpected')])(
  'normaliza falha de rede: %s',
  async (error) => {
    response.mockRejectedValue(error);
    await expect(api().genres()).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  },
);

it('trata HTTP com corpo desconhecido', async () => {
  response.mockImplementation((config) => {
    throw new AxiosError('private', 'ERR_BAD_RESPONSE', config, undefined, {
      status: 502,
      statusText: '',
      headers: {},
      config,
      data: '<html>Error</html>',
    });
  });
  await expect(api().genres()).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE', status: 502 });
});

it('preserva cancelamento de buscas antigas', async () => {
  const cancelled = new CanceledError();
  response.mockRejectedValue(cancelled);
  await expect(api().genres()).rejects.toBe(cancelled);
});
