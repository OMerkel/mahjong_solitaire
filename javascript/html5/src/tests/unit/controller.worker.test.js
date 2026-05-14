import { afterEach, describe, expect, it, vi } from 'vitest';

const defaultSettings = {
  layout: 'ClassicTurtle',
  showfreetiles: 'On',
  showhints: 'On',
  selectionmode: 'Flexible',
  tiletheme: 'Classic',
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock('../../js/board.js');
  delete globalThis.self;
});

describe('controller worker message handling', () => {
  it('handles start and emits redraw + human_to_move', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start', settings: defaultSettings } });

    expect(posted.map((m) => m.request)).toEqual(['redraw', 'human_to_move']);
    expect(posted[0].board.tiles.length).toBe(144);
    expect(Array.isArray(posted[0].freeTileIds)).toBe(true);
    expect(Array.isArray(posted[0].selectableActions)).toBe(true);
  });

  it('restarts with selected layout', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'restart', settings: { ...defaultSettings, layout: 'Square' } } });

    const redraw = posted.find((m) => m.request === 'redraw');
    expect(redraw.board.layout).toBe('Square');
  });

  it('sync keeps board and emits turn-ready snapshot', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start', settings: defaultSettings } });
    posted.length = 0;

    onMessage({ data: { request: 'sync', settings: defaultSettings } });

    expect(posted.map((m) => m.request)).toEqual(['redraw', 'human_to_move']);
  });

  it('action_by_ai remains compatibility no-op with redraw flow', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start', settings: defaultSettings } });
    posted.length = 0;

    onMessage({ data: { request: 'action_by_ai', settings: defaultSettings } });

    expect(posted.map((m) => m.request)).toEqual(['redraw', 'human_to_move']);
  });

  it('move with illegal action keeps board unchanged', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start', settings: defaultSettings } });
    const before = posted[0].board;
    posted.length = 0;

    onMessage({
      data: {
        request: 'move',
        settings: defaultSettings,
        action: { firstId: 999, secondId: 1000 },
      },
    });

    const redraw = posted.find((m) => m.request === 'redraw');
    expect(redraw.board.moves).toBe(before.moves);
    expect(redraw.board.remaining).toBe(before.remaining);
  });

  it('invalid settings are ignored without crashing', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start', settings: defaultSettings } });
    posted.length = 0;

    onMessage({
      data: {
        request: 'sync',
        settings: { ...defaultSettings, layout: 'InvalidLayout' },
      },
    });

    expect(posted.map((m) => m.request)).toEqual(['redraw', 'human_to_move']);
  });

  it('applies valid move action and increments move count', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start', settings: defaultSettings } });
    const before = posted.find((m) => m.request === 'redraw').board;
    const action = posted.find((m) => m.request === 'human_to_move').selectableActions[0];
    posted.length = 0;

    onMessage({ data: { request: 'move', settings: defaultSettings, action } });

    const redraw = posted.find((m) => m.request === 'redraw');
    expect(redraw.board.moves).toBe(before.moves + 1);
  });

  it('supports missing settings payload and unknown request safely', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'start' } });
    expect(posted.map((m) => m.request)).toEqual(['redraw', 'human_to_move']);

    posted.length = 0;
    onMessage({ data: { request: 'unknown_request', settings: defaultSettings } });
    expect(posted).toEqual([]);
  });

  it('rejects invalid showfreetiles/showhints/selectionmode/tiletheme payload fields', async () => {
    const posted = [];
    const listeners = new Map();

    globalThis.self = {
      postMessage: vi.fn((msg) => posted.push(msg)),
      addEventListener: vi.fn((type, handler) => listeners.set(type, handler)),
    };

    await import('../../js/controller.js');
    const onMessage = listeners.get('message');

    onMessage({ data: { request: 'restart', settings: { ...defaultSettings, layout: 'Square' } } });
    expect(posted.find((m) => m.request === 'redraw').board.layout).toBe('Square');

    posted.length = 0;
    onMessage({ data: { request: 'restart', settings: { ...defaultSettings, layout: 'Heart', showfreetiles: 'Maybe' } } });
    expect(posted.find((m) => m.request === 'redraw').board.layout).toBe('Square');

    posted.length = 0;
    onMessage({ data: { request: 'restart', settings: { ...defaultSettings, layout: 'Heart', showhints: 'Maybe' } } });
    expect(posted.find((m) => m.request === 'redraw').board.layout).toBe('Square');

    posted.length = 0;
    onMessage({ data: { request: 'restart', settings: { ...defaultSettings, layout: 'Heart', selectionmode: 'MustMove' } } });
    expect(posted.find((m) => m.request === 'redraw').board.layout).toBe('Square');

    posted.length = 0;
    onMessage({ data: { request: 'restart', settings: { ...defaultSettings, layout: 'Heart', tiletheme: 'Sepia' } } });
    expect(posted.find((m) => m.request === 'redraw').board.layout).toBe('Square');
  });
});
