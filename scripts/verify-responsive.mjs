// G8: no horizontal overflow at nine widths on every route, and the primary content starts inside the first phone screen.
import { launch, openRoute, ROUTES, startServer } from './lib/harness.mjs'

const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1536, 1920, 2560]
const problems = []
const server = await startServer()
const browser = await launch()
try {
  for (const route of ROUTES) {
    for (const width of WIDTHS) {
      const { page, context } = await openRoute(browser, server.url, route, {
        width,
        height: width < 700 ? 800 : 900,
      })
      const overflow = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      )
      const wide = await page.evaluate(
        () =>
          [...document.querySelectorAll('main *')].filter(
            (el) =>
              el.getBoundingClientRect().right > window.innerWidth + 1 &&
              getComputedStyle(el).position !== 'fixed' &&
              !el.closest('nav[aria-label="Chapter list"]') &&
              !el.closest('.sr-only'),
          ).length,
      )
      if (overflow > 0) problems.push(`${route} at ${width}px overflows by ${overflow}px`)
      if (wide > 0) problems.push(`${route} at ${width}px has ${wide} elements past the right edge`)
      if (width <= 414) {
        const h1Bottom = await page.evaluate(
          () => document.querySelector('h1')?.getBoundingClientRect().bottom ?? 9999,
        )
        if (h1Bottom > 480)
          problems.push(
            `${route} at ${width}px: the page heading ends ${Math.round(h1Bottom)}px down`,
          )
        const navBox = await page.evaluate(
          () =>
            document.querySelector('nav[aria-label="Primary, mobile"]')?.getBoundingClientRect()
              .height ?? 0,
        )
        if (navBox < 44)
          problems.push(`${route} at ${width}px: the mobile navigation is ${navBox}px tall`)
      }
      await context.close()
    }
  }
  console.log(`${ROUTES.length} routes at ${WIDTHS.length} widths checked`)
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.error(`RESPONSIVE-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('RESPONSIVE-OK')
