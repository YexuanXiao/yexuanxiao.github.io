const workboxVersion = '6.3.0';

importScripts(`//static.mysteriouspreserve.com/workbox/${workboxVersion}/workbox-sw.js`);
workbox.setConfig({
	modulePathPrefix: `//static.mysteriouspreserve.com/workbox/${workboxVersion}/`
});

workbox.core.setCacheNameDetails({
	prefix: 'M.P.O.'
});

workbox.core.clientsClaim();

workbox.precaching.precacheAndRoute([]);

workbox.precaching.cleanupOutdatedCaches();

// Main documents
workbox.routing.registerRoute(
	/index\.html/,
	new workbox.strategies.NetworkFirst({
		cacheName: 'html',
	})
);

// Search
workbox.routing.registerRoute(
	/search\.json/,
	new workbox.strategies.NetworkFirst({
		cacheName: 'search',
	})
);

// Images
workbox.routing.registerRoute(
	/\.(?:png|jpg|jpeg|webp|svg|ico)$/,
	new workbox.strategies.CacheFirst({
		cacheName: 'images',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 1000,
				maxAgeSeconds: 60 * 60 * 24 * 7
			}),
			new workbox.cacheableResponse.CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Fonts
workbox.routing.registerRoute(
	/\.(?:eot|ttf|woff|woff2)$/,
	new workbox.strategies.CacheFirst({
		cacheName: 'fonts',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 1000,
				maxAgeSeconds: 60 * 60 * 24 * 7
			}),
			new workbox.cacheableResponse.CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Static Resources
workbox.routing.registerRoute(
	/\.(?:js|css|txt|webmanifest)$/,
	new workbox.strategies.CacheFirst({
		cacheName: 'static-resources',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 1000,
				maxAgeSeconds: 60 * 60 * 24 * 7
			}),
			new workbox.cacheableResponse.CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Static Libraries
workbox.routing.registerRoute(
	/^https:\/\/cdn\.jsdelivr\.net/,
	new workbox.strategies.StaleWhileRevalidate({
		cacheName: 'static-libs',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 1000,
				maxAgeSeconds: 60 * 60 * 24 * 7
			}),
			new workbox.cacheableResponse.CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);

// Live2d Resources
workbox.routing.registerRoute(
	/^https:\/\/nykz-static\.pages\.dev/,
	new workbox.strategies.StaleWhileRevalidate({
		cacheName: 'live2d-resources',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 1000,
				maxAgeSeconds: 60 * 60 * 24 * 7
			}),
			new workbox.cacheableResponse.CacheableResponsePlugin({
				statuses: [0, 200]
			})
		]
	})
);
