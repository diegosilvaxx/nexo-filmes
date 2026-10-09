import type { MovieSummary } from '@nexo/contracts';

const poster = `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513"><rect width="342" height="513" fill="#202026"/><circle cx="171" cy="200" r="85" fill="#b8accf"/><path d="M120 335h102M145 354h52" stroke="#e6e6e9" stroke-width="3"/><text x="171" y="460" text-anchor="middle" fill="#e6e6e9" font-family="sans-serif" font-size="22">NEXO FILMES</text></svg>`;
export const movie: MovieSummary = {
  id: 550,
  title: 'Clube da Luta',
  year: 1999,
  tmdbRating: 8.4,
  posterUrl: `data:image/svg+xml,${encodeURIComponent(poster)}`,
  genres: [
    { id: 18, name: 'Drama' },
    { id: 53, name: 'Thriller' },
  ],
};
