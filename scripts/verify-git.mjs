// G15: a real history (many small commits with conventional messages) and nothing heavy or secret committed.
import { execFileSync } from 'node:child_process'

const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
const problems = []
const subjects = git('log', '--format=%s').split('\n').filter(Boolean)
const conventional = subjects.filter((subject) =>
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?!?: \S/.test(subject),
)
console.log(`${subjects.length} commits, ${conventional.length} conventional`)
if (subjects.length < 25) problems.push(`only ${subjects.length} commits, need 25`)
if (conventional.length / subjects.length < 0.9)
  problems.push(`only ${conventional.length} of ${subjects.length} messages are conventional`)
const tracked = git('ls-files').split('\n')
const sizes = tracked.map((file) => {
  try {
    return [file, Number(git('cat-file', '-s', `HEAD:${file}`))]
  } catch {
    return [file, 0]
  }
})
const large = sizes.filter(([, size]) => size > 700 * 1024)
if (large.length)
  problems.push(
    `large files are committed: ${large.map(([file, size]) => `${file} (${Math.round(size / 1024)} KB)`).join(', ')}`,
  )
const total = sizes.reduce((sum, [, size]) => sum + size, 0)
console.log(`tracked files ${tracked.length}, ${(total / 1024 / 1024).toFixed(2)} MB`)
if (total > 4 * 1024 * 1024)
  problems.push(`the repository holds ${(total / 1024 / 1024).toFixed(1)} MB of tracked files`)
if (tracked.some((file) => /(^|\/)\.env(\.|$)/.test(file) || /node_modules\//.test(file)))
  problems.push('an env file or node_modules is tracked')
if (tracked.some((file) => /\.(zip|mp4|mov|psd)$/i.test(file)))
  problems.push('an archive or video is tracked')
if (problems.length) {
  console.error(`GIT-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('GIT-OK')
