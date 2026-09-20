# Component and hook reference

| Name                                         | Where                             | Props or arguments                          | Returns or renders                                          |
| -------------------------------------------- | --------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `App`                                        | `app/App.tsx`                     | none                                        | Providers around the layout                                 |
| `AppLayout`                                  | `layouts/AppLayout.tsx`           | none                                        | Skip link, header, current page, footer, drawer             |
| `AppHeader`                                  | `components/AppHeader.tsx`        | `current: RouteId`                          | Desktop and mobile navigation                               |
| `DayDrawer`                                  | `components/DayDrawer.tsx`        | none (uses the drawer context)              | Modal dialog for one day or one undated receipt             |
| `ReceiptRow`                                 | `components/ReceiptRow.tsx`       | `receipt`, `index?`, `onOpen?`, `showDate?` | One receipt as a printed line                               |
| `DataGate`                                   | `components/DataGate.tsx`         | `children(data)`                            | Children when loaded, else loading or error                 |
| `PageTitle`                                  | `components/PageTitle.tsx`        | `kicker?`, children                         | The page `h1`, focused after navigation                     |
| `ChapterCover`                               | `components/ChapterCover.tsx`     | `index`, `alt`, `sizes`, `priority?`        | A chapter cover in three widths, lazy unless above the fold |
| `MomentChain`                                | `components/MomentChain.tsx`      | `receipts`                                  | A day read as music and spending steps                      |
| `InsightCard`                                | `features/story/components`       | `insight`, `index?`                         | A finding with its evidence days                            |
| `JourneyStrip`                               | `features/story/components`       | `months`, `chapters`, `active?`             | The whole timeline in one SVG                               |
| `ChapterView`                                | `features/story/components`       | `life`, `story`, `chapter`, `onStep`        | One chapter                                                 |
| `ArcDiagram`, `LinkDetail`                   | `features/connections/components` | links, selection                            | The connection diagram and its detail                       |
| `Heatmap`, `MonthlyJourney`, `ArtistStreams` | `features/rhythms/components`     | aggregates                                  | The rhythm charts                                           |
| `ExploreControls`                            | `features/explore/components`     | `filters`, `years`, `onChange`, `onReset`   | Search and filters                                          |
| `useHashRoute()`                             | `hooks/useHashRoute.ts`           | none                                        | `{ route, params, navigate, hash }`                         |
| `useTheme()`                                 | `hooks/useTheme.ts`               | none                                        | `{ theme, toggle }`                                         |
| `useFocusHeading(ref, key)`                  | `hooks/useFocusHeading.ts`        | a ref and a change key                      | Focuses the heading when the key changes                    |
| `useData()`, `useReady()`                    | `context/dataApi.ts`              | none                                        | The loading state, or the loaded life and story             |
| `useDrawer()`                                | `context/drawerApi.ts`            | none                                        | `{ target, openDay, openReceipt, close }`                   |
