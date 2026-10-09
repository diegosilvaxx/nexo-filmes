import type { MovieQuery } from '@nexo/contracts';
const keys = ['page', 'search', 'genreId', 'sort'];
export function readCatalogQuery(params: URLSearchParams): MovieQuery {
  const page = Number(params.get('page') ?? 1);
  const genreId = Number(params.get('genreId'));
  const search = (params.get('search') ?? '').trim().slice(0, 200);
  const sort = params.get('sort');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 500 ? page : 1,
    search,
    ...(!search && Number.isSafeInteger(genreId) && genreId > 0 ? { genreId } : {}),
    sort:
      !search && (sort === 'rating' || sort === 'newest' || sort === 'title') ? sort : 'popular',
  };
}
export function writeCatalogQuery(params: URLSearchParams, query: MovieQuery) {
  const result = new URLSearchParams(params);
  keys.forEach((key) => result.delete(key));
  if (query.page > 1) result.set('page', String(query.page));
  if (query.search) result.set('search', query.search);
  if (!query.search && query.genreId) result.set('genreId', String(query.genreId));
  if (!query.search && query.sort !== 'popular') result.set('sort', query.sort);
  return result;
}
