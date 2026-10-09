import { describe, expect, it } from 'vitest';
import { reviewInputSchema } from './user-data';
describe('schema de avaliação', () => {
  it('aceita todos os passos de 0,5, comentário opcional e normaliza espaços', () => {
    for (let rating = 0.5; rating <= 10; rating += 0.5)
      expect(reviewInputSchema.parse({ rating: String(rating) })).toEqual({ rating, comment: '' });
    expect(reviewInputSchema.parse({ rating: '8.5', comment: '  Bom filme.  ' })).toEqual({
      rating: 8.5,
      comment: 'Bom filme.',
    });
    expect(reviewInputSchema.parse({ rating: 10, comment: 'a'.repeat(500) }).comment).toHaveLength(
      500,
    );
  });
  it('rejeita nota ausente, fora do intervalo ou entre os passos', () => {
    for (const rating of [undefined, '', 0, -1, 0.3, 0.75, 10.5, NaN, Infinity, 'abc']) {
      const result = reviewInputSchema.safeParse({ rating });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.path).toEqual(['rating']);
    }
  });
  it('identifica os dois campos inválidos sem alterar o objeto informado', () => {
    const input = { rating: '11', comment: 'a'.repeat(501) };
    const result = reviewInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(['rating', 'comment']);
    expect(input).toEqual({ rating: '11', comment: 'a'.repeat(501) });
  });
});
