// @vitest-environment node
import { CanceledError } from 'axios';
import { expect, it, vi } from 'vitest';
import { createRequestCache } from './request-cache';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

it('reutiliza respostas sem compartilhar objetos mutáveis com os consumidores', async () => {
  const cache = createRequestCache();
  const value = { titles: ['Clube da Luta'] };
  const load = vi.fn().mockResolvedValue(value);
  const first = await cache.get<typeof value>('movie', 1000, load);
  first.titles.push('Alteração local');
  value.titles.push('Alteração na origem');
  expect(await cache.get('movie', 1000, load)).toEqual({ titles: ['Clube da Luta'] });
  expect(load).toHaveBeenCalledTimes(1);
});

it('conta a validade a partir da resposta e renova somente depois da expiração', async () => {
  let timestamp = 0;
  const cache = createRequestCache({ now: () => timestamp });
  const response = deferred<number>();
  const load = vi.fn().mockReturnValueOnce(response.promise).mockResolvedValue(2);
  const first = cache.get('movie', 100, load);
  timestamp = 90;
  response.resolve(1);
  expect(await first).toBe(1);
  timestamp = 189;
  expect(await cache.get('movie', 100, load)).toBe(1);
  timestamp = 190;
  expect(await cache.get('movie', 100, load)).toBe(2);
  expect(load).toHaveBeenCalledTimes(2);
});

it('compartilha a chamada em andamento e entrega cópias separadas', async () => {
  const cache = createRequestCache();
  const response = deferred<{ title: string }>();
  const load = vi.fn().mockReturnValue(response.promise);
  const first = cache.get('movie', 1000, load);
  const second = cache.get('movie', 1000, load);
  response.resolve({ title: 'Clube da Luta' });
  const [a, b] = await Promise.all([first, second]);
  expect(a).toEqual(b);
  expect(a).not.toBe(b);
  expect(load).toHaveBeenCalledTimes(1);
});

it('descarta falhas e permite outra tentativa', async () => {
  const cache = createRequestCache();
  const failure = new Error('Indisponível');
  const load = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(2);
  await expect(cache.get('movie', 1000, load)).rejects.toBe(failure);
  expect(await cache.get('movie', 1000, load)).toBe(2);
  expect(await cache.get('movie', 1000, load)).toBe(2);
  expect(load).toHaveBeenCalledTimes(2);
});

it('remove a resposta menos utilizada quando alcança o limite', async () => {
  const cache = createRequestCache({ maxEntries: 2 });
  const load = vi.fn().mockResolvedValue(1);
  await cache.get('a', 1000, load);
  await cache.get('b', 1000, load);
  await cache.get('a', 1000, load);
  await cache.get('c', 1000, load);
  await cache.get('a', 1000, load);
  expect(load).toHaveBeenCalledTimes(3);
  await cache.get('b', 1000, load);
  expect(load).toHaveBeenCalledTimes(4);
});

it('remove respostas expiradas antes de descartar respostas válidas', async () => {
  let timestamp = 0;
  const cache = createRequestCache({ maxEntries: 2, now: () => timestamp });
  const load = vi.fn().mockResolvedValue(1);
  await cache.get('a', 100, load);
  await cache.get('b', 1000, load);
  await cache.get('a', 100, load);
  timestamp = 101;
  await cache.get('c', 1000, load);
  await cache.get('b', 1000, load);
  expect(load).toHaveBeenCalledTimes(3);
});

it('cancelar um consumidor não interrompe o outro', async () => {
  const cache = createRequestCache();
  const response = deferred<number>();
  const load = vi.fn().mockReturnValue(response.promise);
  const controller = new AbortController();
  const first = cache.get('movie', 1000, load, controller.signal);
  const second = cache.get('movie', 1000, load);
  const cancelled = expect(first).rejects.toBeInstanceOf(CanceledError);
  controller.abort();
  await cancelled;
  expect(load.mock.calls[0]?.[0].aborted).toBe(false);
  response.resolve(1);
  expect(await second).toBe(1);
  expect(await cache.get('movie', 1000, load)).toBe(1);
  expect(load).toHaveBeenCalledTimes(1);
});

it('cancela a chamada quando todos os consumidores desistem', async () => {
  const cache = createRequestCache();
  const response = deferred<number>();
  const load = vi.fn().mockReturnValue(response.promise);
  const a = new AbortController();
  const b = new AbortController();
  const first = cache.get('movie', 1000, load, a.signal);
  const second = cache.get('movie', 1000, load, b.signal);
  const cancelled = [
    expect(first).rejects.toBeInstanceOf(CanceledError),
    expect(second).rejects.toBeInstanceOf(CanceledError),
  ];
  a.abort();
  b.abort();
  await Promise.all(cancelled);
  expect(load.mock.calls[0]?.[0].aborted).toBe(true);
  response.resolve(1);
});

it('uma resposta cancelada e atrasada não substitui nem remove a nova consulta', async () => {
  const cache = createRequestCache();
  const old = deferred<number>();
  const current = deferred<number>();
  const load = vi.fn().mockReturnValueOnce(old.promise).mockReturnValue(current.promise);
  const controller = new AbortController();
  const first = cache.get('movie', 1000, load, controller.signal);
  const cancelled = expect(first).rejects.toBeInstanceOf(CanceledError);
  controller.abort();
  await cancelled;
  const second = cache.get('movie', 1000, load);
  old.resolve(1);
  await old.promise;
  await Promise.resolve();
  const third = cache.get('movie', 1000, load);
  current.resolve(2);
  expect(await Promise.all([second, third])).toEqual([2, 2]);
  expect(await cache.get('movie', 1000, load)).toBe(2);
  expect(load).toHaveBeenCalledTimes(2);
});

it('reaproveita a consulta quando há remontagem imediata no StrictMode', async () => {
  const cache = createRequestCache();
  const response = deferred<number>();
  const load = vi.fn().mockReturnValue(response.promise);
  const controller = new AbortController();
  const first = cache.get('movie', 1000, load, controller.signal);
  const cancelled = expect(first).rejects.toBeInstanceOf(CanceledError);
  controller.abort();
  const second = cache.get('movie', 1000, load);
  await cancelled;
  expect(load.mock.calls[0]?.[0].aborted).toBe(false);
  response.resolve(1);
  expect(await second).toBe(1);
  expect(load).toHaveBeenCalledTimes(1);
});

it('não consulta a origem para um consumidor já cancelado', async () => {
  const cache = createRequestCache();
  const load = vi.fn().mockResolvedValue(1);
  const controller = new AbortController();
  controller.abort();
  await expect(cache.get('movie', 1000, load, controller.signal)).rejects.toBeInstanceOf(
    CanceledError,
  );
  expect(load).not.toHaveBeenCalled();
});

it('respeita o cancelamento mesmo quando a resposta já está no cache', async () => {
  const cache = createRequestCache();
  const load = vi.fn().mockResolvedValue(1);
  await cache.get('movie', 1000, load);
  const controller = new AbortController();
  const result = cache.get('movie', 1000, load, controller.signal);
  const cancelled = expect(result).rejects.toBeInstanceOf(CanceledError);
  controller.abort();
  await cancelled;
  expect(load).toHaveBeenCalledTimes(1);
});
