import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { UIProvider } from '@nexo/ui';
import { App } from './App';

vi.mock('./components/RemoteSlot', () => ({
  RemoteSlot: ({ name, expose }: { name: string; expose?: string }) => {
    const location = useLocation();
    return expose ? (
      <a href="/favoritos">Favoritos 0</a>
    ) : (
      <h1>
        {name}: {location.pathname}
        {location.search}
      </h1>
    );
  },
}));
beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}));

function mount(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <UIProvider>
        <App />
      </UIProvider>
    </MemoryRouter>,
  );
}

it.each([
  ['/', 'catalog: /filmes'],
  ['/filmes?busca=matrix&pagina=2', 'catalog: /filmes?busca=matrix&pagina=2'],
  ['/filme/550', 'movie: /filme/550'],
  ['/favoritos', 'area: /favoritos'],
  ['/painel', 'area: /painel'],
])('encaminha %s para o remote correspondente', (path, heading) => {
  mount(path);
  expect(screen.getByRole('heading', { name: heading })).toBeVisible();
});

it('preserva o cabeçalho e move o foco para o conteúdo ao navegar', async () => {
  const user = userEvent.setup();
  mount('/filmes');
  await user.click(screen.getByRole('link', { name: 'Painel' }));
  expect(screen.getByRole('heading', { name: 'area: /painel' })).toBeVisible();
  expect(screen.getByRole('main')).toHaveFocus();
  expect(screen.getByRole('link', { name: 'Nexo Filmes, início' })).toBeVisible();
});

it('mostra a página 404 com caminho de retorno ao catálogo', async () => {
  const user = userEvent.setup();
  mount('/rota-inexistente');
  expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await user.click(screen.getByRole('link', { name: 'Voltar ao início' }));
  expect(screen.getByRole('heading', { name: 'catalog: /filmes' })).toBeVisible();
});
