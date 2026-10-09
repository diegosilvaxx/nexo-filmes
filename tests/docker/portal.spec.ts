import { test, expect, metric, favoriteCounter } from '../e2e/fixtures';

test('Nginx serve as aplicações, o proxy do BFF e os remotes sem cache', async ({ request }) => {
  for (const port of [4100, 4101, 4102, 4103]) {
    const origin = `http://127.0.0.1:${port}`;
    for (const path of ['/health', '/api/health']) {
      const health = await request.get(`${origin}${path}`);
      expect(health.ok()).toBe(true);
      expect(await health.json()).toEqual({ status: 'ok' });
    }
    const document = await request.get(`${origin}/filme/550`);
    expect(document.ok()).toBe(true);
    expect(document.headers()['content-type']).toContain('text/html');
    expect(await document.text()).toContain('id="root"');
    expect(document.headers()['cache-control']).toContain('no-store');
    const missingAsset = await request.get(`${origin}/assets/inexistente.js`);
    expect(missingAsset.status()).toBe(404);
  }

  const configResponse = await request.get('/runtime-config.json');
  expect(configResponse.ok()).toBe(true);
  expect(configResponse.headers()['cache-control']).toContain('no-store');
  const config = (await configResponse.json()) as { remotes: Record<string, string> };
  for (const [name, port] of Object.entries({ catalog: 4101, movie: 4102, area: 4103 })) {
    const url = new URL(config.remotes[name]!);
    expect(url.origin).toBe(`http://127.0.0.1:${port}`);
    expect(url.pathname).toBe('/remoteEntry.js');
    const entry = await request.get(url.href);
    expect(entry.ok()).toBe(true);
    expect(entry.headers()['content-type']).toMatch(/javascript/);
    expect(entry.headers()['access-control-allow-origin']).toBe('*');
    expect(entry.headers()['cache-control']).toContain('no-store');
  }
});

test('portal integrado e remotes independentes funcionam nos containers', async ({ page }) => {
  await page.goto('/filmes');
  await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  await page.getByRole('button', { name: 'Favoritar: Clube da Luta', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Favoritado: Clube da Luta. Remover dos favoritos' }),
  ).toBeEnabled();
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 1 favoritos');
  await page.getByRole('link', { name: /Clube da Luta/ }).click();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();
  await page.getByLabel('Sua nota', { exact: false }).fill('8.5');
  await page.getByLabel('Comentário', { exact: false }).fill('Vale a pena rever.');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(page.getByText('Avaliação salva.', { exact: true })).toBeVisible();
  await favoriteCounter(page).click();
  await expect(page.getByText('Sua nota: 8,5', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Sua nota: 8,5', { exact: true })).toBeVisible();
  await page.goto('/painel');
  await expect(metric(page, 'Favoritos')).toHaveText(/^1/);
  await expect(metric(page, 'Filmes avaliados')).toHaveText(/^1/);
  await expect(metric(page, 'Nota média')).toHaveText(/^8,5/);
  await page.goto('/rota-inexistente');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();

  for (const remote of [
    { port: 4101, path: '/filmes', heading: 'Encontre seu próximo filme.' },
    { port: 4102, path: '/filme/550', heading: 'Clube da Luta' },
    { port: 4103, path: '/painel', heading: 'Seu painel.' },
  ]) {
    await page.goto(`http://127.0.0.1:${remote.port}${remote.path}`);
    await expect(page.getByRole('heading', { name: remote.heading, exact: true })).toBeVisible();
    if (remote.port === 4101)
      await expect(page.getByRole('link', { name: /Clube da Luta/ })).toHaveAttribute(
        'href',
        'http://127.0.0.1:4100/filme/550',
      );
    if (remote.port === 4103)
      await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  }
});
