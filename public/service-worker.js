/**
 * Service Worker para manter heartbeat em background
 * Continua enviando pings mesmo quando a aba está em segundo plano
 */

const CACHE_NAME = 'spyfall-clash-v2';
const HEARTBEAT_PORT = 'heartbeat-port';

// Registrar porta para comunicação com a página
self.addEventListener('message', (event) => {
    if (event.data.type === 'INIT_HEARTBEAT_PORT') {
        heartbeatPort = event.ports[0];
        
        heartbeatPort.onmessage = (portEvent) => {
            if (portEvent.data.type === 'START_HEARTBEAT') {
                startBackgroundHeartbeat(portEvent.data);
            } else if (portEvent.data.type === 'STOP_HEARTBEAT') {
                stopBackgroundHeartbeat();
            }
        };

        heartbeatPort.start();
    }
});

let heartbeatPort = null;
let backgroundHeartbeatInterval = null;

function startBackgroundHeartbeat(config) {
    console.log('[Service Worker] Iniciando heartbeat em background');
    
    const pingInterval = config.pingInterval || 15000;
    
    backgroundHeartbeatInterval = setInterval(() => {
        if (heartbeatPort) {
            heartbeatPort.postMessage({
                type: 'BACKGROUND_PING',
                timestamp: Date.now()
            });
        }
    }, pingInterval);
}

function stopBackgroundHeartbeat() {
    if (backgroundHeartbeatInterval) {
        clearInterval(backgroundHeartbeatInterval);
        backgroundHeartbeatInterval = null;
        console.log('[Service Worker] Heartbeat em background parado');
    }
}

// Cache estratégia
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/script.js',
                '/heartbeat.js',
                '/connectivity-manager.js',
                '/style.css'
            ]).catch(err => {
                // Não falhar se alguns recursos não estiverem disponíveis
                console.log('[Service Worker] Alguns recursos não foram cacheados:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Network primeiro, fallback para cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/socket.io/')) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

// Background Sync para reconexão
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-heartbeat') {
        event.waitUntil(
            (async () => {
                if (heartbeatPort) {
                    heartbeatPort.postMessage({
                        type: 'SYNC_HEARTBEAT',
                        timestamp: Date.now()
                    });
                }
            })()
        );
    }
});
