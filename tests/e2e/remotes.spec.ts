import { test, expect, favoriteCounter } from './fixtures';

for (const remote of [
  { port: 4301, path: '/filmes', heading: 'Encontre seu próximo filme.' },
  { port: 4302, path: '/filme/550', heading: 'Clube da Luta' },
  { port: 4303, path: '/painel', heading: 'Seu painel.' },
]) {
  test(`remote independente na porta ${remote.port} apresenta sua tela`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:${remote.port}${remote.path}`);
    await expect(page.getByRole('heading', { name: remote.heading, exact: true })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    if (remote.port === 4301)
      await expect(page.getByRole('link', { name: /Clube da Luta/ })).toHaveAttribute(
        'href',
        'http://127.0.0.1:4300/filme/550',
      );
    if (remote.port === 4303) {
      await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
      await expect(
        page.getByRole('link', { name: 'Explorar filmes', exact: true }),
      ).toHaveAttribute('href', 'http://127.0.0.1:4300/filmes');
    }
  });
}

test('falha do catálogo fica isolada e o remote recupera pelo botão de nova tentativa', async ({
  page,
  context,
}) => {
  const entry = /http:\/\/127\.0\.0\.1:4301\/remoteEntry\.js/;
  await context.route(entry, (route) => route.abort('failed'));
  await page.goto('/filmes');
  const content = page.getByRole('main');
  await expect(content.getByRole('alert')).toContainText('Não foi possível carregar o catálogo.');
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  await expect(
    page.getByRole('banner').getByRole('link', { name: 'Painel', exact: true }),
  ).toBeVisible();
  await context.unroute(entry);
  await content.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  await page.getByRole('banner').getByRole('link', { name: 'Painel', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Seu painel.' })).toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Filmes', exact: true }).click();
  await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
});

test('Minha área recuperada continua disponível ao alternar entre os menus', async ({
  page,
  context,
}) => {
  const entry = /http:\/\/127\.0\.0\.1:4303\/remoteEntry\.js/;
  const entries: string[] = [];
  page.on('request', (request) => {
    if (entry.test(request.url())) entries.push(request.url());
  });
  await context.route(entry, (route) => route.abort('failed'));
  await page.goto('/favoritos');
  const content = page.getByRole('main');
  const header = page.getByRole('banner');
  await expect(content.getByRole('alert')).toContainText('Não foi possível carregar os favoritos.');
  await expect(header.getByRole('alert')).toContainText('Não foi possível carregar os favoritos.');

  await context.unroute(entry);
  await content.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Seus favoritos.' })).toBeVisible();
  await header.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  const recoveredEntries = [...entries];

  for (let visit = 0; visit < 2; visit += 1) {
    await header.getByRole('link', { name: 'Painel', exact: true }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Seu painel.' })).toBeVisible();
    await header.getByRole('link', { name: 'Filmes', exact: true }).click();
    await expect(page.getByRole('article')).toHaveCount(20);
    await favoriteCounter(page).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Seus favoritos.' })).toBeVisible();
    await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  }
  expect(entries, 'A navegação deve reutilizar o remote recuperado').toEqual(recoveredEntries);
});
