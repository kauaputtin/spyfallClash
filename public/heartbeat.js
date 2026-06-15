/**
 * Heartbeat leve para manter sinal de vida com o servidor.
 * A reconexao fica a cargo do Socket.IO para evitar conflito no mobile.
 */

class HeartbeatManager {
    constructor(socket, options = {}) {
        this.socket = socket;
        this.pingInterval = options.pingInterval || 15000;
        this.pongTimeout = options.pongTimeout || 240000;
        this.reconnectAttempts = 0;
        this.isPinging = false;
        this.lastPongTime = Date.now();
        this.isConnected = false;
        this.statusCallback = options.statusCallback || (() => {});
        this.backgroundMode = false;

        this.init();
    }

    init() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.lastPongTime = Date.now();
            this.startHeartbeat();
            this.statusCallback('conectado', 'Conectado ao servidor');
            console.log('[Heartbeat] Conectado ao servidor');
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.stopHeartbeat();
            console.log('[Heartbeat] Desconectado:', reason);

            if (reason === 'io client disconnect' || reason === 'client namespace disconnect') {
                this.statusCallback('desconectado', `Desconectado: ${reason}`);
                return;
            }

            this.statusCallback('reconectando', 'Reconectando ao servidor...');
        });

        this.socket.on('pong', () => {
            this.lastPongTime = Date.now();
            this.statusCallback('pong-recebido', 'Servidor respondeu');
        });

        this.socket.on('connect_error', (error) => {
            this.statusCallback('reconectando', `Tentando reconectar: ${error.message}`);
            console.log('[Heartbeat] Erro de conexao:', error);
        });

        this.socket.io.on('reconnect_attempt', (attempt) => {
            this.reconnectAttempts = attempt;
            this.statusCallback('reconectando', `Tentando reconectar... (${attempt})`);
        });

        this.socket.io.on('reconnect', () => {
            this.reconnectAttempts = 0;
            this.statusCallback('conectado', 'Reconectado ao servidor');
        });

        this.socket.io.on('reconnect_failed', () => {
            this.statusCallback('erro-conexao', 'Nao foi possivel reconectar ao servidor');
        });

        document.addEventListener('visibilitychange', () => {
            this.backgroundMode = document.hidden;
            if (this.backgroundMode) {
                console.log('[Heartbeat] Pagina em background - Socket.IO mantem reconexao');
            } else {
                console.log('[Heartbeat] Pagina visivel - heartbeat normal');
                this.lastPongTime = Date.now();
                if (!this.socket.connected) {
                    this.socket.connect();
                }
            }
        });
    }

    startHeartbeat() {
        if (this.isPinging) return;

        this.isPinging = true;
        console.log('[Heartbeat] Iniciando heartbeat...');

        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendPing();
            }
        }, this.pingInterval);

        this.pongCheckInterval = setInterval(() => {
            const timeSinceLastPong = Date.now() - this.lastPongTime;
            if (timeSinceLastPong <= this.pongTimeout) return;

            console.log('[Heartbeat] Pong atrasado; mantendo reconexao nativa do Socket.IO');
            if (!this.socket.connected) {
                this.socket.connect();
                return;
            }

            this.lastPongTime = Date.now();
            this.statusCallback('conectado', 'Conectado ao servidor');
        }, this.pingInterval);
    }

    stopHeartbeat() {
        if (!this.isPinging) return;

        this.isPinging = false;
        clearInterval(this.heartbeatInterval);
        clearInterval(this.pongCheckInterval);
        console.log('[Heartbeat] Heartbeat parado');
    }

    sendPing() {
        try {
            this.socket.emit('ping', { timestamp: Date.now() });
            if (this.backgroundMode) {
                console.log('[Heartbeat] Ping enviado em background');
            }
        } catch (error) {
            console.error('[Heartbeat] Erro ao enviar ping:', error);
        }
    }

    getStatus() {
        return {
            conectado: this.isConnected,
            tentativasReconexao: this.reconnectAttempts,
            ultimoPong: new Date(this.lastPongTime).toISOString()
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeartbeatManager;
}
