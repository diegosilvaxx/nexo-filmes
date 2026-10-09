import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';

export function findRepositoryRoot(start: string): string {
  let current = resolve(start);
  while (true) {
    try {
      const manifest = JSON.parse(readFileSync(join(current, 'package.json'), 'utf8')) as {
        name?: string;
      };
      if (manifest.name === 'nexo-filmes') return current;
    } catch {
      /* O diretório atual pode não conter um manifesto. */
    }
    const parent = dirname(current);
    if (parent === current) throw new Error('Raiz do projeto não encontrada.');
    current = parent;
  }
}

export function readServerConfig(root: string, mode: string, environment = process.env) {
  const values: Record<string, string | undefined> = {};
  for (const file of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    try {
      Object.assign(values, parseEnv(readFileSync(join(root, file), 'utf8')));
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT'))
        throw new Error('Não foi possível ler o ambiente do servidor.', { cause: error });
    }
  }
  Object.assign(values, environment);
  const token = values.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token) throw new Error('Configure TMDB_READ_ACCESS_TOKEN no .env do servidor.');
  const port = Number(values.BFF_PORT ?? '4200');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('BFF_PORT inválida.');
  return { token, port, host: values.BFF_HOST?.trim() || '127.0.0.1' };
}
