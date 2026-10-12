import { test, expect } from './fixtures';

test('catálogo, filtros, busca e detalhes reutilizam o cache durante a navegação', async ({
  page,
  api,
}) => {
  await page.goto('/filmes');
  const cards = page.getByRole('article').getByRole('link');
  const requests = (path: string) => api.requests.filter((url) => url.pathname === path).length;
  const home = () =>
    page.getByRole('banner').getByRole('link', { name: 'Filmes', exact: true }).click();
  const details = () =>
    page
      .getByRole('article')
      .getByRole('link', { name: /Clube da Luta/ })
      .click();
  await expect(cards).toHaveCount(20);
  expect(requests('/api/genres')).toBe(1);
  expect(requests('/api/movies')).toBe(1);
  await details();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();
  await home();
  await expect(cards).toHaveCount(20);
  await details();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();
  expect(requests('/api/movies/550')).toBe(1);
  await home();
  await expect(cards).toHaveCount(20);
  expect(requests('/api/genres')).toBe(1);
  expect(requests('/api/movies')).toBe(1);

  const genre = page.getByRole('combobox', { name: 'Gênero', exact: true });
  await genre.selectOption('18');
  await expect(page).toHaveURL(/genreId=18/);
  await expect(cards).toHaveCount(20);
  expect(requests('/api/movies')).toBe(2);
  await genre.selectOption('');
  await expect(page).not.toHaveURL(/genreId=/);
  await expect(cards).toHaveCount(20);
  expect(requests('/api/movies')).toBe(2);
  await page.getByLabel('Buscar por título').fill('Clube');
  await expect(cards).toHaveCount(1);
  expect(requests('/api/movies')).toBe(3);
  await page.getByLabel('Buscar por título').fill('');
  await expect(cards).toHaveCount(20);
  await page.getByLabel('Buscar por título').fill('Clube');
  await expect(cards).toHaveCount(1);
  expect(requests('/api/movies')).toBe(3);

  await page.reload();
  await expect(cards).toHaveCount(1);
  expect(requests('/api/genres')).toBe(2);
  expect(requests('/api/movies')).toBe(4);
});

test('renova catálogo e detalhes após seus prazos de validade', async ({ page, api }) => {
  const initialTime = new Date('2026-10-12T12:00:00Z').getTime();
  await page.clock.setFixedTime(initialTime);
  await page.goto('/filmes');
  const cards = page.getByRole('article').getByRole('link');
  const requests = (path: string) => api.requests.filter((url) => url.pathname === path).length;
  const home = () =>
    page.getByRole('banner').getByRole('link', { name: 'Filmes', exact: true }).click();
  const details = () =>
    page
      .getByRole('article')
      .getByRole('link', { name: /Clube da Luta/ })
      .click();
  await expect(cards).toHaveCount(20);
  await details();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();

  await page.clock.setFixedTime(initialTime + 120_000);
  await home();
  await expect(cards).toHaveCount(20);
  expect(requests('/api/movies')).toBe(2);
  expect(requests('/api/genres')).toBe(1);
  await details();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();
  expect(requests('/api/movies/550')).toBe(1);

  await page.clock.setFixedTime(initialTime + 300_000);
  await home();
  await expect(cards).toHaveCount(20);
  await details();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();
  expect(requests('/api/movies/550')).toBe(2);
  expect(requests('/api/genres')).toBe(1);
});
