import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MovieQuery } from '@nexo/contracts';
import { createMoviesApi, useResource } from '@nexo/movies';
import { useFavorites } from '@nexo/user-data';
import {
  Button,
  Intro,
  LoadingState,
  MovieCard,
  MovieGrid,
  Notice,
  PageHeading,
  RequestError,
  ResultsInfo,
  SectionHeader,
} from '@nexo/ui';
import { readCatalogQuery, writeCatalogQuery } from './query';
import { Field, FilterHelp, Filters, Pagination } from './catalog.styles';

const api = createMoviesApi();
export function App({ standalone = false }: { standalone?: boolean }) {
  const [params, setParams] = useSearchParams();
  const query = readCatalogQuery(params);
  const [input, setInput] = useState({ source: query.search, draft: query.search });
  if (input.source !== query.search) setInput({ source: query.search, draft: query.search });
  const heading = useRef<HTMLHeadingElement>(null);
  const favorites = useFavorites();
  const genres = useResource('genres', api.genres);
  const invalidGenre =
    genres.result?.status === 'ready' &&
    query.genreId !== undefined &&
    !genres.result.data.some((genre) => genre.id === query.genreId);
  const key = JSON.stringify(query);
  const loadMovies = useCallback(
    (signal: AbortSignal) => api.movies(JSON.parse(key) as MovieQuery, signal),
    [key],
  );
  const movies = useResource(key, loadMovies, genres.result?.status === 'ready' && !invalidGenre);
  useEffect(() => {
    document.title = 'Filmes · Nexo Filmes';
  }, []);
  useEffect(() => {
    const normalizedQuery = readCatalogQuery(params);
    if (invalidGenre) {
      delete normalizedQuery.genreId;
      normalizedQuery.page = 1;
    }
    const normalized = writeCatalogQuery(params, normalizedQuery);
    if (normalized.toString() !== params.toString()) setParams(normalized, { replace: true });
  }, [params, setParams, invalidGenre]);
  useEffect(() => {
    const search = input.draft.trim().slice(0, 200);
    if (search === query.search) return;
    const timer = setTimeout(
      () =>
        setParams(writeCatalogQuery(params, { page: 1, search, sort: 'popular' }), {
          replace: true,
        }),
      400,
    );
    return () => clearTimeout(timer);
  }, [input.draft, query.search, params, setParams]);
  const active = Boolean(input.draft.trim() || query.search);
  const selected = new Set(favorites.favorites.map((movie) => movie.id));
  const error =
    genres.result?.status === 'error'
      ? { ...genres.result, retry: genres.retry }
      : movies.result?.status === 'error'
        ? { ...movies.result, retry: movies.retry }
        : undefined;
  const page = movies.result?.status === 'ready' ? movies.result.data : undefined;
  const goToPage = (next: number) => {
    setParams(writeCatalogQuery(params, { ...query, page: next }));
    heading.current?.focus();
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  return (
    <section aria-labelledby="catalog-heading">
      <SectionHeader>
        <PageHeading id="catalog-heading" ref={heading} tabIndex={-1}>
          Encontre seu próximo filme.
        </PageHeading>
        <Intro>Explore o catálogo e guarde os filmes que quer assistir.</Intro>
      </SectionHeader>
      <Filters>
        <Field>
          Buscar por título
          <input
            type="search"
            placeholder="Qual filme você procura?"
            maxLength={200}
            value={input.draft}
            onChange={(event) => setInput({ source: query.search, draft: event.target.value })}
          />
        </Field>
        <Field>
          Gênero
          <select
            value={query.genreId ?? ''}
            disabled={active || genres.result?.status !== 'ready'}
            onChange={(event) => {
              const next = { ...query, page: 1 };
              delete next.genreId;
              if (event.target.value) next.genreId = Number(event.target.value);
              setParams(writeCatalogQuery(params, next));
            }}
          >
            <option value="">Todos os gêneros</option>
            {genres.result?.status === 'ready' &&
              genres.result.data.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
          </select>
        </Field>
        <Field>
          Ordenar por
          <select
            value={query.sort}
            disabled={active}
            onChange={(event) =>
              setParams(
                writeCatalogQuery(params, {
                  ...query,
                  page: 1,
                  sort: event.target.value as typeof query.sort,
                }),
              )
            }
          >
            <option value="popular">Mais populares</option>
            <option value="rating">Melhor avaliados</option>
            <option value="newest">Mais recentes</option>
            <option value="title">Título: A–Z</option>
          </select>
        </Field>
      </Filters>
      {active && (
        <FilterHelp>Limpe a busca para filtrar por gênero ou ordenar o catálogo.</FilterHelp>
      )}
      {favorites.error && (
        <Notice>
          <p role="alert">{favorites.error}</p>
          {favorites.status === 'error' && (
            <Button onClick={() => void favorites.retry()}>Carregar favoritos</Button>
          )}
        </Notice>
      )}
      {error ? (
        <RequestError message={error.message} retryAt={error.retryAt} onRetry={error.retry} />
      ) : !page ? (
        <LoadingState label="Carregando filmes…" />
      ) : (
        <>
          <ResultsInfo role="status">
            {page.totalItems.toLocaleString('pt-BR')}{' '}
            {page.totalItems === 1 ? 'filme encontrado' : 'filmes encontrados'}
            {query.search && ` para “${query.search}”`}
          </ResultsInfo>
          {!page.items.length ? (
            <Notice>
              <p>
                {query.page > 1
                  ? 'Não há filmes nesta página.'
                  : 'Nenhum filme encontrado. Experimente outro título ou gênero.'}
              </p>
              <Button
                onClick={() => {
                  setInput({ source: query.search, draft: '' });
                  setParams(writeCatalogQuery(params, { page: 1, search: '', sort: 'popular' }));
                }}
              >
                Limpar filtros
              </Button>
            </Notice>
          ) : (
            <MovieGrid>
              {page.items.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  favorite={selected.has(movie.id)}
                  pending={favorites.pendingIds.includes(movie.id)}
                  disabled={favorites.status !== 'ready'}
                  onToggle={() => void favorites.toggleFavorite(movie)}
                  {...(standalone
                    ? {
                        detailsPath: `${import.meta.env.VITE_PORTAL_URL || 'http://127.0.0.1:4100'}/filme/${movie.id}`,
                      }
                    : {})}
                />
              ))}
            </MovieGrid>
          )}
          {page.totalPages > 1 && (
            <Pagination aria-label="Paginação do catálogo">
              <Button disabled={query.page <= 1} onClick={() => goToPage(query.page - 1)}>
                Anterior
              </Button>
              <span>
                Página {query.page} de {page.totalPages}
              </span>
              <Button
                disabled={query.page >= page.totalPages}
                onClick={() => goToPage(query.page + 1)}
              >
                Próxima
              </Button>
            </Pagination>
          )}
        </>
      )}
    </section>
  );
}
