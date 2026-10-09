import { useReviews } from '@nexo/user-data';
import { LoadingState, RequestError } from '@nexo/ui';
import { ReviewForm } from './ReviewForm';
import { ReviewArea, SectionTitle } from './movie.styles';
export function ReviewSection({ movieId }: { movieId: number }) {
  const reviews = useReviews();
  return (
    <ReviewArea aria-labelledby="review-heading">
      <SectionTitle id="review-heading" tabIndex={-1}>
        Sua avaliação
      </SectionTitle>
      {reviews.status === 'idle' || reviews.status === 'loading' ? (
        <LoadingState label="Carregando sua avaliação…" />
      ) : reviews.status === 'error' ? (
        <RequestError
          message={reviews.error ?? 'Não foi possível carregar sua avaliação.'}
          onRetry={() => void reviews.retry()}
        />
      ) : (
        <>
          {reviews.error && (
            <RequestError message={reviews.error} onRetry={() => void reviews.retry()} />
          )}
          <ReviewForm
            movieId={movieId}
            review={reviews.reviews.find((review) => review.movieId === movieId)}
            pending={reviews.pendingIds.includes(movieId)}
            saveReview={reviews.saveReview}
            deleteReview={reviews.deleteReview}
          />
        </>
      )}
    </ReviewArea>
  );
}
