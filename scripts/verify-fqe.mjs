// G13: the local FQE emulator (a heuristic stand-in for the hackathon's static audit) scores this repository highly.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../../faie-kit/bin/fqe.mjs', import.meta.url))
if (!existsSync(cli)) {
  console.error('FQE-FAIL: the emulator is not next to this project (../faie-kit)')
  process.exit(1)
}
const run = spawnSync(process.execPath, [cli, '.', '--json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
const report = JSON.parse(run.stdout)
for (const module of report.modules)
  console.log(
    `${module.name.padEnd(26)} ${module.points.toFixed(2)} / ${module.max}  (${Math.round(module.index)}%)`,
  )
console.log(`total ${report.total.toFixed(2)} / ${report.max}`)
const groups = report.rubric.map((group) => `${group.name} ${group.percent}%`).join(', ')
console.log(`rubric view: ${groups}`)
const open = report.modules
  .flatMap((module) => module.checks)
  .filter((check) => check.status !== 'pass')
for (const check of open)
  console.log(`  open ${check.id} (${check.points}/${check.maxPoints}): ${check.title}`)
const problems = []
if (report.total < 34) problems.push(`total ${report.total.toFixed(2)} is below 34`)
for (const module of report.modules)
  if (module.index < 75)
    problems.push(`${module.name} is at ${Math.round(module.index)}%, below 75%`)
if (problems.length) {
  console.error(`FQE-FAIL: ${problems.join('; ')}`)
  process.exit(1)
}
console.log('FQE-OK')
