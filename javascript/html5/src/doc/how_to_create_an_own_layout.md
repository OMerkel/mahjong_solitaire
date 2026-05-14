# How To Create An Own Layout

## 1. Purpose

This guide explains how to add a custom board layout to the game, which files must be changed, which constraints must hold, and how to test the result.

It also includes one concrete worked example from sketch to tests.

## 2. Hard Constraints

Every custom layout must satisfy all of these:

- Return exactly 144 coordinate cells.
- Each coordinate must have shape `{ x, y, z }`.
- `(x, y, z)` tuples must be unique.
- Coordinates may be integer or fractional values.
- Layout must be registered in rules, worker validation, and UI options.

If the layout does not produce 144 cells, board creation throws an error.

## 3. Files You Need To Touch

- `js/board.js`
- `js/controller.js`
- `index.html`
- `tests/unit/board.test.js`

Optional if you want user docs updates:

- `README.md`
- `doc/software_architecture.md`

## 4. Existing Helpers For Layout Building

In `js/board.js`:

- `range(start, endInclusive)`
  - Returns an inclusive numeric sequence.
- `points(xStart, xEnd, yStart, yEnd, z)`
  - Returns all `{x,y,z}` cells in an inclusive rectangle.

Example:

```javascript
points(3, 5, 2, 3, 1)
```

returns:

- x: 3..5 (3 columns)
- y: 2..3 (2 rows)
- z: 1
- total cells: 6

## 5. Recommended Helper Functions

When building complex or symmetric shapes, add local helpers near existing helpers in `js/board.js`.

```javascript
const row = (xStart, xEnd, y, z) => points(xStart, xEnd, y, y, z);

const uniqueCells = (cells) => {
  const seen = new Set();
  return cells.filter((c) => {
    const key = `${c.x}:${c.y}:${c.z}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mirrorX = (cells, centerX) => cells.flatMap(({ x, y, z }) => {
  const mx = centerX + (centerX - x);
  return Math.abs(mx - x) < 1e-9
    ? [{ x, y, z }]
    : [{ x, y, z }, { x: mx, y, z }];
});
```

Why these are useful:

- `row` keeps row-driven sketches readable.
- `mirrorX` accelerates left/right symmetric designs.
- `uniqueCells` protects against accidental duplicates during iteration.

## 6. Standard Integration Steps

1. Add the layout builder in `js/board.js`.
2. Register it in `LAYOUT_BUILDERS`.
3. Add its name to `VALID_LAYOUTS` in `js/controller.js`.
4. Add layout radio option in `index.html`.
5. Add tests in `tests/unit/board.test.js`.
6. Run unit tests.

## 7. Worked Example: Diamond Layout (Sketch To Tests)

This is a full example of introducing a layout named `Diamond`.

### 7.1 Sketch The Shape First

Create a quick row-width sketch for base layer `z=0`.

- y0: 2 tiles
- y1: 4 tiles
- y2: 6 tiles
- y3: 8 tiles
- y4: 10 tiles
- y5: 12 tiles
- y6: 10 tiles
- y7: 8 tiles
- y8: 6 tiles
- y9: 4 tiles
- y10: 2 tiles

Centered around x range 0..11, this gives 72 cells for `z0`.

Then choose upper layers to reach 144 total:

- z0 = 72
- z1 = 36 (6x6)
- z2 = 20 (5x4)
- z3 = 12 (4x3)
- z4 = 4 (2x2)
- total = 144

### 7.2 Implement In `js/board.js`

Add the new builder:

```javascript
const createDiamondLayout = () => {
  const z0 = [
    ...points(5, 6, 0, 0, 0),
    ...points(4, 7, 1, 1, 0),
    ...points(3, 8, 2, 2, 0),
    ...points(2, 9, 3, 3, 0),
    ...points(1, 10, 4, 4, 0),
    ...points(0, 11, 5, 5, 0),
    ...points(1, 10, 6, 6, 0),
    ...points(2, 9, 7, 7, 0),
    ...points(3, 8, 8, 8, 0),
    ...points(4, 7, 9, 9, 0),
    ...points(5, 6, 10, 10, 0),
  ];

  const z1 = points(3, 8, 2, 7, 1);   // 36
  const z2 = points(3, 7, 3, 6, 2);   // 20
  const z3 = points(4, 7, 4, 6, 3);   // 12
  const z4 = points(5, 6, 5, 6, 4);   // 4

  return [...z0, ...z1, ...z2, ...z3, ...z4];
};
```

Register it in `LAYOUT_BUILDERS`:

```javascript
const LAYOUT_BUILDERS = Object.freeze({
  ClassicTurtle: createClassicTurtleLayout,
  Heart: createHeartLayout,
  Square: createSquareLayout,
  Diamond: createDiamondLayout,
});
```

### 7.3 Update Worker Validation In `js/controller.js`

Add layout name to `VALID_LAYOUTS`:

```javascript
const VALID_LAYOUTS = Object.freeze(new Set(['ClassicTurtle', 'Heart', 'Square', 'Diamond']));
```

### 7.4 Add UI Option In `index.html`

Add one radio option to the layout group:

```html
<label>
  <input type="radio" name="layout" value="Diamond" />
  Diamond
</label>
```

### 7.5 Add Tests In `tests/unit/board.test.js`

At minimum, add coverage for:

- expected tile count
- deterministic behavior with seed
- availability via layout option

Example assertions:

```javascript
it('supports Diamond layout with 144 tiles', () => {
  const board = createBoard({ seed: 12345, layout: 'Diamond' });
  expect(board.tiles).toHaveLength(144);
});

it('creates deterministic Diamond board for fixed seed', () => {
  const a = createBoard({ seed: 2026, layout: 'Diamond' });
  const b = createBoard({ seed: 2026, layout: 'Diamond' });

  const facesA = a.tiles.map((t) => t.face);
  const facesB = b.tiles.map((t) => t.face);
  expect(facesA).toEqual(facesB);
});

it('falls back only for unknown layouts, not Diamond', () => {
  const board = createBoard({ seed: 7, layout: 'Diamond' });
  expect(board.layout).toBe('Diamond');
});
```

If your shape uses fractional coordinates or overhangs, add freedom/blocking tests specific to those coordinates.

### 7.6 Verify

Run from `javascript/html5/src`:

```powershell
npm test -- --run
```

Optionally run E2E:

```powershell
npm run test:e2e
```

## 8. Common Pitfalls

- Off-by-one mistakes in inclusive ranges.
- Duplicate coordinates when combining handcrafted rows and `points`.
- Forgetting to update `VALID_LAYOUTS` in worker.
- Forgetting to add UI option in `index.html`.
- Introducing fractional overhangs without adding rule tests.

## 9. Design Tips For Good Layouts

- Start from a row-by-row sketch before coding.
- Keep horizontal center stable across layers.
- Increase difficulty with overhangs and narrow chokepoints sparingly.
- Count each layer explicitly and keep a running total to 144.
- Add at least one layout-specific unit test for special geometry.
