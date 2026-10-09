// @vitest-environment node
import axios, { AxiosError, CanceledError } from 'axios';
import { beforeEach, expect, it, vi } from 'vitest';
import { createMoviesApi } from './index';
import { rawGenres, detail, page } from '../../../tests/movie-fixtures';

const response = vi.fn();
function api() {
  return createMoviesApi(
    axios.create({
      baseURL: '/api',
      adapter: async (config) => ({
        data: await response(config),
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    }),
  );
}
beforeEach(() => {
  response.mockReset();
});

it('consulta contratos normalizados e propaga AbortSignal', async () => {
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
      signal: controller.signal,
      params: { page: 1, search: '', genreId: 18, sort: 'popular' },
    }),
  );
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
