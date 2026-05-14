// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT

import { actionToKey, mulberry32, shuffle } from './common.js';

const range = (start, endInclusive) =>
  Array.from({ length: endInclusive - start + 1 }, (_, i) => start + i);

const points = (xStart, xEnd, yStart, yEnd, z) =>
  range(yStart, yEnd).flatMap((y) => range(xStart, xEnd).map((x) => ({ x, y, z })));

const STANDARD_FACES = [
  ...Array.from({ length: 9 }, (_, i) => ({ face: `B${i + 1}`, group: `B${i + 1}` })),
  ...Array.from({ length: 9 }, (_, i) => ({ face: `C${i + 1}`, group: `C${i + 1}` })),
  ...Array.from({ length: 9 }, (_, i) => ({ face: `D${i + 1}`, group: `D${i + 1}` })),
  { face: 'WE', group: 'WE' },
  { face: 'WS', group: 'WS' },
  { face: 'WW', group: 'WW' },
  { face: 'WN', group: 'WN' },
  { face: 'DR', group: 'DR' },
  { face: 'DG', group: 'DG' },
  { face: 'DW', group: 'DW' },
];

const FLOWERS = [
  { face: 'F1', group: 'flower' },
  { face: 'F2', group: 'flower' },
  { face: 'F3', group: 'flower' },
  { face: 'F4', group: 'flower' },
];

const SEASONS = [
  { face: 'S1', group: 'season' },
  { face: 'S2', group: 'season' },
  { face: 'S3', group: 'season' },
  { face: 'S4', group: 'season' },
];

const createClassicTurtleLayout = () => {
  // Base layer (z=0): turtle-shaped pattern (shifted right by 1)
  const z0 = [
    // Row 0: 12 columns
    ...points(1, 12, 0, 0, 0),
    // Row 1: 8 columns (centered)
    ...points(3, 10, 1, 1, 0),
    // Row 2: 10 columns (centered)
    ...points(2, 11, 2, 2, 0),
    // Row 3 and 4: 12 columns with tail on left (1 tile), head on right (2 tiles)
    ...points(1, 12, 3, 3, 0),
    ...points(1, 12, 4, 4, 0),
    { x: 0, y: 3.5, z: 0 },  // tail left
    { x: 13, y: 3.5, z: 0 },  // head right
    { x: 14, y: 3.5, z: 0 },  // head right
    // Row 5: 10 columns (centered)
    ...points(2, 11, 5, 5, 0),
    // Row 6: 8 columns (centered)
    ...points(3, 10, 6, 6, 0),
    // Row 7: 12 columns
    ...points(1, 12, 7, 7, 0),
  ];
  // Now a pyramid with z1, z2, z3, z4 layers centered towards each other
  // Layer z1: covers inner area as 6x6 grid (shifted right by 1)
  const z1 = [
    ...points(4, 9, 1, 6, 1),
  ];

  // Layer z2: 4x4 grid (shifted right by 1)
  const z2 = [
    ...points(5, 8, 2, 5, 2),
  ];

  // Layer z3: even smaller
  const z3 = [
    ...points(6, 7, 3, 4, 3),
  ];

  // Layer z4: peak (single tile centered on z3)
  const z4 = [
    { x: 6.5, y: 3.5, z: 4 },
  ];

  return [...z0, ...z1, ...z2, ...z3, ...z4];
};

const createHeartLayout = () => {
  // Base layer (z=0): heart-shaped pattern
  const z0 = [
    // Row 0: bumps (two rounded lobes at top)
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
    { x: 8, y: 0, z: 0 },
    { x: 9, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    // Rows 1-4: full width (widest part of heart)
    ...points(0, 11, 1, 4, 0),
    // Row 5: starts narrowing
    ...points(1, 10, 5, 5, 0),
    // Row 6: taper continues
    ...points(2, 9, 6, 6, 0),
    // Row 7: taper more
    ...points(3, 8, 7, 7, 0),
    // Row 8: point at bottom
    ...points(5, 6, 8, 8, 0),
  ];

  // Layer z1: 6×6 grid (inner coverage)
  const z1 = [
    ...points(3, 8, 2, 7, 1),
  ];

  // Layer z2: 4×4 grid (narrower inner)
  const z2 = [
    ...points(4, 7, 3, 6, 2),
  ];

  // Layer z3: 2×2 grid (even narrower)
  const z3 = [
    ...points(4, 7, 3, 5, 3),

  ];

  return [...z0, ...z1, ...z2, ...z3];
};

const createSquareLayout = () => {
  const z0 = points(1, 10, 0, 7, 0);

  const z1 = points(2, 9, 1, 6, 1).filter(({ x, y }) => {
    const cut =
      ((y === 1 || y === 6) && (x === 2 || x === 9 || x === 5 || x === 6)) ||
      ((y === 2 || y === 5) && (x === 2 || x === 9));
    return !cut;
  });

  const z2 = points(3, 8, 2, 5, 2).filter(({ x, y }) => {
    const cut = (y === 2 || y === 5) && (x === 3 || x === 8);
    return !cut;
  });

  const z3 = points(4, 7, 3, 4, 3);

  return [...z0, ...z1, ...z2, ...z3];
};

const LAYOUT_BUILDERS = Object.freeze({
  ClassicTurtle: createClassicTurtleLayout,
  Heart: createHeartLayout,
  Square: createSquareLayout,
});

const createFaces = () => {
  const repeatedStandard = STANDARD_FACES.flatMap((item) =>
    Array.from({ length: 4 }, () => ({ ...item }))
  );
  return [...repeatedStandard, ...FLOWERS, ...SEASONS];
};

const tileKey = (tile) => `${tile.x}:${tile.y}:${tile.z}`;

const buildIndex = (tiles) => {
  const byId = new Map();
  const byPosition = new Map();
  tiles.forEach((tile) => {
    byId.set(tile.id, tile);
    byPosition.set(tileKey(tile), tile);
  });
  return { byId, byPosition };
};

export const createBoard = ({ seed, layout = 'ClassicTurtle' } = {}) => {
  const buildLayout = LAYOUT_BUILDERS[layout] ?? createClassicTurtleLayout;
  const layoutCells = buildLayout();
  const faces = createFaces();
  const randomSeed = Number.isInteger(seed) ? seed : ((Date.now() * 2654435761) >>> 0);
  const random = mulberry32(randomSeed);
  const shuffledFaces = shuffle(faces, random);

  if (layoutCells.length !== faces.length) {
    throw new Error(`Invalid layout size for ${layout}: expected ${faces.length}, got ${layoutCells.length}`);
  }

  const tiles = layoutCells.map((position, index) => ({
    id: index,
    ...position,
    face: shuffledFaces[index].face,
    group: shuffledFaces[index].group,
    removed: false,
  }));

  return {
    layout,
    seed: randomSeed,
    tiles,
    selectedTileId: null,
    remaining: tiles.length,
    moves: 0,
    isWon: false,
    isBlocked: false,
    latestPair: null,
    firstMoveTime: null,
  };
};

const hasTileAt = (index, x, y, z) => {
  const t = index.byPosition.get(`${x}:${y}:${z}`);
  return !!t && !t.removed;
};

const EPSILON = 1e-9;

const overlapLength = (aMin, aMax, bMin, bMax) =>
  Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin));

const isFractionalCoordinate = (value) => Math.abs(value - Math.round(value)) > EPSILON;

const hasFractionalPosition = (tile) =>
  isFractionalCoordinate(tile.x) || isFractionalCoordinate(tile.y);

const getBoardCenterX = (tiles) => {
  const xs = tiles.filter((tile) => !tile.removed).map((tile) => tile.x);
  if (xs.length === 0) return 0;
  return (Math.min(...xs) + Math.max(...xs)) / 2;
};

const isPartiallyBlockedByTop = (board, tileId) => {
  const tile = board.tiles.find((t) => t.id === tileId);
  if (!tile) return false;

  // Check if any tile on higher z-levels partially covers this tile
  return board.tiles.some((potentialCoverer) => {
    if (potentialCoverer.removed || potentialCoverer.z <= tile.z) return false;

    // A tile at (x, y) conceptually occupies [x, x+1) × [y, y+1)
    const tileRange = { xMin: tile.x, xMax: tile.x + 1, yMin: tile.y, yMax: tile.y + 1 };
    const covererRange = { xMin: potentialCoverer.x, xMax: potentialCoverer.x + 1, yMin: potentialCoverer.y, yMax: potentialCoverer.y + 1 };

    // Check if ranges overlap in both x and y
    const xOverlap = tileRange.xMin < covererRange.xMax && tileRange.xMax > covererRange.xMin;
    const yOverlap = tileRange.yMin < covererRange.yMax && tileRange.yMax > covererRange.yMin;

    if (!xOverlap || !yOverlap) return false;

    // Check if it's partial coverage (not exact alignment)
    const xExact = tileRange.xMin === covererRange.xMin && tileRange.xMax === covererRange.xMax;
    const yExact = tileRange.yMin === covererRange.yMin && tileRange.yMax === covererRange.yMax;

    // Partial coverage is when they overlap but not exactly aligned
    return !(xExact && yExact);
  });
};

const isPartiallyBlockedOnSide = (board, tileId) => {
  const tile = board.tiles.find((t) => t.id === tileId);
  if (!tile) return false;

  const tileRange = { xMin: tile.x, xMax: tile.x + 1, yMin: tile.y, yMax: tile.y + 1 };
  const centerX = getBoardCenterX(board.tiles);
  const tileDistanceToCenter = Math.abs((tile.x + 0.5) - centerX);

  // Check if any tile on the SAME z-level partially blocks this tile on either side.
  // We only apply this rule when at least one of the two tiles is fractional, so
  // standard integer-aligned neighbors still use the classic left/right rule below.
  return board.tiles.some((potentialBlocker) => {
    if (potentialBlocker.removed || potentialBlocker.z !== tile.z || potentialBlocker.id === tile.id) {
      return false;
    }
    if (!hasFractionalPosition(tile) && !hasFractionalPosition(potentialBlocker)) return false;

    const blockerRange = { xMin: potentialBlocker.x, xMax: potentialBlocker.x + 1, yMin: potentialBlocker.y, yMax: potentialBlocker.y + 1 };

    const yOverlap = overlapLength(tileRange.yMin, tileRange.yMax, blockerRange.yMin, blockerRange.yMax);
    if (yOverlap <= EPSILON) return false;

    const touchesOnLeft = Math.abs(blockerRange.xMax - tileRange.xMin) <= EPSILON;
    const touchesOnRight = Math.abs(tileRange.xMax - blockerRange.xMin) <= EPSILON;

    if (!(touchesOnLeft || touchesOnRight)) return false;

    // Directional side blocking: edge tiles further away from board center block
    // tiles that are closer to the center (e.g., tail/head overhang behavior).
    const blockerDistanceToCenter = Math.abs((potentialBlocker.x + 0.5) - centerX);

    return blockerDistanceToCenter > tileDistanceToCenter + EPSILON;
  });
};

export const isTileFree = (board, tileId) => {
  const tile = board.tiles.find((t) => t.id === tileId);
  if (!tile || tile.removed) return false;

  // Check for partial blocking from above or sides
  if (isPartiallyBlockedByTop(board, tileId)) return false;
  if (isPartiallyBlockedOnSide(board, tileId)) return false;

  const index = buildIndex(board.tiles);

  const blockedByTop = hasTileAt(index, tile.x, tile.y, tile.z + 1);
  if (blockedByTop) return false;

  const blockedLeft = hasTileAt(index, tile.x - 1, tile.y, tile.z);
  const blockedRight = hasTileAt(index, tile.x + 1, tile.y, tile.z);

  return !(blockedLeft && blockedRight);
};

export const canMatch = (first, second) => {
  if (!first || !second) return false;
  if (first.id === second.id) return false;
  return first.group === second.group;
};

export const getFreeTileIds = (board) =>
  board.tiles
    .filter((tile) => !tile.removed)
    .filter((tile) => isTileFree(board, tile.id))
    .map((tile) => tile.id);

export const getActions = (board) => {
  if (board.isWon || board.isBlocked) return [];

  const tileById = new Map(board.tiles.map((tile) => [tile.id, tile]));
  const freeTiles = getFreeTileIds(board)
    .map((id) => tileById.get(id))
    .filter(Boolean);

  return freeTiles.flatMap((leftTile, i) =>
    freeTiles
      .slice(i + 1)
      .filter((rightTile) => canMatch(leftTile, rightTile))
      .map((rightTile) => ({ firstId: leftTile.id, secondId: rightTile.id }))
  );
};

const findAction = (actions, action) => {
  const wanted = actionToKey(action);
  return actions.find((candidate) => actionToKey(candidate) === wanted) ?? null;
};

export const doAction = (board, action) => {
  const legal = findAction(getActions(board), action);
  if (!legal) return board;

  const tiles = board.tiles.map((tile) => {
    if (tile.id === legal.firstId || tile.id === legal.secondId) {
      return { ...tile, removed: true };
    }
    return tile;
  });

  const remaining = tiles.filter((tile) => !tile.removed).length;
  const firstMoveTime = board.firstMoveTime ?? Date.now();
  const nextDraft = {
    ...board,
    tiles,
    selectedTileId: null,
    remaining,
    moves: board.moves + 1,
    isWon: remaining === 0,
    isBlocked: false,
    latestPair: [legal.firstId, legal.secondId],
    firstMoveTime,
  };

  if (!nextDraft.isWon) {
    nextDraft.isBlocked = getActions(nextDraft).length === 0;
  }

  return nextDraft;
};

export class Board {
  constructor(state) {
    this._state = state ?? createBoard();
  }

  getActions() { return getActions(this._state); }

  doAction(action) { this._state = doAction(this._state, action); }

  copy() {
    return new Board({
      ...this._state,
      tiles: this._state.tiles.map((tile) => ({ ...tile })),
      latestPair: this._state.latestPair ? [...this._state.latestPair] : null,
    });
  }

  getState() { return this._state; }
  setState(state) { this._state = state; }
}
