import { describe, expect, it, vi } from 'vitest';
import type { Review } from '@nexo/contracts';
import { createReviewsStore } from './reviews-store';
const review = (movieId: number, rating = 8): Review => ({
  movieId,
  rating,
  comment: 'Comentário',
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
function repository() {
  return {
    listReviews: vi.fn().mockResolvedValue([]),
    saveReview: vi.fn().mockResolvedValue(undefined),
    deleteReview: vi.fn().mockResolvedValue(undefined),
  };
}
describe('estado de avaliações', () => {
  it('substitui imediatamente, bloqueia duplicação e reverte apenas o filme que falhou', async () => {
    const first = deferred<Review>();
    const second = deferred<Review>();
    const repo = repository();
    repo.listReviews.mockResolvedValue([review(13, 5)]);
    repo.saveReview.mockImplementation((id: number) =>
      id === 13 ? first.promise : second.promise,
    );
    const store = createReviewsStore(repo);
    const changed = vi.fn();
    const unsubscribe = store.subscribe(changed);
    await store.initialize();
    const failed = store.saveReview(13, review(13, 9));
    const saved = store.saveReview(2, review(2));
    const duplicate = store.saveReview(2, review(2, 1));
    expect(store.getSnapshot().reviews).toEqual([review(13, 9), review(2)]);
    expect(store.getSnapshot().pendingIds).toEqual([13, 2]);
    expect(repo.saveReview).toHaveBeenCalledTimes(2);
    second.resolve(review(2));
    expect(await saved).toBe(true);
    expect(await duplicate).toBe(true);
    first.reject(new Error('failure'));
    expect(await failed).toBe(false);
    expect(store.getSnapshot().reviews).toEqual([review(2), review(13, 5)]);
    expect(store.getSnapshot().pendingIds).toEqual([]);
    expect(changed).toHaveBeenCalled();
    unsubscribe();
    changed.mockClear();
    await store.refresh();
    expect(changed).not.toHaveBeenCalled();
  });
  it('exclui imediatamente e restaura avaliação se a exclusão falhar', async () => {
    const write = deferred<void>();
    const repo = repository();
    repo.listReviews.mockResolvedValue([review(13)]);
    repo.deleteReview.mockReturnValue(write.promise);
    const store = createReviewsStore(repo);
    await store.initialize();
    const operation = store.deleteReview(13);
    expect(store.getSnapshot().reviews).toEqual([]);
    write.reject(new Error('failure'));
    expect(await operation).toBe(false);
    expect(store.getSnapshot().reviews).toEqual([review(13)]);
    await store.deleteReview(1);
    expect(store.getSnapshot().reviews).toEqual([review(13)]);
  });
  it('impede dados inválidos antes da persistência e recupera erro inicial', async () => {
    const repo = repository();
    repo.listReviews.mockRejectedValueOnce(new Error('blocked'));
    const store = createReviewsStore(repo);
    await Promise.all([store.initialize(), store.initialize()]);
    expect(repo.listReviews).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe('error');
    expect(await store.saveReview(1, { rating: 0.3, comment: '' })).toBe(false);
    expect(await store.saveReview(-1, review(1))).toBe(false);
    expect(repo.saveReview).not.toHaveBeenCalled();
    expect(await store.saveReview(1, review(1))).toBe(true);
    expect(store.getSnapshot().reviews).toEqual([review(1)]);
    await store.initialize();
    expect(repo.listReviews).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });
  it('adia atualização de outra aba durante a escrita', async () => {
    const write = deferred<Review>();
    const repo = repository();
    repo.saveReview.mockReturnValue(write.promise);
    repo.listReviews.mockResolvedValueOnce([]).mockResolvedValue([review(1), review(2)]);
    const store = createReviewsStore(repo);
    await store.initialize();
    const operation = store.saveReview(1, review(1));
    await store.refresh();
    expect(repo.listReviews).toHaveBeenCalledTimes(1);
    write.resolve(review(1));
    await operation;
    await vi.waitFor(() => expect(store.getSnapshot().reviews).toEqual([review(1), review(2)]));
  });
  it('ignora leitura antiga que termina durante uma gravação', async () => {
    const read = deferred<Review[]>();
    const write = deferred<Review>();
    const repo = repository();
    repo.listReviews
      .mockResolvedValueOnce([])
      .mockReturnValueOnce(read.promise)
      .mockResolvedValue([review(1)]);
    repo.saveReview.mockReturnValue(write.promise);
    const store = createReviewsStore(repo);
    await store.initialize();
    const refresh = store.refresh();
    const operation = store.saveReview(1, review(1));
    read.resolve([]);
    await refresh;
    expect(store.getSnapshot().reviews).toEqual([review(1)]);
    write.resolve(review(1));
    await operation;
    await vi.waitFor(() => expect(repo.listReviews).toHaveBeenCalledTimes(3));
  });
});
