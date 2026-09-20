// G9: the palette follows the brief. Light: subtle blue base, green accents. Dark: light lavender highlight. Text passes 4.5 to 1.
import { launch, openRoute, startServer } from './lib/harness.mjs'

const problems = []
const server = await startServer()
const browser = await launch()

function toRgb(value) {
  const short = value.trim().match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (short) return short.slice(1).map((c) => parseInt(c + c, 16))
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16))
  const rgb = value.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  throw new Error(`unreadable colour ${value}`)
}
function hsl([r, g, b]) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
  }
  // Chroma (max minus min) is the honest measure of how tinted a very light colour is; HSL saturation exaggerates it.
  return { h: (h * 60 + 360) % 360, s, l, chroma: d }
}
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

async function tokens(theme) {
  const { page, context } = await openRoute(browser, server.url, '/', { theme })
  const values = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(
      [
        '--bg',
        '--surface',
        '--surface-2',
        '--ink',
        '--ink-2',
        '--ink-3',
        '--accent',
        '--accent-ink',
        '--accent-soft',
        '--focus',
        '--line-strong',
        '--danger',
        '--c-music',
        '--c-food',
        '--c-travel',
        '--c-home',
        '--c-health',
        '--c-shopping',
        '--c-entertainment',
        '--c-money',
        '--c-family',
        '--c-other',
      ].map((name) => [name, style.getPropertyValue(name)]),
    )
  })
  const attribute = await page.evaluate(() => document.documentElement.dataset.theme)
  await context.close()
  if (attribute !== theme)
    problems.push(`theme attribute is "${attribute}" when ${theme} was requested`)
  return Object.fromEntries(Object.entries(values).map(([name, value]) => [name, toRgb(value)]))
}

try {
  const light = await tokens('light')
  const dark = await tokens('dark')
  const lightBase = hsl(light['--bg'])
  const lightAccent = hsl(light['--accent'])
  const darkAccent = hsl(dark['--accent'])
  console.log(
    `light base hue ${lightBase.h.toFixed(0)} chroma ${(lightBase.chroma * 100).toFixed(1)}% lightness ${(lightBase.l * 100).toFixed(0)}%`,
  )
  console.log(
    `light accent hue ${lightAccent.h.toFixed(0)}; dark accent hue ${darkAccent.h.toFixed(0)} lightness ${(darkAccent.l * 100).toFixed(0)}%`,
  )
  if (!(lightBase.h >= 200 && lightBase.h <= 235))
    problems.push(`light base hue ${lightBase.h.toFixed(0)} is not blue`)
  if (!(lightBase.l >= 0.92)) problems.push('light base is not light enough')
  if (!(lightBase.chroma <= 0.1))
    problems.push(`light base is not subtle: chroma ${(lightBase.chroma * 100).toFixed(0)}%`)
  if (!(lightBase.chroma >= 0.02)) problems.push('light base has no blue tint at all')
  if (!(lightAccent.h >= 130 && lightAccent.h <= 170))
    problems.push(`light accent hue ${lightAccent.h.toFixed(0)} is not green`)
  if (!(darkAccent.h >= 245 && darkAccent.h <= 285))
    problems.push(`dark highlight hue ${darkAccent.h.toFixed(0)} is not lavender or violet`)
  if (!(darkAccent.l >= 0.75))
    problems.push(`dark highlight lightness ${(darkAccent.l * 100).toFixed(0)}% is not light`)

  for (const [name, set] of [
    ['light', light],
    ['dark', dark],
  ]) {
    const pairs = [
      ['ink on bg', set['--ink'], set['--bg']],
      ['ink on surface', set['--ink'], set['--surface']],
      ['ink-2 on surface', set['--ink-2'], set['--surface']],
      ['ink-2 on bg', set['--ink-2'], set['--bg']],
      ['ink-3 on surface', set['--ink-3'], set['--surface']],
      ['ink-3 on bg', set['--ink-3'], set['--bg']],
      ['accent on surface', set['--accent'], set['--surface']],
      ['accent on bg', set['--accent'], set['--bg']],
      ['accent on accent-soft', set['--accent'], set['--accent-soft']],
      ['accent-ink on accent', set['--accent-ink'], set['--accent']],
      ['focus ring on surface', set['--focus'], set['--surface']],
    ]
    for (const [label, fg, bg] of pairs) {
      const ratio = contrast(fg, bg)
      const need = label.startsWith('focus') ? 3 : 4.5
      if (ratio < need) problems.push(`${name}: ${label} is ${ratio.toFixed(2)}:1, needs ${need}:1`)
    }
    for (const key of [
      '--c-music',
      '--c-food',
      '--c-travel',
      '--c-home',
      '--c-health',
      '--c-shopping',
      '--c-entertainment',
      '--c-money',
      '--c-family',
      '--c-other',
    ]) {
      const ratio = contrast(set[key], set['--surface'])
      if (ratio < 3)
        problems.push(
          `${name}: data colour ${key} is ${ratio.toFixed(2)}:1 on the surface, graphics need 3:1`,
        )
    }
  }
} finally {
  await browser.close()
  await server.close()
}
if (problems.length) {
  console.error(`THEME-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('THEME-OK')
