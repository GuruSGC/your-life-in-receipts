// Shared test harness: serves the production build with Vite's preview server and drives it with Playwright (system Chrome).
import { chromium } from 'playwright'
import { preview } from 'vite'

export const ROUTES = ['/', '/story', '/connections', '/rhythms', '/explore', '/method']
export const THEMES = ['light', 'dark']

export async function startServer() {
  const server = await preview({
    preview: { port: 0, strictPort: false, open: false },
    logLevel: 'error',
  })
  const address = server.httpServer.address()
  const url = `http://localhost:${typeof address === 'object' && address ? address.port : 4173}`
  return { url, close: () => new Promise((resolve) => server.httpServer.close(() => resolve())) }
}

export async function launch({ scrollbars = false } = {}) {
  const args = scrollbars ? [] : []
  return chromium.launch({ channel: 'chrome', headless: true, args })
}

/** Opens a page at a route with a chosen theme and waits for the data to render. */
export async function openRoute(
  browser,
  url,
  route,
  { theme = 'light', width = 1280, height = 900, reducedMotion = 'no-preference' } = {},
) {
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme: theme,
    reducedMotion,
  })
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('life-receipts:theme:v1', JSON.stringify(value))
    } catch {
      // storage unavailable
    }
  }, theme)
  await page.goto(`${url}/#${route}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1', { timeout: 15000 })
  await page.waitForFunction(
    () => !document.querySelector('[role="status"]')?.textContent?.includes('Printing'),
    null,
    { timeout: 15000 },
  )
  await page.waitForTimeout(500)
  return { page, context, errors }
}
