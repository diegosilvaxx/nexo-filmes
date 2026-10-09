import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getInstance: vi.fn(),
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
  loadRuntimeConfig: vi.fn(),
  resetRuntimeConfig: vi.fn(),
}));
vi.mock('@module-federation/runtime', () => ({ getInstance: mocks.getInstance }));
vi.mock('./config', () => ({
  loadRuntimeConfig: mocks.loadRuntimeConfig,
  resetRuntimeConfig: mocks.resetRuntimeConfig,
}));
const App = () => null;

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  mocks.getInstance.mockReturnValue({
    loadRemote: mocks.loadRemote,
    registerRemotes: mocks.registerRemotes,
  });
  mocks.loadRuntimeConfig.mockResolvedValue({
    remotes: {
      catalog: 'https://catalog.example/remoteEntry.js',
      movie: 'https://movie.example/remoteEntry.js',
      area: 'https://area.example/remoteEntry.js',
    },
  });
  mocks.loadRemote.mockResolvedValue({ App });
});
afterEach(() => vi.useRealTimers());

describe('carregamento federado', () => {
  it('registra a URL em runtime e reutiliza o registro na mesma sessão', async () => {
    const { loadRemoteComponent } = await import('./loader');
    await expect(loadRemoteComponent('catalog', 'App')).resolves.toEqual({ default: App });
    await loadRemoteComponent('catalog', 'App');
    expect(mocks.registerRemotes).toHaveBeenCalledTimes(1);
    expect(mocks.registerRemotes).toHaveBeenCalledWith(
      [{ name: 'catalog', entry: 'https://catalog.example/remoteEntry.js', type: 'module' }],
      { force: false },
    );
    expect(mocks.loadRemote).toHaveBeenCalledWith('catalog/App');
  });

  it('recarrega a configuração e invalida o remote após uma falha', async () => {
    const { loadRemoteComponent } = await import('./loader');
    mocks.loadRemote.mockRejectedValueOnce(new Error('offline'));
    await expect(loadRemoteComponent('movie', 'App')).rejects.toThrow('offline');
    await expect(loadRemoteComponent('movie', 'App', 1)).resolves.toEqual({ default: App });
    expect(mocks.resetRuntimeConfig).toHaveBeenCalledOnce();
    expect(mocks.registerRemotes).toHaveBeenLastCalledWith(
      [
        {
          name: 'movie',
          entry: expect.stringMatching(/remoteEntry\.js\?retry=\d+-1$/),
          type: 'module',
        },
      ],
      { force: true },
    );
  });

  it('limita o tempo de espera e permite tentar novamente', async () => {
    vi.useFakeTimers();
    const { loadRemoteComponent } = await import('./loader');
    mocks.loadRemote.mockImplementationOnce(() => new Promise(() => {}));
    const pending = expect(loadRemoteComponent('area', 'App')).rejects.toThrow(
      'Tempo de carregamento',
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    await expect(loadRemoteComponent('area', 'App', 1)).resolves.toEqual({ default: App });
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([null, {}, { App: 'inválido' }])('rejeita exports inválidos: %j', async (module) => {
    mocks.loadRemote.mockResolvedValueOnce(module);
    const { loadRemoteComponent } = await import('./loader');
    await expect(loadRemoteComponent('catalog', 'App')).rejects.toThrow('Componente do remote');
  });

  it('reporta a ausência do runtime', async () => {
    mocks.getInstance.mockReturnValueOnce(undefined);
    const { loadRemoteComponent } = await import('./loader');
    await expect(loadRemoteComponent('catalog', 'App')).rejects.toThrow('Runtime indisponível');
  });
});
