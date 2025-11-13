/**
 * Exemplos de Uso do Sistema de Heartbeat
 * 
 * Este arquivo demonstra como usar e estender o sistema de heartbeat
 */

// ============================================
// EXEMPLO 1: Uso Básico (já implementado)
// ============================================

/*
// No DOMContentLoaded em script.js:
function inicializarGerenciadores() {
    // Criar ConnectivityManager
    connectivityManager = new ConnectivityManager({
        statusCallback: (status, mensagem) => {
            console.log(`[Conectividade] ${status}: ${mensagem}`);
        }
    });

    // Criar HeartbeatManager
    heartbeatManager = new HeartbeatManager(socket, {
        pingInterval: 15000,      // Ping a cada 15 segundos
        pongTimeout: 60000,       // Timeout após 60 segundos sem pong
        maxReconnectAttempts: 10,
        reconnectDelay: 3000,
        statusCallback: (status, mensagem) => {
            atualizarStatusConexao(status, mensagem);
        }
    });
}
*/

// ============================================
// EXEMPLO 2: Monitorar Status Manualmente
// ============================================

function monitorarConexao() {
    // Verificar status a cada 5 segundos
    setInterval(() => {
        if (heartbeatManager) {
            const status = heartbeatManager.getStatus();
            console.log('Status de Heartbeat:', status);
            // {
            //   conectado: true,
            //   tentativasReconexao: 0,
            //   ultimoPong: "2025-11-13T10:30:45.123Z"
            // }
        }

        if (connectivityManager) {
            const connStatus = connectivityManager.getStatus();
            console.log('Status de Conectividade:', connStatus);
            // {
            //   wakeLockAtivo: true,
            //   serviceWorkerAtivo: true,
            //   tempoInatividade: 5000
            // }
        }
    }, 5000);
}

// ============================================
// EXEMPLO 3: Reação a Desconexões
// ============================================

function configurarReacoesDeDesconexao() {
    socket.on('disconnect', (reason) => {
        console.log('Desconectado:', reason);

        // Reagir a diferentes razões
        if (reason === 'io server disconnect') {
            // Servidor desconectou explicitamente
            console.log('Servidor desconectou o cliente');
        } else if (reason === 'io client disconnect') {
            // Cliente desconectou propositalmente
            console.log('Cliente desconectou propositalmente');
        } else if (reason === 'transport close') {
            // Conexão perdida (network error, etc)
            console.log('Conexão de transporte fechada');
            // HeartbeatManager automaticamente reconecta
        } else if (reason === 'network error') {
            console.log('Erro de rede detectado');
        } else if (reason === 'transport error') {
            console.log('Erro de transporte');
        }
    });

    socket.on('connect_error', (error) => {
        console.error('Erro ao conectar:', error);
    });
}

// ============================================
// EXEMPLO 4: Ativar Wake Lock Manualmente
// ============================================

async function ativarWakeLockManual() {
    if (!('wakeLock' in navigator)) {
        console.log('Wake Lock não suportado');
        return;
    }

    try {
        const wakelock = await navigator.wakeLock.request('screen');
        console.log('✅ Wake Lock ativado - tela não vai dormir');

        // Liberar quando necessário
        // await wakelock.release();
    } catch (err) {
        console.error('Erro ao ativar Wake Lock:', err);
    }
}

// ============================================
// EXEMPLO 5: Forçar Reconexão
// ============================================

function forcarReconexao() {
    if (socket) {
        socket.disconnect();
        socket.connect();
        console.log('Reconexão forçada iniciada');
    }
}

// ============================================
// EXEMPLO 6: Verificar Compatibilidade
// ============================================

function verificarCompatibilidade() {
    const compatibility = {
        serviceWorker: 'serviceWorker' in navigator,
        wakeLock: 'wakeLock' in navigator,
        backgroundSync: 'sync' in ServiceWorkerRegistration?.prototype,
        onlineOfflineEvents: 'onOnline' in window && 'onOffline' in window,
        messageChannel: 'MessageChannel' in window,
        https: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    };

    console.log('Compatibilidade de Recursos:');
    console.log(compatibility);

    return compatibility;
}

// ============================================
// EXEMPLO 7: Customizar Intervalo de Heartbeat
// ============================================

function customizarHeartbeat(pingMs = 20000, timeoutMs = 80000) {
    if (heartbeatManager) {
        // Parar heartbeat atual
        heartbeatManager.stopHeartbeat();

        // Recriar com novos valores
        heartbeatManager = new HeartbeatManager(socket, {
            pingInterval: pingMs,
            pongTimeout: timeoutMs,
            maxReconnectAttempts: 10,
            reconnectDelay: 3000,
            statusCallback: (status, mensagem) => {
                atualizarStatusConexao(status, mensagem);
            }
        });

        console.log(`Heartbeat customizado: ${pingMs}ms ping, ${timeoutMs}ms timeout`);
    }
}

// ============================================
// EXEMPLO 8: Simulação de Problemas de Rede
// ============================================

// ⚠️ APENAS PARA DEBUG - não usar em produção

function simularProblemasDeRede() {
    // Simular desconexão
    window.simularDesconexao = () => {
        if (socket) {
            socket.disconnect();
            console.log('🔴 Desconexão simulada');
        }
    };

    // Simular timeout
    window.simularTimeout = () => {
        if (heartbeatManager) {
            heartbeatManager.lastPongTime = Date.now() - 70000; // Simular timeout
            console.log('⏱️ Timeout simulado');
        }
    };

    // Simular voltar online
    window.simularVoltarOnline = () => {
        if (socket && !socket.connected) {
            socket.connect();
            console.log('🟢 Volta online simulada');
        }
    };

    // Simular múltiplas desconexões
    window.simularDesconexoesMultiplas = (quantas = 3) => {
        let contador = 0;
        const intervalo = setInterval(() => {
            if (contador < quantas) {
                socket.disconnect();
                setTimeout(() => {
                    socket.connect();
                }, 2000);
                contador++;
            } else {
                clearInterval(intervalo);
            }
        }, 5000);
    };

    console.log('Funções de simulação disponíveis:');
    console.log('- simularDesconexao()');
    console.log('- simularTimeout()');
    console.log('- simularVoltarOnline()');
    console.log('- simularDesconexoesMultiplas(5)');
}

// ============================================
// EXEMPLO 9: Event Listener para Mudanças de Visibilidade
// ============================================

function configurarDeteccaoVisibilidade() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 Página em background');
            // Service Worker e heartbeat continuam funcionando
        } else {
            console.log('📱 Página em foreground');
            // Retomar atividades que precisam de visibilidade
            if (heartbeatManager && !heartbeatManager.isPinging) {
                heartbeatManager.startHeartbeat();
            }
        }
    });
}

// ============================================
// EXEMPLO 10: Dashboard de Status
// ============================================

function criarDashboardStatus() {
    const dashboard = document.createElement('div');
    dashboard.id = 'heartbeat-dashboard';
    dashboard.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border: 2px solid #667eea;
        border-radius: 10px;
        padding: 15px;
        font-size: 12px;
        font-family: monospace;
        max-width: 300px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: none;
        z-index: 1000;
    `;

    document.body.appendChild(dashboard);

    window.toggleHeartbeatDashboard = () => {
        const isVisible = dashboard.style.display !== 'none';
        dashboard.style.display = isVisible ? 'none' : 'block';
    };

    setInterval(() => {
        if (dashboard.style.display !== 'none') {
            const hbStatus = heartbeatManager?.getStatus() || {};
            const connStatus = connectivityManager?.getStatus() || {};

            dashboard.innerHTML = `
                <strong style="color: #667eea;">Heartbeat Status</strong><br>
                Conectado: ${hbStatus.conectado ? '✅' : '❌'}<br>
                Tentativas: ${hbStatus.tentativasReconexao || 0}<br>
                Último Pong: ${hbStatus.ultimoPong?.split('T')[1]?.slice(0, 8) || 'N/A'}<br>
                <br>
                <strong style="color: #667eea;">Conectividade</strong><br>
                Wake Lock: ${connStatus.wakeLockAtivo ? '✅' : '❌'}<br>
                Service Worker: ${connStatus.serviceWorkerAtivo ? '✅' : '❌'}<br>
                Inatividade: ${Math.round((connStatus.tempoInatividade || 0) / 1000)}s
            `;
        }
    }, 1000);

    console.log('Dashboard disponível: toggleHeartbeatDashboard()');
}

// ============================================
// INICIALIZAR EXEMPLOS
// ============================================

// Descomentar para ativar exemplos

// verificarCompatibilidade();
// monitorarConexao();
// configurarReacoesDeDesconexao();
// configurarDeteccaoVisibilidade();
// simularProblemasDeRede();
// criarDashboardStatus();

// Ativar dashboard: toggleHeartbeatDashboard()
// Simular problema: simularDesconexao()
