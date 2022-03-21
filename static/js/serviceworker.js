const dbName = "pwa_db";
const version = 17;
const storeName = "pwa_store";

const storeNames = [
	"crypt_key_store",
	"tournaments_store",
	"games_store",
	"fixtures_store"
]

var staticCacheName = `djangopwa-v${version}`;

let db;

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

const contentToCache = appShellFiles

self.addEventListener('install', function(event) {
	console.log('[Service Worker] Install');

	event.waitUntil( ( async () => {
		const cache = await caches.open(staticCacheName)
		console.log('[Service Worker] Caching all: app shell and content');
		await cache.addAll(contentToCache)
	} ) )
});

self.addEventListener('fetch', function(event) {
	console.log('[Service Worker] Fetching')
	event.respondWith(
		caches.open(staticCacheName).then( function (cache) {
			return cache.match(event.request).then( function (response) {
				return (
					response || 
					fetch(event.request).then(function (response) {
						cache.put(event.request, response.clone());
						return response;
					})
				);
			} );
		} ),
	);
});

self.addEventListener('activate', (ev) => {
	// when the service worker has been activated to replace an old one.
	// Extendable Event
	console.log('activated');

	// delete old versions of caches.

	ev.waitUntil(
		caches.keys().then( (keys) => {
			return Promise.all(
				keys.filter( (key) => {
					if (key != staticCacheName) {
						return true;
					}
				} )
				.map( (key) => caches.delete(key) )
			).then( (empties) => {
				// empties is an Array of boolean values.
				// one for each cache deleted
				// TODO:
				openDB( addToStore, [1, 985895886993885881885915904, storeNames[0]] )
			} )
		} )
	)
} )

async function openDB(callback, callbackParams = []) {
	const openRequest = self.indexedDB.open(dbName, version);

	openRequest.onerror = function(event) {
		console.log("Every hour isn't allowed to use IndexedDB?! " + event.target.errorCode);
	};


	openRequest.onupgradeneeded = function(event) {
		db = event.target.result

		for (let storeName of storeNames) {
			if (!db.objectStoreNames.contains(storeName)) {
				// if there's no store of 'storeName' create a new object store
				db.createObjectStore(storeName, { keyPath: "key" })
			}
		}
	};

	openRequest.onsuccess = function(event) {
		console.log( "DB open success, calling callback" )
		db = event.target.result;

		console.log(db)

		if (callback) {
			callback(...callbackParams);
		}
	}
}

async function addToStore(key, value, storeName=storeNames[0]) {
	console.log( "Adding to store, current db object" )
	console.log(`Key: ${key}, value: ${value}, storeName: ${storeName}`)
	console.log(db)
	// start a transaction of actions you want to submit
	const transaction = db.transaction(storeName, "readwrite")

	// create an object store
	const store = transaction.objectStore(storeName);

	// add key and value to the store
	const request = store.put({ key, value });

	request.onsuccess = function() {
		console.log("added to the store", {key: value}, request.result);
	};

	request.onerror = function () {
		console.log("Error did not save to store", request.error);
	};

	transaction.onerror = function (event) {
		console.log("Trans failed", event);
	};

	transaction.oncomplete = function (event) {
		console.log("Trans completed", event);
	}
}

async function getFromStore(key, callback, storeName) {
	// start a transaction
	const transaction = db.transaction(storeName, "readwrite");

	// create an object store
	const store = transaction.objectStore(storeName);

	// get key and value from the store
	const request = store.get(key);

	request.onsuccess = function(event) {
		if (callback) {
			callback(event.target.result.value); // this removes the {key:"key", value:"value"} structure
		}
	};

	request.onerror = function() {
		console.log("Error did not read to store", request.error);
	};

	transaction.onerror = function(event) {
		console.log("Trans failed", event);
	};

	transaction.oncomplete = function (event) {
		console.log("Trans completed ", event)
	}
}