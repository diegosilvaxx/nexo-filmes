import type { Genre, MovieSummary, Review } from '@nexo/contracts';

export function calculateStatistics(
  favorites: readonly MovieSummary[],
  reviews: readonly Review[],
) {
  const genres = new Map<number, Genre & { count: number }>();
  for (const movie of favorites) {
    const uniqueGenres = new Map(movie.genres.map((genre) => [genre.id, genre]));
    for (const genre of uniqueGenres.values()) {
      const previous = genres.get(genre.id);
      genres.set(genre.id, { ...genre, count: (previous?.count ?? 0) + 1 });
    }
  }
  const mostFrequentGenre =
    [...genres.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR') || a.id - b.id,
    )[0] ?? null;
  return {
    favoriteCount: favorites.length,
    reviewCount: reviews.length,
    averageRating: reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : null,
    mostFrequentGenre,
  };
}
