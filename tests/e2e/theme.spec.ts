import axe from 'axe-core';
import { test, expect } from './fixtures';

test('tema claro preserva rascunhos, navegação, acessibilidade e preferência após recarga', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/filme/550');
  const rating = page.getByLabel('Sua nota', { exact: false });
  const comment = page.getByLabel('Comentário', { exact: false });
  await expect(rating).toBeEnabled();
  await page.getByRole('banner').screenshot({
    path: testInfo.outputPath('cabecalho-escuro.png'),
    animations: 'disabled',
  });
  await rating.fill('8.5');
  await comment.fill('Rascunho preservado ao trocar o tema.');
  const toggle = page.getByRole('button', { name: 'Ativar tema claro' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(rating).toHaveValue('8.5');
  await expect(comment).toHaveValue('Rascunho preservado ao trocar o tema.');
  await expect(rating).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f7f7fa');
  await page.getByRole('banner').screenshot({
    path: testInfo.outputPath('cabecalho-claro.png'),
    animations: 'disabled',
  });

  await rating.fill('11');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(rating).toHaveAttribute('aria-invalid', 'true');
  await page.addScriptTag({ content: axe.source });
  expect(
    await page.evaluate(
      async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations,
    ),
  ).toEqual([]);

  for (const path of ['/filmes', '/filme/550', '/favoritos', '/painel', '/rota-inexistente']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/^Carregando/)).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(247, 247, 250)');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(
      async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations,
    );
    expect(violations, `Acessibilidade do tema claro: ${path}`).toEqual([]);
    if (path === '/filmes') {
      await page.screenshot({ path: testInfo.outputPath('catalogo-claro.png'), fullPage: true });
    }
  }
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ativar tema escuro' })).toBeVisible();
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
});

test('preferência de tema acompanha outra aba sem perder os filtros', async ({ page, context }) => {
  await page.goto('/filmes?page=2&genreId=18&sort=rating');
  const other = await context.newPage();
  await other.goto('/painel');
  await other.getByRole('button', { name: 'Ativar tema claro' }).click();
  await expect(page.getByRole('button', { name: 'Ativar tema escuro' })).toBeVisible();
  await expect(page).toHaveURL(/page=2&genreId=18&sort=rating/);
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
  await expect(other.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
  await other.close();
});
