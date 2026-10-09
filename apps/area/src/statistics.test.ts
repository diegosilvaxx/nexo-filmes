import { expect, it } from 'vitest';
import type { Genre, MovieSummary, Review } from '@nexo/contracts';
import { summary } from '../../../tests/movie-fixtures';
import { calculateStatistics } from './statistics';

const drama = { id: 18, name: 'Drama' };
const comedy = { id: 35, name: 'Comédia' };
const action = { id: 28, name: 'Ação' };
const movie = (id: number, genres: Genre[]): MovieSummary => ({ ...summary, id, genres });
const review = (movieId: number, rating: number): Review => ({ movieId, rating, comment: '' });

it('retorna totais zero e valores ausentes quando não há dados', () => {
  expect(calculateStatistics([], [])).toEqual({
    favoriteCount: 0,
    reviewCount: 0,
    averageRating: null,
    mostFrequentGenre: null,
  });
});
it('conta todas as avaliações, inclusive de filmes que não são favoritos, e calcula a média', () => {
  const result = calculateStatistics([movie(1, [drama])], [review(1, 8), review(2, 8.5)]);
  expect(result).toEqual({
    favoriteCount: 1,
    reviewCount: 2,
    averageRating: 8.25,
    mostFrequentGenre: { ...drama, count: 1 },
  });
  expect(calculateStatistics([], [review(1, 0.5)]).averageRating).toBe(0.5);
  expect(calculateStatistics([], [review(1, 10)]).averageRating).toBe(10);
});
it('considera todos os gêneros de cada favorito e conta cada gênero uma vez por filme', () => {
  expect(
    calculateStatistics(
      [movie(1, [drama, drama, comedy]), movie(2, [comedy, action]), movie(3, [action])],
      [],
    ).mostFrequentGenre,
  ).toEqual({ ...action, count: 2 });
  expect(
    calculateStatistics([movie(1, [drama, comedy]), movie(2, [drama])], []).mostFrequentGenre,
  ).toEqual({ ...drama, count: 2 });
});
it('desempata por ordem alfabética em português, independentemente da ordem dos filmes', () => {
  const favorites = [movie(1, [drama]), movie(2, [comedy]), movie(3, [action])];
  expect(calculateStatistics(favorites, []).mostFrequentGenre).toEqual({ ...action, count: 1 });
  expect(calculateStatistics([...favorites].reverse(), []).mostFrequentGenre).toEqual({
    ...action,
    count: 1,
  });
  expect(
    calculateStatistics(
      [movie(1, [{ id: 1, name: 'Ficção' }]), movie(2, [{ id: 2, name: 'Épico' }])],
      [],
    ).mostFrequentGenre?.name,
  ).toBe('Épico');
});
it('usa o ID como desempate estável quando os gêneros têm o mesmo nome', () => {
  expect(
    calculateStatistics([movie(1, [{ id: 2, name: 'Drama' }, drama])], []).mostFrequentGenre,
  ).toEqual({ id: 2, name: 'Drama', count: 1 });
});
it('mantém os totais de favoritos sem gênero e não altera os dados recebidos', () => {
  const favorites = Object.freeze([
    Object.freeze({ ...movie(1, []), genres: [] }),
    Object.freeze(movie(2, [drama])),
  ]);
  const reviews = Object.freeze([Object.freeze(review(9, 7))]);
  expect(calculateStatistics(favorites, reviews).favoriteCount).toBe(2);
  expect(calculateStatistics([movie(1, [])], []).mostFrequentGenre).toBeNull();
  expect(favorites.map((item) => item.id)).toEqual([1, 2]);
  expect(reviews[0]).toEqual(review(9, 7));
});
