/**
 * Sistema de Heartbeat e Reconexão Automática
 * Mantém o jogador conectado mesmo em situações desafiadoras
 * Continua funcionando com tela desligada ou app minimizado
 */

class HeartbeatManager {
    constructor(socket, options = {}) {
        this.socket = socket;
        this.pingInterval = options.pingInterval || 15000; // 15 segundos
        this.pongTimeout = options.pongTimeout || 240000; // 4 minutos (menor que o timeout do servidor)
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.reconnectDelay = options.reconnectDelay || 3000; // 3 segundos
        
        this.isPinging = false;
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();
        this.isConnected = false;
        this.statusCallback = options.statusCallback || (() => {});
        this.backgroundMode = false; // Rastrear se está em background
        
        this.init();
    }

    init() {
        // Listeners de conexão
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
            this.statusCallback('desconectado', `Desconectado: ${reason}`);
            console.log('[Heartbeat] Desconectado:', reason);
            
            // Não reconectar se foi desconexão manual (tipo "client namespace disconnect")
            if (reason !== 'client namespace disconnect') {
                this.attemptReconnect();
            }
        });

        // Listener para pong do servidor
        this.socket.on('pong', () => {
            this.lastPongTime = Date.now();
            this.statusCallback('pong-recebido', 'Servidor respondeu');
        });

        // Listener para erro de conexão
        this.socket.on('connect_error', (error) => {
            this.statusCallback('erro-conexao', `Erro de conexão: ${error.message}`);
            console.log('[Heartbeat] Erro de conexão:', error);
        });

        // Monitorar visibilidade para ajustar comportamento mas NÃO parar heartbeat
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.backgroundMode = true;
                console.log('[Heartbeat] Página em background - continuando heartbeat');
            } else {
                this.backgroundMode = false;
                console.log('[Heartbeat] Página visível - heartbeat normal');
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

        // Verificar timeout de pong
        this.pongCheckInterval = setInterval(() => {
            const timeSinceLastPong = Date.now() - this.lastPongTime;
            if (timeSinceLastPong > this.pongTimeout) {
                console.log('[Heartbeat] Timeout de pong detectado');
                this.socket.disconnect();
                this.attemptReconnect();
            }
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
                console.log('[Heartbeat] Ping enviado em modo background');
            }
        } catch (error) {
            console.error('[Heartbeat] Erro ao enviar ping:', error);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.statusCallback('falha-reconexao', 'Falha ao reconectar após múltiplas tentativas');
            console.error('[Heartbeat] Falha ao reconectar após múltiplas tentativas');
            return;
        }

        this.reconnectAttempts++;
        const delayMs = this.reconnectDelay * this.reconnectAttempts;
        
        this.statusCallback('reconectando', `Tentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        console.log(`[Heartbeat] Reconectando em ${delayMs}ms (tentativa ${this.reconnectAttempts})`);

        setTimeout(() => {
            if (!this.isConnected) {
                this.socket.connect();
            }
        }, delayMs);
    }

    getStatus() {
        return {
            conectado: this.isConnected,
            tentativasReconexao: this.reconnectAttempts,
            ultimoPong: new Date(this.lastPongTime).toISOString()
        };
    }
}

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeartbeatManager;
}
