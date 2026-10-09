import { useCallback, useEffect, useState } from 'react';
import { createMoviesApi, useResource } from '@nexo/movies';
import { useFavorites } from '@nexo/user-data';
import {
  Button,
  FavoriteToggle,
  LoadingState,
  NotFound,
  Notice,
  PageHeading,
  RequestError,
} from '@nexo/ui';
import {
  CastList,
  CastDetails,
  Credits,
  Detail,
  DetailPoster,
  Genres,
  Metadata,
  SectionTitle,
  Synopsis,
  MovieActions,
} from './movie.styles';
import { ReviewSection } from './ReviewSection';
const api = createMoviesApi();
export function MoviePage({ movieId }: { movieId: number }) {
  const load = useCallback((signal: AbortSignal) => api.movie(movieId, signal), [movieId]);
  const resource = useResource(String(movieId), load);
  const favorites = useFavorites();
  const [failedPoster, setFailedPoster] = useState(false);
  const movie = resource.result?.status === 'ready' ? resource.result.data : undefined;
  useEffect(() => {
    document.title = `${movie?.title ?? 'Detalhes do filme'} · Nexo Filmes`;
  }, [movie?.title]);
  if (!resource.result) return <LoadingState label="Carregando filme…" />;
  if (resource.result.status === 'error')
    return resource.result.code === 'NOT_FOUND' ? (
      <NotFound />
    ) : (
      <RequestError
        message={resource.result.message}
        retryAt={resource.result.retryAt}
        onRetry={resource.retry}
      />
    );
  if (!movie) return null;
  return (
    <article aria-labelledby="movie-title">
      <Detail>
        <DetailPoster>
          {movie.posterUrl && !failedPoster ? (
            <img
              src={movie.posterUrl}
              alt={`Pôster de ${movie.title}`}
              width="500"
              height="750"
              decoding="async"
              onError={() => setFailedPoster(true)}
            />
          ) : (
            <span>Sem pôster</span>
          )}
        </DetailPoster>
        <div>
          <PageHeading id="movie-title">{movie.title}</PageHeading>
          <Metadata>
            <span>{movie.year ?? 'Ano não informado'}</span>
            <span>{movie.runtime ? `${movie.runtime} min` : 'Duração não informada'}</span>
            <span>TMDB · {movie.tmdbRating.toFixed(1).replace('.', ',')}/10</span>
          </Metadata>
          <Genres>
            {movie.genres.map((genre) => genre.name).join(' · ') || 'Gênero não informado'}
          </Genres>
          <MovieActions>
            <FavoriteToggle
              title={movie.title}
              favorite={favorites.favorites.some((item) => item.id === movie.id)}
              pending={favorites.pendingIds.includes(movie.id)}
              disabled={favorites.status !== 'ready'}
              onToggle={() => void favorites.toggleFavorite(movie)}
            />
            <a href="#review-heading">Ir para sua avaliação</a>
          </MovieActions>
          {favorites.error && (
            <Notice>
              <p role="alert">{favorites.error}</p>
              {favorites.status === 'error' && (
                <Button onClick={() => void favorites.retry()}>Carregar favoritos</Button>
              )}
            </Notice>
          )}
          <SectionTitle>Sinopse</SectionTitle>
          <Synopsis>{movie.synopsis || 'Sinopse não disponível.'}</Synopsis>
          <Credits>
            <dt>Direção</dt>
            <dd>{movie.directors.join(' · ') || 'Direção não informada.'}</dd>
          </Credits>
          <SectionTitle>Elenco</SectionTitle>
          {movie.cast.length ? (
            <CastList>
              {movie.cast.slice(0, 6).map((person, index) => (
                <li key={`${person.id}-${index}`}>
                  {person.name}
                  <span>{person.character || 'Personagem não informado'}</span>
                </li>
              ))}
            </CastList>
          ) : (
            <Synopsis>Elenco não disponível.</Synopsis>
          )}
          {movie.cast.length > 6 && (
            <CastDetails>
              <summary>Ver elenco completo ({movie.cast.length})</summary>
              <CastList>
                {movie.cast.slice(6).map((person, index) => (
                  <li key={`${person.id}-${index}`}>
                    {person.name}
                    <span>{person.character || 'Personagem não informado'}</span>
                  </li>
                ))}
              </CastList>
            </CastDetails>
          )}
          <ReviewSection movieId={movie.id} />
        </div>
      </Detail>
    </article>
  );
}
