import { expect, it } from 'vitest';
import { getPageItems } from './pagination';

it.each([
  { page: 1, total: 5, expected: [1, 2, 3, 4, 5] },
  { page: 3, total: 7, expected: [1, 2, 3, 4, 5, 6, 7] },
  { page: 1, total: 500, expected: [1, 2, 3, 4, 5, 'end-ellipsis', 500] },
  { page: 4, total: 500, expected: [1, 2, 3, 4, 5, 'end-ellipsis', 500] },
  { page: 6, total: 500, expected: [1, 'start-ellipsis', 5, 6, 7, 'end-ellipsis', 500] },
  { page: 499, total: 500, expected: [1, 'start-ellipsis', 496, 497, 498, 499, 500] },
  { page: 500, total: 500, expected: [1, 'start-ellipsis', 496, 497, 498, 499, 500] },
])('mostra páginas válidas e intervalos na página $page de $total', ({ page, total, expected }) => {
  expect(getPageItems(page, total)).toEqual(expected);
});
