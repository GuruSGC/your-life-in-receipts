// G14: the documentation set exists and the README has the sections a reviewer looks for.
import { existsSync, readFileSync } from 'node:fs'

const problems = []
for (const file of ['README.md', 'ARCHITECTURE.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE'])
  if (!existsSync(file)) problems.push(`${file} is missing`)
const readme = existsSync('README.md') ? readFileSync('README.md', 'utf8') : ''
const headings = [...readme.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) => match[1].toLowerCase())
const sections = [
  ['overview', /overview|about/],
  ['features', /feature/],
  ['tech stack', /tech|stack/],
  ['getting started', /getting started|install|setup/],
  ['architecture', /architecture|structure/],
  ['components and hooks', /component|hook/],
  ['data and method', /data|method/],
  ['testing', /test/],
  ['accessibility', /accessib/],
  ['performance', /performance/],
  ['security', /security/],
  ['deployment', /deploy/],
]
for (const [name, pattern] of sections)
  if (!headings.some((heading) => pattern.test(heading)))
    problems.push(`the README has no "${name}" section`)
if (readme.length < 4000) problems.push(`the README is only ${readme.length} characters`)
if (!/https:\/\/[\w.-]+\.vercel\.app/.test(readme))
  problems.push('the README does not link the live deployment')
if (!/!\[[^\]]*\]\(docs\/[^)]+\.(webp|png|jpg)\)/.test(readme))
  problems.push('the README has no screenshots')
if (/[–—]/.test(readme)) problems.push('the README contains an en or em dash')
const stack = ['React 19', 'TypeScript', 'Vite', 'Tailwind', 'Vitest']
for (const item of stack)
  if (!readme.includes(item)) problems.push(`the README does not name ${item}`)
if (problems.length) {
  console.error(`DOCS-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`README ${readme.length} characters, ${headings.length} headings`)
console.log('DOCS-OK')
