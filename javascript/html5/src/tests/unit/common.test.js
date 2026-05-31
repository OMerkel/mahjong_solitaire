import { describe, expect, it } from "vitest";
import {
	actionToKey,
	BOARD_HEIGHT,
	BOARD_WIDTH,
	MAX_LAYER,
	mulberry32,
	shuffle,
} from "../../js/common.js";

describe("common constants", () => {
	it("exports board dimensions and max layer", () => {
		expect(BOARD_WIDTH).toBe(12);
		expect(BOARD_HEIGHT).toBe(8);
		expect(MAX_LAYER).toBe(4);
	});
});

describe("actionToKey", () => {
	it("builds pair key from tile ids", () => {
		expect(actionToKey({ firstId: 10, secondId: 44 })).toBe("10:44");
	});
});

describe("mulberry32", () => {
	it("produces deterministic sequence for same seed", () => {
		const a = mulberry32(123456);
		const b = mulberry32(123456);
		const seqA = [a(), a(), a(), a()];
		const seqB = [b(), b(), b(), b()];
		expect(seqA).toEqual(seqB);
	});

	it("produces values in [0, 1)", () => {
		const rnd = mulberry32(77);
		for (let i = 0; i < 25; i++) {
			const value = rnd();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});
});

describe("shuffle", () => {
	it("returns new array with same values", () => {
		const data = [1, 2, 3, 4, 5];
		const out = shuffle(data, mulberry32(5));
		expect(out).not.toBe(data);
		expect([...out].sort((x, y) => x - y)).toEqual(data);
	});

	it("can keep order when random function always returns 0", () => {
		const data = [1, 2, 3, 4];
		const out = shuffle(data, () => 0);
		expect(out).toEqual([2, 3, 4, 1]);
	});
});
