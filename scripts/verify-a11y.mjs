// G7: axe on every route in both themes (and with the drawer open), plus keyboard operation and visible focus.
import AxeBuilder from '@axe-core/playwright'
import { launch, openRoute, ROUTES, startServer, THEMES } from './lib/harness.mjs'

const problems = []
const server = await startServer()
const browser = await launch()

async function scan(page, label) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()
  const serious = result.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact),
  )
  console.log(
    `${label}: ${result.violations.length} violations, ${serious.length} serious or critical`,
  )
  for (const violation of serious)
    problems.push(
      `${label}: ${violation.id} (${violation.nodes.length} nodes) ${violation.nodes[0]?.html.slice(0, 120)}`,
    )
}

try {
  for (const theme of THEMES) {
    for (const route of ROUTES) {
      const { page, context } = await openRoute(browser, server.url, route, { theme })
      await scan(page, `${route} ${theme}`)
      await context.close()
    }
    const { page, context } = await openRoute(browser, server.url, '/', { theme })
    await page.locator('article button.chip').first().click()
    await page.getByRole('dialog').waitFor({ state: 'visible' })
    await scan(page, `day drawer ${theme}`)
    await context.close()
  }

  // Keyboard only: skip link, navigation, a chip that opens the drawer, Escape to close, focus lands back on the trigger.
  const { page, context } = await openRoute(browser, server.url, '/')
  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
  if (!/skip to content/i.test(first ?? ''))
    problems.push(`first Tab stop is "${first}", expected the skip link`)
  await page.keyboard.press('Enter')
  const target = await page.evaluate(
    () => document.activeElement?.tagName + '#' + (document.activeElement?.id ?? ''),
  )
  console.log(`after the skip link, focus is on ${target}`)
  const chip = page.locator('article button.chip').first()
  await chip.focus()
  const ring = await chip.evaluate((el) => {
    const style = getComputedStyle(el)
    return { width: parseFloat(style.outlineWidth), style: style.outlineStyle }
  })
  if (!(ring.width >= 2 && ring.style !== 'none'))
    problems.push(`focused chip has no visible outline: ${JSON.stringify(ring)}`)
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  const back = await page.evaluate(() => document.activeElement?.textContent?.trim())
  if (!back || !/\d{4}/.test(back))
    problems.push(`focus did not return to the trigger after Escape: "${back}"`)
  // Every route is reachable by keyboard from the navigation.
  for (const label of ['Story', 'Connections', 'Rhythms', 'Explore']) {
    const link = page
      .getByRole('navigation', { name: 'Primary', exact: true })
      .getByRole('link', { name: label })
    await link.focus()
    await page.keyboard.press('Enter')
    await page
      .waitForFunction(() => document.activeElement?.tagName === 'H1', null, { timeout: 4000 })
      .catch(() => undefined)
    const title = await page.evaluate(() => document.activeElement?.tagName)
    if (title !== 'H1')
      problems.push(
        `after opening ${label} with the keyboard, focus is on ${title}, expected the page heading`,
      )
  }
  await context.close()
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.error(`A11Y-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('A11Y-OK')
