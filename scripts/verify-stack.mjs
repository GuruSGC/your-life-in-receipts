// G17: the project is built on a current stack and uses current platform features, not just current package names.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const problems = []
const check = (ok, message) => {
  if (!ok) problems.push(message)
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
const major = (name) =>
  Number(
    String(deps[name] ?? '0')
      .replace(/^[^\d]*/, '')
      .split('.')[0],
  )
const minimums = {
  react: 19,
  'react-dom': 19,
  typescript: 5,
  vite: 6,
  tailwindcss: 4,
  vitest: 3,
  eslint: 9,
  playwright: 1,
}
for (const [name, minimum] of Object.entries(minimums))
  check(major(name) >= minimum, `${name} ${deps[name] ?? 'missing'} is older than ${minimum}`)
check(pkg.type === 'module', 'package.json is not "type": "module"')
check(Boolean(pkg.engines?.node), 'package.json has no engines.node')
const deprecated = [
  'moment',
  'jquery',
  'enzyme',
  'tslint',
  'node-sass',
  'request',
  'create-react-app',
  'react-scripts',
  'redux-thunk',
  'lodash',
]
for (const name of deprecated) check(!(name in deps), `${name} is a dated dependency`)
check(existsSync('eslint.config.js'), 'ESLint is not using the flat config')
check(
  !existsSync('.eslintrc.json') && !existsSync('.eslintrc.js') && !existsSync('webpack.config.js'),
  'a legacy config file is present',
)
check(
  /"strict":\s*true/.test(readFileSync('tsconfig.app.json', 'utf8')),
  'TypeScript strict mode is off',
)

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  )
const source = files('src')
const code = source
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const css = source
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const html = readFileSync('index.html', 'utf8')

const features = [
  [
    'React lazy routes with Suspense',
    /lazy\(\s*\(\)\s*=>\s*import/.test(code) && /<Suspense/.test(code),
  ],
  ['useDeferredValue for search', /useDeferredValue/.test(code)],
  ['useSyncExternalStore for the router', /useSyncExternalStore/.test(code)],
  [
    'function components and hooks only, apart from the error boundary',
    (code.match(/extends (React\.)?Component/g) ?? []).length <= 1,
  ],
  ['View Transitions API', /startViewTransition/.test(code) && /::view-transition/.test(css)],
  ['container queries', /@container/.test(css) && /container-type/.test(css)],
  ['color-mix()', /color-mix\(/.test(css)],
  ['dynamic viewport units', /100dvh/.test(css)],
  ['native <dialog> for the drawer', /showModal\(\)/.test(code)],
  [
    'text-wrap balance and pretty',
    /text-wrap:\s*balance/.test(css) && /text-wrap:\s*pretty/.test(css),
  ],
  [
    'prefers-color-scheme and prefers-reduced-motion',
    /prefers-color-scheme/.test(css) && /prefers-reduced-motion/.test(css),
  ],
  ['CSS custom properties driving the theme', /:root\[data-theme='dark'\]/.test(css)],
  ['web app manifest', /rel="manifest"/.test(html) && existsSync('public/manifest.webmanifest')],
  [
    'self-hosted variable font',
    /font-weight: 100 900/.test(css) &&
      existsSync('public/fonts/inter-tight-latin-wght-normal.woff2'),
  ],
  ['ESM imports with a path alias', /from '@\//.test(code)],
]
for (const [name, present] of features) check(present, `missing modern feature: ${name}`)
console.log(
  `${features.filter(([, present]) => present).length} of ${features.length} modern platform features in use; react ${deps.react}, typescript ${deps.typescript}, vite ${deps.vite}, tailwindcss ${deps.tailwindcss}, vitest ${deps.vitest}`,
)
if (problems.length) {
  console.error(`STACK-FAIL:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log('STACK-OK')
