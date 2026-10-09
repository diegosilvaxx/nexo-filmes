import { useState } from 'react';
import type { MovieSummary } from '@nexo/contracts';
import {
  MovieArticle,
  MovieGenres,
  MovieLink,
  MovieMeta,
  MovieTitle,
  Poster,
  Rating,
} from './movie.styles';
import { FavoriteToggle } from './FavoriteToggle';

interface MovieCardProps {
  movie: MovieSummary;
  favorite: boolean;
  pending: boolean;
  disabled?: boolean;
  onToggle: () => void;
  detailsPath?: string;
  personalRating?: number | null | undefined;
  ratingPending?: boolean;
}
export function MovieCard({
  movie,
  favorite,
  pending,
  disabled = false,
  onToggle,
  detailsPath,
  personalRating,
  ratingPending = false,
}: MovieCardProps) {
  const [failedPoster, setFailedPoster] = useState(false);
  return (
    <MovieArticle>
      <MovieLink
        to={detailsPath ?? `/filme/${movie.id}`}
        aria-label={`Ver detalhes de ${movie.title}`}
      >
        <Poster>
          {movie.posterUrl && !failedPoster ? (
            <img
              src={movie.posterUrl}
              width="342"
              height="513"
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedPoster(true)}
            />
          ) : (
            <span>Sem pôster</span>
          )}
        </Poster>
        <MovieTitle>{movie.title}</MovieTitle>
      </MovieLink>
      <MovieMeta>
        <span>{movie.year ?? 'Ano não informado'}</span>
        <Rating
          aria-label={`Nota TMDB: ${movie.tmdbRating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} de 10`}
        >
          <span aria-hidden="true">★ </span>
          {movie.tmdbRating.toFixed(1).replace('.', ',')}
        </Rating>
      </MovieMeta>
      <MovieGenres>
        {movie.genres.map((genre) => genre.name).join(' · ') || 'Gênero não informado'}
      </MovieGenres>
      {personalRating !== undefined && (
        <MovieGenres aria-busy={ratingPending}>
          {personalRating === null
            ? 'Sem avaliação'
            : `Sua nota: ${personalRating.toFixed(1).replace('.', ',')}`}
          {ratingPending && <span> · Salvando…</span>}
        </MovieGenres>
      )}
      <FavoriteToggle
        title={movie.title}
        favorite={favorite}
        pending={pending}
        disabled={disabled}
        onToggle={onToggle}
      />
    </MovieArticle>
  );
}
