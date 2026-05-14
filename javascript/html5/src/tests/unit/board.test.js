import { describe, expect, it } from 'vitest';
import { Board, canMatch, createBoard, doAction, getActions, getFreeTileIds, isTileFree } from '../../js/board.js';

const byId = (board, id) => board.tiles.find((tile) => tile.id === id);
const byPosition = (board, x, y, z) =>
  board.tiles.find((tile) => tile.x === x && tile.y === y && tile.z === z);

const makeTinyBoard = () => ({
  layout: 'Tiny',
  seed: 1,
  selectedTileId: null,
  remaining: 4,
  moves: 0,
  isWon: false,
  isBlocked: false,
  latestPair: null,
  tiles: [
    { id: 0, x: 0, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
    { id: 1, x: 2, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
    { id: 2, x: 0, y: 2, z: 0, face: 'C1', group: 'C1', removed: false },
    { id: 3, x: 2, y: 2, z: 0, face: 'D1', group: 'D1', removed: false },
  ],
});

describe('createBoard', () => {
  it('creates deterministic board with fixed seed', () => {
    const a = createBoard({ seed: 123, layout: 'ClassicTurtle' });
    const b = createBoard({ seed: 123, layout: 'ClassicTurtle' });
    expect(a.tiles.map((t) => t.face)).toEqual(b.tiles.map((t) => t.face));
  });

  it('supports all configured layouts with 144 tiles', () => {
    const layouts = ['ClassicTurtle', 'Heart', 'Square'];
    layouts.forEach((layout) => {
      const board = createBoard({ layout });
      expect(board.layout).toBe(layout);
      expect(board.tiles).toHaveLength(144);
      expect(board.remaining).toBe(144);
      expect(board.tiles.every((t) => t.removed === false)).toBe(true);
    });
  });

  it('falls back to classic layout on unknown layout name', () => {
    const board = createBoard({ layout: 'Nope' });
    expect(board.layout).toBe('Nope');
    expect(board.tiles).toHaveLength(144);
  });
});

describe('matching and free-tile logic', () => {
  it('matches same groups and rejects non-matches', () => {
    expect(canMatch({ id: 1, group: 'B1' }, { id: 2, group: 'B1' })).toBe(true);
    expect(canMatch({ id: 1, group: 'flower' }, { id: 2, group: 'flower' })).toBe(true);
    expect(canMatch({ id: 1, group: 'B1' }, { id: 2, group: 'C1' })).toBe(false);
    expect(canMatch(null, { id: 2, group: 'C1' })).toBe(false);
    expect(canMatch({ id: 1, group: 'B1' }, { id: 1, group: 'B1' })).toBe(false);
  });

  it('detects free tiles based on side/top blocking', () => {
    const board = makeTinyBoard();
    expect(isTileFree(board, 0)).toBe(true);

    const blocked = {
      ...board,
      tiles: [
        ...board.tiles,
        { id: 4, x: -1, y: 0, z: 0, face: 'WE', group: 'WE', removed: false },
        { id: 5, x: 1, y: 0, z: 0, face: 'WS', group: 'WS', removed: false },
      ],
    };
    expect(isTileFree(blocked, 0)).toBe(false);

    const topBlocked = {
      ...board,
      tiles: [...board.tiles, { id: 6, x: 0, y: 0, z: 1, face: 'WN', group: 'WN', removed: false }],
    };
    expect(isTileFree(topBlocked, 0)).toBe(false);
    expect(isTileFree(board, 999)).toBe(false);
  });

  it('blocks tiles that are partially covered by higher layers', () => {
    // Create a board with partial coverage: tile at (0, 0, 0) is partially covered by tile at (0.5, 0.5, 1)
    const board = {
      layout: 'Test',
      seed: 1,
      selectedTileId: null,
      remaining: 3,
      moves: 0,
      isWon: false,
      isBlocked: false,
      latestPair: null,
      tiles: [
        { id: 0, x: 0, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 1, x: 2, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 2, x: 0.5, y: 0.5, z: 1, face: 'C1', group: 'C1', removed: false }, // partially covers tile 0
      ],
    };

    // Tile 0 is partially covered by tile 2, so it should not be free
    expect(isTileFree(board, 0)).toBe(false);

    // Tile 1 is not covered, so it should be free
    expect(isTileFree(board, 1)).toBe(true);

    // Tile 2 (the covering tile) is free
    expect(isTileFree(board, 2)).toBe(true);

    // After removing the covering tile, tile 0 should become free
    const afterRemoval = {
      ...board,
      tiles: board.tiles.map((t) => (t.id === 2 ? { ...t, removed: true } : t)),
    };
    expect(isTileFree(afterRemoval, 0)).toBe(true);
  });

  it('blocks inward tiles from outward fractional side neighbors', () => {
    const board = {
      layout: 'Test',
      seed: 1,
      selectedTileId: null,
      remaining: 3,
      moves: 0,
      isWon: false,
      isBlocked: false,
      latestPair: null,
      tiles: [
        { id: 0, x: 2, y: 3, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 1, x: 3, y: 3.5, z: 0, face: 'C1', group: 'C1', removed: false },
        { id: 2, x: 0, y: 0, z: 0, face: 'WE', group: 'WE', removed: false },
      ],
    };

    // Tile 1 is further from center and partially overlaps tile 0 on the right edge.
    // That outward blocker should block the inward tile.
    expect(isTileFree(board, 0)).toBe(false);
    // The outward blocker remains free in this directional rule.
    expect(isTileFree(board, 1)).toBe(true);

    // Unrelated tile remains free.
    expect(isTileFree(board, 2)).toBe(true);

    // After removing the outward blocker, tile 0 becomes free.
    const afterRemoval = {
      ...board,
      tiles: board.tiles.map((t) => (t.id === 1 ? { ...t, removed: true } : t)),
    };
    expect(isTileFree(afterRemoval, 0)).toBe(true);
  });

  it('applies same-z side blocking for classic turtle tail and head tiles', () => {
    const board = createBoard({ seed: 123, layout: 'ClassicTurtle' });

    const tail = byPosition(board, 0, 3.5, 0);
    const leftUpper = byPosition(board, 1, 3, 0);
    const leftLower = byPosition(board, 1, 4, 0);
    const outerHead = byPosition(board, 14, 3.5, 0);
    const innerHead = byPosition(board, 13, 3.5, 0);
    const rightUpper = byPosition(board, 12, 3, 0);
    const rightLower = byPosition(board, 12, 4, 0);

    expect(tail).toBeTruthy();
    expect(leftUpper).toBeTruthy();
    expect(leftLower).toBeTruthy();
    expect(outerHead).toBeTruthy();
    expect(innerHead).toBeTruthy();
    expect(rightUpper).toBeTruthy();
    expect(rightLower).toBeTruthy();

    expect(isTileFree(board, leftUpper.id)).toBe(false);
    expect(isTileFree(board, leftLower.id)).toBe(false);
    expect(isTileFree(board, innerHead.id)).toBe(false);
    expect(isTileFree(board, outerHead.id)).toBe(true);

    const withoutOuterHead = {
      ...board,
      tiles: board.tiles.map((tile) =>
        tile.id === outerHead.id ? { ...tile, removed: true } : tile
      ),
    };

    expect(isTileFree(withoutOuterHead, innerHead.id)).toBe(true);
    expect(isTileFree(withoutOuterHead, rightUpper.id)).toBe(false);
    expect(isTileFree(withoutOuterHead, rightLower.id)).toBe(false);
  });

  it('returns only legal pair actions from free tiles', () => {
    const board = makeTinyBoard();
    const actions = getActions(board);
    expect(actions).toEqual([{ firstId: 0, secondId: 1 }]);

    const noTurn = { ...board, isWon: true };
    expect(getActions(noTurn)).toEqual([]);
  });

  it('computes free tile ids for current board', () => {
    const board = makeTinyBoard();
    expect(getFreeTileIds(board)).toEqual([0, 1, 2, 3]);
  });
});

describe('doAction', () => {
  it('applies legal action and updates derived state', () => {
    const board = makeTinyBoard();
    const next = doAction(board, { firstId: 0, secondId: 1 });
    expect(next).not.toBe(board);
    expect(byId(next, 0).removed).toBe(true);
    expect(byId(next, 1).removed).toBe(true);
    expect(next.remaining).toBe(2);
    expect(next.moves).toBe(1);
    expect(next.latestPair).toEqual([0, 1]);
    expect(next.isWon).toBe(false);
  });

  it('returns same object on illegal action', () => {
    const board = makeTinyBoard();
    const next = doAction(board, { firstId: 2, secondId: 3 });
    expect(next).toBe(board);
  });

  it('marks board as won on last pair', () => {
    const board = {
      ...makeTinyBoard(),
      tiles: [
        { id: 0, x: 0, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 1, x: 2, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
      ],
      remaining: 2,
    };

    const next = doAction(board, { firstId: 0, secondId: 1 });
    expect(next.isWon).toBe(true);
    expect(next.isBlocked).toBe(false);
    expect(next.remaining).toBe(0);
  });

  it('marks board as blocked when tiles remain and no actions exist', () => {
    const board = {
      ...makeTinyBoard(),
      tiles: [
        { id: 0, x: 0, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 1, x: 2, y: 0, z: 0, face: 'C1', group: 'C1', removed: false },
        { id: 2, x: 0, y: 2, z: 0, face: 'D1', group: 'D1', removed: false },
      ],
      remaining: 3,
    };

    const next = doAction(board, { firstId: 0, secondId: 0 });
    expect(next).toBe(board);

    const almost = {
      ...board,
      tiles: [
        { id: 0, x: 0, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 1, x: 2, y: 0, z: 0, face: 'B1', group: 'B1', removed: false },
        { id: 2, x: 0, y: 2, z: 0, face: 'D1', group: 'D1', removed: false },
      ],
      remaining: 3,
    };

    const resolved = doAction(almost, { firstId: 0, secondId: 1 });
    expect(resolved.isBlocked).toBe(true);
    expect(resolved.isWon).toBe(false);
    expect(resolved.remaining).toBe(1);
  });
});

describe('Board class adapter', () => {
  it('supports copy and independent mutation', () => {
    const board = new Board(makeTinyBoard());
    const copy = board.copy();
    copy.doAction({ firstId: 0, secondId: 1 });
    expect(copy.getState().moves).toBe(1);
    expect(board.getState().moves).toBe(0);
  });

  it('setState replaces state', () => {
    const board = new Board();
    const state = makeTinyBoard();
    board.setState(state);
    expect(board.getState()).toBe(state);
  });

  it('getActions delegates to pure helper', () => {
    const board = new Board(makeTinyBoard());
    expect(board.getActions()).toEqual([{ firstId: 0, secondId: 1 }]);
  });
});
