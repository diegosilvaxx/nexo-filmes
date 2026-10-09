import { describe, expect, it } from 'vitest';
import { readCatalogQuery, writeCatalogQuery } from './query';
describe('consulta do catálogo pela URL', () => {
  it('recupera filtros e paginação e normaliza valores inválidos', () => {
    expect(readCatalogQuery(new URLSearchParams('page=2&genreId=18&sort=rating'))).toEqual({
      page: 2,
      genreId: 18,
      sort: 'rating',
      search: '',
    });
    for (const page of ['-1', '0', '501', '1.5', 'x'])
      expect(readCatalogQuery(new URLSearchParams(`page=${page}&genreId=-1&sort=bad`))).toEqual({
        page: 1,
        sort: 'popular',
        search: '',
      });
    expect(readCatalogQuery(new URLSearchParams('sort=title')).sort).toBe('title');
    expect(readCatalogQuery(new URLSearchParams('sort=newest')).sort).toBe('newest');
  });
  it('busca usa relevância, remove gênero e limita título', () => {
    expect(
      readCatalogQuery(new URLSearchParams('search=%20Matrix%20&genreId=18&sort=rating')),
    ).toEqual({ page: 1, search: 'Matrix', sort: 'popular' });
    expect(readCatalogQuery(new URLSearchParams({ search: 'x'.repeat(220) })).search).toHaveLength(
      200,
    );
  });
  it('remove valores padrão, preserva parâmetros alheios e permite compartilhar consulta', () => {
    const original = new URLSearchParams(
      'source=bookmark&page=3&search=old&genreId=18&sort=newest',
    );
    expect(writeCatalogQuery(original, { page: 1, search: '', sort: 'popular' }).toString()).toBe(
      'source=bookmark',
    );
    const next = { page: 2, search: '', genreId: 28, sort: 'title' as const };
    expect(readCatalogQuery(writeCatalogQuery(original, next))).toEqual(next);
    expect(
      writeCatalogQuery(original, {
        page: 1,
        search: 'Matrix',
        genreId: 18,
        sort: 'rating',
      }).toString(),
    ).toBe('source=bookmark&search=Matrix');
  });
});
