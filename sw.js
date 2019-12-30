// sw version
const version = "1.1";

const appAssets = [
    "index.html",
    "main.js",
    "images/flame.png",
    "images/logo.png",

    "vendor/jquery.min.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(`pwa-cache-${version}`).then(cache => cache.addAll(appAssets)).catch(console.error))
})

self.addEventListener("activate", (event) => {

    //clean static cache
    let cleaned = caches.keys().then((keys) => {
        keys.forEach(key => {
            if (!key.includes(`pwa-cache-${version}`)) {
                return caches.delete(key)
            }
        })
    })

    event.waitUntil(cleaned)

})

//remove old cached Images from giphy Cache
function cleanGiphyCache(giphyUrl) {
    caches.open("giphyImage-cache").then(cache => {
        cache.keys().then(keys => {
            keys.forEach(key => {
                if (!giphyUrl.includes(key.url)) cache.delete(key)
            })
        })
    })
}

function fallBackCache(request) {
    return fetch(request).then(res => {

        if (res.ok) {
            caches.open(`pwa-cache-${version}`).then(cache => cache.put(request, res))
            return res.clone();
        }
        throw "Fetch Error"
    }).catch(() => {
        return caches.match(request)
    })

}

// cache Strategy- cache first with network fallback
function staticCache(request, cacheName = `pwa-cache-${version}`) {
    return caches.match(request).then((cachedRes) => {
        if (cachedRes) {
            return cachedRes
        }
        return fetch(request).then((res) => {
            caches.open(cacheName).then((cache) => cache.put(request, res))
            return res.clone();
        })
    })
}

// SW Fetch
self.addEventListener("fetch", (event) => {

    // Caching for static content - App Shell
    if (event.request.url.match(location.origin)) {
        event.respondWith(staticCache(event.request))
    } else if (event.request.url.match("api.giphy.com/v1/gifs/trending")) {
        // Dynmic content Caching - Giphy API
        event.respondWith(fallBackCache(event.request))
    }
    else if (event.request.url.match("giphy.com/media")) {
        // Cache Giphy Images
        event.respondWith(staticCache(event.request, "giphyImage-cache"))
    }
})

self.addEventListener("message", (e) => {
    if (e.data.action === "cleanGiphyCache") cleanGiphyCache(e.data.giphyUrlArray)
})