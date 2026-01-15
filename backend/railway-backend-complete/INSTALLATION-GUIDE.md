# 🚀 GUIA COMPLETO DE INSTALAÇÃO - RAILWAY BACKEND

## 📁 ESTRUTURA DE FICHEIROS NO RAILWAY:

```
seu-railway-project/
├── index.js                 # ← CÓDIGO DO arquivo main-server.js
├── package.json            # ← CÓDIGO DO arquivo package-json.json  
├── config/
│   └── firebase.js         # ← CÓDIGO DO arquivo firebase-config.js
└── routes/
    └── auth.js             # ← CÓDIGO DO arquivo auth-routes.js
```

## 🔧 PASSO A PASSO:

### 1. **CRIAR FICHEIROS NO RAILWAY:**

**A. Ficheiro Principal (index.js):**
- Copiar código de `main-server.js`
- Colar no seu `index.js` principal

**B. Configuração Firebase (config/firebase.js):**
- Criar pasta `config/`
- Criar ficheiro `firebase.js`
- Copiar código de `firebase-config.js`

**C. Rotas de Auth (routes/auth.js):**
- Criar pasta `routes/`
- Criar ficheiro `auth.js`  
- Copiar código de `auth-routes.js`

**D. Package.json:**
- Atualizar seu `package.json` com as dependências

### 2. **VARIÁVEIS DE AMBIENTE NO RAILWAY:**

Adicionar estas variáveis no painel Railway:

```bash
# Firebase (obrigatório)
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project.iam.gserviceaccount.com

# Opcional
NODE_ENV=production
FRONTEND_URL=https://link-aturismomoz.com
PORT=8080
```

### 3. **INSTALAR DEPENDÊNCIAS:**

No Railway, executar:
```bash
npm install express cors firebase-admin dotenv
```

### 4. **TESTAR ENDPOINTS:**

Depois do deploy, testar:
- `GET /api/health` ✅
- `GET /api/auth/profile` ✅  
- `POST /api/auth/register` ✅
- `PUT /api/auth/roles` ✅

## ⚙️ CONFIGURAÇÕES ADICIONAIS:

### A. **Base de Dados:**
O código usa Firestore por padrão. Se quiser PostgreSQL:

```javascript
// Substituir db.collection('users') por queries PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

### B. **CORS Personalizado:**
Ajustar origins no `main-server.js` para seus domínios.

## 🎯 RESULTADO FINAL:

Depois da instalação, o Railway terá **TODOS** os endpoints:
- ✅ Autenticação completa
- ✅ Gestão de roles  
- ✅ Viagens
- ✅ Health check
- ✅ CORS configurado

**Tempo estimado:** 15-20 minutos ⏱️