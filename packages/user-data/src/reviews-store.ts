import {
  USER_DATA_CHANGED,
  reviewInputSchema,
  movieIdSchema,
  type Review,
  type ReviewInput,
  type UserDataChangedEvent,
} from '@nexo/contracts';
import type { ReviewsRepository } from './repository';
export interface ReviewsSnapshot {
  status: 'idle' | 'loading' | 'ready' | 'error';
  reviews: readonly Review[];
  pendingIds: readonly number[];
  error: string | null;
}
export const emptyReviews: ReviewsSnapshot = {
  status: 'idle',
  reviews: [],
  pendingIds: [],
  error: null,
};
export function createReviewsStore(
  repository: ReviewsRepository,
  events: EventTarget = new EventTarget(),
) {
  let snapshot = emptyReviews;
  let initialization: Promise<boolean> | undefined;
  const pending = new Map<number, Promise<boolean>>();
  let refreshRequested = false;
  function publish(next: ReviewsSnapshot, reason: UserDataChangedEvent['reason']) {
    snapshot = next;
    events.dispatchEvent(
      new CustomEvent<UserDataChangedEvent>(USER_DATA_CHANGED, {
        detail: { resource: 'reviews', reason },
      }),
    );
  }
  async function load(refresh = false): Promise<boolean> {
    if (pending.size) {
      refreshRequested = true;
      return true;
    }
    if (initialization) return initialization;
    if (snapshot.status === 'ready' && !refresh) return true;
    if (snapshot.status !== 'ready')
      publish({ ...snapshot, status: 'loading', error: null }, 'loaded');
    const operation = repository
      .listReviews()
      .then((reviews) => {
        if (pending.size) {
          refreshRequested = true;
          return true;
        }
        publish({ status: 'ready', reviews, pendingIds: [], error: null }, 'loaded');
        return true;
      })
      .catch(() => {
        publish(
          {
            ...snapshot,
            status: snapshot.status === 'ready' ? 'ready' : 'error',
            error: 'Não foi possível carregar as avaliações. Tente novamente.',
          },
          'loaded',
        );
        return false;
      })
      .finally(() => {
        initialization = undefined;
      });
    initialization = operation;
    return operation;
  }
  async function write(movieId: number, review: Review | undefined): Promise<boolean> {
    if (!movieIdSchema.safeParse(movieId).success) return false;
    if (snapshot.status !== 'ready' && !(await load())) return false;
    const existing = pending.get(movieId);
    if (existing) return existing;
    if (snapshot.pendingIds.includes(movieId)) return false;
    const previous = snapshot.reviews.find((item) => item.movieId === movieId);
    const withoutMovie = snapshot.reviews.filter((item) => item.movieId !== movieId);
    publish(
      {
        ...snapshot,
        reviews: review ? [...withoutMovie, review] : withoutMovie,
        pendingIds: [...snapshot.pendingIds, movieId],
      },
      'optimistic',
    );
    const request = review
      ? repository.saveReview(movieId, review)
      : repository.deleteReview(movieId);
    const operation = request
      .then(() => {
        publish(
          { ...snapshot, pendingIds: snapshot.pendingIds.filter((id) => id !== movieId) },
          'saved',
        );
        return true;
      })
      .catch(() => {
        const reviews = snapshot.reviews.filter((item) => item.movieId !== movieId);
        if (previous) reviews.push(previous);
        publish(
          { ...snapshot, reviews, pendingIds: snapshot.pendingIds.filter((id) => id !== movieId) },
          'rollback',
        );
        return false;
      })
      .finally(() => {
        pending.delete(movieId);
        if (!pending.size && refreshRequested) {
          refreshRequested = false;
          void load(true);
        }
      });
    pending.set(movieId, operation);
    return operation;
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      events.addEventListener(USER_DATA_CHANGED, listener);
      return () => events.removeEventListener(USER_DATA_CHANGED, listener);
    },
    initialize: () => load(),
    refresh: () => load(true),
    saveReview: (movieId: number, input: ReviewInput) => {
      const result = reviewInputSchema.safeParse(input);
      return result.success ? write(movieId, { movieId, ...result.data }) : Promise.resolve(false);
    },
    deleteReview: (movieId: number) => write(movieId, undefined),
  };
}
