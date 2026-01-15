# 🚀 Configurações de Deploy - Link-A

## 📱 **Frontend (Vercel)**

### Configurações do Projeto:
- **Diretório:** `frontend-single/`
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Variáveis de Ambiente:
```bash
# Firebase Auth
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id

# Backend API
VITE_API_URL=https://your-backend.railway.app
```

### Domínios Configurados:
- `link-aturismomoz.com` (principal)
- `link-amzapp.vercel.app` (preview)
- Subdomínios automáticos do Vercel

---

## 🚂 **Backend (Railway)**

### Configurações do Projeto:
- **Diretório:** `backend/`
- **Runtime:** Node.js 18+
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Port:** Automático (Railway define via PORT env)

### Variáveis de Ambiente:
```bash
# Server
NODE_ENV=production
PORT=8000

# Database (Neon/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database
PGHOST=your_postgres_host
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_database_name

# Firebase Admin (para verificação de tokens)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# CORS Origins
ALLOWED_ORIGINS=https://link-aturismomoz.com,https://link-amzapp.vercel.app
```

---

## 🔧 **Railway Deploy Settings**

### railway.json:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🌐 **Vercel Deploy Settings**

### vercel.json:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": "dist",
  "functions": {},
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🔐 **Firebase Setup**

### 1. Criar Projeto Firebase:
1. Vá para https://console.firebase.google.com/
2. Clique "Create a project"
3. Escolha nome: `link-a-mozambique`

### 2. Configurar Authentication:
1. No console Firebase → Authentication
2. Sign-in method → Enable "Google" e "Email/Password"
3. Authorized domains → Adicionar:
   - `link-aturismomoz.com`
   - `link-amzapp.vercel.app`
   - `localhost` (para desenvolvimento)

### 3. Obter Configurações:
1. Project Settings → General
2. Your apps → Web app
3. Copiar as chaves para as variáveis de ambiente

---

## 🗄️ **Database Setup (Neon)**

### 1. Criar Database:
1. Vá para https://neon.tech/
2. Create database: `link-a-prod`
3. Copie a connection string

### 2. Schema Migration:
```bash
# No backend/
npm run db:push
```

---

## ✅ **Checklist de Deploy**

### Pré-Deploy:
- [ ] Build frontend: `cd frontend-single && npm run build`
- [ ] Build backend: `cd backend && npm run build`
- [ ] Testar localmente com variáveis de produção
- [ ] Firebase configurado com domínios corretos

### Deploy Frontend (Vercel):
- [ ] Conectar repositório GitHub
- [ ] Configurar diretório: `frontend-single/`
- [ ] Adicionar todas as variáveis VITE_*
- [ ] Deploy automático configurado

### Deploy Backend (Railway):
- [ ] Conectar repositório GitHub
- [ ] Configurar diretório: `backend/`
- [ ] Adicionar todas as variáveis de ambiente
- [ ] Testar endpoint: `/health`

### Pós-Deploy:
- [ ] Testar login Google
- [ ] Testar seleção de roles
- [ ] Verificar CORS funcionando
- [ ] Monitorar logs por erros

---

## 🐛 **Debugging**

### Logs importantes:
```bash
# Frontend (Browser Console)
- Erros de Firebase Auth
- Erros de API calls
- CORS errors

# Backend (Railway Logs)
- Database connection errors
- Firebase token verification
- API endpoint errors
```

### URLs de teste:
- **Frontend:** https://link-amzapp.vercel.app
- **Backend Health:** https://your-backend.railway.app/health
- **API Auth:** https://your-backend.railway.app/api/auth/user