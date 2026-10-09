import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAVORITES_STORAGE_KEY, type MovieSummary } from '@nexo/contracts';
import { createUserRepository, readSimulationConfig } from './repository';
const film = (id: number): MovieSummary => ({
  id,
  title: `Filme ${id}`,
  year: 2020,
  posterUrl: null,
  tmdbRating: 8,
  genres: [{ id: 18, name: 'Drama' }],
});
const instant = { delayMinMs: 0, delayMaxMs: 0, failWrites: false };
function storage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
afterEach(() => {
  vi.useRealTimers();
});
describe('repositório de favoritos', () => {
  it('mantém alterações de filmes distintos em gravações concorrentes e após nova instância', async () => {
    const local = storage();
    const repo = createUserRepository({ storage: () => local, simulation: instant });
    await Promise.all([repo.setFavorite(film(1), true), repo.setFavorite(film(2), true)]);
    expect(
      await createUserRepository({ storage: () => local, simulation: instant }).listFavorites(),
    ).toEqual([film(1), film(2)]);
    await repo.setFavorite(film(1), true);
    await repo.setFavorite(film(2), false);
    expect(await repo.listFavorites()).toEqual([film(1)]);
  });
  it('aplica atraso aleatório em leitura e escrita', async () => {
    vi.useFakeTimers();
    const local = storage();
    const repo = createUserRepository({ storage: () => local, random: () => 0.5 });
    const saved = vi.fn();
    const loaded = vi.fn();
    const write = repo.setFavorite(film(1), true).then(saved);
    await vi.advanceTimersByTimeAsync(899);
    expect(saved).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await write;
    const read = repo.listFavorites().then(loaded);
    await vi.advanceTimersByTimeAsync(899);
    expect(loaded).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await read;
    expect(loaded).toHaveBeenCalledWith([film(1)]);
  });
  it('falha em qualquer gravação de ID terminado em 13 sem alterar dados', async () => {
    const local = storage();
    await createUserRepository({ storage: () => local, simulation: instant }).setFavorite(
      film(113),
      true,
    );
    const repo = createUserRepository({
      storage: () => local,
      simulation: { ...instant, failWrites: true },
    });
    await expect(repo.setFavorite(film(13), true)).rejects.toThrow('desfeita');
    await expect(repo.setFavorite(film(113), false)).rejects.toThrow('desfeita');
    expect(await repo.listFavorites()).toEqual([film(113)]);
  });
  it('preserva armazenamento corrompido e informa falha de acesso ou quota', async () => {
    const local = storage();
    local.setItem(FAVORITES_STORAGE_KEY, '{invalid');
    const repo = createUserRepository({ storage: () => local, simulation: instant });
    await expect(repo.listFavorites()).rejects.toThrow('carregar');
    await expect(repo.setFavorite(film(1), true)).rejects.toThrow('salvar');
    expect(local.getItem(FAVORITES_STORAGE_KEY)).toBe('{invalid');
    const blocked = createUserRepository({
      storage: () => {
        throw new Error('blocked');
      },
      simulation: instant,
    });
    await expect(blocked.listFavorites()).rejects.toThrow('carregar');
    const full = createUserRepository({
      storage: () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('quota');
        },
      }),
      simulation: instant,
    });
    await expect(full.setFavorite(film(1), true)).rejects.toThrow('salvar');
  });
  it('valida configuração e desativa simulação nos testes', () => {
    expect(readSimulationConfig()).toEqual({ delayMinMs: 300, delayMaxMs: 1500, failWrites: true });
    expect(readSimulationConfig({ MODE: 'test' })).toEqual(instant);
    expect(
      readSimulationConfig({
        VITE_USER_DATA_DELAY_MIN_MS: '0',
        VITE_USER_DATA_DELAY_MAX_MS: '0',
        VITE_USER_DATA_FAIL_WRITES: 'false',
      }),
    ).toEqual(instant);
    for (const env of [
      { VITE_USER_DATA_DELAY_MIN_MS: '-1' },
      { VITE_USER_DATA_DELAY_MAX_MS: '299' },
      { VITE_USER_DATA_DELAY_MAX_MS: '60001' },
      { VITE_USER_DATA_FAIL_WRITES: 'no' },
    ])
      expect(() => readSimulationConfig(env)).toThrow('Configuração');
  });
});
