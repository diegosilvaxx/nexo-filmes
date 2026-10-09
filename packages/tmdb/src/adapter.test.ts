// @vitest-environment node
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { beforeEach, expect, it, vi } from 'vitest';
import { createTmdbAdapter } from './adapter';
import { parseRetryAfter, toServiceError } from './errors';
import {
  rawGenres,
  rawMovie,
  rawPage,
  rawDetail,
  page,
  detail,
} from '../../../tests/movie-fixtures';

const response = vi.fn();
function service() {
  return createTmdbAdapter(
    'test-token',
    axios.create({
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

it('configura autenticação e linguagem apenas no servidor', () => {
  const create = vi.spyOn(axios, 'create');
  createTmdbAdapter(' test-token ');
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      baseURL: 'https://api.themoviedb.org/3',
      timeout: 12000,
      maxRedirects: 0,
      params: { language: 'pt-BR' },
      headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
    }),
  );
  expect(() => createTmdbAdapter(' ')).toThrow('Configure');
});

it('compartilha a requisição de gêneros e reutiliza o cache', async () => {
  response.mockResolvedValue(rawGenres);
  const api = service();
  const first = api.genres();
  expect(api.genres()).toBe(first);
  expect(await first).toEqual(rawGenres.genres);
  await api.genres();
  expect(response).toHaveBeenCalledTimes(1);
});

it('recupera o cache após falha', async () => {
  response.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(rawGenres);
  const api = service();
  await expect(api.genres()).rejects.toMatchObject({ status: 502 });
  await expect(api.genres()).resolves.toEqual(rawGenres.genres);
});

it.each([
  ['popular', 'popularity.desc'],
  ['rating', 'vote_average.desc'],
  ['newest', 'primary_release_date.desc'],
  ['title', 'title.asc'],
] as const)('converte catálogo e ordenação %s', async (sort, expected) => {
  response.mockResolvedValueOnce(rawGenres).mockResolvedValueOnce(rawPage);
  const result = await service().movies({ page: 1, search: '', genreId: 18, sort });
  expect(result).toEqual(page);
  expect(response).toHaveBeenLastCalledWith(
    expect.objectContaining({
      url: '/discover/movie',
      params: expect.objectContaining({
        page: 1,
        with_genres: 18,
        sort_by: expected,
        include_adult: false,
      }),
    }),
  );
  expect(result.items[0]).not.toHaveProperty('genre_ids');
});

it('envia busca para search sem gênero ou ordenação', async () => {
  response.mockResolvedValueOnce(rawGenres).mockResolvedValueOnce(rawPage);
  await service().movies({ page: 2, search: ' Matrix ', sort: 'popular' });
  const last = response.mock.calls.at(-1)?.[0] as AxiosRequestConfig;
  expect(last.url).toBe('/search/movie');
  expect(last.params).toEqual({ query: 'Matrix', page: 2, include_adult: false });
});

it('normaliza informações ausentes e ignora imagem externa', async () => {
  response.mockResolvedValueOnce(rawGenres).mockResolvedValueOnce({
    ...rawPage,
    results: [{ ...rawMovie, poster_path: 'https://external.example/image.jpg', release_date: '' }],
  });
  expect((await service().movies({ page: 1, search: '', sort: 'popular' })).items[0]).toMatchObject(
    { posterUrl: null, year: null },
  );
});

it('obtém créditos e normaliza direção, elenco e imagens', async () => {
  response.mockResolvedValueOnce(rawDetail);
  expect(await service().movie(550)).toEqual(detail);
  expect(response).toHaveBeenCalledWith(
    expect.objectContaining({ url: '/movie/550', params: { append_to_response: 'credits' } }),
  );
});

it('normaliza informações opcionais no detalhe', async () => {
  response.mockResolvedValueOnce({
    ...rawDetail,
    poster_path: null,
    release_date: null,
    runtime: 0,
    overview: null,
    credits: { cast: [], crew: [] },
  });
  expect(await service().movie(550)).toMatchObject({
    posterUrl: null,
    year: null,
    runtime: null,
    synopsis: '',
    cast: [],
    directors: [],
  });
});

it('rejeita gênero inexistente e consultas incompatíveis', async () => {
  response.mockResolvedValue(rawGenres);
  const api = service();
  await expect(
    api.movies({ page: 1, search: '', sort: 'popular', genreId: 999 }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    api.movies({ page: 1, search: 'Matrix', sort: 'popular', genreId: 18 }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(api.movie(0)).rejects.toMatchObject({ status: 400 });
  expect(response).toHaveBeenCalledTimes(1);
});

it('rejeita respostas incompatíveis', async () => {
  response.mockResolvedValue({ unexpected: 'Bearer private-value' });
  await expect(service().movie(550)).rejects.toMatchObject({
    status: 502,
    code: 'INVALID_RESPONSE',
  });
  await expect(service().genres()).rejects.toMatchObject({ status: 502, code: 'INVALID_RESPONSE' });
});

it.each([
  [429, 'RATE_LIMITED', 429],
  [404, 'NOT_FOUND', 404],
  [401, 'UPSTREAM_UNAVAILABLE', 502],
  [500, 'UPSTREAM_UNAVAILABLE', 502],
])('converte HTTP %s em erro de domínio', async (status, code, expectedStatus) => {
  response.mockImplementation((config) => {
    throw new AxiosError('Bearer private-value', 'ERR_BAD_RESPONSE', config, undefined, {
      status,
      statusText: '',
      data: 'private-value',
      headers: { 'retry-after': '15' },
      config,
    });
  });
  await expect(service().movie(550)).rejects.toMatchObject({ status: expectedStatus, code });
  try {
    await service().movie(550);
  } catch (error) {
    expect(String(error)).not.toContain('private-value');
  }
});

it.each(['ECONNABORTED', 'ETIMEDOUT'])('trata timeout %s', (code) => {
  expect(toServiceError(new AxiosError('timeout', code))).toMatchObject({
    status: 504,
    code: 'UPSTREAM_TIMEOUT',
  });
});

it.each([
  ['10', 10],
  [1.2, 2],
  ['', undefined],
  [-1, undefined],
  ['invalid', undefined],
  ['Thu, 01 Jan 1970 00:00:05 GMT', 5],
])('normaliza Retry-After %s', (value, expected) => {
  expect(parseRetryAfter(value, 0)).toBe(expected);
});
