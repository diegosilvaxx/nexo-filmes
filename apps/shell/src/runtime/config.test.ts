import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig, parseRuntimeConfig, resetRuntimeConfig } from './config';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@nexo/http', () => ({ createHttpClient: () => ({ get }) }));

const config = {
  remotes: {
    catalog: '/catalog/remoteEntry.js',
    movie: 'https://movies.example/remoteEntry.js',
    area: 'https://area.example/remoteEntry.js',
  },
};

beforeEach(() => {
  resetRuntimeConfig();
  get.mockReset();
});

describe('configuração pública dos remotes', () => {
  it('resolve URLs relativas e mantém os endereços HTTPS', () => {
    expect(parseRuntimeConfig(config, 'https://nexo.example')).toEqual({
      remotes: { ...config.remotes, catalog: 'https://nexo.example/catalog/remoteEntry.js' },
    });
  });

  it.each([
    null,
    {},
    { remotes: {} },
    { remotes: { ...config.remotes, catalog: '' } },
    { remotes: { ...config.remotes, movie: 42 } },
    { remotes: { ...config.remotes, area: 'javascript:alert(1)' } },
    { remotes: { ...config.remotes, area: 'https://user:password@area.example/entry.js' } },
  ])('rejeita estrutura ou endereço inválido: %j', (value) => {
    expect(() => parseRuntimeConfig(value, 'https://nexo.example')).toThrow();
  });

  it('compartilha uma requisição entre consumidores simultâneos', async () => {
    get.mockResolvedValueOnce({ data: config });
    const first = loadRuntimeConfig();
    const second = loadRuntimeConfig();
    expect(first).toBe(second);
    await first;
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('runtime-config.json', {
      headers: { 'Cache-Control': 'no-cache' },
    });
  });

  it('permite nova requisição após falha de rede ou configuração inválida', async () => {
    get
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: config });
    await expect(loadRuntimeConfig()).rejects.toThrow('offline');
    await expect(loadRuntimeConfig()).rejects.toThrow('Configuração');
    await expect(loadRuntimeConfig()).resolves.toHaveProperty(
      'remotes.movie',
      config.remotes.movie,
    );
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('busca a configuração atualizada após reinicialização', async () => {
    get.mockResolvedValue({ data: config });
    await loadRuntimeConfig();
    resetRuntimeConfig();
    await loadRuntimeConfig();
    expect(get).toHaveBeenCalledTimes(2);
  });
});
