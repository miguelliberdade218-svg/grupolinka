// SETUP GUIDE - ADMIN MODULE REFACTOR
// =======================================
// Data: 24/02/2026
// Status: ✅ PRONTO PARA USO

/*

╔════════════════════════════════════════════════════════════════╗
║  🎯 O QUE FOI FEITO - RESUMO EXECUTIVO                       ║
╚════════════════════════════════════════════════════════════════╝

✅ REORGANIZAÇÃO COMPLETA DO ADMIN MODULE

De um único arquivo gigante para uma arquitetura profissional:

📁 ESTRUTURA ANTERIOR:
   adminController.ts (800+ linhas) - Tudo junto

📁 ESTRUTURA NOVA:
   ├── adminService.ts    (400 linhas) - Lógica pura de negócio
   ├── index.ts           (400 linhas) - Routes + Middleware
   ├── README.md          - Documentação completa
   └── SETUP.md           - Este arquivo


╔════════════════════════════════════════════════════════════════╗
║  📋 CHECKLIST DO QUE MUDOU                                    ║
╚════════════════════════════════════════════════════════════════╝

✅ CRIADO:
   1. src/modules/admin/adminService.ts
      - Classe AdminService com todos os métodos de negócio
      - Métodos bem organizados por domínio
      - Documentação inline

   2. src/modules/admin/index.ts
      - Express router com todas as rotas
      - Middleware adminOnly para autenticação
      - Tratamento de erros centralizado

   3. src/modules/admin/README.md
      - Documentação completa das rotas
      - Exemplos de CURL para cada endpoint
      - Descrição dos filtros disponíveis

   4. src/modules/admin/SETUP.md
      - Este arquivo - guia de setup

✅ MODIFICADO:
   1. routes/index.ts
      - Antiga import: adminController
      - Nova import: adminRouter
      - Antiga rota: /api/admin/system
      - Nova rota: /api/admin

✅ RENOMEADO:
   1. adminController.ts → adminController.ts.old
      - Mantém a versão antiga para referência
      - Pode ser deletado depois


╔════════════════════════════════════════════════════════════════╗
║  📚 MÉTODOS DISPONÍVEIS NO adminService                       ║
╚════════════════════════════════════════════════════════════════╝

DASHBOARD:
  ✅ getDashboardStats()
     - Total de usuários, motoristas, hotéis, etc
     - Pagamentos pendentes
     - Reclamações novas

USUÁRIOS:
  ✅ listUsers(filters)
     - Listar com paginação
     - Filtros: status, type, search
  
  ✅ getUserDetails(userId)
     - Detalhes completos
     - Documentos, histórico, contas bancárias

MOTORISTAS:
  ✅ getVerificationQueue()
     - Fila de verificação
  
  ✅ approveDriver(userId, adminId, reason)
  ✅ rejectDriver(userId, adminId, reason)
  ✅ suspendDriver(userId, adminId, reason, endDate)

GERENTES DE HOTEL:
  ✅ approveHotelManager(userId, adminId, reason)
  ✅ rejectHotelManager(userId, adminId, reason)

CLIENTES:
  ✅ suspendClient(userId, adminId, reason, endDate)
  ✅ reactivateClient(userId, adminId, reason)

HOTÉIS:
  ✅ listHotels(filters)
  ✅ getHotelDetails(hotelId)
  ✅ suspendHotel(hotelId, adminId, reason)
  ✅ activateHotel(hotelId, adminId, reason)

COMISSÕES:
  ✅ getCurrentFees()
  ✅ updateFee(serviceType, percentage, adminId, reason)

RECLAMAÇÕES:
  ✅ listComplaints(filters)
  ✅ getComplaintDetails(complaintId)
  ✅ updateComplaintStatus(complaintId, adminId, status, resolution)

PAGAMENTOS:
  ✅ getPaymentStats()
  ✅ listPaymentReferences(filters)
  ✅ confirmPayment(paymentId, adminId, notes)

AUDITORIA:
  ✅ logAdminAction(adminId, action, targetId, details)
  ✅ getAdminLogs(filters)


╔════════════════════════════════════════════════════════════════╗
║  🚀 COMO TESTAR - PASSO A PASSO                              ║
╚════════════════════════════════════════════════════════════════╝

1️⃣ COMPILE O PROJETO:
   # Verifique se compila sem erros
   npm run check
   # ou
   npx tsc --noEmit

2️⃣ START O SERVIDOR:
   npm run dev

3️⃣ TESTE ENDPOINTS:

   A) Dashboard Stats:
   curl -X GET "http://localhost:3001/api/admin/dashboard/stats" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   
   Resultado esperado:
   {
     "success": true,
     "data": {
       "total_users": 150,
       "total_drivers": 45,
       "total_hotel_managers": 12,
       "pending_verifications": 8,
       ...
     }
   }

   B) Listar usuários pendentes:
   curl -X GET "http://localhost:3001/api/admin/users?status=pending&limit=10" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

   C) Aprovar motorista:
   curl -X POST "http://localhost:3001/api/admin/capabilities/USER_ID/approve-driver" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Documentos verificados"}'

   D) Ver taxas atuais:
   curl -X GET "http://localhost:3001/api/admin/fees/current" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

   E) Atualizar taxa:
   curl -X POST "http://localhost:3001/api/admin/fees/update" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "service_type": "ride",
       "fee_percentage": 10,
       "reason": "Promoção especial"
     }'


╔════════════════════════════════════════════════════════════════╗
║  🔐 AUTENTICAÇÃO                                              ║
╚════════════════════════════════════════════════════════════════╝

Requisitos:
1. Token válido do Firebase
2. Usuário deve ter isAdmin = true na base de dados

Middleware de autenticação:
  verifyFirebaseToken - Verifica se token é válido
  adminOnly - Verifica se é admin

Se falhar:
  401 - Token inválido
  403 - Usuário não é admin


╔════════════════════════════════════════════════════════════════╗
║  💾 SCHEMA - TABELAS UTILIZADAS                              ║
╚════════════════════════════════════════════════════════════════╝

✅ users
   - Dados de todos os usuários
   - Campos de capacidades: canDrive, canManageHotels, canBookServices
   - Campos de verificação: *VerificationStatus, *VerificationNotes, *VerifiedAt

✅ rides
   - Histórico de corridas
   - Análises de receita

✅ hotels
   - Dados dos hotéis
   - Status ativo/inativo

✅ hotelBookings
   - Reservas de hotéis

✅ eventSpaces / eventBookings
   - Espaços para eventos e reservas

✅ complaints
   - Reclamações e denúncias
   - Status, prioridade, resolução

✅ paymentReferences
   - Registros de pagamentos
   - Receita, taxa, net

✅ platformFeeConfig
   - Configuração de comissões por serviço

✅ capabilityAuditLog
   - Histórico de mudanças de capacidades

✅ userCapacityDocuments
   - Documentos carregados pelos usuários

✅ userEntities / userBankAccounts
   - Informações de pagamento dos provedores


╔════════════════════════════════════════════════════════════════╗
║  📊 EXEMPLO COMPLETO - FLUXO DE APROVAÇÃO DE MOTORISTA       ║
╚════════════════════════════════════════════════════════════════╝

1. Admin acessa /api/admin/capabilities/queue
   ✅ Vê lista de motoristas pendentes com documentos

2. Admin clica "Aprovar" para um motorista
   POST /api/admin/capabilities/DRIVER_ID/approve-driver
   Body: { "reason": "Documentos verificados" }
   ✅ Motorista é aprovado
   ✅ Status muda para "verified"
   ✅ Ação é logada

3. Admin pode ver o histórico:
   GET /api/admin/users/DRIVER_ID
   ✅ Campo "history" mostra todas as ações

4. Se necessário, admin pode suspender:
   POST /api/admin/capabilities/DRIVER_ID/suspend-driver
   Body: { "reason": "Avaliações baixas" }
   ✅ Motorista é suspenso


╔════════════════════════════════════════════════════════════════╗
║  🐛 TROUBLESHOOTING                                           ║
╚════════════════════════════════════════════════════════════════╝

ERRO: "Cannot find module ./adminController"
✅ SOLUÇÃO: Use import adminRouter from './index'

ERRO: 403 - Acesso negado
✅ SOLUÇÃO: Verifique se user.isAdmin = true no banco

ERRO: Token inválido
✅ SOLUÇÃO: Use Firebase token válido e não expirado

ERRO: "Parâmetros inválidos"
✅ SOLUÇÃO: Verifique se todos os campos obrigatórios estão no body


╔════════════════════════════════════════════════════════════════╗
║  ✨ PRÓXIMOS PASSOS                                           ║
╚════════════════════════════════════════════════════════════════╝

1. ✅ Testar todos os endpoints com Postman
2. ✅ Deletar adminController.ts.old após confirmar
3. ✅ Criar frontend admin com essas rotas
4. ✅ Adicionar alertas/notificações quando ações são feitas
5. ✅ Implementar relatórios avançados
6. ✅ Adicionar webhooks para notificar clientes

*/
