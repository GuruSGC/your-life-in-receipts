// G1: lint (zero errors and zero warnings), strict typecheck, Prettier, production build.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const run = (label, args) => {
  const result = spawnSync(npm, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 32 * 1024 * 1024,
  })
  const output = `${result.stdout}${result.stderr}`
  console.log(`${result.status === 0 ? 'ok  ' : 'FAIL'} ${label}`)
  if (result.status !== 0) console.error(output.split('\n').slice(-25).join('\n'))
  return { ok: result.status === 0, output }
}

const problems = []
for (const [label, args] of [
  ['eslint (max-warnings 0)', ['run', 'lint', '--silent', '--', '--max-warnings', '0']],
  ['typecheck', ['run', 'typecheck', '--silent']],
  ['prettier', ['run', 'format:check', '--silent']],
  ['build', ['run', 'build', '--silent']],
]) {
  if (!run(label, args).ok) problems.push(label)
}
const tsconfig = readFileSync('tsconfig.app.json', 'utf8')
if (!/"strict":\s*true/.test(tsconfig)) problems.push('tsconfig.app.json is not strict')
if (problems.length) {
  console.error(`TOOLING-FAIL: ${problems.join(', ')}`)
  process.exit(1)
}
console.log('TOOLING-OK')
