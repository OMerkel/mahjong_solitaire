// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT

import { createRenderer, createTileGraphics, paletteForFace, svgEl } from './renderer.js';
import { Actions, appReducer, createStore, initialAppState } from './store.js';

const store = createStore(appReducer, initialAppState);
const sections = ['game', 'rules', 'options', 'about'];
const SETTINGS_STORAGE_KEY = 'mahjong_user_settings';
const HIGHSCORE_STORAGE_KEY = 'mahjong_highscores';

const showView = (view) => {
  sections.forEach((id) => {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = (id !== view);
  });

  const title = document.getElementById('app-header-title');
  if (!title) return;
  title.textContent = view === 'game'
    ? 'Mahjong Solitaire'
    : view.charAt(0).toUpperCase() + view.slice(1);
};

const updateHeaderBadge = (settings) => {
  const badge = document.getElementById('app-header-badge');
  if (!badge) return;
  const layout = settings.layout ?? 'ClassicTurtle';
  const theme = settings.tileTheme ?? 'Classic';
  const free = settings.showFreeTiles ?? 'On';
  badge.textContent = `${layout} | ${theme} | Free ${free}`;
  badge.setAttribute('aria-label', `Layout ${layout}, theme ${theme}, free-tiles highlight ${free}`);
};

const readSettings = () => ({
  layout: document.querySelector('input[name="layout"]:checked')?.value ?? 'ClassicTurtle',
  showfreetiles: document.querySelector('input[name="showfreetiles"]:checked')?.value ?? 'On',
  showhints: document.querySelector('input[name="showhints"]:checked')?.value ?? 'On',
  selectionmode: document.querySelector('input[name="selectionmode"]:checked')?.value ?? 'Flexible',
  tiletheme: document.querySelector('input[name="tiletheme"]:checked')?.value ?? 'Classic',
});

const engine = new Worker('js/controller.js', { type: 'module' });

const sendToEngine = (request, extra = {}) => {
  try {
    engine.postMessage({ class: 'request', request, settings: readSettings(), ...extra });
  } catch (error) {
    console.error(`Worker message failed (${request}):`, error);
  }
};

engine.addEventListener('error', (event) => {
  console.error('Worker crashed:', event.message, event.filename, event.lineno);
});

let renderer = null;
let wasWonLastState = false;
let timerInterval = null;

const startGameTimer = (board) => {
  // Clear any existing timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Only start timer if game is active with firstMoveTime set
  if (!board || !board.firstMoveTime || board.isWon || board.isBlocked) {
    return;
  }

  // Update every second
  timerInterval = setInterval(() => {
    if (!renderer || !store.getState().board) {
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    const currentBoard = store.getState().board;
    if (!currentBoard.firstMoveTime || currentBoard.isWon || currentBoard.isBlocked) {
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    const elapsedSeconds = Math.floor((Date.now() - currentBoard.firstMoveTime) / 1000);
    renderer.updateStatus(currentBoard, elapsedSeconds);
  }, 1000);
};

const handleTileClick = (tileId) => {
  const state = store.getState();
  if (state.phase !== 'human_turn') return;

  const freeSet = new Set(state.freeTileIds);
  if (!freeSet.has(tileId)) return;

  const selected = state.selectedTileId;
  const allowReselect = (state.settings.selectionMode ?? 'Flexible') === 'Flexible';

  if (selected === null) {
    store.dispatch({ type: Actions.SELECT_SOURCE, source: tileId });
    return;
  }

  if (selected === tileId) {
    if (allowReselect) {
      store.dispatch({ type: Actions.SELECT_SOURCE, source: null });
    }
    return;
  }

  const action = state.selectableActions.find((candidate) => (
    (candidate.firstId === selected && candidate.secondId === tileId) ||
    (candidate.firstId === tileId && candidate.secondId === selected)
  ));

  if (action) {
    sendToEngine('move', { action });
    return;
  }

  if (allowReselect) {
    store.dispatch({ type: Actions.SELECT_SOURCE, source: tileId });
  }
};

engine.addEventListener('message', ({ data }) => {
  switch (data.request) {
    case 'redraw':
      store.dispatch({ type: Actions.ENGINE_BOARD_UPDATE, board: data.board });
      break;

    case 'human_to_move':
      store.dispatch({
        type: Actions.HUMAN_TURN_READY,
        board: data.board,
        selectableActions: data.selectableActions ?? [],
        freeTileIds: data.freeTileIds ?? [],
      });
      break;

    default:
      break;
  }
});

store.subscribe((state) => {
  showView(state.view);
  updateHeaderBadge(state.settings);

  if (!renderer || !state.board) return;

  const showHints = (state.settings.showHints ?? 'On') === 'On';
  const showFree = (state.settings.showFreeTiles ?? 'On') === 'On';
  const hintPair = (showHints && state.selectedTileId === null && state.selectableActions.length > 0)
    ? [state.selectableActions[0].firstId, state.selectableActions[0].secondId]
    : null;

  renderer.render(
    state.board,
    state.freeTileIds,
    state.selectedTileId,
    hintPair,
    showFree,
    state.settings.tileTheme ?? 'Classic'
  );

  startGameTimer(state.board);

  const isWon = !!state.board?.isWon;
  if (isWon && !wasWonLastState) {
    recordCompletedGame(state.board);
  }
  wasWonLastState = isWon;
});

const pad2 = (n) => String(n).padStart(2, '0');

const getTodayKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const getMonthKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

const getWeekKey = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad2(weekNo)}`;
};

const LAYOUT_NAMES = Object.freeze(['ClassicTurtle', 'Heart', 'Square']);

const emptyScores = () => {
  const initLayout = () => LAYOUT_NAMES.reduce((acc, layout) => ({ ...acc, [layout]: null }), {});
  return {
    today: { period: '', layouts: initLayout() },
    week: { period: '', layouts: initLayout() },
    month: { period: '', layouts: initLayout() },
  };
};

const normalizeScores = (value) => {
  const base = emptyScores();
  if (!value || typeof value !== 'object') return base;
  for (const period of ['today', 'week', 'month']) {
    const item = value[period];
    if (!item || typeof item !== 'object') continue;
    base[period].period = typeof item.period === 'string' ? item.period : '';
    if (item.layouts && typeof item.layouts === 'object') {
      for (const layout of LAYOUT_NAMES) {
        const score = item.layouts[layout];
        base[period].layouts[layout] = Number.isInteger(score) ? score : null;
      }
    }
  }
  return base;
};

const loadScores = () => {
  try {
    const raw = localStorage.getItem(HIGHSCORE_STORAGE_KEY);
    if (!raw) return emptyScores();
    return normalizeScores(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to load highscores from localStorage:', error);
    return emptyScores();
  }
};

const saveScores = (scores) => {
  try {
    localStorage.setItem(HIGHSCORE_STORAGE_KEY, JSON.stringify(scores));
  } catch (error) {
    console.warn('Failed to save highscores to localStorage:', error);
  }
};

const refreshScorePeriods = (scores) => {
  const next = normalizeScores(scores);
  const now = new Date();
  const keys = {
    today: getTodayKey(now),
    week: getWeekKey(now),
    month: getMonthKey(now),
  };

  for (const period of ['today', 'week', 'month']) {
    if (next[period].period !== keys[period]) {
      const initLayout = () => LAYOUT_NAMES.reduce((acc, layout) => ({ ...acc, [layout]: null }), {});
      next[period] = { period: keys[period], layouts: initLayout() };
    }
  }

  return next;
};

const formatScore = (bestSeconds) => {
  if (bestSeconds === null) return '-';
  const minutes = Math.floor(bestSeconds / 60);
  const seconds = bestSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const updateHighscoreView = (scores, currentLayout = 'ClassicTurtle') => {
  // Helper to format score with layout info for a specific layout
  const formatScoreWithLayout = (layoutScores, layout) => {
    const bestSeconds = layoutScores[layout];
    if (bestSeconds === null) return '-';
    const timeStr = formatScore(bestSeconds);
    return `${timeStr} (${layout})`;
  };

  // Update Options menu display
  const todayEl = document.getElementById('score-today');
  const weekEl = document.getElementById('score-week');
  const monthEl = document.getElementById('score-month');
  if (todayEl) todayEl.textContent = formatScoreWithLayout(scores.today.layouts, currentLayout);
  if (weekEl) weekEl.textContent = formatScoreWithLayout(scores.week.layouts, currentLayout);
  if (monthEl) monthEl.textContent = formatScoreWithLayout(scores.month.layouts, currentLayout);

  // Update game board display
  const gameTodayEl = document.getElementById('game-score-today');
  const gameWeekEl = document.getElementById('game-score-week');
  const gameMonthEl = document.getElementById('game-score-month');
  if (gameTodayEl) gameTodayEl.textContent = formatScoreWithLayout(scores.today.layouts, currentLayout);
  if (gameWeekEl) gameWeekEl.textContent = formatScoreWithLayout(scores.week.layouts, currentLayout);
  if (gameMonthEl) gameMonthEl.textContent = formatScoreWithLayout(scores.month.layouts, currentLayout);
};

const renderHighscores = () => {
  const next = refreshScorePeriods(loadScores());
  saveScores(next);
  const currentLayout = store.getState().settings.layout ?? 'ClassicTurtle';
  updateHighscoreView(next, currentLayout);
};

const recordCompletedGame = (board) => {
  if (!board || !board.firstMoveTime || !board.layout) return;

  const elapsedSeconds = Math.floor((Date.now() - board.firstMoveTime) / 1000);
  if (elapsedSeconds <= 0) return;

  const layout = board.layout;
  const next = refreshScorePeriods(loadScores());

  let newHighscorePeriods = [];
  for (const period of ['today', 'week', 'month']) {
    const current = next[period].layouts[layout];

    // Replace score if: 1) no score yet, or 2) faster time
    if (current === null || elapsedSeconds < current) {
      next[period].layouts[layout] = elapsedSeconds;
      newHighscorePeriods.push(period);
    }
  }
  saveScores(next);
  updateHighscoreView(next, layout);

  // Update the status message
  const statusMessage = `Amazing! You solved it in ${formatScore(elapsedSeconds)}!`;
  const highscoreMessage = newHighscorePeriods.length > 0
    ? ` 🎉 A new highscore for ${newHighscorePeriods.join(', ')}!`
    : ' Fantastic effort! Keep pushing for new records!';

  renderer.updateStatus(board, `${statusMessage}\n${highscoreMessage}`);
};

const resetHighscore = (period) => {
  const valid = ['today', 'week', 'month'];
  if (!valid.includes(period)) return;

  const next = refreshScorePeriods(loadScores());
  const initLayout = () => LAYOUT_NAMES.reduce((acc, layout) => ({ ...acc, [layout]: null }), {});
  next[period].layouts = initLayout();
  saveScores(next);
  const currentLayout = store.getState().settings.layout ?? 'ClassicTurtle';
  updateHighscoreView(next, currentLayout);
};

const renderTileShowcase = (theme = 'Classic') => {
  const container = document.getElementById('tile-showcase');
  if (!container) return;

  container.innerHTML = '';

  const categories = {
    Bamboo: { faces: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'], copies: 4 },
    Characters: { faces: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'], copies: 4 },
    Circles: { faces: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'], copies: 4 },
    Dragons: { faces: ['DR', 'DG', 'DW'], copies: 4 },
    Winds: { faces: ['WE', 'WS', 'WW', 'WN'], copies: 4 },
    Flowers: { faces: ['F1', 'F2', 'F3', 'F4'], copies: 1 },
    Seasons: { faces: ['S1', 'S2', 'S3', 'S4'], copies: 1 },
  };

  for (const [categoryName, categoryData] of Object.entries(categories)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'tile-group';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'tile-group-title';
    const copyText = categoryData.copies === 1 ? 'single tiles' : `${categoryData.copies} copies per tile`;
    titleDiv.textContent = `${categoryName} (${copyText})`;
    groupDiv.appendChild(titleDiv);

    const samplesDiv = document.createElement('div');
    samplesDiv.className = 'tile-samples';

    for (const face of categoryData.faces) {
      const palette = paletteForFace(face, theme);
      const svg = svgEl('svg', {
        viewBox: '0 0 92 122',
        class: 'tile-sample-svg',
        role: 'img',
        'aria-label': face,
      });

      const plate = svgEl('rect', {
        x: 0,
        y: 0,
        rx: 10,
        ry: 10,
        width: 92,
        height: 122,
        fill: '#e7e5e4',
        stroke: '#78716c',
        'stroke-width': 2,
      });

      const body = svgEl('rect', {
        x: 4,
        y: 4,
        rx: 8,
        ry: 8,
        width: 84,
        height: 114,
        fill: palette.fill,
        stroke: '#fafaf9',
        'stroke-width': 1.6,
      });

      svg.appendChild(plate);
      svg.appendChild(body);

      const graphics = createTileGraphics(face, palette);
      svg.appendChild(graphics);

      samplesDiv.appendChild(svg);
    }

    groupDiv.appendChild(samplesDiv);
    container.appendChild(groupDiv);
  }
};

const saveSettingsToStorage = () => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(readSettings()));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

const restoreSettingsFromStorage = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return;
    const settings = JSON.parse(stored);
    ['layout', 'showfreetiles', 'showhints', 'selectionmode', 'tiletheme'].forEach((name) => {
      const value = settings[name];
      if (!value) return;
      const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (el) el.checked = true;
    });
  } catch (error) {
    console.warn('Failed to restore settings from localStorage:', error);
  }
};

const wireUI = () => {
  restoreSettingsFromStorage();
  renderHighscores();
  const initialTheme = readSettings().tiletheme ?? 'Classic';
  renderTileShowcase(initialTheme);

  const boardContainer = document.getElementById('board');
  renderer = createRenderer(boardContainer, handleTileClick);

  const panel = document.getElementById('side-panel');
  const menuBtn = document.getElementById('btn-menu');
  const closeBtn = document.getElementById('btn-panel-close');
  const overlay = document.getElementById('panel-overlay');

  const openPanel = () => { panel.classList.add('open'); overlay.hidden = false; };
  const closePanel = () => { panel.classList.remove('open'); overlay.hidden = true; };

  const applySettingsFromOptions = ({ restart = false } = {}) => {
    const previous = store.getState().settings;
    const s = readSettings();
    store.dispatch({ type: Actions.SETTINGS_CHANGE, settings: {
      layout: s.layout,
      showFreeTiles: s.showfreetiles,
      showHints: s.showhints,
      selectionMode: s.selectionmode,
      tileTheme: s.tiletheme,
    }});

    sendToEngine('sync');

    const layoutChanged = previous.layout !== s.layout;
    if (restart || layoutChanged) {
      store.dispatch({ type: Actions.NEW_GAME });
      sendToEngine('restart');
    }
  };

  const closePanelAndReturnToGame = () => {
    closePanel();
    const currentView = store.getState().view;
    if (currentView === 'options') {
      applySettingsFromOptions();
      store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
      return;
    }
    if (currentView === 'rules' || currentView === 'about') {
      store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
    }
  };

  menuBtn?.addEventListener('click', openPanel);
  closeBtn?.addEventListener('click', closePanelAndReturnToGame);
  overlay?.addEventListener('click', closePanelAndReturnToGame);

  document.getElementById('nav-new')?.addEventListener('click', () => {
    saveSettingsToStorage();
    applySettingsFromOptions({ restart: true });
    closePanel();
    store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
  });

  const navTo = (view) => () => { closePanel(); store.dispatch({ type: Actions.NAVIGATE, view }); };
  document.getElementById('nav-rules')?.addEventListener('click', () => {
    const currentTheme = readSettings().tiletheme ?? 'Classic';
    renderTileShowcase(currentTheme);
    navTo('rules')();
  });
  document.getElementById('nav-options')?.addEventListener('click', () => {
    renderHighscores();
    navTo('options')();
  });
  document.getElementById('nav-about')?.addEventListener('click', navTo('about'));

  document.querySelectorAll('.btn-back').forEach((btn) => {
    btn.addEventListener('click', () => store.dispatch({ type: Actions.NAVIGATE, view: 'game' }));
  });

  document.getElementById('btn-options-ok')?.addEventListener('click', () => {
    saveSettingsToStorage();
    applySettingsFromOptions();
    store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
  });

  document.getElementById('btn-reset-score-today')?.addEventListener('click', () => {
    if (!window.confirm('Are you sure?')) return;
    resetHighscore('today');
  });

  document.getElementById('btn-reset-score-week')?.addEventListener('click', () => {
    if (!window.confirm('Are you sure?')) return;
    resetHighscore('week');
  });

  document.getElementById('btn-reset-score-month')?.addEventListener('click', () => {
    if (!window.confirm('Are you sure?')) return;
    resetHighscore('month');
  });

  document.querySelectorAll('input[name="layout"], input[name="showfreetiles"], input[name="showhints"], input[name="selectionmode"], input[name="tiletheme"]').forEach((input) => {
    input.addEventListener('change', saveSettingsToStorage);
  });

  document.querySelectorAll('input[name="tiletheme"]').forEach((input) => {
    input.addEventListener('change', () => {
      const newTheme = readSettings().tiletheme ?? 'Classic';
      renderTileShowcase(newTheme);
    });
  });

  document.querySelectorAll('input[name="layout"]').forEach((input) => {
    input.addEventListener('change', () => {
      const newLayout = readSettings().layout ?? 'ClassicTurtle';
      const scores = loadScores();
      updateHighscoreView(scores, newLayout);
    });
  });

  const initial = readSettings();
  store.dispatch({ type: Actions.SETTINGS_CHANGE, settings: {
    layout: initial.layout,
    showFreeTiles: initial.showfreetiles,
    showHints: initial.showhints,
    selectionMode: initial.selectionmode,
    tileTheme: initial.tiletheme,
  }});

  sendToEngine('start');
};

export { saveSettingsToStorage, restoreSettingsFromStorage };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireUI);
} else {
  wireUI();
}
