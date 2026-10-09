import { useState } from 'react';
import type { MovieSummary } from '@nexo/contracts';
import {
  FavoriteButton,
  MovieArticle,
  MovieGenres,
  MovieLink,
  MovieMeta,
  MovieTitle,
  Poster,
  Rating,
} from './movie.styles';

interface MovieCardProps {
  movie: MovieSummary;
  favorite: boolean;
  pending: boolean;
  disabled?: boolean;
  onToggle: () => void;
  detailsPath?: string;
}
export function MovieCard({
  movie,
  favorite,
  pending,
  disabled = false,
  onToggle,
  detailsPath,
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
      <FavoriteButton
        type="button"
        aria-pressed={favorite}
        aria-busy={pending}
        aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${movie.title} ${favorite ? 'dos' : 'aos'} favoritos`}
        disabled={disabled || pending}
        onClick={onToggle}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill={favorite ? 'currentColor' : 'none'}
          aria-hidden="true"
        >
          <path
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        {pending ? 'Salvando…' : favorite ? 'Favoritado' : 'Favoritar'}
      </FavoriteButton>
    </MovieArticle>
  );
}
