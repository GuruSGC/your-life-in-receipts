// Captures every route in both themes at desktop and phone width, for visual review. Usage: node scripts/screens.mjs [outDir]
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { launch, openRoute, ROUTES, startServer, THEMES } from './lib/harness.mjs'

const out = process.argv[2] ?? '.screens'
mkdirSync(out, { recursive: true })
const server = await startServer()
const browser = await launch()
try {
  for (const theme of THEMES) {
    for (const [label, width, height] of [
      ['desktop', 1280, 900],
      ['phone', 390, 844],
    ]) {
      for (const route of ROUTES) {
        const { page, context, errors } = await openRoute(browser, server.url, route, {
          theme,
          width,
          height,
        })
        const name = `${route === '/' ? 'home' : route.slice(1)}-${theme}-${label}.png`
        await page.screenshot({ path: join(out, name), fullPage: true })
        if (errors.length) console.log(`${name}: console errors`, errors.slice(0, 2))
        await context.close()
      }
    }
  }
  console.log(`screens written to ${out}`)
} finally {
  await browser.close()
  await server.close()
}
