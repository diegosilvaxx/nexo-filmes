import type { ComponentType } from 'react';
import { getInstance } from '@module-federation/runtime';
import type { RemoteName } from '@nexo/contracts';
import { loadRuntimeConfig, resetRuntimeConfig } from './config';

type RemoteExports = Record<string, ComponentType>;
export type RemoteExpose = 'App' | 'FavoritesCounter';
const registrations = new Map<RemoteName, string>();

export async function loadRemoteComponent(name: RemoteName, expose: RemoteExpose, attempt = 0) {
  if (attempt > 0) resetRuntimeConfig();
  const config = await loadRuntimeConfig();
  const entry = new URL(config.remotes[name]);
  if (attempt > 0) entry.searchParams.set('retry', `${Date.now()}-${attempt}`);
  const runtime = getInstance((instance) => instance.name === 'shell');
  if (!runtime) throw new Error('Runtime indisponível.');
  const entryUrl = entry.href;
  if (registrations.get(name) !== entryUrl) {
    runtime.registerRemotes([{ name, entry: entryUrl, type: 'module' }], {
      force: registrations.has(name),
    });
    registrations.set(name, entryUrl);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  let module: RemoteExports | null;
  try {
    module = await Promise.race([
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Tempo de carregamento excedido.')), 10_000);
      }),
      runtime.loadRemote<RemoteExports>(`${name}/${expose}`),
    ]);
  } finally {
    clearTimeout(timer);
  }
  const component = module?.[expose];
  if (typeof component !== 'function') throw new Error('Componente do remote indisponível.');
  return { default: component };
}
