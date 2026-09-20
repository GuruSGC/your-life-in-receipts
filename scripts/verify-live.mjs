// G16: the deployed site answers, renders the app with real data, has its security headers, and logs no console errors.
import { existsSync, readFileSync } from 'node:fs'
import { launch } from './lib/harness.mjs'

const url =
  process.argv[2] ??
  (existsSync('deploy.json') ? JSON.parse(readFileSync('deploy.json', 'utf8')).url : null)
if (!url) {
  console.error('LIVE-FAIL: no deployment URL (deploy.json is missing)')
  process.exit(1)
}
const problems = []
const response = await fetch(url)
if (response.status !== 200) problems.push(`GET ${url} returned ${response.status}`)
for (const header of [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
])
  if (!response.headers.get(header)) problems.push(`the live response lacks ${header}`)
const data = await fetch(`${url.replace(/\/$/, '')}/data/music.json`)
if (data.status !== 200 || !(data.headers.get('content-type') ?? '').includes('json'))
  problems.push(`music.json returned ${data.status} ${data.headers.get('content-type')}`)
const browser = await launch()
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.getByText(/148,350 songs and 3,761 purchases/).waitFor({ timeout: 20000 })
  await page.goto(`${url.replace(/\/$/, '')}/#/explore`, { waitUntil: 'networkidle' })
  await page.getByText(/12,611 receipts/).waitFor({ timeout: 20000 })
  if (errors.length) problems.push(`console errors: ${errors.slice(0, 2).join(' | ')}`)
  await context.close()
} finally {
  await browser.close()
}
if (problems.length) {
  console.error(`LIVE-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`${url} renders the app with its data`)
console.log('LIVE-OK')
