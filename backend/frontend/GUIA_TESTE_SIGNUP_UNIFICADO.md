# GUIA RÁPIDO PARA TESTAR O SIGNUP UNIFICADO

## 🚀 COMEÇAR A TESTAR

### 1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

### 2. Acesse a nova página:
```
http://localhost:5173/signup-unified
```

### 3. Métodos disponíveis:
- **Google Signup**: Registro com conta Google
- **Email Signup**: Registro tradicional com email

## 🔍 O QUE TESTAR

### Teste 1: Fluxo Google
1. Clique em "Continuar com Google"
2. Complete autenticação Google
3. Verifique redirecionamento

### Teste 2: Fluxo Email
1. Clique em "Criar conta com Email"
2. Será redirecionado para páginas específicas
3. Teste cada tipo de conta:
   - `/signup` - Cliente
   - `/drivers-signup` - Motorista
   - `/hotels-signup` - Gestor

### Teste 3: Compatibilidade
1. Acesse páginas tradicionais
2. Verifique se links para unificado funcionam
3. Teste navegação entre páginas

## 🛠 ENDPOINTS DO BACKEND

### Para desenvolvimento futuro:

```javascript
// 1. Cadastro básico
POST http://localhost:8000/api/auth/signup-client
{
  "email": "user@example.com",
  "firstName": "Nome",
  "lastName": "Sobrenome",
  "phone": "+258841234567",
  "accountType": "individual"
}

// 2. Ativar capacidade
POST http://localhost:8000/api/auth/activate-capacity
{
  "capacity": "drive",
  "documents": [
    {
      "type": "driver_license",
      "url": "https://...",
      "number": "AB123456"
    }
  ]
}

// 3. Setup completo
POST http://localhost:8000/api/auth/setup-user-roles
{
  "uid": "firebase-uid",
  "email": "user@example.com",
  "displayName": "Nome Completo",
  "accountType": "individual",
  "wantsToBeClient": true,
  "wantsToBeDriver": true,
  "wantsToBeHotelManager": false,
  "driverLicenseNumber": "AB123456",
  "driverVehicleType": "Carro"
}
```

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: Firebase não configurado
```
Solução: Configure as variáveis de ambiente no .env
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
```

### Problema 2: Backend não responde
```
Solução: Certifique-se que o backend está rodando
cd ../server
npm run dev
```

### Problema 3: Erros de CORS
```
Solução: Configure CORS no backend
app.use(cors({ origin: 'http://localhost:5173' }))
```

## 📈 PRÓXIMAS ETAPAS DE DESENVOLVIMENTO

### Prioridade Alta:
1. Implementar formulário básico no wizard
2. Conectar com endpoints reais
3. Implementar validação

### Prioridade Média:
1. Upload de documentos
2. Progress tracking visual
3. Feedback melhorado

### Prioridade Baixa:
1. Animações
2. Internacionalização
3. Acessibilidade

## 🔗 LINKS

- Documentação do Backend: `server/README.md`
- Schema de Usuários: `shared/schema.ts`
- Serviço de Auth: `src/modules/auth/services/authService.ts`
- Rotas de Auth: `src/modules/auth/routes/auth.ts`

## 📞 SUPORTE

Para problemas:
1. Verifique logs do console
2. Confirme variáveis de ambiente
3. Teste endpoints com Postman/Insomnia
4. Consulte a documentação existente
```