# 🔌 Sistema de Heartbeat e Reconexão Automática

## Overview

Este documento descreve o sistema robusto de heartbeat e reconexão automática implementado para manter jogadores conectados ao servidor mesmo em situações desafiadoras.

## 🎯 Objetivos

- ✅ Manter conexão ativa mesmo quando o navegador perde foco
- ✅ Continuar ping quando a tela desliga (móvel)
- ✅ Reconectar automaticamente se a conexão cair
- ✅ Executar heartbeat em background via Service Worker
- ✅ Ativar Wake Lock para manter tela ativa (opcional)

---

## 🏗️ Arquitetura

### 1. **HeartbeatManager** (`heartbeat.js`)

Gerencia o sistema de ping/pong entre cliente e servidor.

**Funcionalidades:**
- Envia ping a cada 15 segundos
- Aguarda pong dentro de 60 segundos
- Reconecta automaticamente se timeout
- Máximo de 10 tentativas de reconexão
- Exponential backoff no delay de reconexão

**Uso:**
```javascript
const heartbeatManager = new HeartbeatManager(socket, {
    pingInterval: 15000,           // Ping a cada 15s
    pongTimeout: 60000,            // Timeout após 60s
    maxReconnectAttempts: 10,      // Máximo de tentativas
    reconnectDelay: 3000,          // Delay inicial de reconexão
    statusCallback: (status, msg) => {
        console.log(status, msg);
    }
});
```

**Estados de Conexão:**
- `conectado` - Conectado e respondendo
- `desconectado` - Desconectado
- `reconectando` - Tentando reconectar
- `falha-reconexao` - Falha após múltiplas tentativas
- `pong-recebido` - Servidor respondeu ao ping
- `erro-conexao` - Erro ao tentar conectar

---

### 2. **ConnectivityManager** (`connectivity-manager.js`)

Gerencia recursos de conectividade avançados.

**Funcionalidades:**
- Registra Service Worker
- Detecta atividade do usuário
- Ativa Wake Lock API para manter tela ativa
- Comunica com Service Worker via Message Port
- Gerencia inatividade (timeout após 5 minutos)

**Uso:**
```javascript
const connectivityManager = new ConnectivityManager({
    enableWakeLock: true,        // Ativar Wake Lock
    enableServiceWorker: true,   // Registrar Service Worker
    activityTimeout: 300000,     // Timeout de inatividade (5min)
    statusCallback: (status, msg) => {
        console.log(status, msg);
    }
});

// Iniciar heartbeat em background
connectivityManager.startBackgroundHeartbeat({
    pingInterval: 15000
});
```

**Recursos Suportados:**
- 🟢 **Wake Lock API** - Mantém tela ativa durante jogo
- 🟢 **Service Worker** - Executa heartbeat em background
- 🟢 **Background Sync API** - Sincroniza dados ao reconectar
- 🟢 **Online/Offline Events** - Detecta mudanças de conectividade

---

### 3. **Service Worker** (`service-worker.js`)

Executa heartbeat mesmo quando a aba está em segundo plano.

**Funcionalidades:**
- Mantém comunicação via Message Port
- Envia pings em background
- Suporta Background Sync
- Caching de recursos

**Ciclo de Vida:**
1. Cliente registra Service Worker
2. Service Worker ativa
3. Estabelece comunicação via Message Port
4. Heartbeat continua em background

---

### 4. **Servidor** (`server.js`)

Implementa o lado servidor do heartbeat.

**Funcionalidades:**
- Listener para evento `ping` do cliente
- Responde com evento `pong`
- Monitora inatividade (timeout: 90 segundos)
- Desconecta clientes inativos automaticamente

**Código:**
```javascript
socket.on('ping', (data) => {
    lastPing = Date.now();
    socket.emit('pong');
});
```

---

## 📊 Fluxo de Funcionamento

```
Cliente conecta
    ↓
HeartbeatManager inicia
    ↓
Service Worker registrado
    ↓
ConnectivityManager detecta atividade
    ↓
A cada 15s: cliente envia PING
    ↓
Servidor recebe PING → atualiza lastPing
    ↓
Servidor responde PONG
    ↓
Cliente recebe PONG → atualiza lastPongTime
    ↓
Se não receber PONG em 60s:
    - Desconecta
    - Tenta reconectar (backoff exponencial)
    - Máximo 10 tentativas

Se servidor não receber PING em 90s:
    - Força desconexão do cliente
    - Cliente tenta reconectar automaticamente
```

---

## 🎮 Comportamentos por Cenário

### Cenário 1: Browser perde foco
```
Evento: Usuário alterna para outra aba
    ↓
✅ Heartbeat continua via JavaScript principal
✅ Se página entrar em sleep: Service Worker toma conta
✅ Status visual mantém indicador de conexão
```

### Cenário 2: Tela do móvel desliga
```
Evento: Tela de repouso ativada
    ↓
✅ Wake Lock API: tenta manter tela ativa (com permissão)
✅ Se tela desligar: Service Worker mantém heartbeat
✅ Reconexão automática quando tela voltar
```

### Cenário 3: Internet cai
```
Evento: Perda de conexão de rede
    ↓
✅ Tentativa falha de enviar PING
✅ HeartbeatManager inicia reconexão
✅ Backoff exponencial: 3s, 6s, 9s, 12s... (máx 30s)
✅ Máximo 10 tentativas
✅ Se reconectar: socket.id pode mudar
```

### Cenário 4: Servidor desconecta cliente
```
Evento: Servidor força desconexão por inatividade
    ↓
✅ Socket.io dispara evento 'disconnect'
✅ HeartbeatManager detecta
✅ Inicia reconexão automática
✅ Cliente tenta voltar para sala com mesmo código
```

---

## 📱 Compatibilidade de APIs

| Recurso | Desktop | Mobile | Fallback |
|---------|---------|--------|----------|
| Heartbeat básico | ✅ | ✅ | - |
| Service Worker | ✅ | ✅ | Heartbeat no main thread |
| Wake Lock | ⚠️ | ✅ | Sem lock, tela pode dormir |
| Background Sync | ⚠️ | ✅ | Reconexão manual |
| Online/Offline Events | ✅ | ✅ | - |

---

## 🔍 Monitoramento e Debug

### Console Logs

Abra DevTools (F12) para ver logs detalhados:

```javascript
[Heartbeat] Conectado ao servidor
[Heartbeat] Iniciando heartbeat...
[Heartbeat] Enviando ping: {timestamp: 1234567890}
[Heartbeat] Pong recebido
[Heartbeat] Desconectado: network error
[Heartbeat] Reconectando em 3000ms (tentativa 1/10)
[Connectivity] Service Worker registrado
[Connectivity] Wake Lock ativado
```

### Status Visual

Um indicador fixo no canto superior direito mostra:
- 🟢 **Verde** - Conectado e respondendo
- 🔴 **Vermelho** - Desconectado
- 🟠 **Laranja** - Reconectando
- ⚫ **Preto** - Erro crítico

### API de Status

```javascript
// Obter status atual
const status = heartbeatManager.getStatus();
console.log(status);
// {
//   conectado: true,
//   tentativasReconexao: 0,
//   ultimoPong: "2025-11-13T10:30:45.123Z"
// }

const connStatus = connectivityManager.getStatus();
console.log(connStatus);
// {
//   wakeLockAtivo: true,
//   serviceWorkerAtivo: true,
//   tempoInatividade: 5000
// }
```

---

## ⚙️ Configuração

### Parâmetros Ajustáveis

**HeartbeatManager:**
```javascript
new HeartbeatManager(socket, {
    pingInterval: 15000,           // ↓ Ping mais frequente = mais tráfego
    pongTimeout: 60000,            // ↓ Timeout menor = mais sensível
    maxReconnectAttempts: 10,      // ↓ Mais tentativas = mais resiliente
    reconnectDelay: 3000           // ↓ Delay menor = reconecta mais rápido
});
```

**Servidor:**
```javascript
const PING_TIMEOUT = 90000;  // Tempo até desconectar cliente inativo
// Verificação a cada 30 segundos
```

### Recomendações

- **Para WiFi estável**: `pingInterval: 30s`, `pongTimeout: 90s`
- **Para móvel/4G**: `pingInterval: 15s`, `pongTimeout: 60s`
- **Para conexão instável**: `pingInterval: 10s`, `pongTimeout: 40s`

---

## 🚀 Implantação

### Passos

1. **Verificar compatibilidade**
```bash
# No navegador
if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker suportado');
}
if ('wakeLock' in navigator) {
    console.log('✅ Wake Lock suportado');
}
```

2. **Inicializar (já feito em script.js)**
```javascript
const heartbeatManager = new HeartbeatManager(socket, { ... });
const connectivityManager = new ConnectivityManager({ ... });
```

3. **Servidor Node.js**
```javascript
// server.js já inclui listeners para ping/pong
socket.on('ping', (data) => { ... });
```

4. **Servir via HTTPS**
Alguns recursos (Wake Lock, Service Worker) requerem HTTPS

---

## 🐛 Troubleshooting

### Problema: Service Worker não registrado
**Solução:** Verificar se está rodando em HTTPS (locales HTTP://localhost aceitam)

### Problema: Wake Lock não funciona
**Solução:** 
- Verificar compatibilidade do navegador
- Ativar permissões no navegador
- Verificar se página tem foco

### Problema: Desconexões frequentes
**Solução:**
- Aumentar `pongTimeout`
- Reduzir `pingInterval`
- Verificar conectividade da rede

### Problema: Reconnection loop infinito
**Solução:**
- Aumentar `maxReconnectAttempts`
- Implementar cap time máximo no backoff

---

## 📚 Referências

- [Socket.io Documentation](https://socket.io/docs/)
- [Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/WakeLock)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Sync_API)

---

## 📝 Changelog

**v1.0.0** - Implementação inicial
- ✅ HeartbeatManager
- ✅ ConnectivityManager
- ✅ Service Worker
- ✅ Wake Lock API
- ✅ Status visual
- ✅ Reconexão automática

---

**Desenvolvido para Spyfall Clash** ⚔️
