# Contributing

## Setup

```bash
npm install
npm run dev
```

The app needs only Node 22 or newer. The raw datasets are not required: the compiled files in `public/data` are committed. To rebuild them, put the three CSV folders next to the project in `../life-data` (or set `LIFE_DATA_DIR`) and run `node scripts/build-data.mjs`.

## Workflow

- Branch names: `feat/short-description`, `fix/short-description`.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `perf:`, `test:`, `docs:`, `chore:`.
- Keep commits small. One idea per commit.

## Before you push

```bash
npm run lint            # zero errors and zero warnings
npm run typecheck
npm run format:check
npm run coverage        # thresholds are enforced
npm run build
```

`npm run format` fixes formatting.

## Conventions

- One component per file, logic in hooks and pure functions.
- Only `shared/services/storage.ts` touches `localStorage`.
- Import through the `@/` alias, and through a folder's `index.ts` where one exists.
- Motion may use `transform` and `opacity` only, must be 300 ms or shorter, and must respect `prefers-reduced-motion`.
- New insights must list the days they were found on, and a test must recompute the number independently.
