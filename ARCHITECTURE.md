# Architecture

## Data flow

```
raw CSV files (outside the repo)
        |  scripts/build-data.mjs   parse, dedupe, merge, encode
        v
public/data/{music,ledger,card}.json      compact, versioned, about 640 KB
        |  fetched by the story worker
        v
decode + validate  ->  LifeData { receipts, byDay, music aggregates, quality notes, totals }
        |
        v
buildStory(life)   ->  months, day facts, chapters, links, insights      (pure functions)
        |
        |  postMessage: story + totals first, then receipts in chunks of 1,500
        v
DataContext  ->  pages, charts and the day drawer
```

The worker (`services/data/storyWorker.ts`) exists so decoding and analysis never block a paint or a keystroke. Where module workers are missing, and in tests, `loadStory` does the same work on the main thread.

## The data layer

- `build-data.mjs` reads the raw files with a small RFC 4180 CSV reader. It removes 1,510 duplicate plays, groups plays into sessions after a 30 minute gap, merges the card statement's duplicate rows by transaction id, keeps undated card receipts separately, and delta-encodes session start times to keep the file small.
- `decode.ts` turns each compiled file into `Receipt` records, validating every field and throwing a readable error on the first malformed row. `assemble` joins the three sources and indexes receipts by day.
- Times are minutes since 1970 as recorded (wall clock). No timezone is applied anywhere; the app says so.

## The insight engine (`services/insights`)

All functions are pure and deterministic.

- **`series.ts`** builds one row per month (listening, night plays, forward-button endings, spending) and one fact record per day (minutes, artists, spend, themes, sources).
- **`chapters.ts`** cuts the timeline where a source starts or stops, then applies binary segmentation to log monthly listening: the split that most reduces the spread inside each side, at least six months apiece, until there are seven chapters. Each chapter is named after the trait that deviates most from the whole timeline (night listening, one artist dominating, new artists, a very loud or quiet stretch, a busy forward button). Neighbouring chapters never share a name.
- **`links.ts`** compares, for each of the fifteen most played artists and each kind of spending, how often the artist plays on days with that spending against any day in the same window. Pairs with at least 8 shared days and a rate at least 25% away from normal are kept and ranked by `|ln(lift)| x sqrt(shared days)`.
- **`habits.ts`** and **`money.ts`** produce the individual findings. Each returns a headline, a body, a big number, a label and the evidence days.

## The interface

- Hash routing on `useSyncExternalStore`, lazy pages inside `Suspense`, a global error boundary.
- Charts are hand-written SVG with text alternatives, so there is no charting dependency.
- The day drawer is a native modal `<dialog>`, which gives focus trapping, Escape and top-layer stacking for free.
- Theme tokens are CSS custom properties; a single `data-theme` attribute switches them, set before first paint.
- Motion is CSS keyframes and transitions driven by duration tokens and one `--motion-scale`.

## Trade-offs

- The connection finder counts an artist as played on a day when they lead one of that day's listening sessions. That is a deliberate approximation, since sessions only keep their top three artists; the independent check tolerates the difference.
- The card statement's blank fields are filled only from other copies of the same transaction. Nothing is estimated.
- There is no map, because the coordinates in the card statement contradict its city and state fields.
