// A small static server for dist/ that behaves like the production host: gzip for text, long caching for hashed assets.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { gzipSync } from 'node:zlib'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.webmanifest'])

export async function startStaticServer(root = 'dist') {
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent((request.url ?? '/').split('?')[0] ?? '/')
    const file = normalize(join(root, path === '/' ? 'index.html' : path))
    if (!file.startsWith(normalize(root))) {
      response.writeHead(403).end()
      return
    }
    try {
      let body = await readFile(file)
      const extension = extname(file)
      const headers = { 'content-type': TYPES[extension] ?? 'application/octet-stream' }
      headers['cache-control'] = path.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate'
      if (
        COMPRESSIBLE.has(extension) &&
        /\bgzip\b/.test(request.headers['accept-encoding'] ?? '')
      ) {
        body = gzipSync(body)
        headers['content-encoding'] = 'gzip'
      }
      response.writeHead(200, headers).end(body)
    } catch {
      response.writeHead(404).end('not found')
    }
  })
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  return {
    url: `http://localhost:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}
