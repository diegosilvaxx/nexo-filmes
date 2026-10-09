import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { UIProvider } from '@nexo/ui';

const { loadRemoteComponent } = vi.hoisted(() => ({ loadRemoteComponent: vi.fn() }));
vi.mock('../runtime/loader', () => ({ loadRemoteComponent }));
beforeEach(() => {
  vi.resetModules();
  loadRemoteComponent.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

it('mantém o restante da página e recupera o remote após falha de download', async () => {
  const user = userEvent.setup();
  loadRemoteComponent
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ default: () => <h1>Catálogo recuperado</h1> });
  const { RemoteSlot } = await import('./RemoteSlot');
  const view = render(
    <UIProvider>
      <header>Nexo Filmes</header>
      <RemoteSlot name="catalog" label="o catálogo" />
    </UIProvider>,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível carregar o catálogo.',
  );
  expect(screen.getByText('Nexo Filmes')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('heading', { name: 'Catálogo recuperado' })).toBeVisible();
  expect(loadRemoteComponent).toHaveBeenLastCalledWith('catalog', 'App', 1);
  view.rerender(
    <UIProvider>
      <header>Nexo Filmes</header>
      <RemoteSlot key="return" name="catalog" label="o catálogo" />
    </UIProvider>,
  );
  expect(await screen.findByRole('heading', { name: 'Catálogo recuperado' })).toBeVisible();
  expect(loadRemoteComponent).toHaveBeenCalledTimes(3);
  expect(loadRemoteComponent).toHaveBeenLastCalledWith('catalog', 'App');
});

it('isola uma falha durante a renderização e permite nova montagem', async () => {
  const user = userEvent.setup();
  const Broken = () => {
    throw new Error('render');
  };
  loadRemoteComponent
    .mockResolvedValueOnce({ default: Broken })
    .mockResolvedValueOnce({ default: () => <h1>Filme recuperado</h1> });
  const { RemoteSlot } = await import('./RemoteSlot');
  render(
    <UIProvider>
      <RemoteSlot name="movie" label="o filme" />
    </UIProvider>,
  );
  expect(await screen.findByRole('alert')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(await screen.findByRole('heading', { name: 'Filme recuperado' })).toBeVisible();
});

it('isola o contador do cabeçalho do conteúdo da página', async () => {
  loadRemoteComponent.mockImplementation((name, expose) =>
    expose === 'FavoritesCounter'
      ? Promise.reject(new Error('offline'))
      : Promise.resolve({ default: () => <h1>{name}</h1> }),
  );
  const { RemoteSlot } = await import('./RemoteSlot');
  render(
    <UIProvider>
      <RemoteSlot name="area" expose="FavoritesCounter" compact label="os favoritos" />
      <RemoteSlot name="catalog" label="o catálogo" />
    </UIProvider>,
  );
  expect(await screen.findByRole('heading', { name: 'catalog' })).toBeVisible();
  expect(await screen.findByRole('alert')).toHaveTextContent('os favoritos');
});
