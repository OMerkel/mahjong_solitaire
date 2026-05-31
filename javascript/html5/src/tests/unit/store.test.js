import { describe, expect, it } from "vitest";
import {
	Actions,
	appReducer,
	createStore,
	initialAppState,
} from "../../js/store.js";

describe("store", () => {
	it("getState returns current state snapshot", () => {
		const store = createStore(appReducer, initialAppState);
		expect(store.getState()).toBe(initialAppState);

		store.dispatch({ type: Actions.NAVIGATE, view: "rules" });
		expect(store.getState().view).toBe("rules");
	});

	it("dispatch notifies subscribers and unsubscribe stops notifications", () => {
		const store = createStore(appReducer, initialAppState);
		let calls = 0;
		const unsubscribe = store.subscribe(() => {
			calls++;
		});

		store.dispatch({ type: Actions.NAVIGATE, view: "rules" });
		expect(calls).toBe(1);

		unsubscribe();
		store.dispatch({ type: Actions.NAVIGATE, view: "about" });
		expect(calls).toBe(1);
	});

	it("subscriber receives dispatched action", () => {
		const store = createStore(appReducer, initialAppState);
		let lastActionType = null;

		store.subscribe((_state, action) => {
			lastActionType = action.type;
		});

		store.dispatch({ type: Actions.NEW_GAME });
		expect(lastActionType).toBe(Actions.NEW_GAME);
	});

	it("keeps state on unknown action", () => {
		const prev = initialAppState;
		const next = appReducer(prev, { type: "UNKNOWN" });
		expect(next).toBe(prev);
	});

	it("supports reducer transitions used by UI flow", () => {
		let state = initialAppState;

		state = appReducer(state, { type: Actions.NAVIGATE, view: "options" });
		expect(state.view).toBe("options");

		state = appReducer(state, {
			type: Actions.SETTINGS_CHANGE,
			settings: {
				layout: "Heart",
				tileTheme: "Ink",
			},
		});
		expect(state.settings.layout).toBe("Heart");
		expect(state.settings.tileTheme).toBe("Ink");

		const board = {
			layout: "ClassicTurtle",
			tiles: [],
			isWon: false,
			isBlocked: false,
			remaining: 144,
			moves: 0,
			latestPair: null,
		};
		const actions = [{ firstId: 1, secondId: 2 }];
		const freeTileIds = [1, 2, 3];
		state = appReducer(state, {
			type: Actions.HUMAN_TURN_READY,
			board,
			selectableActions: actions,
			freeTileIds,
		});
		expect(state.phase).toBe("human_turn");
		expect(state.selectableActions).toEqual(actions);
		expect(state.freeTileIds).toEqual(freeTileIds);

		state = appReducer(state, {
			type: Actions.SELECT_SOURCE,
			source: 1,
		});
		expect(state.selectedTileId).toBe(1);

		state = appReducer(state, { type: Actions.AI_THINKING });
		expect(state.phase).toBe("idle");
		expect(state.selectedTileId).toBeNull();

		state = appReducer(state, { type: Actions.ENGINE_BOARD_UPDATE, board });
		expect(state.phase).toBe("idle");
		expect(state.board).toEqual(board);

		state = appReducer(state, { type: Actions.NEW_GAME });
		expect(state.phase).toBe("idle");
		expect(state.selectedTileId).toBeNull();
		expect(state.selectableActions).toEqual([]);
		expect(state.freeTileIds).toEqual([]);
	});
});
