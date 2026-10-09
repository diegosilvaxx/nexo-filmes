import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSyncExternalStore } from 'react';
import { expect, it, vi } from 'vitest';
import { createReviewsStore, createUserRepository } from '@nexo/user-data';
import { UIProvider } from '@nexo/ui';
import type { Review } from '@nexo/contracts';
import { ReviewForm } from './ReviewForm';
const saved: Review = { movieId: 550, rating: 8, comment: 'Original' };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function ControlledForm({
  store,
  movieId = 550,
}: {
  store: ReturnType<typeof createReviewsStore>;
  movieId?: number;
}) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const review = state.reviews.find((item) => item.movieId === movieId);
  return (
    <UIProvider>
      <output aria-label="Nota salva">{review?.rating ?? '—'}</output>
      <ReviewForm
        movieId={movieId}
        review={review}
        pending={state.pendingIds.includes(movieId)}
        saveReview={store.saveReview}
        deleteReview={store.deleteReview}
      />
    </UIProvider>
  );
}
it('mostra mensagens por campo, foca a primeira falha e preserva todos os valores', async () => {
  const saveReview = vi.fn();
  render(
    <UIProvider>
      <ReviewForm
        movieId={550}
        review={undefined}
        pending={false}
        saveReview={saveReview}
        deleteReview={vi.fn()}
      />
    </UIProvider>,
  );
  const note = screen.getByLabelText(/Sua nota/);
  const comment = screen.getByLabelText(/Comentário/);
  fireEvent.change(note, { target: { value: '11' } });
  fireEvent.change(comment, { target: { value: 'a'.repeat(501) } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(note).toHaveFocus();
  expect(note).toHaveValue(11);
  expect(comment).toHaveValue('a'.repeat(501));
  expect(note).toHaveAccessibleDescription(/A nota deve ser de 0,5 a 10/);
  expect(comment).toHaveAccessibleDescription(/até 500 caracteres/);
  expect(saveReview).not.toHaveBeenCalled();
  fireEvent.change(note, { target: { value: '8.5' } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(comment).toHaveFocus();
  expect(note).toHaveValue(8.5);
});
it('preserva a nota digitada e valida limites e passos somente ao salvar com Zod', async () => {
  const saveReview = vi.fn().mockResolvedValue(true);
  render(
    <UIProvider>
      <ReviewForm
        movieId={550}
        review={undefined}
        pending={false}
        saveReview={saveReview}
        deleteReview={vi.fn()}
      />
    </UIProvider>,
  );
  const note = screen.getByLabelText(/Sua nota/);
  const user = userEvent.setup();
  await user.type(note, '0.56546544');
  expect(note).toHaveValue(0.56546544);
  await user.clear(note);
  expect(note).toHaveValue(null);
  await user.type(note, '0.5');
  expect(note).toHaveValue(0.5);
  await user.clear(note);
  await user.type(note, '1.6');
  expect(note).toHaveValue(1.6);
  expect(note).toHaveAttribute('aria-invalid', 'false');
  await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(note).toHaveValue(1.6);
  expect(note).toHaveFocus();
  expect(note).toHaveAccessibleDescription(/passos de 0,5/);
  expect(saveReview).not.toHaveBeenCalled();
  for (const value of ['11.234', '0.2']) {
    fireEvent.change(note, { target: { value } });
    fireEvent.blur(note);
    expect(note).toHaveValue(Number(value));
    await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
    expect(note).toHaveValue(Number(value));
    expect(note).toHaveAccessibleDescription(/A nota deve ser de 0,5 a 10/);
    expect(saveReview).not.toHaveBeenCalled();
  }
  fireEvent.change(note, { target: { value: '1.5' } });
  await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(saveReview).toHaveBeenCalledWith(550, { rating: 1.5, comment: '' });
});
it('aceita digitar mais de 500 caracteres e bloqueia a gravação com Zod ao salvar', async () => {
  const saveReview = vi.fn().mockResolvedValue(true);
  render(
    <UIProvider>
      <ReviewForm
        movieId={550}
        review={undefined}
        pending={false}
        saveReview={saveReview}
        deleteReview={vi.fn()}
      />
    </UIProvider>,
  );
  const comment = screen.getByLabelText(/Comentário/);
  fireEvent.change(screen.getByLabelText(/Sua nota/), { target: { value: '8.5' } });
  fireEvent.change(comment, { target: { value: 'a'.repeat(500) } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(comment).not.toHaveAttribute('maxlength');
  await userEvent.setup().type(comment, 'a');
  expect(comment).toHaveValue('a'.repeat(501));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(comment).toHaveAttribute('aria-invalid', 'false');
  await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(screen.getByRole('alert')).toHaveTextContent('O comentário deve ter até 500 caracteres.');
  expect(comment).toHaveAttribute('aria-invalid', 'true');
  expect(comment).toHaveValue('a'.repeat(501));
  expect(comment).toHaveFocus();
  expect(saveReview).not.toHaveBeenCalled();
  fireEvent.change(comment, { target: { value: 'a'.repeat(500) } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(comment).toHaveAttribute('aria-invalid', 'false');
  await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(saveReview).toHaveBeenCalledWith(550, { rating: 8.5, comment: 'a'.repeat(500) });
});
it('falha ao salvar ID 13 com o repositório real, desfaz a nota e preserva os campos', async () => {
  const storage = { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() };
  const store = createReviewsStore(
    createUserRepository({
      storage: () => storage,
      simulation: { delayMinMs: 0, delayMaxMs: 0, failWrites: true },
    }),
  );
  await store.initialize();
  render(<ControlledForm store={store} movieId={13} />);
  fireEvent.change(screen.getByLabelText(/Sua nota/), { target: { value: '7.5' } });
  fireEvent.change(screen.getByLabelText(/Comentário/), { target: { value: 'Meu comentário' } });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar');
  expect(screen.getByLabelText(/Sua nota/)).toHaveValue(7.5);
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('Meu comentário');
  expect(screen.getByLabelText('Nota salva')).toHaveTextContent('—');
  expect(storage.setItem).not.toHaveBeenCalled();
});
it('exige nota e aceita comentário vazio sem validação nativa bloquear o schema', async () => {
  const saveReview = vi.fn().mockResolvedValue(true);
  render(
    <UIProvider>
      <ReviewForm
        movieId={550}
        review={undefined}
        pending={false}
        saveReview={saveReview}
        deleteReview={vi.fn()}
      />
    </UIProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(screen.getByLabelText(/Sua nota/)).toHaveFocus();
  expect(saveReview).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText(/Sua nota/), '0.5');
  await user.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  expect(saveReview).toHaveBeenCalledWith(550, { rating: 0.5, comment: '' });
  expect(await screen.findByRole('status')).toHaveTextContent('Avaliação salva.');
});
it('edita avaliação, publica a nota otimista e bloqueia os campos durante salvamento', async () => {
  const request = deferred<Review>();
  const repo = {
    listReviews: vi.fn().mockResolvedValue([saved]),
    saveReview: vi.fn().mockReturnValue(request.promise),
    deleteReview: vi.fn(),
  };
  const store = createReviewsStore(repo);
  await store.initialize();
  render(<ControlledForm store={store} />);
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText(/Sua nota/));
  await user.type(screen.getByLabelText(/Sua nota/), '9.5');
  await user.clear(screen.getByLabelText(/Comentário/));
  await user.type(screen.getByLabelText(/Comentário/), '  Revisado  ');
  await user.click(screen.getByRole('button', { name: 'Atualizar avaliação' }));
  expect(screen.getByLabelText('Nota salva')).toHaveTextContent('9.5');
  expect(screen.getByLabelText(/Sua nota/)).toBeDisabled();
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('  Revisado  ');
  expect(screen.getByRole('button', { name: 'Salvando avaliação…' })).toBeDisabled();
  await act(async () => {
    request.resolve({ movieId: 550, rating: 9.5, comment: 'Revisado' });
  });
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('Revisado');
  expect(screen.getByRole('status', { name: '' })).toHaveTextContent('Avaliação salva.');
  expect(store.getSnapshot().reviews).toHaveLength(1);
});
it('restaura a nota persistida após falha de edição e mantém o rascunho para tentar novamente', async () => {
  const repo = {
    listReviews: vi.fn().mockResolvedValue([saved]),
    saveReview: vi.fn().mockRejectedValueOnce(new Error('failure')).mockResolvedValue(saved),
    deleteReview: vi.fn(),
  };
  const store = createReviewsStore(repo);
  await store.initialize();
  render(<ControlledForm store={store} />);
  const user = userEvent.setup();
  fireEvent.change(screen.getByLabelText(/Sua nota/), { target: { value: '7.5' } });
  fireEvent.change(screen.getByLabelText(/Comentário/), { target: { value: 'Novo comentário' } });
  await user.click(screen.getByRole('button', { name: 'Atualizar avaliação' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Seus dados foram mantidos');
  expect(screen.getByLabelText('Nota salva')).toHaveTextContent('8');
  expect(screen.getByLabelText(/Sua nota/)).toHaveValue(7.5);
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('Novo comentário');
  await user.click(screen.getByRole('button', { name: 'Atualizar avaliação' }));
  expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Avaliação salva.');
  expect(screen.getByLabelText('Nota salva')).toHaveTextContent('7.5');
});
it('preserva rascunho se exclusão falhar e limpa os campos e foca a nota ao excluir', async () => {
  const repo = {
    listReviews: vi.fn().mockResolvedValue([saved]),
    saveReview: vi.fn(),
    deleteReview: vi.fn().mockRejectedValueOnce(new Error('failure')).mockResolvedValue(undefined),
  };
  const store = createReviewsStore(repo);
  await store.initialize();
  render(<ControlledForm store={store} />);
  const user = userEvent.setup();
  fireEvent.change(screen.getByLabelText(/Comentário/), { target: { value: 'Rascunho' } });
  await user.click(screen.getByRole('button', { name: 'Excluir avaliação' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível excluir');
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('Rascunho');
  expect(screen.getByLabelText('Nota salva')).toHaveTextContent('8');
  await user.click(screen.getByRole('button', { name: 'Excluir avaliação' }));
  expect(await screen.findByRole('status', { name: '' })).toHaveTextContent('Avaliação excluída.');
  expect(screen.getByLabelText(/Sua nota/)).toHaveValue(null);
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('');
  expect(screen.getByLabelText(/Sua nota/)).toHaveFocus();
  expect(screen.queryByRole('button', { name: 'Excluir avaliação' })).not.toBeInTheDocument();
});
it('não sobrescreve edição em andamento quando outra aba muda a avaliação salva', async () => {
  const repo = {
    listReviews: vi
      .fn()
      .mockResolvedValueOnce([saved])
      .mockResolvedValue([{ ...saved, rating: 9 }]),
    saveReview: vi.fn(),
    deleteReview: vi.fn(),
  };
  const store = createReviewsStore(repo);
  await store.initialize();
  render(<ControlledForm store={store} />);
  fireEvent.change(screen.getByLabelText(/Comentário/), { target: { value: 'Ainda escrevendo' } });
  await act(() => store.refresh());
  expect(screen.getByLabelText('Nota salva')).toHaveTextContent('9');
  expect(screen.getByLabelText(/Comentário/)).toHaveValue('Ainda escrevendo');
  expect(screen.getByLabelText(/Sua nota/)).toHaveValue(8);
});
