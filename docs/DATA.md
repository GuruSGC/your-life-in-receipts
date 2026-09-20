# Data guide

The raw files stay outside the repository. `scripts/build-data.mjs` compiles them into three JSON files in `public/data`.

## Sources

| File          | Source                                 | Rows read | Kept                            | Notes                                                       |
| ------------- | -------------------------------------- | --------- | ------------------------------- | ----------------------------------------------------------- |
| `music.json`  | Spotify listening export, 2013 to 2024 | 149,860   | 148,350 plays in 8,850 sessions | 1,510 duplicate plays removed                               |
| `ledger.json` | Household transactions, 2015 to 2018   | 2,461     | 2,461 entries                   | Dates are day/month/year, amounts in rupees                 |
| `card.json`   | Card statement, 2022 to 2024           | 10,267    | 1,300 receipts                  | 1,404 distinct transactions after merging; 102 have no date |

## Fields

Every receipt in the app has: `id`, `kind` (`listen`, `ledger` or `card`), `min` (minutes since 1970, wall clock as recorded, or null), `title`, `detail`, `theme`, `search` text, and for spending an `amount` in rupees and a `direction`.

## Rules applied

- A session is a run of plays with no gap longer than 30 minutes.
- A skip is a track ended by the forward button; the source flag for skips is filled in for only some years.
- Card rows with the same transaction id are merged, each blank field filled from another copy.
- Rows without an id or an amount are left out and counted.
- Times are never shifted to another timezone.
