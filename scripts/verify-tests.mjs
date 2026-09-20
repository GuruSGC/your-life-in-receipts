// G2 and G3: the unit and component tests pass, the coverage thresholds in vite.config.ts hold, and the decoder rejects bad data.
import { spawnSync } from 'node:child_process'

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const run = (args) =>
  spawnSync(npx, ['vitest', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 32 * 1024 * 1024,
  })
const summary = (text) =>
  text
    .split('\n')
    .filter((line) => /Tests |Test Files|ERROR|FAIL|×/.test(line))
    .join('\n')

const mode = process.argv[2] ?? 'all'
if (mode === 'loader') {
  const result = run(['run', 'tests/decode.test.ts', '--coverage.enabled=false'])
  const text = result.stdout + result.stderr
  console.log(summary(text))
  const rejects = /rejects malformed files/.test(text) || /6 passed/.test(text)
  if (result.status !== 0 || !rejects) {
    console.error('LOADER-FAIL')
    process.exit(1)
  }
  console.log('LOADER-OK')
} else {
  const result = run(['run', '--coverage'])
  const text = result.stdout + result.stderr
  console.log(summary(text))
  const lines = Number(text.match(/Lines\s*:\s*([\d.]+)%/)?.[1] ?? '0')
  const tests = Number(text.match(/Tests\s+(?:\d+ failed \| )?(\d+) passed/)?.[1] ?? '0')
  console.log(`line coverage ${lines}%, ${tests} tests`)
  if (result.status !== 0 || lines < 80 || tests < 30) {
    console.error('TESTS-FAIL')
    process.exit(1)
  }
  console.log('TESTS-OK')
}
