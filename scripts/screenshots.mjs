// Regenerates the README screenshots as small WebP files. Usage: npm run build && node scripts/screenshots.mjs
import { mkdirSync, statSync } from 'node:fs'
import sharp from 'sharp'
import { launch, openRoute } from './lib/harness.mjs'
import { startStaticServer } from './lib/static-server.mjs'

const SHOTS = [
  { file: 'home-light', route: '/', theme: 'light', width: 1280, height: 1500 },
  { file: 'story-dark', route: '/story?chapter=4', theme: 'dark', width: 1280, height: 1400 },
  { file: 'connections-light', route: '/connections', theme: 'light', width: 1280, height: 1100 },
  { file: 'rhythms-dark', route: '/rhythms', theme: 'dark', width: 1280, height: 1250 },
  { file: 'home-phone', route: '/', theme: 'light', width: 390, height: 844 },
]

mkdirSync('docs', { recursive: true })
const server = await startStaticServer()
const browser = await launch()
try {
  for (const shot of SHOTS) {
    const { page, context } = await openRoute(browser, server.url, shot.route, shot)
    const png = await page.screenshot({ type: 'png', fullPage: false })
    const path = `docs/${shot.file}.webp`
    await sharp(png)
      .resize({ width: shot.width > 600 ? 1000 : 390 })
      .webp({ quality: 72 })
      .toFile(path)
    console.log(`${path} ${(statSync(path).size / 1024).toFixed(0)} KB`)
    await context.close()
  }
} finally {
  await browser.close()
  await server.close()
}
