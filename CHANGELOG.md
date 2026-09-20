# Changelog

All notable changes to this project are recorded here, newest first.

## [Unreleased]

### Added
- Submission attempt 1: the complete experience (Receipt, Story, Connections, Rhythms, Explore, Method).

## [0.1.0] - 2026-09-20

### Added
- Data build that compiles three raw exports into compact JSON, with duplicate removal, session grouping and transaction merging.
- Typed decoding with validation at the edge, and a loader with a readable failure state.
- Insight engine: monthly series, chapter segmentation with personas, artist and spending connections, eleven findings with their evidence days.
- Home, Story, Connections, Rhythms, Explore and Method pages, and a day drawer.
- Light theme (subtle blue and green) and dark theme (lavender), receipt-inspired components, and motion limited to `transform` and `opacity`.
- Tests, coverage thresholds and a set of browser verification scripts.

### Changed
- The insight engine runs in a worker and streams receipts after the first paint.
- A skip is now the forward button ending a track, because the export's own skipped flag is filled in for only some years.
