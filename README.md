# 🎮 Spyfall Clash - Jogo do Impostor

Jogo estilo "Impostor" (tipo Among Us) com tema Clash Royale, que roda diretamente no navegador.

## 🎯 Como Funciona

1. **Criar ou Entrar em Sala**: O host cria uma sala e recebe um código único para compartilhar com os amigos.
2. **Configurar Partida**: O host escolhe se haverá 1 ou 2 impostores.
3. **Rodadas**: O jogo tem 3 rodadas. Em cada rodada:
   - Todos os jogadores recebem uma carta do Clash Royale (exceto os impostores)
   - Os jogadores dão dicas verbais sobre a carta sem falar o nome diretamente
   - Os impostores tentam se misturar sem serem descobertos
4. **Votação**: Ao final de cada rodada, todos votam quem acham que é o impostor.
5. **Resultado**: Descubra se acertaram ou não!

## 🚀 Como Executar

### Pré-requisitos

- Node.js instalado (versão 14 ou superior)
- NPM (geralmente vem com Node.js)

### Instalação

#### Opção 1: Usando NPM (PowerShell/CMD)

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

#### Opção 2: Usando Scripts Batch (Recomendado para Windows)

Se você encontrar problemas com a política de execução do PowerShell:

1. Instale as dependências executando:
   - Clique duas vezes em `install.bat`, OU
   - Execute no CMD: `install.bat`

2. Inicie o servidor executando:
   - Clique duas vezes em `start.bat`, OU
   - Execute no CMD: `start.bat`

#### Opção 3: Executar Node.js Diretamente

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor diretamente:
```bash
node server.js
```

### Acessar o Jogo

3. Acesse no navegador:
```
http://localhost:3000
```

### ⚠️ Solução de Problemas no Windows

Se você receber um erro sobre "execução de scripts desabilitada" no PowerShell:

**Solução 1:** Use o CMD (Prompt de Comando) ao invés do PowerShell

**Solução 2:** Use os arquivos `.bat` fornecidos (`install.bat` e `start.bat`)

**Solução 3:** Altere a política de execução do PowerShell (requer permissões de administrador):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎲 Como Jogar

1. **Criar Sala**: Clique em "Criar Sala", digite seu nome e copie o código gerado.
2. **Entrar em Sala**: Outros jogadores clicam em "Entrar em Sala", digitam o código e seus nomes.
3. **Configurar**: O host escolhe a quantidade de impostores (1 ou 2).
4. **Iniciar**: Quando houver pelo menos 3 jogadores, o host pode iniciar a partida.
5. **Jogar**: Cada jogador vê sua palavra secreta (ou descobre que é impostor) e dá dicas verbalmente.
6. **Votar**: O host inicia a votação e todos votam quem acham que é o impostor.
7. **Resultado**: Veja os resultados e continue para a próxima rodada!

## 📋 Requisitos do Jogo

- Mínimo de 3 jogadores
- Máximo de 10 jogadores por sala
- 3 rodadas por partida
- 1 ou 2 impostores (configurável pelo host)

## 🎴 Cartas do Clash Royale

O jogo utiliza todas as cartas oficiais do Clash Royale como palavras secretas, incluindo:
- Flechas, Bombardeiro, Arqueiras, Cavaleiro, etc.
- Mais de 100 cartas disponíveis!

## 🛠️ Tecnologias Utilizadas

- **Node.js**: Servidor backend
- **Express**: Framework web
- **Socket.io**: Comunicação em tempo real
- **HTML/CSS/JavaScript**: Interface frontend

## 📝 Notas

- As dicas são dadas verbalmente (presencialmente ou por chamada de voz)
- O jogo não grava ou processa áudio
- Cada partida é independente e as salas são temporárias
- Recomenda-se jogar em dispositivos na mesma rede ou usar um serviço de hospedagem para jogar online

## 🌐 Deploy Online

Para jogar online com amigos, você pode fazer deploy gratuitamente!

### 🚀 Comece Aqui:

1. **Leia primeiro:** [COMECE-AQUI.md](COMECE-AQUI.md) - Guia de início rápido
2. **Guia completo:** [GUIA-COMPLETO-DEPLOY.md](GUIA-COMPLETO-DEPLOY.md) - Instruções detalhadas passo a passo
3. **Checklist:** [CHECKLIST-DEPLOY.md](CHECKLIST-DEPLOY.md) - Use para não esquecer nada
4. **Verificar:** Execute `VERIFICAR-ANTES-DEPLOY.bat` para verificar se tudo está pronto

### 📚 Outros Guias:

- [DEPLOY.md](DEPLOY.md) - Guia de deploy (versão resumida)
- [DEPLOY-RAPIDO.md](DEPLOY-RAPIDO.md) - Guia rápido (5 minutos)

### Opções Recomendadas (Gratuitas):

- **Render** (Recomendado) - Mais fácil, domínio gratuito, HTTPS automático
- **Railway** - Não dorme automaticamente, $5 crédito grátis/mês
- **Fly.io** - Alternativa sólida
- **Cyclic** - Deploy automático via GitHub

Todas as opções oferecem:
- ✅ HTTPS automático
- ✅ Deploy automático via GitHub
- ✅ Domínio gratuito
- ✅ Sem necessidade de cartão de crédito (para planos free)

---

Divirta-se jogando Spyfall Clash! 🎮⚔️

