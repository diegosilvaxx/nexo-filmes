import { test, expect, metric, favoriteCounter } from './fixtures';

test('catálogo com 20 filmes, paginação, filtros e busca com debounce preservados na URL', async ({
  page,
  api,
}) => {
  await page.goto('/filmes');
  const details = page.getByRole('article').getByRole('link');
  await expect(details).toHaveCount(20);
  await page.getByRole('button', { name: 'Próxima' }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await expect(details).toHaveCount(20);
  await page.getByRole('combobox', { name: 'Gênero', exact: true }).selectOption('18');
  await expect(page).toHaveURL(/genreId=18/);
  await expect(page).not.toHaveURL(/page=2/);
  await page.getByRole('combobox', { name: 'Ordenar por', exact: true }).selectOption('title');
  await expect(page).toHaveURL(/sort=title/);
  await page.getByLabel('Buscar por título').pressSequentially('Clube', { delay: 40 });
  await expect(page).toHaveURL(/search=Clube/);
  await expect(details).toHaveCount(1);
  await expect(page.getByRole('combobox', { name: 'Gênero', exact: true })).toBeDisabled();
  await expect(page.getByRole('combobox', { name: 'Ordenar por', exact: true })).toBeDisabled();
  expect(api.requests.filter((url) => url.searchParams.get('search') === 'Clube')).toHaveLength(1);
  expect(api.requests.filter((url) => Boolean(url.searchParams.get('search')))).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel('Buscar por título')).toHaveValue('Clube');
  await expect(details).toHaveCount(1);
});

test('favoritos, avaliação, edição, painel e exclusão persistem entre telas e recargas', async ({
  page,
}) => {
  await page.goto('/filmes');
  await page.getByRole('button', { name: 'Favoritar: Clube da Luta', exact: true }).click();
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 1 favoritos');
  await expect(
    page.getByRole('button', { name: 'Favoritado: Clube da Luta. Remover dos favoritos' }),
  ).toBeEnabled();
  await page.getByRole('link', { name: /Clube da Luta/ }).click();
  await expect(page.getByRole('heading', { name: 'Clube da Luta', exact: true })).toBeVisible();
  await expect(page.getByText('139 min', { exact: true })).toBeVisible();
  await expect(page.getByText('David Fincher', { exact: true })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'Edward Norton' })).toBeVisible();
  await page.getByLabel('Sua nota', { exact: false }).fill('8.5');
  await page.getByLabel('Comentário', { exact: false }).fill('Vale a pena rever.');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(page.getByText('Avaliação salva.', { exact: true })).toBeVisible();
  await favoriteCounter(page).click();
  await expect(page.getByText('Sua nota: 8,5', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Sua nota: 8,5', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: /Clube da Luta/ }).click();
  await expect(page.getByLabel('Comentário', { exact: false })).toHaveValue('Vale a pena rever.');
  await page.getByLabel('Sua nota', { exact: false }).fill('9.5');
  await page.getByRole('button', { name: 'Atualizar avaliação', exact: true }).click();
  await expect(page.getByText('Avaliação salva.', { exact: true })).toBeVisible();
  await page.getByRole('banner').getByRole('link', { name: 'Painel', exact: true }).click();
  await expect(metric(page, 'Favoritos')).toHaveText(/^1/);
  await expect(metric(page, 'Filmes avaliados')).toHaveText(/^1/);
  await expect(metric(page, 'Nota média')).toHaveText(/^9,5/);
  await expect(metric(page, 'Gênero mais frequente')).toHaveText(/^Drama/);
  await page.getByRole('link', { name: 'Ver favoritos', exact: true }).click();
  await page
    .getByRole('button', { name: 'Favoritado: Clube da Luta. Remover dos favoritos', exact: true })
    .click();
  await expect(page.getByText('Você ainda não tem filmes favoritos.')).toBeVisible();
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  await expect(page.getByText('Salvando favoritos…', { exact: true })).toHaveCount(0);
  await page.goto('/painel');
  await expect(metric(page, 'Favoritos')).toHaveText(/^0/);
  await expect(metric(page, 'Filmes avaliados')).toHaveText(/^1/);
  await expect(metric(page, 'Nota média')).toHaveText(/^9,5/);
  await page.goto('/filme/550');
  await page.getByRole('button', { name: 'Excluir avaliação', exact: true }).click();
  await expect(page.getByText('Avaliação excluída.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Sua nota', { exact: false })).toBeFocused();
  await page.goto('/painel');
  await expect(metric(page, 'Filmes avaliados')).toHaveText(/^0/);
  await expect(metric(page, 'Nota média')).toHaveText(/^—/);
  await expect(metric(page, 'Gênero mais frequente')).toHaveText(/^—/);
});

test('Zod bloqueia dados inválidos ao salvar, foca o primeiro erro e preserva os valores', async ({
  page,
}) => {
  await page.goto('/filme/550');
  const rating = page.getByLabel('Sua nota', { exact: false });
  const comment = page.getByLabel('Comentário', { exact: false });
  await expect(rating).toBeEnabled();
  await rating.fill('11');
  await comment.fill('a'.repeat(501));
  await expect(rating).toHaveValue('11');
  await expect(comment).toHaveValue('a'.repeat(501));
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(rating).toBeFocused();
  await expect(rating).toHaveAttribute('aria-invalid', 'true');
  await expect(comment).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('A nota deve ser de 0,5 a 10.', { exact: true })).toBeVisible();
  await expect(
    page.getByText('O comentário deve ter até 500 caracteres.', { exact: true }),
  ).toBeVisible();
  await rating.fill('1.6');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(rating).toHaveValue('1.6');
  await expect(page.getByText('Use uma nota em passos de 0,5.', { exact: true })).toBeVisible();
  await rating.fill('8.5');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(comment).toBeFocused();
  await expect(comment).toHaveValue('a'.repeat(501));
  await expect(page.getByRole('button', { name: 'Excluir avaliação', exact: true })).toHaveCount(0);
  await comment.fill('a'.repeat(500));
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(page.getByText('Avaliação salva.', { exact: true })).toBeVisible();
});

test('escritas no ID 13 falham, desfazem o favorito e mantêm o rascunho da avaliação', async ({
  page,
}) => {
  await page.goto('/filme/13');
  const favorite = page.getByRole('button', {
    name: 'Favoritar: Forrest Gump',
    exact: true,
  });
  await favorite.click();
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 1 favoritos');
  await expect(page.getByRole('alert')).toContainText('A alteração foi desfeita.');
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
  await expect(favorite).toBeEnabled();
  await page.getByLabel('Sua nota', { exact: false }).fill('7.5');
  await page.getByLabel('Comentário', { exact: false }).fill('Manter este comentário.');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Não foi possível salvar a avaliação.' }),
  ).toBeVisible();
  await expect(page.getByLabel('Sua nota', { exact: false })).toHaveValue('7.5');
  await expect(page.getByLabel('Comentário', { exact: false })).toHaveValue(
    'Manter este comentário.',
  );
  await expect(page.getByRole('button', { name: 'Salvar avaliação', exact: true })).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel('Sua nota', { exact: false })).toHaveValue('');
  await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
});

test('outra aba recebe favorito e avaliação sem recarregar o painel', async ({ page, context }) => {
  await page.goto('/painel');
  await expect(metric(page, 'Filmes avaliados')).toHaveText(/^0/);
  const details = await context.newPage();
  await details.goto('/filme/550');
  await details.getByRole('button', { name: 'Favoritar: Clube da Luta', exact: true }).click();
  await details.getByLabel('Sua nota', { exact: false }).fill('8.5');
  await details.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(details.getByText('Avaliação salva.', { exact: true })).toBeVisible();
  await expect(metric(page, 'Favoritos')).toHaveText(/^1/);
  await expect(metric(page, 'Filmes avaliados')).toHaveText(/^1/);
  await expect(metric(page, 'Nota média')).toHaveText(/^8,5/);
  await details.getByLabel('Sua nota', { exact: false }).fill('9.5');
  await details.getByRole('button', { name: 'Atualizar avaliação', exact: true }).click();
  await expect(metric(page, 'Nota média')).toHaveText(/^9,5/);
  await details.close();
});

for (const code of ['RATE_LIMITED', 'UPSTREAM_UNAVAILABLE'] as const) {
  test(`catálogo recupera ${code} com nova tentativa e mantém o cabeçalho`, async ({
    page,
    api,
  }) => {
    api.nextMovieError = code;
    await page.goto('/filmes');
    await expect(page.getByRole('alert')).toContainText('Tente novamente.');
    await expect(favoriteCounter(page)).toHaveAccessibleName('Favoritos 0 favoritos');
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  });
}

test('catálogo apresenta carregamento, busca vazia e recuperação ao limpar filtros', async ({
  page,
  api,
}) => {
  api.delayMs = 500;
  await page.goto('/filmes');
  await expect(page.getByText('Carregando filmes…', { exact: true })).toBeVisible();
  await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  api.delayMs = 0;
  await page.getByLabel('Buscar por título').fill('Título inexistente');
  await expect(
    page.getByText('Nenhum filme encontrado. Experimente outro título ou gênero.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  await expect(page.getByLabel('Buscar por título')).toHaveValue('');
});

for (const path of ['/filme/abc', '/filme/99999', '/rota-inexistente']) {
  test(`apresenta 404 para ${path} sem perder a navegação`, async ({ page }) => {
    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: 'Página não encontrada', exact: true }),
    ).toBeVisible();
    await page.getByRole('banner').getByRole('link', { name: 'Filmes', exact: true }).click();
    await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  });
}

test('catálogo, detalhe e painel não têm overflow horizontal e os atalhos recebem foco por teclado', async ({
  page,
}, testInfo) => {
  for (const path of ['/filmes', '/filme/550', '/painel']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
  }
  const favorites = page.getByRole('link', { name: 'Ver favoritos', exact: true });
  await favorites.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Explorar filmes', exact: true })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('painel.png'), fullPage: true });
});
