import axios from 'axios';
import { ZodError } from 'zod';
import type { ApiErrorCode } from '@nexo/contracts';

export class ServiceError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, code: ApiErrorCode, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function parseRetryAfter(value: unknown, now = Date.now()): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const numeric = Number(value);
  if (!String(value).trim()) return undefined;
  if (Number.isFinite(numeric)) return numeric >= 0 ? Math.ceil(numeric) : undefined;
  const date = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - now) / 1000)) : undefined;
}

export function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  if (error instanceof ZodError)
    return new ServiceError(
      502,
      'INVALID_RESPONSE',
      'O serviço de filmes retornou dados inválidos.',
    );
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429)
      return new ServiceError(
        429,
        'RATE_LIMITED',
        'Muitas requisições. Aguarde e tente novamente.',
        parseRetryAfter(error.response.headers['retry-after']),
      );
    if (error.response?.status === 404)
      return new ServiceError(404, 'NOT_FOUND', 'Filme não encontrado.');
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
      return new ServiceError(
        504,
        'UPSTREAM_TIMEOUT',
        'O serviço de filmes demorou para responder.',
      );
  }
  return new ServiceError(502, 'UPSTREAM_UNAVAILABLE', 'O serviço de filmes está indisponível.');
}
