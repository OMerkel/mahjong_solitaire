// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT
// Service Worker for Mahjong Solitaire PWA

const CACHE_NAME = "mahjong-solitaire-v1";
const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./css/index.css",
	"./js/hmi.js",
	"./js/renderer.js",
	"./js/store.js",
	"./js/board.js",
	"./js/common.js",
	"./js/controller.js",
	"./manifest.json",
];

// Install event: cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
					// Gracefully handle errors; some assets may not exist yet
					console.warn("Cache asset add error:", err);
				});
			})
			.then(() => self.skipWaiting()),
	);
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => {
							console.log("Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}),
				);
			})
			.then(() => self.clients.claim()),
	);
});

// Fetch event: network-first with fallback to cache
self.addEventListener("fetch", (event) => {
	// Only cache GET requests
	if (event.request.method !== "GET") {
		return;
	}

	// Skip cross-origin requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	event.respondWith(
		// Try network first
		fetch(event.request)
			.then((response) => {
				// Cache successful responses
				if (response && response.status === 200) {
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			})
			.catch(() => {
				// Fallback to cache if network fails
				return caches.match(event.request).then((cachedResponse) => {
					return (
						cachedResponse ||
						new Response("Offline - content not cached", {
							status: 503,
							statusText: "Service Unavailable",
						})
					);
				});
			}),
	);
});
