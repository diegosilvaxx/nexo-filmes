import { describe, expect, it, vi } from 'vitest';
import type { MovieSummary } from '@nexo/contracts';
import { createFavoritesStore } from './store';
const film = (id: number): MovieSummary => ({
  id,
  title: `Filme ${id}`,
  year: 2020,
  posterUrl: null,
  tmdbRating: 8,
  genres: [],
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
describe('estado compartilhado dos favoritos', () => {
  it('publica imediatamente, bloqueia repetição e reverte apenas a gravação que falhou', async () => {
    const first = deferred<void>();
    const second = deferred<void>();
    const repository = {
      listFavorites: vi.fn().mockResolvedValue([]),
      setFavorite: vi
        .fn()
        .mockImplementation((movie: MovieSummary) =>
          movie.id === 13 ? first.promise : second.promise,
        ),
    };
    const store = createFavoritesStore(repository);
    const changed = vi.fn();
    const unsubscribe = store.subscribe(changed);
    await store.initialize();
    const failed = store.toggleFavorite(film(13));
    const saved = store.toggleFavorite(film(2));
    const duplicate = store.toggleFavorite(film(2));
    expect(store.getSnapshot().favorites.map((item) => item.id)).toEqual([13, 2]);
    expect(store.getSnapshot().pendingIds).toEqual([13, 2]);
    expect(repository.setFavorite).toHaveBeenCalledTimes(2);
    second.resolve();
    expect(await saved).toBe(true);
    expect(await duplicate).toBe(true);
    first.reject(new Error('failure'));
    expect(await failed).toBe(false);
    expect(store.getSnapshot()).toMatchObject({
      favorites: [film(2)],
      pendingIds: [],
      error: expect.stringContaining('desfeita'),
    });
    expect(changed).toHaveBeenCalled();
    unsubscribe();
    changed.mockClear();
    await store.refresh();
    expect(changed).not.toHaveBeenCalled();
  });
  it('restaura remoção que falhou e mantém snapshot estável enquanto não há mudança', async () => {
    const repository = {
      listFavorites: vi.fn().mockResolvedValue([film(13)]),
      setFavorite: vi.fn().mockRejectedValue(new Error('failure')),
    };
    const store = createFavoritesStore(repository);
    await store.initialize();
    expect(store.getSnapshot()).toBe(store.getSnapshot());
    const operation = store.toggleFavorite(film(13));
    expect(store.getSnapshot().favorites).toEqual([]);
    expect(await operation).toBe(false);
    expect(store.getSnapshot().favorites).toEqual([film(13)]);
  });
  it('compartilha carregamento e permite nova tentativa após erro inicial', async () => {
    const repository = {
      listFavorites: vi
        .fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue([film(1)]),
      setFavorite: vi.fn().mockResolvedValue(undefined),
    };
    const store = createFavoritesStore(repository);
    await Promise.all([store.initialize(), store.initialize()]);
    expect(repository.listFavorites).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe('error');
    expect(await store.toggleFavorite(film(2))).toBe(true);
    expect(store.getSnapshot().favorites).toEqual([film(1), film(2)]);
    await store.initialize();
    expect(repository.listFavorites).toHaveBeenCalledTimes(2);
  });
  it('adianta leitura de outra aba para depois de uma escrita pendente', async () => {
    const write = deferred<void>();
    const repository = {
      listFavorites: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValue([film(1), film(2)]),
      setFavorite: vi.fn().mockReturnValue(write.promise),
    };
    const store = createFavoritesStore(repository);
    await store.initialize();
    const operation = store.toggleFavorite(film(1));
    await store.refresh();
    expect(repository.listFavorites).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().favorites).toEqual([film(1)]);
    write.resolve();
    await operation;
    await vi.waitFor(() => expect(store.getSnapshot().favorites).toEqual([film(1), film(2)]));
  });
  it('não substitui escrita otimista por leitura iniciada anteriormente', async () => {
    const read = deferred<MovieSummary[]>();
    const write = deferred<void>();
    const repository = {
      listFavorites: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockReturnValueOnce(read.promise)
        .mockResolvedValue([film(1)]),
      setFavorite: vi.fn().mockReturnValue(write.promise),
    };
    const store = createFavoritesStore(repository);
    await store.initialize();
    const refresh = store.refresh();
    const operation = store.toggleFavorite(film(1));
    read.resolve([]);
    await refresh;
    expect(store.getSnapshot().favorites).toEqual([film(1)]);
    write.resolve();
    await operation;
    await vi.waitFor(() => expect(repository.listFavorites).toHaveBeenCalledTimes(3));
  });
});
