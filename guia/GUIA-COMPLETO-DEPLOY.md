# 🚀 Guia Completo - Deploy do Spyfall Clash

Este guia vai te levar do zero até ter seu jogo online, passo a passo, sem pular nada!

---

## 📋 ÍNDICE

1. [Verificar se tudo está funcionando localmente](#1-verificar-se-tudo-está-funcionando-localmente)
2. [Instalar GitHub Desktop](#2-instalar-github-desktop)
3. [Criar conta no GitHub (se não tiver)](#3-criar-conta-no-github-se-não-tiver)
4. [Preparar o código para o GitHub](#4-preparar-o-código-para-o-github)
5. [Enviar código para o GitHub](#5-enviar-código-para-o-github)
6. [Criar conta no Render](#6-criar-conta-no-render)
7. [Fazer Deploy no Render](#7-fazer-deploy-no-render)
8. [Testar o jogo online](#8-testar-o-jogo-online)
9. [Solução de Problemas](#9-solução-de-problemas)

---

## 1. VERIFICAR SE TUDO ESTÁ FUNCIONANDO LOCALMENTE

### Passo 1.1: Verificar se você está na pasta correta

1. Abra o **Explorador de Arquivos** do Windows
2. Navegue até: `C:\Users\kakag\Desktop\Spyfall Clash`
3. Verifique se você vê estes arquivos:
   - ✅ `package.json`
   - ✅ `server.js`
   - ✅ Pasta `public` (com `index.html`, `script.js`, `style.css`)
   - ✅ Pasta `node_modules` (se já instalou)

### Passo 1.2: Instalar dependências (se ainda não instalou)

**Opção A - Usando o arquivo .bat:**
1. Na pasta `Spyfall Clash`, clique duas vezes no arquivo `install.bat`
2. Aguarde até aparecer "Press any key to continue..."
3. Pressione qualquer tecla para fechar

**Opção B - Usando CMD (Prompt de Comando):**
1. Pressione `Windows + R`
2. Digite `cmd` e pressione Enter
3. Digite estes comandos (um de cada vez, pressionando Enter após cada um):
   ```cmd
   cd "C:\Users\kakag\Desktop\Spyfall Clash"
   npm install
   ```
4. Aguarde a instalação terminar

### Passo 1.3: Testar se o servidor funciona localmente

**Opção A - Usando o arquivo .bat:**
1. Clique duas vezes no arquivo `start.bat`
2. Você deve ver uma janela preta com a mensagem:
   ```
   Servidor rodando na porta 3000
   Acesse: http://localhost:3000
   ```
3. Abra o navegador e acesse: `http://localhost:3000`
4. O jogo deve aparecer!
5. Para parar o servidor, feche a janela preta

**Opção B - Usando CMD:**
1. No CMD, digite:
   ```cmd
   cd "C:\Users\kakag\Desktop\Spyfall Clash"
   node server.js
   ```
2. Você deve ver a mensagem do servidor
3. Abra o navegador em `http://localhost:3000`
4. Para parar, pressione `Ctrl + C` no CMD

✅ **Se o jogo abriu no navegador, está tudo funcionando!** Continue para o próximo passo.

❌ **Se deu erro:** Veja a seção [Solução de Problemas](#9-solução-de-problemas) no final deste guia.

---

## 2. INSTALAR GITHUB DESKTOP

### Passo 2.1: Baixar GitHub Desktop

1. Abra seu navegador
2. Acesse: https://desktop.github.com
3. Clique no botão verde **"Download for Windows"**
4. O arquivo `GitHubDesktopSetup.exe` vai baixar

### Passo 2.2: Instalar GitHub Desktop

1. Vá até a pasta **Downloads** (ou onde o arquivo foi baixado)
2. Clique duas vezes em `GitHubDesktopSetup.exe`
3. Siga as instruções de instalação:
   - Clique em **"Next"** ou **"Avançar"**
   - Aceite os termos (marque a caixa)
   - Clique em **"Install"** ou **"Instalar"**
   - Aguarde a instalação
   - Clique em **"Finish"** ou **"Concluir"**

### Passo 2.3: Abrir GitHub Desktop

1. O GitHub Desktop deve abrir automaticamente
2. Se não abrir, procure no menu Iniciar do Windows
3. Na primeira vez, ele vai pedir para fazer login (vamos fazer no próximo passo)

---

## 3. CRIAR CONTA NO GITHUB (SE NÃO TIVER)

### Passo 3.1: Criar conta no GitHub

1. Abra seu navegador
2. Acesse: https://github.com
3. Clique no botão **"Sign up"** (no canto superior direito)
4. Preencha o formulário:
   - **Username**: Escolha um nome de usuário (ex: `seu-nome`, `kakag-games`)
   - **Email**: Seu email
   - **Password**: Uma senha forte
5. Resolva o desafio de verificação (pode pedir para resolver um puzzle)
6. Clique em **"Create account"**
7. Verifique seu email (GitHub vai enviar um email de confirmação)
8. Clique no link no email para verificar

### Passo 3.2: Fazer login no GitHub Desktop

1. Abra o **GitHub Desktop**
2. Ele vai pedir para fazer login
3. Clique em **"Sign in to GitHub.com"**
4. Você será redirecionado para o navegador
5. Faça login com sua conta GitHub
6. Autorize o GitHub Desktop
7. Volte para o GitHub Desktop - você deve estar logado agora

✅ **Se você já tem conta no GitHub:** Apenas faça login no GitHub Desktop seguindo os passos 3.2.

---

## 4. PREPARAR O CÓDIGO PARA O GITHUB

### Passo 4.1: Verificar se todos os arquivos estão na pasta

Na pasta `C:\Users\kakag\Desktop\Spyfall Clash`, você deve ter:

```
Spyfall Clash/
├── node_modules/          (pasta - não precisa enviar)
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .gitignore            (arquivo - importante!)
├── package.json
├── package-lock.json
├── server.js
├── README.md
├── DEPLOY.md
├── render.yaml
├── Procfile
├── install.bat
└── start.bat
```

### Passo 4.2: Verificar o arquivo .gitignore

1. Abra a pasta `Spyfall Clash`
2. Verifique se existe o arquivo `.gitignore`
3. Se não existir, crie um arquivo de texto chamado `.gitignore`
4. Dentro dele, coloque este conteúdo:
   ```
   node_modules/
   .env
   .DS_Store
   *.log
   npm-debug.log*
   yarn-debug.log*
   yarn-error.log*
   ```

✅ **Tudo pronto?** Continue para o próximo passo!

---

## 5. ENVIAR CÓDIGO PARA O GITHUB

### Passo 5.1: Adicionar a pasta no GitHub Desktop

1. Abra o **GitHub Desktop**
2. Clique em **"File"** (no menu superior)
3. Clique em **"Add Local Repository"**
4. Uma janela vai abrir
5. Clique no botão **"Choose..."**
6. Navegue até: `C:\Users\kakag\Desktop\Spyfall Clash`
7. Selecione a pasta `Spyfall Clash`
8. Clique em **"Select Folder"** ou **"Selecionar Pasta"**
9. Clique em **"Add repository"**

### Passo 5.2: Verificar os arquivos

1. No GitHub Desktop, você deve ver uma lista de arquivos na lateral esquerda
2. Todos os arquivos devem estar marcados (✓)
3. Se não estiver, clique em cada arquivo para marcar

### Passo 5.3: Fazer o primeiro commit

1. Na parte inferior do GitHub Desktop, você verá um campo de texto
2. Escreva uma mensagem, por exemplo: `"Initial commit - Spyfall Clash game"`
3. Clique no botão **"Commit to main"** (no canto inferior esquerdo)
4. Aguarde alguns segundos - os arquivos serão commitados localmente

### Passo 5.4: Criar repositório no GitHub

Agora temos duas opções:

#### OPÇÃO A: Criar repositório novo (Recomendado se você não tem um)

1. No GitHub Desktop, clique no botão **"Publish repository"** (no centro da tela)
2. Uma janela vai abrir
3. **Nome do repositório:** Digite um nome único, por exemplo:
   - `spyfall-clash-game`
   - `spyfall-clash-online`
   - `meu-spyfall-clash`
   - `spyfall-clash-2024`
4. **Descrição (opcional):** Digite: `Jogo do Impostor com tema Clash Royale`
5. **Marque a opção:** ☑️ "Keep this code private" (se quiser manter privado)
   - Ou deixe desmarcado para ser público
6. Clique em **"Publish repository"**
7. Aguarde alguns segundos - o GitHub Desktop vai enviar os arquivos para o GitHub

#### OPÇÃO B: Usar repositório existente (Se você já tem um)

1. No GitHub Desktop, clique em **"Repository"** (menu superior)
2. Clique em **"Repository settings"**
3. Clique na aba **"Remote"**
4. No campo **"Primary remote repository (origin)"**, cole a URL do seu repositório
   - A URL é algo como: `https://github.com/SEU_USUARIO/NOME_DO_REPO.git`
   - Você pode copiar essa URL no GitHub.com, clicando no botão verde "Code"
5. Clique em **"Save"**
6. Volte para a tela principal do GitHub Desktop
7. Clique no botão **"Push origin"** (no canto superior direito)
8. Aguarde - os arquivos serão enviados

### Passo 5.5: Verificar se funcionou

1. Abra seu navegador
2. Acesse: https://github.com
3. Faça login
4. Você deve ver seu repositório na lista
5. Clique no repositório
6. Você deve ver todos os arquivos do jogo!

✅ **Se você vê os arquivos no GitHub, está funcionando!** Continue para o próximo passo.

---

## 6. CRIAR CONTA NO RENDER

### Passo 6.1: Acessar o Render

1. Abra seu navegador
2. Acesse: https://render.com
3. Clique no botão **"Get Started for Free"** (no canto superior direito)

### Passo 6.2: Fazer login com GitHub

1. Clique no botão **"Sign in with GitHub"**
2. Você será redirecionado para o GitHub
3. Clique em **"Authorize Render"** para autorizar
4. Você será redirecionado de volta para o Render
5. Pronto! Você está logado no Render

✅ **Conta criada e logada!** Continue para o próximo passo.

---

## 7. FAZER DEPLOY NO RENDER

### Passo 7.1: Criar novo Web Service

1. No dashboard do Render, clique no botão **"New +"** (no canto superior direito)
2. Um menu vai aparecer
3. Clique em **"Web Service"**

### Passo 7.2: Conectar repositório GitHub

1. Uma tela vai aparecer pedindo para conectar um repositório
2. Você verá uma lista de repositórios do GitHub
3. Se não ver seu repositório:
   - Clique em **"Configure account"** ou **"Connect account"**
   - Autorize o Render a acessar seus repositórios
   - Selecione os repositórios que quer conectar (ou todos)
   - Clique em **"Install"** ou **"Connect"**
4. Agora você deve ver seu repositório na lista
5. Clique no repositório `spyfall-clash-game` (ou o nome que você deu)

### Passo 7.3: Configurar o Web Service

Agora você verá um formulário. Preencha assim:

1. **Name:**
   - Digite: `spyfall-clash` (ou qualquer nome)
   - Este será o nome do seu serviço

2. **Region:**
   - Escolha a região mais próxima
   - Exemplo: `Oregon (US West)` para Brasil

3. **Branch:**
   - Deixe como `main` (ou `master` se for o caso)
   - Este é o branch do GitHub que será usado

4. **Root Directory:**
   - Deixe **VAZIO** (não preencha nada)
   - Ou coloque apenas um ponto: `.`

5. **Environment:**
   - Selecione: **`Node`**
   - O Render detecta automaticamente que é Node.js

6. **Build Command:**
   - Digite: `npm install`
   - Este comando instala as dependências

7. **Start Command:**
   - Digite: `npm start`
   - Este comando inicia o servidor

8. **Plan:**
   - Selecione: **`Free`**
   - Este é o plano gratuito

### Passo 7.4: Criar o serviço

1. Revise todas as configurações
2. Clique no botão **"Create Web Service"** (no final da página)
3. O Render vai começar a fazer o deploy
4. Você verá uma tela com logs do deploy
5. Aguarde 2-5 minutos (pode demorar na primeira vez)

### Passo 7.5: Aguardar o deploy

Enquanto o deploy está rodando, você verá:

1. **"Building..."** - O Render está instalando as dependências
2. **"Deploying..."** - O Render está iniciando o servidor
3. **"Live"** - O servidor está rodando! 🎉

### Passo 7.6: Copiar a URL

1. Quando aparecer **"Live"**, o deploy está completo
2. No topo da página, você verá uma URL, por exemplo:
   - `https://spyfall-clash.onrender.com`
3. Clique no ícone de **copiar** ao lado da URL
4. Ou copie manualmente a URL

✅ **Deploy concluído!** Continue para o próximo passo.

---

## 8. TESTAR O JOGO ONLINE

### Passo 8.1: Acessar o jogo

1. Abra uma nova aba no navegador
2. Cole a URL que você copiou (ex: `https://spyfall-clash.onrender.com`)
3. Pressione Enter
4. O jogo deve carregar!

### Passo 8.2: Testar funcionalidades

1. **Teste criar sala:**
   - Clique em "Criar Sala"
   - Digite um nome
   - Clique em "Criar"
   - Você deve ver um código de sala

2. **Teste em outro dispositivo/navegador:**
   - Abra o jogo em outro navegador (ou celular)
   - Clique em "Entrar em Sala"
   - Digite o código da sala
   - Digite um nome
   - Clique em "Entrar"
   - Você deve entrar na sala!

✅ **Se tudo funcionou, seu jogo está online!**

### Passo 8.3: Compartilhar com amigos

1. Compartilhe a URL com seus amigos
2. Exemplo: `https://spyfall-clash.onrender.com`
3. Eles podem acessar e jogar com você!

---

## 9. SOLUÇÃO DE PROBLEMAS

### Problema: "npm start" não funciona

**Solução:**
1. Verifique se você está na pasta correta
2. Abra o CMD e digite:
   ```cmd
   cd "C:\Users\kakag\Desktop\Spyfall Clash"
   ```
3. Verifique se o `package.json` existe:
   ```cmd
   dir package.json
   ```
4. Se existir, instale as dependências:
   ```cmd
   npm install
   ```
5. Tente iniciar:
   ```cmd
   node server.js
   ```

### Problema: "Cannot find module"

**Solução:**
1. Delete a pasta `node_modules`
2. Delete o arquivo `package-lock.json`
3. Execute novamente:
   ```cmd
   npm install
   ```

### Problema: Repositório já existe no GitHub

**Solução:**
1. Use um nome diferente ao criar o repositório
2. Ou conecte ao repositório existente no GitHub Desktop:
   - Repository → Repository settings → Remote
   - Cole a URL do repositório existente

### Problema: Render não encontra o repositório

**Solução:**
1. No Render, clique em "Configure account"
2. Autorize o acesso a todos os repositórios
3. Ou autorize apenas o repositório específico
4. Tente novamente

### Problema: Deploy falha no Render

**Solução:**
1. Verifique os logs no Render (aba "Logs")
2. Verifique se o `package.json` tem o script "start"
3. Verifique se todas as dependências estão no `package.json`
4. Verifique se o `server.js` existe

### Problema: Jogo não carrega online

**Solução:**
1. Verifique se o deploy foi concluído (deve estar "Live")
2. Aguarde alguns minutos (pode demorar para "acordar" no plano free)
3. Tente acessar novamente
4. Verifique os logs no Render

### Problema: Socket.io não funciona

**Solução:**
1. Verifique se a URL está usando HTTPS (Render fornece automaticamente)
2. Verifique se o servidor está rodando (logs no Render)
3. Verifique se o `server.js` tem a configuração de CORS do Socket.io

### Problema: Servidor "dorme" no Render

**Solução:**
1. Isso é normal no plano gratuito do Render
2. O servidor "dorme" após 15 minutos de inatividade
3. A primeira requisição após dormir pode demorar ~30 segundos
4. Isso é esperado e não é um erro
5. Para evitar, você pode fazer upgrade para um plano pago

---

## 🎉 PARABÉNS!

Se você chegou até aqui, seu jogo está online e funcionando!

### Próximos Passos:

1. **Compartilhe a URL** com seus amigos
2. **Teste o jogo** com vários jogadores
3. **Divirta-se!** 🎮

### Dicas:

- **Atualizar o jogo:** Quando fizer mudanças, faça commit no GitHub Desktop e o Render vai atualizar automaticamente
- **Ver logs:** No Render, você pode ver os logs do servidor na aba "Logs"
- **Customizar:** Você pode mudar o nome do serviço no Render em "Settings"

---

## 📞 PRECISA DE AJUDA?

Se você está travado em algum passo:

1. **Leia os logs:** Sempre verifique os logs de erro
2. **Verifique a seção de problemas:** Veja a seção 9 acima
3. **Tente novamente:** Às vezes reiniciar resolve

---

**Boa sorte e divirta-se jogando! 🎮⚔️**

