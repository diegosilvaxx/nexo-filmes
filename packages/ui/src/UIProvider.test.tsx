import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UIProvider } from './UIProvider';
import { ThemeToggle } from './ThemeToggle';
import { THEME_STORAGE_KEY } from './theme-preference';

function renderTheme() {
  return render(
    <UIProvider>
      <ThemeToggle />
    </UIProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.remove();
});

describe('preferência de tema', () => {
  it('começa no tema escuro e atualiza a cor do navegador', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
    renderTheme();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeVisible();
    expect(meta).toHaveAttribute('content', '#121215');
  });

  it('restaura o tema claro salvo', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    renderTheme();
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeVisible();
  });

  it('ignora preferências inválidas', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'invalid');
    renderTheme();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('alterna os dois temas e salva a escolha', async () => {
    const user = userEvent.setup();
    renderTheme();
    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('continua alternando quando o armazenamento está indisponível', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Armazenamento indisponível.', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Armazenamento indisponível.', 'SecurityError');
    });
    const user = userEvent.setup();
    renderTheme();
    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('sincroniza mudanças e limpeza de outra aba, ignorando outras chaves', () => {
    renderTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'other-key' })));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY })));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    window.localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
