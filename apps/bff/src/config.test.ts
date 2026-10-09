// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { findRepositoryRoot, readServerConfig } from './config';

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'nexo-config-'));
});
afterEach(() => {
  if (dirname(resolve(root)) !== resolve(tmpdir()) || !basename(root).startsWith('nexo-config-'))
    throw new Error('Diretório temporário inválido.');
  rmSync(root, { recursive: true, force: true });
});

it('encontra a raiz da aplicação independente', () => {
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'nexo-filmes' }));
  mkdirSync(join(root, 'apps/bff'), { recursive: true });
  expect(findRepositoryRoot(join(root, 'apps/bff'))).toBe(root);
});

it('aplica precedência de arquivos e variáveis de ambiente', () => {
  writeFileSync(join(root, '.env'), 'TMDB_READ_ACCESS_TOKEN=base\nBFF_PORT=4200');
  writeFileSync(join(root, '.env.production'), 'TMDB_READ_ACCESS_TOKEN=production');
  writeFileSync(join(root, '.env.production.local'), 'BFF_PORT=4300');
  expect(
    readServerConfig(root, 'production', { TMDB_READ_ACCESS_TOKEN: ' process-token ' }),
  ).toEqual({ token: 'process-token', port: 4300, host: '127.0.0.1' });
});

it('informa token ausente e porta inválida sem expor valores', () => {
  expect(() => readServerConfig(root, 'development', {})).toThrow(
    'Configure TMDB_READ_ACCESS_TOKEN',
  );
  expect(() =>
    readServerConfig(root, 'development', { TMDB_READ_ACCESS_TOKEN: 'token', BFF_PORT: '0' }),
  ).toThrow('BFF_PORT inválida');
});
