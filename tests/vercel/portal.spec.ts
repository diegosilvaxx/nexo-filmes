import { test, expect, favoriteCounter } from '../e2e/fixtures';

test('builds Vercel integram remotes, API, navegação e recarga no mesmo domínio', async ({
  page,
  request,
}) => {
  const health = await request.get('/api/health');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toEqual({ status: 'ok' });
  for (const remote of ['catalog', 'movie', 'area']) {
    const entry = await request.get(`/remotes/${remote}/remoteEntry.js`);
    expect(entry.ok()).toBe(true);
    expect(entry.headers()['content-type']).toContain('javascript');
  }
  await page.goto('/filmes');
  await expect(page.getByRole('article')).toHaveCount(20);
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  await page.getByRole('article').first().getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Clube da Luta' })).toBeVisible();
  await page.getByRole('button', { name: 'Favoritar: Clube da Luta', exact: true }).click();
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 1 favoritos');
  await expect(
    page.getByRole('button', { name: 'Favoritado: Clube da Luta. Remover dos favoritos' }),
  ).toBeEnabled();
  await favoriteCounter(page).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('banner').getByRole('link', { name: 'Painel', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Seu painel.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Seu painel.' })).toBeVisible();
});

test('remotes independentes respeitam seus caminhos e retornam ao portal no mesmo domínio', async ({
  page,
}) => {
  await page.goto('/remotes/catalog');
  await expect(page).toHaveURL(/\/remotes\/catalog\/filmes$/);
  await expect(page.getByRole('article')).toHaveCount(20);
  await expect(page.getByRole('article').first().getByRole('link')).toHaveAttribute(
    'href',
    'http://127.0.0.1:4500/filme/550',
  );
  await page.goto('/remotes/movie/filme/550');
  await expect(page.getByRole('heading', { level: 1, name: 'Clube da Luta' })).toBeVisible();
  await page.goto('/remotes/area/painel');
  await expect(page.getByRole('heading', { level: 1, name: 'Seu painel.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar filmes', exact: true })).toHaveAttribute(
    'href',
    'http://127.0.0.1:4500/filmes',
  );
  await page.setViewportSize({ width: 360, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await page.goto('/remotes/area');
  await expect(page.getByRole('heading', { level: 1, name: 'Seus favoritos.' })).toBeVisible();
});
