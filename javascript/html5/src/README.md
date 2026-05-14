# Mahjong Solitaire (HTML5/Javascript)

Mahjong Solitaire for the browser, using ES modules and a worker-backed game engine.

## Feature List

- Legal move generation for free-tile matching.
- Layout options: Classic Turtle (default), Heart, Square.
- Tile themes: Classic, Ink.
- Highscores persisted for:
  - Today
  - This Week
  - This Month
- Per-period highscore reset with confirmation dialog.
- Side-panel navigation and Options workflow.
- PWA support via manifest files.

## Quick Start

### Prerequisites

- Node.js 18+.
- npm.

### Install

```powershell
npm install
```

### Run locally

```powershell
node tests/server.js
```

Open [http://localhost:4173](http://localhost:4173).

## Test Commands

Unit tests:

```powershell
npm test
```

Unit coverage:

```powershell
npm run test:coverage
```

E2E tests:

```powershell
npm run test:e2e
```

All tests:

```powershell
npm run test:all
```

## Coverage

Coverage is configured in vitest.config.js and enforced at:

- Statements >= 96%
- Branches >= 96%
- Functions >= 96%
- Lines >= 96%

## Architecture

See doc/software_architecture.md.

Custom layout guide:

- doc/how_to_create_an_own_layout.md

## Notes on Implementation Style

The game engine is organized around functional concepts:

- Pure state transitions in js/board.js.
- Immutable updates for board and store state.
- Composable transforms (map/filter/flatMap) for action generation.
- Worker orchestration isolated in js/controller.js.

## License

Source code is MIT-licensed.
