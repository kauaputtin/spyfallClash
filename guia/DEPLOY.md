# 🚀 Guia de Deploy - Spyfall Clash

Este guia vai te ajudar a hospedar o jogo gratuitamente para jogar online com seus amigos!

## 🎯 Opção Recomendada: Render (Gratuito e Fácil)

Render oferece hospedagem gratuita com:
- ✅ Domínio gratuito (ex: `spyfall-clash.onrender.com`)
- ✅ HTTPS automático
- ✅ Deploy automático via GitHub
- ✅ Sem necessidade de cartão de crédito
- ✅ 750 horas gratuitas por mês (suficiente para uso pessoal)

## 📋 Pré-requisitos

1. **Conta no GitHub** (grátis): [github.com](https://github.com)
2. **Conta no Render** (grátis): [render.com](https://render.com)
3. **Git instalado** no seu computador (opcional, pode usar GitHub Desktop)

## 🚀 Passo a Passo - Deploy no Render

### Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Dê um nome ao repositório (ex: `spyfall-clash`)
4. Marque como **Público** (Public) ou **Privado** (Private) - ambos funcionam
5. **NÃO** marque "Initialize with README" (já temos arquivos)
6. Clique em **"Create repository"**

### Passo 2: Enviar Código para o GitHub

#### Opção A: Usando GitHub Desktop (Mais Fácil)

1. Baixe e instale [GitHub Desktop](https://desktop.github.com)
2. Abra o GitHub Desktop
3. Vá em **File → Add Local Repository**
4. Selecione a pasta `Spyfall Clash`
5. Vá em **Repository → Publish repository**
6. Escolha o repositório que você criou
7. Clique em **"Publish repository"**

#### Opção B: Usando Git no Terminal

Abra o terminal na pasta do projeto e execute:

```bash
git init
git add .
git commit -m "Initial commit - Spyfall Clash"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

*(Substitua `SEU_USUARIO` e `SEU_REPOSITORIO` pelo seu nome de usuário e nome do repositório)*

### Passo 3: Deploy no Render

1. Acesse [render.com](https://render.com) e faça login (pode usar conta GitHub)
2. No dashboard, clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório do GitHub:
   - Clique em **"Connect account"** se necessário
   - Selecione o repositório `spyfall-clash` (ou o nome que você deu)
   - Clique em **"Connect"**
4. Configure o serviço:
   - **Name**: `spyfall-clash` (ou qualquer nome)
   - **Environment**: `Node`
   - **Region**: Escolha a mais próxima (ex: `Oregon (US West)`)
   - **Branch**: `main` (ou `master`)
   - **Root Directory**: Deixe vazio (ou `.` se pedir)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Selecione **"Free"**
5. Clique em **"Create Web Service"**
6. Aguarde o deploy (pode levar 2-5 minutos na primeira vez)
7. Quando terminar, você verá uma URL tipo: `https://spyfall-clash.onrender.com`

### Passo 4: Testar o Jogo

1. Copie a URL que o Render forneceu
2. Abra no navegador
3. O jogo deve carregar normalmente!
4. Compartilhe a URL com seus amigos

## 🔄 Atualizações Futuras

Sempre que você fizer alterações no código:

1. Envie as mudanças para o GitHub:
   ```bash
   git add .
   git commit -m "Descrição das mudanças"
   git push
   ```

2. O Render detecta automaticamente e faz um novo deploy (pode levar 1-2 minutos)

## ⚙️ Configurações Avançadas (Opcional)

### Renomear a URL

1. No dashboard do Render, vá em **Settings**
2. Em **"Custom Domain"**, você pode adicionar um domínio próprio
3. Ou em **"Name"**, você pode mudar o nome (a URL muda automaticamente)

### Variáveis de Ambiente

Se precisar adicionar variáveis de ambiente:
1. Vá em **Environment** no dashboard do Render
2. Adicione as variáveis necessárias
3. O servidor reinicia automaticamente

## 🌐 Outras Opções de Hospedagem Gratuita

### Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"** → **"Deploy from GitHub repo"**
4. Selecione seu repositório
5. Railway detecta automaticamente que é Node.js
6. Clique em **"Deploy"**
7. Aguarde e copie a URL gerada

### Fly.io

1. Acesse [fly.io](https://fly.io)
2. Instale o Fly CLI
3. Execute: `fly launch`
4. Siga as instruções

### Cyclic

1. Acesse [cyclic.sh](https://cyclic.sh)
2. Conecte seu repositório GitHub
3. Deploy automático!

## 🐛 Solução de Problemas

### O servidor não inicia

- Verifique os logs no dashboard do Render
- Certifique-se de que `package.json` tem o script `"start": "node server.js"`
- Verifique se todas as dependências estão em `package.json`

### Socket.io não funciona

- Render já suporta WebSockets, então deve funcionar automaticamente
- Se houver problemas, verifique se a URL está usando HTTPS (Render fornece automaticamente)

### Erro 404 ao acessar

- Verifique se o arquivo `public/index.html` existe
- Verifique se o servidor está servindo arquivos estáticos corretamente

### Timeout no Render (serviço free)

- O serviço gratuito do Render "dorme" após 15 minutos de inatividade
- A primeira requisição após dormir pode demorar ~30 segundos para "acordar"
- Isso é normal no plano gratuito
- Para evitar, você pode fazer upgrade para um plano pago, ou usar Railway (que não dorme)

## 📝 Notas Importantes

- **Render Free**: O serviço "dorme" após 15 minutos de inatividade. A primeira requisição após isso pode demorar ~30 segundos.
- **Railway Free**: Oferece $5 de crédito grátis por mês, não dorme automaticamente.
- **HTTPS**: Todos os serviços fornecem HTTPS automaticamente (necessário para Socket.io funcionar corretamente).
- **Domínio**: Você pode usar o domínio fornecido gratuitamente ou adicionar um domínio próprio.

## 🎮 Pronto!

Agora você tem seu jogo online! Compartilhe a URL com seus amigos e divirtam-se!

---

**Dúvidas?** Verifique os logs no dashboard do Render ou consulte a documentação oficial.

