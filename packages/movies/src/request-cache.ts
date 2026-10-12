import { CanceledError } from 'axios';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

interface PendingRequest {
  controller: AbortController;
  promise: Promise<unknown>;
  consumers: number;
}

interface CacheOptions {
  maxEntries?: number;
  now?: () => number;
}

export function createRequestCache({
  maxEntries = 200,
  now = () => Date.now(),
}: CacheOptions = {}) {
  const entries = new Map<string, CacheEntry>();
  const pending = new Map<string, PendingRequest>();

  function store(key: string, value: unknown, ttl: number) {
    const timestamp = now();
    for (const [entryKey, entry] of entries) {
      if (entry.expiresAt <= timestamp) entries.delete(entryKey);
    }
    entries.delete(key);
    entries.set(key, { value: structuredClone(value), expiresAt: timestamp + ttl });
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  }

  function subscribe<T>(key: string, request: PendingRequest, signal?: AbortSignal): Promise<T> {
    request.consumers++;
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const release = () => {
        if (settled) return false;
        settled = true;
        signal?.removeEventListener('abort', abort);
        request.consumers--;
        return true;
      };
      function abort() {
        if (!release()) return;
        reject(new CanceledError());
        // Permite que a remontagem imediata do StrictMode reutilize a consulta.
        queueMicrotask(() => {
          if (request.consumers === 0 && pending.get(key) === request) {
            pending.delete(key);
            request.controller.abort();
          }
        });
      }
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) abort();
      request.promise.then(
        (value) => {
          if (release()) resolve(value as T);
        },
        (error: unknown) => {
          if (release()) reject(error);
        },
      );
    }).then((value) => structuredClone(value));
  }

  function get<T>(
    key: string,
    ttl: number,
    load: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (signal?.aborted) return Promise.reject(new CanceledError());
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now()) {
      entries.delete(key);
      entries.set(key, cached);
      return Promise.resolve().then(() => {
        if (signal?.aborted) throw new CanceledError();
        return structuredClone(cached.value) as T;
      });
    }
    entries.delete(key);
    let request = pending.get(key);
    if (!request) {
      const controller = new AbortController();
      const created: PendingRequest = {
        controller,
        consumers: 0,
        promise: Promise.resolve().then(() => load(controller.signal)),
      };
      created.promise = created.promise
        .then((value) => {
          if (!controller.signal.aborted && pending.get(key) === created) store(key, value, ttl);
          return value;
        })
        .finally(() => {
          if (pending.get(key) === created) pending.delete(key);
        });
      pending.set(key, created);
      request = created;
    }
    return subscribe<T>(key, request, signal);
  }

  return { get };
}

export type RequestCache = ReturnType<typeof createRequestCache>;
