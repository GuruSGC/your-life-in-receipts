// G11: Lighthouse (mobile emulation, 4x CPU slowdown, slow 4G) against the production build, as the median of three runs,
// plus the gzipped size of the JavaScript needed for the first paint. Pass a URL to measure a deployment instead.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { startStaticServer } from './lib/static-server.mjs'

const RUNS = 3
const THRESHOLDS = { performance: 85, accessibility: 95, 'best-practices': 95, seo: 90 }
const url = process.argv[2]
// The build is served the way the production host serves it: gzip for text and long-lived caching for hashed assets.
const server = url ? null : await startStaticServer()
const target = url ?? `${server.url}/`
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const problems = []
const runs = []

for (let attempt = 0; attempt < RUNS; attempt += 1) {
  const profile = mkdtempSync(join(tmpdir(), 'lr-lh-'))
  const chrome = await launch({
    chromeFlags: ['--headless=new', '--no-sandbox'],
    userDataDir: profile,
  })
  try {
    const run = await lighthouse(target, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: Object.keys(THRESHOLDS),
    })
    const { categories, audits } = run.lhr
    runs.push({
      scores: Object.fromEntries(
        Object.keys(THRESHOLDS).map((key) => [key, Math.round((categories[key].score ?? 0) * 100)]),
      ),
      fcp: audits['first-contentful-paint'].numericValue,
      lcp: audits['largest-contentful-paint'].numericValue,
      cls: audits['cumulative-layout-shift'].numericValue,
      tbt: audits['total-blocking-time'].numericValue,
      kb: (audits['total-byte-weight']?.numericValue ?? 0) / 1024,
    })
  } finally {
    await Promise.resolve(chrome.kill()).catch(() => undefined)
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
    } catch {
      // leftover profile files are harmless
    }
  }
}
if (server) await server.close()

const pick = (getter) => median(runs.map(getter))
const scores = Object.fromEntries(
  Object.keys(THRESHOLDS).map((key) => [key, pick((run) => run.scores[key])]),
)
const fcp = pick((run) => run.fcp)
const lcp = pick((run) => run.lcp)
const cls = pick((run) => run.cls)
const tbt = pick((run) => run.tbt)
console.log(
  `runs: performance ${runs.map((run) => run.scores.performance).join(', ')}; FCP ${runs.map((run) => Math.round(run.fcp)).join(', ')} ms`,
)
console.log(
  `median: ${Object.entries(scores)
    .map(([key, value]) => `${key} ${value}`)
    .join(', ')}`,
)
console.log(
  `median: FCP ${Math.round(fcp)} ms, LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(3)}, TBT ${Math.round(tbt)} ms, transferred ${Math.round(pick((run) => run.kb))} KB`,
)
for (const [key, minimum] of Object.entries(THRESHOLDS))
  if (scores[key] < minimum) problems.push(`${key} ${scores[key]} < ${minimum}`)
if (cls > 0.02) problems.push(`CLS ${cls.toFixed(3)} > 0.02`)
if (fcp >= 1800) problems.push(`FCP ${Math.round(fcp)} ms >= 1800`)

// Initial JavaScript: the entry script and everything it preloads.
const html = readFileSync('dist/index.html', 'utf8')
const files = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((match) => match[1])
const initial = [...new Set(files)].reduce(
  (sum, file) => sum + gzipSync(readFileSync(join('dist', file))).length,
  0,
)
console.log(`initial JavaScript (${files.length} files): ${(initial / 1024).toFixed(1)} KB gzipped`)
if (initial > 100 * 1024)
  problems.push(`initial JavaScript ${(initial / 1024).toFixed(1)} KB gzipped > 100 KB`)

if (problems.length) {
  console.error(`EFFICIENCY-FAIL: ${problems.join('; ')}`)
  process.exit(1)
}
console.log('EFFICIENCY-OK')
