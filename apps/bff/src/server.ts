import { createServer, type ServerResponse } from 'node:http';
import { movieIdSchema, movieQuerySchema } from '@nexo/contracts';
import { ServiceError, type MovieService } from '@nexo/tmdb';

function respond(response: ServerResponse, status: number, data: unknown) {
  if (response.destroyed) return;
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

export function createBffServer(service: MovieService) {
  return createServer(async (request, response) => {
    try {
      if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        respond(response, 405, {
          error: { code: 'INVALID_REQUEST', message: 'Método não permitido.' },
        });
        return;
      }
      const url = new URL(request.url ?? '/', 'http://bff.local');
      if (url.pathname === '/api/health') {
        respond(response, 200, { status: 'ok' });
        return;
      }
      if (url.pathname === '/api/genres') {
        respond(response, 200, await service.genres());
        return;
      }
      if (url.pathname === '/api/movies') {
        const keys = [...url.searchParams.keys()];
        if (new Set(keys).size !== keys.length)
          throw new ServiceError(400, 'INVALID_REQUEST', 'Parâmetros duplicados.');
        const parsed = movieQuerySchema.safeParse(Object.fromEntries(url.searchParams));
        if (!parsed.success)
          throw new ServiceError(
            400,
            'INVALID_REQUEST',
            'Consulta inválida. Verifique os filtros e a paginação.',
          );
        respond(response, 200, await service.movies(parsed.data));
        return;
      }
      const detail = /^\/api\/movies\/(\d+)$/.exec(url.pathname);
      if (detail) {
        const parsed = movieIdSchema.safeParse(detail[1]);
        if (!parsed.success) throw new ServiceError(400, 'INVALID_REQUEST', 'Filme inválido.');
        respond(response, 200, await service.movie(parsed.data));
        return;
      }
      throw new ServiceError(404, 'NOT_FOUND', 'Endereço não encontrado.');
    } catch (error) {
      const safe =
        error instanceof ServiceError
          ? error
          : new ServiceError(500, 'INTERNAL_ERROR', 'Não foi possível concluir a solicitação.');
      if (safe.retryAfterSeconds !== undefined)
        response.setHeader('Retry-After', safe.retryAfterSeconds);
      respond(response, safe.status, {
        error: {
          code: safe.code,
          message: safe.message,
          ...(safe.retryAfterSeconds !== undefined
            ? { retryAfterSeconds: safe.retryAfterSeconds }
            : {}),
        },
      });
    }
  });
}
