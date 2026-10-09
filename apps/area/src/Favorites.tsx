import { useEffect } from 'react';
import { useFavorites } from '@nexo/user-data';
import {
  Intro,
  LoadingState,
  MovieCard,
  MovieGrid,
  Notice,
  PageHeading,
  RequestError,
  ResultsInfo,
  SectionHeader,
  TextLink,
} from '@nexo/ui';

export function Favorites({ standalone = false }: { standalone?: boolean }) {
  const favorites = useFavorites();
  const portal = import.meta.env.VITE_PORTAL_URL || 'http://127.0.0.1:4100';
  useEffect(() => {
    document.title = 'Favoritos · Nexo Filmes';
  }, []);
  return (
    <section aria-labelledby="favorites-heading">
      <SectionHeader>
        <PageHeading id="favorites-heading">Seus favoritos.</PageHeading>
        <Intro>Os filmes que você guardou para ver ou rever.</Intro>
      </SectionHeader>
      {favorites.status === 'idle' || favorites.status === 'loading' ? (
        <LoadingState label="Carregando favoritos…" />
      ) : favorites.status === 'error' ? (
        <RequestError
          message={favorites.error ?? 'Não foi possível carregar os favoritos.'}
          onRetry={() => void favorites.retry()}
        />
      ) : (
        <>
          {favorites.error && (
            <Notice>
              <p role="alert">{favorites.error}</p>
            </Notice>
          )}
          <ResultsInfo role="status">
            {favorites.favorites.length}{' '}
            {favorites.favorites.length === 1 ? 'filme salvo' : 'filmes salvos'}
          </ResultsInfo>
          {favorites.favorites.length ? (
            <MovieGrid>
              {favorites.favorites.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  favorite
                  pending={favorites.pendingIds.includes(movie.id)}
                  onToggle={() => void favorites.toggleFavorite(movie)}
                  {...(standalone ? { detailsPath: `${portal}/filme/${movie.id}` } : {})}
                />
              ))}
            </MovieGrid>
          ) : (
            <Notice>
              <p>Você ainda não tem filmes favoritos.</p>
              <TextLink to={standalone ? `${portal}/filmes` : '/filmes'}>Explorar filmes</TextLink>
            </Notice>
          )}
          {favorites.pendingIds.some(
            (id) => !favorites.favorites.some((movie) => movie.id === id),
          ) && <LoadingState label="Salvando favoritos…" />}
        </>
      )}
    </section>
  );
}
