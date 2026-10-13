import { createTmdbAdapter } from '@nexo/tmdb';
import { createBffServer } from './server';

const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
if (!token) throw new Error('Configure TMDB_READ_ACCESS_TOKEN no ambiente do servidor.');

export default createBffServer(createTmdbAdapter(token));
