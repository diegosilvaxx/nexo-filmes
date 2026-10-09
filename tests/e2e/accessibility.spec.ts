import axe from 'axe-core';
import type { Page } from '@playwright/test';
import { test, expect, favoriteCounter } from './fixtures';

async function checkAccessibility(page: Page, state: string) {
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const engine = (window as unknown as { axe: typeof axe }).axe;
    const results = await engine.run(document);
    return results.violations.map(({ id, nodes }) => ({
      id,
      elements: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
    }));
  });
  expect(violations, `Acessibilidade de ${state}`).toEqual([]);
}

test('telas completas não apresentam violações de acessibilidade', async ({ page, api }) => {
  test.setTimeout(45_000);
  for (const path of ['/favoritos', '/filmes', '/filme/550', '/painel', '/rota-inexistente']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/^Carregando/)).toHaveCount(0);
    await checkAccessibility(page, path);
  }
  await page.goto('/filmes');
  await page.getByRole('button', { name: 'Favoritar: Clube da Luta', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Favoritado: Clube da Luta. Remover dos favoritos' }),
  ).toBeEnabled();
  await favoriteCounter(page).click();
  await expect(page.getByText('Sem avaliação', { exact: true })).toBeVisible();
  await checkAccessibility(page, 'favoritos preenchidos');
  await page.goto('/filme/550');
  await page.getByRole('button', { name: 'Salvar avaliação', exact: true }).click();
  await expect(page.getByLabel('Sua nota', { exact: false })).toBeFocused();
  await expect(page.getByLabel('Sua nota', { exact: false })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await checkAccessibility(page, 'avaliação inválida');
  api.nextMovieError = 'RATE_LIMITED';
  await page.goto('/filmes');
  await expect(page.getByRole('alert')).toContainText('Tente novamente.');
  await checkAccessibility(page, 'erro da API');
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Armazenamento indisponível.', 'SecurityError');
      },
    });
  });
  await page.goto('/painel');
  await expect(page.getByRole('button', { name: /carregar o contador/ })).toBeVisible();
  await expect(page.getByText(/^Carregando/)).toHaveCount(0);
  await checkAccessibility(page, 'armazenamento indisponível');
});

test('atalho para o conteúdo e foco visível funcionam pelo teclado', async ({ page }, testInfo) => {
  await page.goto('/filmes');
  await expect(page.getByRole('article').getByRole('link')).toHaveCount(20);
  const skip = page.getByRole('link', { name: 'Ir para o conteúdo', exact: true });
  await skip.focus();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await skip.focus();
  await page.keyboard.press('Tab');
  const home = page.getByRole('link', { name: 'Nexo Filmes, início', exact: true });
  await expect(home).toBeFocused();
  const focus = await home.evaluate((element) => {
    const style = getComputedStyle(element);
    const background = getComputedStyle(document.documentElement).backgroundColor;
    const luminance = (color: string) => {
      const [red = 0, green = 0, blue = 0] = (color.match(/[\d.]+/g) ?? [])
        .slice(0, 3)
        .map(Number)
        .map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };
    const outline = luminance(style.outlineColor);
    const surface = luminance(background);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
      contrast: (Math.max(outline, surface) + 0.05) / (Math.min(outline, surface) + 0.05),
    };
  });
  expect(focus.style).not.toBe('none');
  expect(focus.width).toBeGreaterThanOrEqual(2);
  expect(focus.contrast).toBeGreaterThanOrEqual(3);
  await page.screenshot({ path: testInfo.outputPath('foco-teclado.png'), fullPage: true });
});
