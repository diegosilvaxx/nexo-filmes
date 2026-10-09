import {
  FAVORITES_STORAGE_KEY,
  favoritesSchema,
  movieSummarySchema,
  type MovieSummary,
} from '@nexo/contracts';

export interface SimulationConfig {
  delayMinMs: number;
  delayMaxMs: number;
  failWrites: boolean;
}
export interface FavoritesRepository {
  listFavorites(): Promise<MovieSummary[]>;
  setFavorite(movie: MovieSummary, favorite: boolean): Promise<void>;
}
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;
const defaults: SimulationConfig = { delayMinMs: 300, delayMaxMs: 1500, failWrites: true };

export function readSimulationConfig(environment: Record<string, unknown> = {}): SimulationConfig {
  if (environment.MODE === 'test') return { delayMinMs: 0, delayMaxMs: 0, failWrites: false };
  const min = Number(environment.VITE_USER_DATA_DELAY_MIN_MS ?? defaults.delayMinMs);
  const max = Number(environment.VITE_USER_DATA_DELAY_MAX_MS ?? defaults.delayMaxMs);
  const flag = environment.VITE_USER_DATA_FAIL_WRITES;
  if (
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 0 ||
    max < min ||
    max > 60_000 ||
    (flag !== undefined && flag !== 'true' && flag !== 'false')
  )
    throw new Error('Configuração da simulação de dados inválida.');
  return { delayMinMs: min, delayMaxMs: max, failWrites: flag !== 'false' };
}

export function createUserRepository(
  options: {
    storage?: () => StorageAccess;
    simulation?: SimulationConfig;
    random?: () => number;
  } = {},
): FavoritesRepository {
  const storage = options.storage ?? (() => window.localStorage);
  const config = options.simulation ?? defaults;
  const random = options.random ?? Math.random;
  async function wait() {
    const delay =
      config.delayMinMs + Math.floor(random() * (config.delayMaxMs - config.delayMinMs + 1));
    if (delay > 0) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    else await Promise.resolve();
  }
  function read() {
    const value = storage().getItem(FAVORITES_STORAGE_KEY);
    if (!value) return [];
    const data = favoritesSchema.parse(JSON.parse(value));
    return [...new Map(data.favorites.map((movie) => [movie.id, movie])).values()];
  }
  return {
    async listFavorites() {
      await wait();
      try {
        return read();
      } catch {
        throw new Error('Não foi possível carregar os favoritos. Tente novamente.');
      }
    },
    async setFavorite(input, favorite) {
      await wait();
      try {
        const movie = movieSummarySchema.parse(input);
        if (config.failWrites && String(movie.id).endsWith('13'))
          throw new Error('Falha de gravação.');
        const favorites = new Map(read().map((item) => [item.id, item]));
        if (favorite) favorites.set(movie.id, movie);
        else favorites.delete(movie.id);
        storage().setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify({ version: 1, favorites: [...favorites.values()] }),
        );
      } catch {
        throw new Error('Não foi possível salvar os favoritos. A alteração foi desfeita.');
      }
    },
  };
}
