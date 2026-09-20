// G10: motion discipline, measured from the animations the browser actually runs.
// Every animation is 300 ms or shorter, movement uses transform and opacity only, and reduced motion removes movement.
import { launch, openRoute, startServer } from './lib/harness.mjs'

const MAX_MS = 300
const MOVEMENT =
  /^(width|height|top|left|right|bottom|inset|margin|padding|max-|min-|font-size|line-height|flex|grid)/
const problems = []
const server = await startServer()
const browser = await launch()

const recorder = () => {
  window.__motion = []
  const record = (kind, event) => {
    const animations = event.target?.getAnimations?.() ?? []
    for (const animation of animations) {
      const timing = animation.effect?.getTiming?.() ?? {}
      const keyframes = animation.effect?.getKeyframes?.() ?? []
      const properties = new Set(
        keyframes
          .flatMap((frame) => Object.keys(frame))
          .filter((key) => !['offset', 'easing', 'composite', 'computedOffset'].includes(key)),
      )
      window.__motion.push({
        kind,
        name: animation.animationName ?? animation.transitionProperty ?? 'unnamed',
        duration: Number(timing.duration) || 0,
        properties: [...properties],
      })
    }
  }
  document.addEventListener('animationstart', (event) => record('animation', event), true)
  document.addEventListener('transitionrun', (event) => record('transition', event), true)
}

async function drive(reducedMotion) {
  const { page, context } = await openRoute(browser, server.url, '/', { reducedMotion })
  await page.addInitScript(recorder)
  await page.evaluate(recorder)
  // Press feedback, chips, drawer, story steps, connections, theme switch.
  await page.locator('article button.chip').first().click()
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  for (const label of ['Story', 'Connections', 'Rhythms', 'Explore']) {
    await page
      .getByRole('navigation', { name: 'Primary', exact: true })
      .getByRole('link', { name: label })
      .click()
    await page.waitForTimeout(350)
  }
  await page.getByRole('button', { name: 'Music' }).click()
  await page.getByRole('button', { name: /switch to the/i }).click()
  await page.goto(`${server.url}/#/story?chapter=4`)
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: /next chapter/i }).click()
  await page.waitForTimeout(400)
  const motion = await page.evaluate(() => window.__motion)
  await context.close()
  return motion
}

try {
  const normal = await drive('no-preference')
  const reduced = await drive('reduce')
  const names = [...new Set(normal.map((item) => item.name))]
  console.log(`observed ${normal.length} animations and transitions (${names.join(', ')})`)
  if (normal.length < 15)
    problems.push(`only ${normal.length} animations observed; the interface would feel static`)
  for (const item of normal) {
    if (item.duration > MAX_MS)
      problems.push(`${item.kind} "${item.name}" runs ${item.duration} ms, over ${MAX_MS}`)
    const bad = item.properties.filter((property) => MOVEMENT.test(property))
    if (
      item.kind === 'animation' &&
      item.properties.some((property) => !['transform', 'opacity'].includes(property))
    )
      problems.push(
        `animation "${item.name}" animates ${item.properties.join(', ')}, not just transform and opacity`,
      )
    if (bad.length)
      problems.push(`${item.kind} "${item.name}" moves layout properties: ${bad.join(', ')}`)
    if (item.kind === 'transition' && MOVEMENT.test(String(item.name)))
      problems.push(`transition on layout property ${item.name}`)
  }
  const moving = reduced.filter(
    (item) => item.kind === 'animation' && item.properties.includes('transform'),
  )
  if (moving.length)
    problems.push(
      `reduced motion still runs movement: ${[...new Set(moving.map((item) => item.name))].join(', ')}`,
    )
  console.log(`reduced motion: ${reduced.length} animations, ${moving.length} with movement`)
  const fades = reduced.filter(
    (item) => item.kind === 'animation' && item.properties.includes('opacity'),
  )
  if (fades.length === 0)
    problems.push('reduced motion removed every fade; state changes should still be softened')
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.error(`MOTION-FAIL:\n  ${[...new Set(problems)].join('\n  ')}`)
  process.exit(1)
}
console.log('MOTION-OK')
