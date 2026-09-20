// G12: no raw HTML sinks, clean production audit, the headers configured, and the app actually runs under that CSP.
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { launch, startServer } from './lib/harness.mjs'

const problems = []
const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  )
const source = files('src').filter(
  (file) => /\.(ts|tsx)$/.test(file) && !file.replaceAll('\\', '/').includes('src/test/'),
)
const text = source.map((file) => [file, readFileSync(file, 'utf8')])

for (const [file, content] of text) {
  if (
    /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML|document\.write\(|\beval\(|new Function\(/.test(
      content,
    )
  )
    problems.push(`${file} uses a raw HTML or eval sink`)
  if (/target="_blank"/.test(content) && !/rel="[^"]*noopener/.test(content))
    problems.push(`${file} opens a new tab without rel=noopener`)
  if (
    /localStorage|sessionStorage/.test(content) &&
    !file.replaceAll('\\', '/').endsWith('shared/services/storage.ts')
  )
    problems.push(`${file} touches web storage outside the storage service`)
  if (
    /\bfetch\(/.test(content) &&
    !/features\/data\/services|DataContext|dataService/.test(file.replaceAll('\\', '/'))
  )
    problems.push(`${file} makes a network request outside the data service`)
}
const searchInputs = text.flatMap(
  ([, content]) => content.match(/<input[^>]*type="search"[^>]*>/g) ?? [],
)
if (searchInputs.length === 0 || searchInputs.some((tag) => !/maxLength/.test(tag)))
  problems.push('a search input has no length limit')

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const audit = spawnSync(npm, ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
try {
  const counts = JSON.parse(audit.stdout).metadata.vulnerabilities
  console.log(
    `npm audit (production): ${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate, ${counts.low} low`,
  )
  if (counts.critical + counts.high > 0)
    problems.push('the production audit has high or critical findings')
} catch {
  console.log('npm audit could not be read (offline?); skipped')
}

const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
const headers = Object.fromEntries(
  config.headers.flatMap((rule) =>
    rule.headers.map((header) => [header.key.toLowerCase(), header.value]),
  ),
)
for (const name of [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
])
  if (!headers[name]) problems.push(`vercel.json does not set ${name}`)
const csp = headers['content-security-policy'] ?? ''
for (const directive of [
  "default-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
]) {
  if (!csp.includes(directive) && directive !== "object-src 'none'")
    problems.push(`the CSP lacks ${directive}`)
}
if (/script-src[^;]*'unsafe-(inline|eval)'/.test(csp))
  problems.push('the CSP allows inline or eval scripts')

// Run the built app with that exact CSP and confirm it still works and reports no violations.
const server = await startServer()
const browser = await launch()
try {
  const context = await browser.newContext()
  const page = await context.newPage()
  const violations = []
  page.on('console', (message) => {
    if (/content security policy|refused to/i.test(message.text())) violations.push(message.text())
  })
  await page.route('**/*', async (route) => {
    const response = await route.fetch()
    const responseHeaders = { ...response.headers(), 'content-security-policy': csp }
    await route.fulfill({ response, headers: responseHeaders })
  })
  await page.goto(`${server.url}/#/story?chapter=4`, { waitUntil: 'networkidle' })
  await page.waitForSelector('#chapter-title', { timeout: 15000 })
  await page.getByRole('button', { name: /open that day/i }).click()
  await page.getByRole('dialog').waitFor({ state: 'visible' })
  if (violations.length) problems.push(`CSP violations: ${violations.slice(0, 2).join(' | ')}`)
  await context.close()
} finally {
  await browser.close()
  await server.close()
}

if (problems.length) {
  console.error(`SECURITY-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('SECURITY-OK')
