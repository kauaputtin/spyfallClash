/**
 * Manager de Conectividade com Suporte a Background Execution
 * Integra: Service Worker, detecção de atividade e gerenciamento de visibilidade
 * Mantém conexão ativa mesmo com tela desligada ou app minimizado
 */

class ConnectivityManager {
    constructor(options = {}) {
        this.enableServiceWorker = options.enableServiceWorker !== false;
        this.serviceWorkerPort = null;
        this.activityTimeout = options.activityTimeout || 300000; // 5 minutos
        this.lastActivityTime = Date.now();
        this.statusCallback = options.statusCallback || (() => {});
        this.socket = options.socket || null; // Socket para controlar desconexão
        
        this.init();
    }

    async init() {
        // Registrar Service Worker se suportado
        if (this.enableServiceWorker && 'serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Detectar atividade do usuário
        this.setupActivityDetection();

        // Configurar detecção de visibilidade (não desconectar quando oculto)
        this.setupVisibilityHandling();

        // Detectar fechamento real da janela
        this.setupWindowCloseDetection();
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            console.log('[Connectivity] Service Worker registrado:', registration);
            
            // Configurar comunicação com Service Worker
            if (registration.active) {
                this.setupServiceWorkerPort(registration.active);
            }
        } catch (error) {
            console.warn('[Connectivity] Erro ao registrar Service Worker:', error);
        }
    }

    setupServiceWorkerPort(worker) {
        const channel = new MessageChannel();
        this.serviceWorkerPort = channel.port1;

        this.serviceWorkerPort.onmessage = (event) => {
            if (event.data.type === 'BACKGROUND_PING') {
                this.statusCallback('background-ping', 'Ping em background enviado');
            } else if (event.data.type === 'SYNC_HEARTBEAT') {
                this.statusCallback('sync-heartbeat', 'Sincronização de heartbeat');
            }
        };

        this.serviceWorkerPort.start();
        worker.postMessage(
            { type: 'INIT_HEARTBEAT_PORT' },
            [channel.port2]
        );
    }

    setupActivityDetection() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivityTime = Date.now();
                this.attemptWakeLock();
            }, { passive: true });
        });

        // Monitorar inatividade
        setInterval(() => {
            const inactiveTime = Date.now() - this.lastActivityTime;
            if (inactiveTime > this.activityTimeout) {
                this.statusCallback('inativo', 'Usuário inativo por 5 minutos');
            }
        }, 60000);
    }

    setupVisibilityHandling() {
        // Monitorar visibilidade da página mas NÃO desconectar quando oculta
        // Isso permite que o usuário minimize ou desligue a tela sem perder a conexão
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.statusCallback('pagina-oculta', 'Página em background - mantendo conexão');
                console.log('[Connectivity] Página oculta - mantendo conexão ativa');
            } else {
                this.statusCallback('pagina-visivel', 'Página visível novamente');
                console.log('[Connectivity] Página visível novamente');
            }
        });
    }

    setupWindowCloseDetection() {
        // Desconectar APENAS quando a janela for realmente fechada
        window.addEventListener('beforeunload', (e) => {
            // Desconectar o socket quando a janela for fechada
            if (this.socket && this.socket.connected) {
                console.log('[Connectivity] Janela sendo fechada - desconectando socket');
                console.log('[Connectivity] Sessao preservada para reconexao');
            }
        });

        // Fallback para navegadores que não suportam beforeunload
        window.addEventListener('pagehide', (e) => {
            if (e.persisted) {
                // Página está sendo colocada no cache (não fechada)
                console.log('[Connectivity] Página em cache - mantendo conexão');
            } else {
                // Página está sendo fechada
                if (this.socket && this.socket.connected) {
                    console.log('[Connectivity] Página fechada - desconectando socket');
                    console.log('[Connectivity] Sessao preservada para reconexao');
                }
            }
        });
    }

    enableBackgroundSync() {
        // Habilitar sincronização em background se suportado
        if ('sync' in self.registration) {
            self.registration.sync.register('sync-heartbeat').then(() => {
                console.log('[Connectivity] Background Sync registrado');
            }).catch(err => {
                console.warn('[Connectivity] Erro ao registrar Background Sync:', err);
            });
        }
    }

    startBackgroundHeartbeat(config) {
        if (this.serviceWorkerPort) {
            this.serviceWorkerPort.postMessage({
                type: 'START_HEARTBEAT',
                pingInterval: config.pingInterval || 15000
            });
        }
    }

    stopBackgroundHeartbeat() {
        if (this.serviceWorkerPort) {
            this.serviceWorkerPort.postMessage({
                type: 'STOP_HEARTBEAT'
            });
        }
    }

    getStatus() {
        return {
            serviceWorkerAtivo: this.serviceWorkerPort !== null,
            tempoInatividade: Date.now() - this.lastActivityTime,
            paginaVisivel: !document.hidden
        };
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConnectivityManager;
}
