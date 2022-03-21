var staticCacheName = 'djangopwa-v1';

const appShellFiles = [
	"/static/app/css/index.css",
	"/static/app/css/styles.css",
	"/static/app/js/index.js",
	"/static/app/js/jquery-3.6.0.min.js",
	"/static/app/js/functions.js",
	"/static/app/js/home.js",
	"/static/app/js/tournaments.js",
	"/static/app/bootstrap/css/booststrap.min.css",
	"/static/app/css/booststrap-dark.min.css",
	"/static/app/bootstrap/js/bootstrap.min.js",
	"/static/app/bootstrap/js/bootstrap.bundle.min.js",
	"/static/app/font-awesome/css/all.css",
	"/static/app/js/luxon.min.js",
	"/jsi18n/"
]

self.addEventListener('install', function(event) {
event.waitUntil(
	caches.open(staticCacheName).then(function(cache) {
	return cache.addAll([
		'',
	]);
	})
);
});

self.addEventListener('fetch', function(event) {
var requestUrl = new URL(event.request.url);
	if (requestUrl.origin === location.origin) {
	if ((requestUrl.pathname === '/')) {
		event.respondWith(caches.match(''));
		return;
	}
	}
	event.respondWith(
	caches.match(event.request).then(function(response) {
		return response || fetch(event.request);
	})
	);
});
