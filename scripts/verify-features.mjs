// G6: the required experience works in a real browser on the production build.
import { launch, openRoute, startServer } from './lib/harness.mjs'

const problems = []
const check = (ok, message) => {
  if (!ok) problems.push(message)
}
const server = await startServer()
const browser = await launch()
const count = async (page) =>
  Number(
    (await page.locator('p[role=status]').first().innerText())
      .match(/([\d,]+) receipts/)?.[1]
      .replace(/,/g, ''),
  )

try {
  // Exploration: search narrows the list, a filter changes counts, a result opens its day.
  {
    const { page, context, errors } = await openRoute(browser, server.url, '/explore')
    const all = await count(page)
    check(all === 12611, `unfiltered explore shows ${all} receipts, expected 12611`)
    await page.getByRole('button', { name: 'Card statement' }).click()
    const withoutCard = await count(page)
    check(
      withoutCard === 11311,
      `turning off the card statement left ${withoutCard} receipts, expected 11311`,
    )
    await page.getByRole('button', { name: 'Card statement' }).click()
    await page.getByRole('searchbox', { name: /search/i }).fill('beatles')
    await page.waitForFunction(
      (before) => !document.querySelector('p[role=status]')?.textContent?.includes(before),
      all.toLocaleString('en-US'),
    )
    const searched = await count(page)
    check(searched > 0 && searched < all, `search for "beatles" gave ${searched}`)
    await page.getByRole('button', { name: 'Music' }).click()
    check((await count(page)) === 0, 'no kinds selected should show nothing')
    await page
      .getByRole('button', { name: /clear filters/i })
      .first()
      .click()
    await page.getByRole('searchbox', { name: /search/i }).fill('milk')
    await page.waitForTimeout(400)
    const milk = await count(page)
    check(milk > 10 && milk < 400, `search "milk" gave ${milk}`)
    await page.locator('ul li button').first().click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })
    check((await dialog.locator('h2').innerText()).length > 4, 'day drawer has no date heading')
    check((await dialog.locator('li').count()) >= 1, 'day drawer lists no receipts')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    check(errors.length === 0, `console errors on explore: ${errors.join(' | ')}`)
    await context.close()
  }
  // Relationship discovery: choosing a connection shows its numbers and days, and a day opens the receipts.
  {
    const { page, context } = await openRoute(browser, server.url, '/connections')
    const items = page.locator('ul button[aria-pressed]')
    check((await items.count()) >= 10, 'fewer than 10 connections listed')
    await items.nth(3).click()
    const heading = await page.locator('h2').filter({ hasText: / and / }).first().innerText()
    check(/ and /.test(heading), 'connection detail heading missing')
    check(await page.getByText(/not a cause/i).isVisible(), 'the co-occurrence caveat is not shown')
    await page.locator('div[aria-live=polite] button.chip').first().click()
    await page.getByRole('dialog').waitFor({ state: 'visible' })
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /card years/i }).click()
    await context.close()
  }
  // Interactive story: every chapter is reachable, in order, and the last one ends the story.
  {
    const { page, context } = await openRoute(browser, server.url, '/story')
    const seen = []
    for (let step = 1; step <= 7; step += 1) {
      const persona = await page.locator('#chapter-title').innerText()
      seen.push(persona)
      check(
        (await page.getByText(new RegExp(`Chapter ${step} of 7`)).count()) > 0,
        `chapter ${step} did not show its position`,
      )
      if (step < 7) await page.getByRole('button', { name: /next chapter/i }).click()
      await page.waitForTimeout(80)
    }
    check(
      await page.getByRole('button', { name: /next chapter/i }).isDisabled(),
      'the last chapter still offers Next',
    )
    check(new Set(seen).size >= 6, `chapters are not distinct enough: ${seen.join(', ')}`)
    await page.goto(`${server.url}/#/story?chapter=6`)
    await page.waitForSelector('#chapter-title')
    await page.getByRole('button', { name: /open that day/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.waitFor({ state: 'visible' })
    const kinds = await dialog.locator('li span.mono').allInnerTexts()
    check(
      new Set(kinds.map((text) => text.split(' · ')[0])).size >= 2,
      'the chapter moment does not combine two sources',
    )
    await context.close()
  }
  // Visual journey: the timeline and the heatmap render with content.
  {
    const { page, context } = await openRoute(browser, server.url, '/')
    check(
      (await page.locator('svg[role=group] rect.bar-grow').count()) > 60,
      'the journey strip has no monthly bars',
    )
    await page.goto(`${server.url}/#/rhythms`)
    await page.waitForSelector('svg[role=img]')
    check((await page.locator('svg[role=img] rect').count()) >= 168, 'the heatmap is missing cells')
    await context.close()
  }
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.error(`FEATURES-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('FEATURES-OK')
