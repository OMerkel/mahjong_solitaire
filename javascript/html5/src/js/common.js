// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT

export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 8;
export const MAX_LAYER = 4;

export const actionToKey = (action) => `${action.firstId}:${action.secondId}`;

export const mulberry32 = (seed) => {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let x = Math.imul(t ^ (t >>> 15), 1 | t);
		x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
};

export const shuffle = (values, randomFn) => {
	const arr = [...values];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(randomFn() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};
