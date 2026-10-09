import type { ApiErrorCode } from '@nexo/contracts';
export class MoviesApiError extends Error {
  readonly code: ApiErrorCode | 'NETWORK_ERROR';
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;
  constructor(
    code: ApiErrorCode | 'NETWORK_ERROR',
    status: number,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'MoviesApiError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
