/**
 * Manager de Conectividade com Suporte a Wake Lock e Background Execution
 * Integra: Service Worker, Wake Lock API, e detecção de atividade
 */

class ConnectivityManager {
    constructor(options = {}) {
        this.enableWakeLock = options.enableWakeLock !== false;
        this.enableServiceWorker = options.enableServiceWorker !== false;
        this.wakeLockedScreen = null;
        this.serviceWorkerPort = null;
        this.activityTimeout = options.activityTimeout || 300000; // 5 minutos
        this.lastActivityTime = Date.now();
        this.statusCallback = options.statusCallback || (() => {});
        
        this.init();
    }

    async init() {
        // Registrar Service Worker se suportado
        if (this.enableServiceWorker && 'serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Detectar atividade do usuário
        this.setupActivityDetection();

        // Tentar ativar Wake Lock ao interagir com a página
        this.setupWakeLockTriggers();
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

    setupWakeLockTriggers() {
        // Tentar ativar Wake Lock quando usar a página
        const events = ['mousedown', 'keydown', 'touchstart'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (!this.wakeLockedScreen) {
                    this.requestWakeLock();
                }
            }, { passive: true });
        });
    }

    async requestWakeLock() {
        if (!this.enableWakeLock || !('wakeLock' in navigator)) {
            console.log('[Connectivity] Wake Lock não suportado ou desabilitado');
            return;
        }

        try {
            this.wakeLockedScreen = await navigator.wakeLock.request('screen');
            this.statusCallback('wake-lock-ativo', 'Tela mantida ativa');
            console.log('[Connectivity] Wake Lock ativado');

            // Liberar Wake Lock se a página perder foco
            this.wakeLockedScreen.addEventListener('release', () => {
                this.statusCallback('wake-lock-liberado', 'Tela pode dormir');
                this.wakeLockedScreen = null;
            });

            // Recapturar Wake Lock se a página ganhar foco
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && !this.wakeLockedScreen) {
                    this.requestWakeLock();
                }
            });
        } catch (error) {
            console.warn('[Connectivity] Erro ao solicitar Wake Lock:', error);
        }
    }

    async releaseWakeLock() {
        if (this.wakeLockedScreen) {
            await this.wakeLockedScreen.release();
            this.wakeLockedScreen = null;
            console.log('[Connectivity] Wake Lock liberado');
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
            wakeLockAtivo: this.wakeLockedScreen !== null,
            serviceWorkerAtivo: this.serviceWorkerPort !== null,
            tempoInatividade: Date.now() - this.lastActivityTime
        };
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConnectivityManager;
}
