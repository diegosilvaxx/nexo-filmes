import type { RuntimeConfig, RemoteName } from '@nexo/contracts';
import { createHttpClient } from '@nexo/http';

const client = createHttpClient('/');
let configuration: Promise<RuntimeConfig> | undefined;
const remoteNames: RemoteName[] = ['catalog', 'movie', 'area'];

export function parseRuntimeConfig(value: unknown, origin: string): RuntimeConfig {
  if (
    !value ||
    typeof value !== 'object' ||
    !('remotes' in value) ||
    !value.remotes ||
    typeof value.remotes !== 'object'
  )
    throw new Error('Configuração dos remotes inválida.');
  const remotes = {} as Record<RemoteName, string>;
  for (const name of remoteNames) {
    if (!(name in value.remotes)) throw new Error(`Endereço do remote ${name} ausente.`);
    const raw = (value.remotes as Record<string, unknown>)[name];
    if (typeof raw !== 'string' || !raw.trim())
      throw new Error(`Endereço do remote ${name} inválido.`);
    const url = new URL(raw, origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      throw new Error(`Endereço do remote ${name} inválido.`);
    remotes[name] = url.href;
  }
  return { remotes };
}

export function loadRuntimeConfig() {
  if (!configuration)
    configuration = client
      .get<unknown>('runtime-config.json', { headers: { 'Cache-Control': 'no-cache' } })
      .then((response) => parseRuntimeConfig(response.data, window.location.origin))
      .catch((error: unknown) => {
        configuration = undefined;
        throw error;
      });
  return configuration;
}

export function resetRuntimeConfig() {
  configuration = undefined;
}
