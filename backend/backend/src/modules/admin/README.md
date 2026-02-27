// ADMIN MODULE - NOVA ARQUITETURA LIMPA
// ====================================================
// Estrutura reorganizada para ser profissional, escalável e fácil de manter

/*
📁 NOVA ESTRUTURA:
src/modules/admin/
├── adminService.ts     ⭐ Lógica de negócio (AdminService class)
├── index.ts            ⭐ Routes + Controllers combinados
└── README.md           📚 Documentação e exemplos

✅ COMPONENTES:

1️⃣ adminService.ts
   - Classe AdminService com todos os métodos
   - Separação de responsabilidades
   - Fácil de testar e reutilizar
   - Métodos organizados por funcionalidade:
     * Dashboard (stats)
     * User Management
     * Capabilities (Driver, Hotel Manager, Client)
     * Hotels Management
     * Fees/Commissions
     * Complaints
     * Payments
     * Audit Logs

2️⃣ index.ts (Router)
   - Express router com todas as rotas
   - Middleware adminOnly para autenticação
   - Chama métodos do adminService
   - Tratamento de erros centralizado
   - Respostas padronizadas (success: true/false)

3️⃣ Como usar em routes/index.ts:
   import adminRouter from '../modules/admin';
   app.use('/api/admin', adminRouter);

✅ ENDPOINTS DISPONÍVEIS:

🎯 DASHBOARD
  GET  /api/admin/dashboard/stats              - Stats gerais

👥 USUÁRIOS
  GET  /api/admin/users                        - Listar usuários com filtros
  GET  /api/admin/users/:userId                - Detalhes de um usuário

🔑 CAPACIDADES
  GET  /api/admin/capabilities/queue           - Fila de verificação
  
  POST /api/admin/capabilities/:userId/approve-driver      - Aprovar motorista
  POST /api/admin/capabilities/:userId/reject-driver       - Rejeitar motorista
  POST /api/admin/capabilities/:userId/suspend-driver      - Suspender motorista
  
  POST /api/admin/capabilities/:userId/approve-hotel-manager   - Aprovar gerente
  POST /api/admin/capabilities/:userId/reject-hotel-manager    - Rejeitar gerente
  
  POST /api/admin/clients/:userId/suspend             - Suspender cliente
  POST /api/admin/clients/:userId/reactivate         - Reativar cliente

🏨 HOTÉIS
  GET  /api/admin/hotels                       - Listar hotéis com filtros
  GET  /api/admin/hotels/:hotelId              - Detalhes de um hotel
  POST /api/admin/hotels/:hotelId/suspend      - Suspender hotel
  POST /api/admin/hotels/:hotelId/activate     - Ativar hotel

💱 TAXAS/COMISSÕES
  GET  /api/admin/fees/current                 - Ver taxas atuais
  POST /api/admin/fees/update                  - Atualizar taxa (12%, 10%, etc)

📋 RECLAMAÇÕES
  GET  /api/admin/complaints                   - Listar reclamações
  GET  /api/admin/complaints/:complaintId      - Detalhes de reclamação
  PUT  /api/admin/complaints/:complaintId/status - Atualizar status

💰 PAGAMENTOS
  GET  /api/admin/payments/stats               - Stats de pagamentos
  GET  /api/admin/payments/references          - Listar pagamentos com filtros
  POST /api/admin/payments/:paymentId/confirm  - Confirmar pagamento

📊 AUDITORIA
  GET  /api/admin/audit/logs                   - Logs das ações admin

✅ EXEMPLO DE USO - CURL COMMANDS:

# 1. Listar usuários pendentes de verificação
curl -X GET "http://localhost:3001/api/admin/users?status=pending&limit=20" \\
  -H "Authorization: Bearer TOKEN"

# 2. Aprovar um motorista
curl -X POST "http://localhost:3001/api/admin/capabilities/user123/approve-driver" \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Documentos verificados"
  }'

# 3. Rejeitar um motorista com motivo
curl -X POST "http://localhost:3001/api/admin/capabilities/user123/reject-driver" \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Documentos inválidos"
  }'

# 4. Suspender cliente
curl -X POST "http://localhost:3001/api/admin/clients/user123/suspend" \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reason": "Comportamento inadequado",
    "end_date": "2026-03-24"
  }'

# 5. Atualizar taxa de comissão para viagens
curl -X POST "http://localhost:3001/api/admin/fees/update" \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "service_type": "ride",
    "fee_percentage": 10,
    "reason": "Promoção de verão"
  }'

# 6. Ver dashboard com stats gerais
curl -X GET "http://localhost:3001/api/admin/dashboard/stats" \\
  -H "Authorization: Bearer TOKEN"

# 7. Listar reclamações ativas
curl -X GET "http://localhost:3001/api/admin/complaints?status=new&priority=high" \\
  -H "Authorization: Bearer TOKEN"

# 8. Confirmar um pagamento
curl -X POST "http://localhost:3001/api/admin/payments/payment123/confirm" \\
  -H "Authorization: Bearer TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "notes": "Comprovante verificado"
  }'

✅ RESPOSTA PADRÃO:

Sucesso:
{
  "success": true,
  "data": {...},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

Erro:
{
  "success": false,
  "message": "Descrição do erro"
}

✅ FILTROS DISPONÍVEIS:

Usuários:
  - status: "active" | "suspended" | "pending"
  - type: "driver" | "hotel_manager" | "client" | "admin"
  - search: texto para buscar por email, nome, etc
  - page, limit

Hotéis:
  - status: "active" | "inactive"
  - search: texto
  - page, limit

Reclamações:
  - status: "new" | "in_progress" | "resolved" | "closed"
  - priority: "low" | "medium" | "high" | "urgent"
  - page, limit

Pagamentos:
  - status: "pending" | "paid" | "failed"
  - booking_type: "ride" | "hotel" | "event"
  - provider_id: ID do provedor
  - page, limit

✅ FLUXOS DE NEGÓCIO IMPLEMENTADOS:

1. VERIFICAÇÃO DE MOTORISTA
   - Admin vê fila de motoristas pendentes
   - Clica em "Aprovar" ou "Rejeitar"
   - Descrição de motivo é registrada
   - Histórico é mantido
   - Motorista é notificado

2. VERIFICAÇÃO DE GERENTE DE HOTEL
   - Similar ao fluxo de motorista
   - Valida documentos comerciais

3. GESTÃO DE CLIENTES
   - Suspender cliente por comportamento inadequado
   - Reativar quando apropriado

4. GESTÃO DE HOTÉIS
   - Listar e controlar hotéis
   - Suspender se necessário

5. CONTROLE DE COMISSÕES
   - Ver comissão atual (12%)
   - Atualizar para 10%, 15%, etc
   - Histórico de mudanças

6. RECLAMAÇÕES
   - Listar com filtros de prioridade
   - Atualizar status
   - Resolver com notas

7. PAGAMENTOS
   - Ver stats (total, pendente, confirmado)
   - Confirmar pagamentos manualmente
   - Filtrar por status, tipo, provedor

8. AUDITORIA
   - Log de todas as ações
   - Quem fez, quando, o quê

✅ MIGRAÇÃO DE adminController.ts ANTIGO:

ANTES (antigo):
- Dashboard com queries complexas
- Vários endpoints misturados
- Sem separação de responsabilidades
- Difícil de manter

DEPOIS (novo):
- AdminService com métodos bem definidos
- Routes simples e legíveis
- Cada método tem uma responsabilidade
- Muito mais fácil de testar e estender
- Pronto para escalar

✅ COMO ESTENDER:

Para adicionar nova funcionalidade:

1. Adicione método em AdminService:
   async newFeature() {
     // lógica aqui
   }

2. Adicione rota em index.ts:
   router.get('/new-feature', verifyFirebaseToken, adminOnly, async (req, res) => {
     const result = await adminService.newFeature();
     res.json({ success: true, data: result });
   });

3. Simples assim! ✨

*/
