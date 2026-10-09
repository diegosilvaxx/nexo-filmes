import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react';
import { reviewInputSchema, type Review, type ReviewInput } from '@nexo/contracts';
import { Button } from '@nexo/ui';
import { Actions, FieldError, Form, FormField, FormStatus, Help } from './movie.styles';

interface ReviewFormProps {
  movieId: number;
  review: Review | undefined;
  pending: boolean;
  saveReview: (id: number, input: ReviewInput) => Promise<boolean>;
  deleteReview: (id: number) => Promise<boolean>;
}
function values(review: Review | undefined) {
  return { rating: review ? String(review.rating) : '', comment: review?.comment ?? '' };
}
export function ReviewForm({
  movieId,
  review,
  pending,
  saveReview,
  deleteReview,
}: ReviewFormProps) {
  const id = useId();
  const source = JSON.stringify(review ?? null);
  const [fields, setFields] = useState({ ...values(review), source, dirty: false });
  if (!fields.dirty && fields.source !== source)
    setFields({ ...values(review), source, dirty: false });
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});
  const [message, setMessage] = useState<{ text: string; failed: boolean }>();
  const rating = useRef<HTMLInputElement>(null);
  const comment = useRef<HTMLTextAreaElement>(null);
  const [action, setAction] = useState<'save' | 'delete'>('save');
  const focusAfterDelete = useRef(false);
  useEffect(() => {
    if (focusAfterDelete.current && !pending) {
      rating.current?.focus();
      focusAfterDelete.current = false;
    }
  }, [pending, message]);
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setMessage(undefined);
    const result = reviewInputSchema.safeParse({ rating: fields.rating, comment: fields.comment });
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if ((field === 'rating' || field === 'comment') && !next[field])
          next[field] = issue.message;
      }
      setErrors(next);
      (next.rating ? rating : comment).current?.focus();
      return;
    }
    setErrors({});
    setAction('save');
    const success = await saveReview(movieId, result.data);
    if (success)
      setFields({
        rating: String(result.data.rating),
        comment: result.data.comment,
        source,
        dirty: false,
      });
    setMessage({
      failed: !success,
      text: success
        ? 'Avaliação salva.'
        : 'Não foi possível salvar a avaliação. Seus dados foram mantidos. Tente novamente.',
    });
  }
  async function remove() {
    if (pending) return;
    setMessage(undefined);
    setAction('delete');
    const success = await deleteReview(movieId);
    if (success) {
      setFields({ rating: '', comment: '', source: 'null', dirty: false });
      setErrors({});
      focusAfterDelete.current = true;
    }
    setMessage({
      failed: !success,
      text: success
        ? 'Avaliação excluída.'
        : 'Não foi possível excluir a avaliação. Seus dados foram mantidos. Tente novamente.',
    });
  }
  return (
    <Form noValidate onSubmit={(event) => void save(event)} aria-busy={pending}>
      <FormField>
        <label htmlFor={`${id}-rating`}>
          Sua nota <span aria-hidden="true">*</span>
        </label>
        <input
          id={`${id}-rating`}
          ref={rating}
          type="number"
          inputMode="decimal"
          min="0.5"
          max="10"
          step="0.5"
          required
          value={fields.rating}
          disabled={pending}
          aria-invalid={Boolean(errors.rating)}
          aria-describedby={`${id}-rating-help${errors.rating ? ` ${id}-rating-error` : ''}`}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setFields((current) => ({
              ...current,
              rating: value,
              dirty: true,
            }));
            setErrors((current) => ({ ...current, rating: '' }));
            setMessage(undefined);
          }}
        />
        <Help id={`${id}-rating-help`}>Obrigatória. De 0,5 a 10, em passos de 0,5.</Help>
        {errors.rating && <FieldError id={`${id}-rating-error`}>{errors.rating}</FieldError>}
      </FormField>
      <FormField>
        <label htmlFor={`${id}-comment`}>
          Comentário <span>(opcional)</span>
        </label>
        <textarea
          id={`${id}-comment`}
          ref={comment}
          rows={5}
          value={fields.comment}
          disabled={pending}
          aria-invalid={Boolean(errors.comment)}
          aria-describedby={`${id}-comment-help${errors.comment ? ` ${id}-comment-error` : ''}`}
          onChange={(event) => {
            setFields({ ...fields, comment: event.target.value, dirty: true });
            setErrors((current) => ({ ...current, comment: '' }));
            setMessage(undefined);
          }}
        />
        <Help id={`${id}-comment-help`}>{fields.comment.length}/500 caracteres.</Help>
        {errors.comment && (
          <FieldError id={`${id}-comment-error`} role="alert">
            {errors.comment}
          </FieldError>
        )}
      </FormField>
      <Actions>
        <Button type="submit" disabled={pending}>
          {pending && action === 'save'
            ? 'Salvando avaliação…'
            : review
              ? 'Atualizar avaliação'
              : 'Salvar avaliação'}
        </Button>
        {review && (
          <Button type="button" disabled={pending} onClick={() => void remove()}>
            {pending && action === 'delete' ? 'Excluindo avaliação…' : 'Excluir avaliação'}
          </Button>
        )}
      </Actions>
      {pending && (
        <FormStatus role="status">
          {action === 'delete' ? 'Excluindo avaliação…' : 'Salvando avaliação…'}
        </FormStatus>
      )}
      {message && (
        <FormStatus role={message.failed ? 'alert' : 'status'}>{message.text}</FormStatus>
      )}
    </Form>
  );
}
