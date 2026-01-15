# 🚀 Guia de Deployment - Link-A

## Estrutura da Aplicação

A aplicação Link-A está agora dividida em duas partes para facilitar o deployment:

```
├── frontend-single/     # 🎨 Frontend React (Vercel)
└── backend/            # ⚙️ Backend API (Railway)
```

## 📱 Frontend - Vercel Deployment

### Diretório Root: `frontend-single/`

**Configuração automática já incluída:**
- ✅ `vercel.json` configurado
- ✅ Build otimizado com chunks separados
- ✅ Proxy para API configurado
- ✅ Rewrite rules para SPA

**Passos para deployment:**

1. **Conectar repositório ao Vercel**
   - Root Directory: `frontend-single`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Variáveis de ambiente necessárias:**
   ```env
   VITE_API_URL=https://sua-api-railway.railway.app
   VITE_FIREBASE_API_KEY=sua_firebase_key
   VITE_FIREBASE_PROJECT_ID=seu_projeto_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

3. **Deploy automático:** ✅ Pronto!

---

## 🔧 Backend - Railway Deployment

### Diretório Root: `backend/`

**Configuração automática já incluída:**
- ✅ `railway.json` configurado
- ✅ Build com esbuild otimizado
- ✅ CORS configurado para Vercel
- ✅ Health check endpoint

**Passos para deployment:**

1. **Conectar repositório ao Railway**
   - Root Directory: `backend`
   - Start Command: `npm start`
   - Build Command: `npm run build`

2. **Variáveis de ambiente necessárias:**
   ```env
   DATABASE_URL=sua_database_url
   NODE_ENV=production
   PORT=8000
   ```

3. **Deploy automático:** ✅ Pronto!

---

## 🎯 Sistema de Roles Implementado

A aplicação agora possui **um único frontend** com seleção de roles durante o signup:

### Roles Disponíveis:
- 🧳 **Cliente** - Reservar viagens, hospedagem e eventos
- 🚗 **Motorista** - Oferecer serviços de transporte  
- 🏨 **Gestor de Hotel** - Gerir hospedagem e acomodações

### Fluxo de Signup:
```
Landing Page → Signup → Role Selection → Dashboard Específico
```

---

## 🔗 URLs Finais

Após deployment, você terá:

- **Frontend:** `https://sua-app.vercel.app`
- **Backend API:** `https://sua-api.railway.app`
- **Health Check:** `https://sua-api.railway.app/health`

---

## ✅ Testes Realizados

- ✅ Build do frontend (14.76s) - Sucesso
- ✅ Build do backend (26ms) - Sucesso  
- ✅ Sistema de roles implementado
- ✅ CORS configurado corretamente
- ✅ Proxy API configurado

---

## 🚨 Próximos Passos

1. **Fazer deployment no Vercel e Railway**
2. **Configurar variáveis de ambiente**
3. **Atualizar VITE_API_URL com a URL real do Railway**
4. **Testar comunicação entre frontend e backend**

A aplicação está **100% pronta** para deployment! 🇲🇿