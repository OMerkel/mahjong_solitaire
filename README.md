# Mahjong Solitaire

Browser-based Mahjong Solitaire implemented with modern JavaScript ES modules, functional core game logic, and a Web Worker game engine.

![Mahjong icon](javascript/html5/src/img/icons/mahjong128.png)

## Play Online

- [Start game now...](https://omerkel.github.io/mahjong_solitaire/javascript/html5/src/)

## Features

- Legal single-player Mahjong Solitaire with deterministic, seed-based board generation.
- Three playable layouts: Classic Turtle, Heart, and Square.
- Rule engine with top blocking, side blocking, and partial-overlap blocking semantics.
- Three tile themes (Classic, Classic 2, Ink), optional free-tile highlighting, and optional hinting.
- Selection modes: Flexible (reselect allowed) and Locked.
- Persistent settings in localStorage.
- Time-based highscores for Today, This Week, and This Month:
  - measured from first successful pair removal to board clear;
  - displayed with associated layout.
- Responsive SVG renderer with side panel navigation and PWA manifests.
- Test coverage via unit tests and end-to-end tests.

## Architecture Summary

- Main thread UI: wiring, state store, rendering, localStorage, and user interaction.
- Web Worker engine: authoritative board state and legal move execution.
- Pure rules core: layout generation, tile freedom rules, action generation, and immutable board transitions.

Detailed architecture, message flow diagrams, and extension guidance:

- javascript/html5/src/doc/software_architecture.md

## Quick Start

1. Install Node.js.
2. Open a terminal in javascript/html5/src.
3. Install dependencies:

```powershell
npm install
```

1. Start a local server for manual play:

```powershell
node tests/server.js
```

1. Open [http://localhost:4173](http://localhost:4173).

## Tests

Run unit tests:

```powershell
npm test
```

Run unit tests with coverage:

```powershell
npm run test:coverage
```

Run end-to-end tests:

```powershell
npm run test:e2e
```

Run all tests:

```powershell
npm run test:all
```

## Coverage Requirement

Unit-test coverage thresholds are enforced in javascript/html5/src/vitest.config.js.
Current thresholds are set to at least 96% for statements, branches, functions, and lines.

## Project Docs

- javascript/html5/src/README.md
- javascript/html5/src/doc/software_architecture.md
- javascript/html5/src/doc/how_to_create_an_own_layout.md

## Authors

See AUTHORS.
