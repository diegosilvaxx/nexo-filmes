import { useEffect, useState } from 'react';
import { MoviesApiError } from './errors';
type Result<T> =
  | { key: string; status: 'ready'; data: T }
  | { key: string; status: 'error'; code: string; message: string; retryAt: number | undefined };
export function useResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T>>();
  const requestKey = `${key}:${attempt}`;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key: requestKey,
          status: 'error',
          code: error instanceof MoviesApiError ? error.code : 'NETWORK_ERROR',
          message:
            error instanceof MoviesApiError
              ? error.message
              : 'Não foi possível carregar os filmes. Tente novamente.',
          retryAt:
            error instanceof MoviesApiError && error.retryAfterSeconds
              ? Date.now() + error.retryAfterSeconds * 1000
              : undefined,
        });
      });
    return () => controller.abort();
  }, [enabled, requestKey, load]);
  return {
    result: enabled && result?.key === requestKey ? result : undefined,
    retry: () => setAttempt((value) => value + 1),
  };
}
