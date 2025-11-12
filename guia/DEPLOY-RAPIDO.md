# 🚀 Deploy Rápido - Spyfall Clash

## Guia Resumido (5 minutos)

### 1. Criar Repositório no GitHub
- Acesse [github.com](https://github.com)
- Clique em **"New repository"**
- Dê um nome (ex: `spyfall-clash`)
- Clique em **"Create repository"**

### 2. Enviar Código para GitHub

**Opção A - GitHub Desktop (Mais Fácil):**
1. Baixe [GitHub Desktop](https://desktop.github.com)
2. Abra → File → Add Local Repository
3. Selecione a pasta do projeto
4. Repository → Publish repository

**Opção B - Terminal:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

### 3. Deploy no Render
1. Acesse [render.com](https://render.com) e faça login
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `spyfall-clash`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Clique em **"Create Web Service"**
6. Aguarde 2-5 minutos
7. Copie a URL gerada (ex: `https://spyfall-clash.onrender.com`)

### 4. Pronto! 🎉
- Compartilhe a URL com seus amigos
- O jogo está online e funcionando!

---

📖 **Guia detalhado:** Veja [DEPLOY.md](DEPLOY.md) para mais informações e soluções de problemas.

