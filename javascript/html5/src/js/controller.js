// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT

import { Board, createBoard, doAction, getActions, getFreeTileIds } from './board.js';

let board = new Board(createBoard());
let settings = {
  layout: 'ClassicTurtle',
  showFreeTiles: 'On',
  showHints: 'On',
  selectionMode: 'Flexible',
  tileTheme: 'Classic',
};

const VALID_LAYOUTS = Object.freeze(new Set(['ClassicTurtle', 'Heart', 'Square']));
const VALID_ON_OFF = Object.freeze(new Set(['On', 'Off']));
const VALID_SELECTION = Object.freeze(new Set(['Flexible', 'Locked']));
const VALID_THEMES = Object.freeze(new Set(['Classic', 'Ink']));

const isValidPayload = ({ layout, showFreeTiles, showHints, selectionMode, tileTheme }) =>
  VALID_LAYOUTS.has(layout) &&
  VALID_ON_OFF.has(showFreeTiles) &&
  VALID_ON_OFF.has(showHints) &&
  VALID_SELECTION.has(selectionMode) &&
  VALID_THEMES.has(tileTheme);

const normalizeSettings = (payload = {}) => ({
  layout: payload.layout ?? settings.layout,
  showFreeTiles: payload.showfreetiles ?? settings.showFreeTiles,
  showHints: payload.showhints ?? settings.showHints,
  selectionMode: payload.selectionmode ?? settings.selectionMode,
  tileTheme: payload.tiletheme ?? settings.tileTheme,
});

const snapshot = () => {
  const state = board.getState();
  return {
    board: state,
    freeTileIds: getFreeTileIds(state),
    selectableActions: getActions(state),
  };
};

const postState = (request) => {
  self.postMessage({
    eventClass: 'request',
    request,
    ...snapshot(),
  });
};

const postTurnReady = () => {
  postState('redraw');
  postState('human_to_move');
};

const applySettings = (payload) => {
  const next = normalizeSettings(payload);
  if (!isValidPayload(next)) return;
  settings = next;
};

const restart = () => {
  board = new Board(createBoard({ layout: settings.layout }));
  postTurnReady();
};

const move = (action) => {
  const current = board.getState();
  const next = doAction(current, action);
  board.setState(next === current ? current : next);
  postTurnReady();
};

const handlers = Object.freeze({
  start: ({ settings: payload }) => {
    applySettings(payload);
    restart();
  },
  restart: ({ settings: payload }) => {
    applySettings(payload);
    restart();
  },
  move: ({ settings: payload, action }) => {
    applySettings(payload);
    move(action);
  },
  sync: ({ settings: payload }) => {
    applySettings(payload);
    postTurnReady();
  },
  action_by_ai: () => {
    // Compatibility no-op: no computer player in this edition.
    postTurnReady();
  },
});

self.addEventListener('message', ({ data }) => {
  const handler = handlers[data.request];
  if (handler) handler(data);
});
