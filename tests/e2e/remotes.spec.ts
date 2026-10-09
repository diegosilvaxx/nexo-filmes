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
});
