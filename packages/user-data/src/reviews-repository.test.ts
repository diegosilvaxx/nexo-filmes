import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAVORITES_STORAGE_KEY, REVIEWS_STORAGE_KEY } from '@nexo/contracts';
import { createUserRepository } from './repository';
const instant = { delayMinMs: 0, delayMaxMs: 0, failWrites: false };
function localStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
const review = { rating: 8.5, comment: 'Bom filme.' };
afterEach(() => {
  vi.useRealTimers();
});
describe('repositório de avaliações', () => {
  it('substitui avaliação do mesmo filme, preserva outras e persiste após nova instância', async () => {
    const storage = localStorage();
    const repo = createUserRepository({ storage: () => storage, simulation: instant });
    await Promise.all([repo.saveReview(1, review), repo.saveReview(2, { rating: 7, comment: '' })]);
    await repo.saveReview(1, { rating: 9.5, comment: '  Revisado.  ' });
    expect(
      await createUserRepository({ storage: () => storage, simulation: instant }).listReviews(),
    ).toEqual([
      { movieId: 1, rating: 9.5, comment: 'Revisado.' },
      { movieId: 2, rating: 7, comment: '' },
    ]);
    await repo.deleteReview(1);
    expect(await repo.listReviews()).toEqual([{ movieId: 2, rating: 7, comment: '' }]);
    await repo.deleteReview(1);
    expect(await repo.listReviews()).toHaveLength(1);
  });
  it('simula atraso nas leituras, salvamentos e exclusões', async () => {
    vi.useFakeTimers();
    const storage = localStorage();
    const repo = createUserRepository({ storage: () => storage, random: () => 0 });
    for (const operation of [
      () => repo.saveReview(1, review),
      () => repo.listReviews(),
      () => repo.deleteReview(1),
    ]) {
      const finished = vi.fn();
      const pending = operation().then(finished);
      await vi.advanceTimersByTimeAsync(299);
      expect(finished).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await pending;
      expect(finished).toHaveBeenCalledOnce();
    }
  });
  it('falha em criação, edição e exclusão de ID terminado em 13 sem mudar dados', async () => {
    const storage = localStorage();
    await createUserRepository({ storage: () => storage, simulation: instant }).saveReview(
      113,
      review,
    );
    const original = storage.getItem(REVIEWS_STORAGE_KEY);
    const repo = createUserRepository({
      storage: () => storage,
      simulation: { ...instant, failWrites: true },
    });
    await expect(repo.saveReview(13, review)).rejects.toThrow('salvar');
    await expect(repo.saveReview(113, { rating: 3, comment: 'Editado' })).rejects.toThrow('salvar');
    await expect(repo.deleteReview(113)).rejects.toThrow('excluir');
    expect(storage.getItem(REVIEWS_STORAGE_KEY)).toBe(original);
  });
  it('valida dados e preserva conteúdo corrompido ou armazenamento indisponível', async () => {
    const storage = localStorage();
    const repo = createUserRepository({ storage: () => storage, simulation: instant });
    await expect(repo.saveReview(1, { rating: 0.7, comment: '' })).rejects.toThrow('salvar');
    await expect(repo.saveReview(-1, review)).rejects.toThrow('salvar');
    await expect(repo.deleteReview(0)).rejects.toThrow('excluir');
    expect(storage.getItem(REVIEWS_STORAGE_KEY)).toBeNull();
    storage.setItem(REVIEWS_STORAGE_KEY, '{invalid');
    storage.setItem(FAVORITES_STORAGE_KEY, '{"version":1,"favorites":[]}');
    await expect(repo.listReviews()).rejects.toThrow('carregar');
    await expect(repo.saveReview(1, review)).rejects.toThrow('salvar');
    await expect(repo.deleteReview(1)).rejects.toThrow('excluir');
    expect(storage.getItem(REVIEWS_STORAGE_KEY)).toBe('{invalid');
    expect(await repo.listFavorites()).toEqual([]);
    const blocked = createUserRepository({
      storage: () => {
        throw new Error('blocked');
      },
      simulation: instant,
    });
    await expect(blocked.listReviews()).rejects.toThrow('carregar');
    const full = createUserRepository({
      storage: () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error('quota');
        },
      }),
      simulation: instant,
    });
    await expect(full.saveReview(1, review)).rejects.toThrow('salvar');
  });
});
