export const rawGenres = {
  genres: [
    { id: 18, name: 'Drama' },
    { id: 878, name: 'Ficção científica' },
  ],
};
export const rawMovie = {
  id: 550,
  title: 'Clube da Luta',
  poster_path: '/poster.jpg',
  release_date: '1999-10-15',
  vote_average: 8.4,
  genre_ids: [18, 878, 999],
};
export const rawPage = { results: [rawMovie], page: 1, total_pages: 800, total_results: 16000 };
export const rawDetail = {
  ...rawMovie,
  genres: rawGenres.genres,
  runtime: 139,
  overview: 'Uma sinopse.',
  credits: {
    cast: [
      { id: 2, name: 'Brad Pitt', character: 'Tyler', order: 1 },
      { id: 1, name: 'Edward Norton', character: 'Narrador', order: 0 },
    ],
    crew: [
      { id: 3, name: 'David Fincher', job: 'Director' },
      { id: 3, name: 'David Fincher', job: 'Director' },
      { id: 4, name: 'Roteirista', job: 'Writer' },
    ],
  },
};
export const summary = {
  id: 550,
  title: 'Clube da Luta',
  year: 1999,
  posterUrl: 'https://image.tmdb.org/t/p/w342/poster.jpg',
  tmdbRating: 8.4,
  genres: rawGenres.genres,
};
export const page = { items: [summary], page: 1, totalPages: 500, totalItems: 16000 };
export const detail = {
  ...summary,
  posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  runtime: 139,
  synopsis: 'Uma sinopse.',
  directors: ['David Fincher'],
  cast: [
    { id: 1, name: 'Edward Norton', character: 'Narrador' },
    { id: 2, name: 'Brad Pitt', character: 'Tyler' },
  ],
};
