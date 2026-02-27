// ⚡ QUICK START - ADMIN MODULE
// Use este guia para começar AGORA

/*

╔═════════════════════════════════════════════════════════════════╗
║  🚀 COMEÇAR A USAR EM 5 MINUTOS                              ║
╚═════════════════════════════════════════════════════════════════╝


PASSO 1: VERIFICAR A NOVO SISTEMA
──────────────────────────────────────────────────────────────────
✓ adminService.ts criado
✓ index.ts criado
✓ Routes atualizadas em routes/index.ts
✓ De /api/admin/system para /api/admin


PASSO 2: TESTAR NO TERMINAL
──────────────────────────────────────────────────────────────────

# Start do servidor
npm run dev

# Em outro terminal, teste:

# A) Dashboard (todos os stats)
curl http://localhost:3001/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# B) Listar usuários
curl http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# C) Verificação queue
curl http://localhost:3001/api/admin/capabilities/queue \
  -H "Authorization: Bearer YOUR_TOKEN"


PASSO 3: USAR NO SEU FRONTEND
──────────────────────────────────────────────────────────────────

// JavaScript/Fetch
const response = await fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// React com Axios
import axios from 'axios';

const adminAPI = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Listar usuários
const { data } = await adminAPI.get('/users?status=pending');

// Aprovar motorista
await adminAPI.post(`/capabilities/${userId}/approve-driver`, {
  reason: 'Documentos verificados'
});

// Atualizar taxa
await adminAPI.post('/fees/update', {
  service_type: 'ride',
  fee_percentage: 10
});


PASSO 4: PRINCIPAIS ENDPOINTS
──────────────────────────────────────────────────────────────────

GET  /api/admin/dashboard/stats
     ↳ Ver todos os números (usuários, pagamentos, etc)

GET  /api/admin/users?status=pending
     ↳ Ver usuários que faltam verificação

GET  /api/admin/capabilities/queue
     ↳ Fila de motoristas e gerentes a verificar

POST /api/admin/capabilities/{userId}/approve-driver
     ↳ Aprovar um motorista

POST /api/admin/capabilities/{userId}/reject-driver
     ↳ Rejeitar com motivo

GET  /api/admin/complaints?status=new
     ↳ Ver reclamações novas

PUT  /api/admin/complaints/{id}/status
     ↳ Atualizar status de reclamação

GET  /api/admin/payments/stats
     ↳ Ver stats de pagamentos

POST /api/admin/payments/{paymentId}/confirm
     ↳ Confirmar pagamento manualmente

GET  /api/admin/fees/current
     ↳ Ver taxa de comissão atual

POST /api/admin/fees/update
     ↳ Mudar taxa (ex: de 12% para 10%)


PASSO 5: ESTRUTURA DE RESPOSTA
──────────────────────────────────────────────────────────────────

Sucesso com lista:
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

Sucesso simples:
{
  "success": true,
  "message": "Ação realizada",
  "data": {...}
}

Erro:
{
  "success": false,
  "message": "Descrição do erro"
}


╔═════════════════════════════════════════════════════════════════╗
║  🎯 CASO DE USO: APROVAR MOTORISTA                             ║
╚═════════════════════════════════════════════════════════════════╝

User Story:
  "Como admin, quero avisar motoristas se está aprovado"

Fluxo:
  1. Admin entra no dashboard
  2. Vê "Motoristas Pendentes: 5"
  3. Clica em "Fila de Verificação"
  4. Vê lista de motoristas com documentos
  5. Clica "Aprovar" e digita motivo
  6. API chama: POST /api/admin/capabilities/{userId}/approve-driver
  7. Motorista agora pode dirigir
  8. Admin pode ver histórico da ação

Backend:
  1. adminService.approveDriver() é chamado
  2. Query atualizada: canDrive = true
  3. Status muda para "verified"
  4. Ação é logada em capabilityAuditLog
  5. Resposta: { success: true, message: "Motorista aprovado" }

Frontend:
  1. Toast/Notificação: "Motorista aprovado"
  2. Lista é atualizada
  3. Motorista sumiu da fila


╔═════════════════════════════════════════════════════════════════╗
║  🛠️ TROUBLESHOOTING RÁPIDO                                    ║
╚═════════════════════════════════════════════════════════════════╝

PROBLEMA: 404 Not Found
SOLUÇÃO:  Use /api/admin, não /api/admin/system

PROBLEMA: 403 Forbidden
SOLUÇÃO:  Seu usuário precisa ter isAdmin = true no banco

PROBLEMA: 401 Token inválido
SOLUÇÃO:  Firebase token não é válido ou expirou

PROBLEMA: Campo "success" não vem na resposta
SOLUÇÃO:  Verifique se a rota é do novo sistema

PROBLEMA: Filtros não funcionam
SOLUÇÃO:  Use query params: ?status=pending&limit=10


╔═════════════════════════════════════════════════════════════════╗
║  📱 EXEMPLO COMPLETO EM JAVASCRIPT                            ║
╚═════════════════════════════════════════════════════════════════╝

// 1. Configurar cliente HTTP
class AdminAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = 'http://localhost:3001/api/admin';
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.baseURL}${path}`, options);
    return response.json();
  }

  // Dashboard
  async getDashboard() {
    return this.request('GET', '/dashboard/stats');
  }

  // Usuários
  async listUsers(status = null, limit = 20, page = 1) {
    let path = `/users?limit=${limit}&page=${page}`;
    if (status) path += `&status=${status}`;
    return this.request('GET', path);
  }

  // Capacidades
  async getVerificationQueue() {
    return this.request('GET', '/capabilities/queue');
  }

  async approveDriver(driverId, reason) {
    return this.request('POST', `/capabilities/${driverId}/approve-driver`, { reason });
  }

  // Pagamentos
  async getPaymentStats() {
    return this.request('GET', '/payments/stats');
  }

  async confirmPayment(paymentId, notes) {
    return this.request('POST', `/payments/${paymentId}/confirm`, { notes });
  }

  // Taxas
  async updateFee(serviceType, feePercentage) {
    return this.request('POST', '/fees/update', {
      service_type: serviceType,
      fee_percentage: feePercentage
    });
  }
}

// 2. Usar a API
const admin = new AdminAPI(firebaseToken);

// Ver dashboard
const stats = await admin.getDashboard();
console.log(`Total de usuários: ${stats.data.total_users}`);

// Ver motoristas pendentes
const queue = await admin.getVerificationQueue();
queue.forEach(item => {
  console.log(`${item.fullName} - ${item.status}`);
});

// Aprovar motorista
const result = await admin.approveDriver('driver123', 'Documentos verificados');
if (result.success) {
  console.log('Motorista aprovado!');
}


╔═════════════════════════════════════════════════════════════════╗
║  📚 MAIS INFORMAÇÕES                                           ║
╚═════════════════════════════════════════════════════════════════╝

Para mais detalhes:
  → README.md - Todos os endpoints
  → SETUP.md - Instalação e testes
  → SUMMARY.md - Antes vs Depois
  → adminService.ts - Ver código-fonte
  → index.ts - Ver rotas


═══════════════════════════════════════════════════════════════════

✨ DICAS PROFISSIONAIS:

1. Use a fila de verificação padrão
   Não precisa fazer query manual

2. Sempre adicione "reason" ao aprovar/rejeitar
   Fica registrado no histórico

3. Para auditar ações, veja /api/admin/audit/logs
   Mostra QUO, QUANDO, O QUÊ de cada admin

4. Mantenha as taxas de comissão documentadas
   Histórico fica salvo automaticamente

5. Use filtros para facilitar busca
   status=pending, type=driver, search=email

*/
