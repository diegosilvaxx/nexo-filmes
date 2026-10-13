import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export default async function globalSetup() {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const config = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8')) as {
    services: Record<
      string,
      {
        outputDirectory: string;
        routes?: { dest?: string }[];
      }
    >;
  };
  for (const application of ['shell', 'catalog', 'movie', 'area']) {
    execFileSync(process.execPath, ['scripts/build-vercel.mjs', application], {
      cwd: root,
      stdio: 'pipe',
    });
  }
  const originalToken = process.env.TMDB_READ_ACCESS_TOKEN;
  process.env.TMDB_READ_ACCESS_TOKEN = 'vercel-test-token';
  const { default: bff } = await import('../../apps/bff/src/vercel');
  const types: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
  };
  const gateway = createServer(async (request, response) => {
    const path = new URL(request.url ?? '/', 'http://127.0.0.1:4500').pathname;
    if (path.startsWith('/api/')) {
      bff.emit('request', request, response);
      return;
    }
    const remote = path.match(/^\/remotes\/(catalog|movie|area)(?:\/(.*))?$/);
    const service = config.services[remote?.[1] ?? 'shell']!;
    const directory = resolve(root, service.outputDirectory);
    const file = resolve(directory, `.${path}`);
    if (!file.startsWith(`${directory}${sep}`) && file !== directory) {
      response.writeHead(400).end();
      return;
    }
    try {
      let body: Buffer;
      let extension = extname(file);
      try {
        body = await readFile(file);
      } catch {
        const fallback = service.routes?.find((route) => route.dest)?.dest;
        if (!fallback) {
          response.writeHead(404).end();
          return;
        }
        body = await readFile(resolve(directory, `.${fallback}`));
        extension = '.html';
      }
      response.setHeader('Content-Type', types[extension] ?? 'application/octet-stream');
      response.setHeader('Cache-Control', 'no-store');
      response.end(body);
    } catch {
      response.writeHead(500).end();
    }
  });
  await new Promise<void>((done, reject) => {
    gateway.once('error', reject);
    gateway.listen(4500, '127.0.0.1', done);
  });
  return async () => {
    if (originalToken === undefined) delete process.env.TMDB_READ_ACCESS_TOKEN;
    else process.env.TMDB_READ_ACCESS_TOKEN = originalToken;
    gateway.closeAllConnections();
    await new Promise<void>((done, reject) =>
      gateway.close((error) => (error ? reject(error) : done())),
    );
    bff.closeAllConnections();
  };
}
