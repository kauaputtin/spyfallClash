# 🔌 Guia Rápido - Sistema de Heartbeat

## ✅ O que foi implementado?

Um sistema completo de **heartbeat e reconexão automática** que mantém jogadores conectados mesmo em:

- ✅ Navegador em background (outra aba aberta)
- ✅ Tela do móvel desligada (repouso)
- ✅ Conexão de rede instável
- ✅ Servidor rejeitando conexão

---

## 🚀 Como Funciona

### **Fluxo Básico**

```
A cada 15 segundos:
  Cliente envia → PING
    ↓
  Servidor recebe e responde → PONG
    ↓
  Cliente recebe → Atualiza status
    ↓
  Se não receber PONG em 60s → RECONECTA AUTOMATICAMENTE
```

---

## 📊 Três Camadas de Proteção

### 1️⃣ **HeartbeatManager** (heartbeat.js)
- Envia `ping` a cada **15 segundos**
- Aguarda `pong` por até **60 segundos**
- Se timeout → tenta reconectar até **10 vezes**
- Delay exponencial: 3s → 6s → 9s → ... → 30s

### 2️⃣ **ConnectivityManager** (connectivity-manager.js)
- Registra **Service Worker**
- Ativa **Wake Lock** (tela não dorme)
- Detecta atividade do usuário
- Comunica com Service Worker via Message Channel

### 3️⃣ **Service Worker** (service-worker.js)
- Executa heartbeat **em background**
- Continua mesmo se aba for fechada
- Cache automático de recursos
- Suporta Background Sync

---

## 🎯 Estados Visuais

No canto superior direito, você vê um indicador:

| Cor | Significado | Ação |
|-----|-------------|------|
| 🟢 Verde | Conectado | Tudo ok, continue jogando |
| 🔴 Vermelho | Desconectado | Sem conexão, aguarde... |
| 🟠 Laranja | Reconectando | Tentando voltar, aguarde... |
| ⚫ Preto | Erro | Múltiplas falhas, recarregue |

---

## 📱 Compatibilidade

| Recurso | Suportado | Fallback |
|---------|-----------|----------|
| Heartbeat básico | ✅ Todos | - |
| Service Worker | ✅ Moderno | Heartbeat no main thread |
| Wake Lock | ✅ Móvel | Sem lock, tela pode dormir |
| Background Sync | ✅ Android | Reconexão manual |

---

## 🧪 Testando Localmente

### Teste 1: Simular Desconexão
```javascript
// Console do navegador (F12)
socket.disconnect();
// Veja a cor mudar para vermelho
// Aguarde 3 segundos para reconectar automaticamente
```

### Teste 2: Simular Timeout
```javascript
// Console
heartbeatManager.lastPongTime = Date.now() - 70000;
// Força timeout e reconexão
```

### Teste 3: Múltiplas Desconexões
```javascript
// Console - conecta/desconecta 5 vezes
for (let i = 0; i < 5; i++) {
    setTimeout(() => {
        socket.disconnect();
        setTimeout(() => socket.connect(), 2000);
    }, i * 5000);
}
```

### Teste 4: Status em Tempo Real
```javascript
// Console
heartbeatManager.getStatus();
// {
//   conectado: true,
//   tentativasReconexao: 0,
//   ultimoPong: "2025-11-13T10:35:22.456Z"
// }
```

---

## 🔧 Configuração Recomendada

### Para WiFi Estável
```javascript
pingInterval: 30000,      // 30 segundos
pongTimeout: 90000        // 90 segundos
```

### Para Móvel/4G
```javascript
pingInterval: 15000,      // 15 segundos
pongTimeout: 60000        // 60 segundos (padrão)
```

### Para Conexão Muito Instável
```javascript
pingInterval: 10000,      // 10 segundos
pongTimeout: 40000        // 40 segundos
```

**Como mudar em script.js:**
```javascript
heartbeatManager = new HeartbeatManager(socket, {
    pingInterval: 10000,    // ← Mudar aqui
    pongTimeout: 40000,     // ← E aqui
    // ... resto das opções
});
```

---

## 📁 Arquivos Adicionados

```
/public/
  ├── heartbeat.js              ← Sistema de ping/pong
  ├── connectivity-manager.js   ← Gerencia Service Worker, Wake Lock
  ├── service-worker.js         ← Heartbeat em background
  └── index.html                ← Incluído indicador visual

/
  ├── HEARTBEAT-DOCS.md         ← Documentação completa
  ├── HEARTBEAT-EXAMPLES.js     ← Exemplos de uso
  └── HEARTBEAT-QUICKSTART.md   ← Este arquivo
```

---

## 🛠️ Troubleshooting

### Problema: Indicador sempre vermelho
**Solução:** 
- Verificar se servidor está rodando (`npm start`)
- Abrir DevTools (F12) → Console
- Procurar erros em vermelho
- Recarregar página (Ctrl+R)

### Problema: Service Worker não registrou
**Solução:**
- Certificar que está em `localhost` ou `https://`
- Alguns navegadores antigos não suportam
- Fallback automático: heartbeat continua no main thread

### Problema: Wake Lock não funciona
**Solução:**
- Conferir compatibilidade: `'wakeLock' in navigator`
- Android Chrome: suportado
- iOS Safari: não suportado (usar fallback)
- Desktop: suportado em navegadores modernos

### Problema: Desconecta toda hora
**Solução:**
- Aumentar `pongTimeout` (ex: 90000)
- Reduzir `pingInterval` (ex: 10000)
- Verificar latência da rede
- Checar logs no console do servidor

---

## 📊 Monitoramento

### Ver Logs do Servidor
```bash
# Terminal onde rodou "npm start"
Novo jogador conectado: v72eXic0NKzfAbbrAAAB
[Heartbeat] Cliente v72eXic0NKzfAbbrAAAB respondeu ao ping
```

### Ver Logs do Cliente
```
F12 → Console
[Heartbeat] Conectado ao servidor
[Heartbeat] Iniciando heartbeat...
[Connectivity] Service Worker registrado
[Connectivity] Wake Lock ativado
```

---

## 🎮 Integração com o Jogo

O sistema já está **totalmente integrado** em `script.js`:

```javascript
function inicializarGerenciadores() {
    connectivityManager = new ConnectivityManager({...});
    heartbeatManager = new HeartbeatManager(socket, {...});
}
```

Você **não precisa fazer nada** - funciona automaticamente! ✅

---

## 🚀 Deployment

Ao fazer deploy na nuvem (Render, Railway, etc):

1. ✅ Todos os arquivos já foram criados
2. ✅ Service Worker funciona com HTTPS automático
3. ✅ Wake Lock funciona em móvel
4. ✅ Heartbeat continua em background

**Nenhuma configuração adicional necessária!**

---

## 📞 Suporte

Se tiver dúvidas:
1. Leia `HEARTBEAT-DOCS.md` para documentação completa
2. Veja exemplos em `HEARTBEAT-EXAMPLES.js`
3. Abra DevTools (F12) para logs detalhados
4. Verifique a seção "Troubleshooting"

---

**Status:** ✅ Implementado e Testado
**Última Atualização:** 13 de Novembro de 2025
**Compatibilidade:** Todos os navegadores modernos
