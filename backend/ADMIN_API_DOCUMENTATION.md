# API Administrativa LinkA - Documentação Completa

## 📊 Endpoints Implementados

### 1. ESTATÍSTICAS E RELATÓRIOS

#### GET `/api/admin/dashboard/stats`
Obtém estatísticas gerais do dashboard
```json
{
  "success": true,
  "data": {
    "totalUsers": 5,
    "admins": 1,
    "drivers": 3,
    "hotels": 5,
    "clients": 5,
    "pendingVerifications": 5,
    "newComplaints": 0,
    "pendingPayments": 0,
    "totalRides": 29,
    "totalHotelBookings": 15,
    "totalEventBookings": 0,
    "pendingPaymentsAmount": "0"
  }
}
```

#### GET `/api/admin/dashboard/stats-period`
Obtém estatísticas por período (semanal, mensal, anual)
- Query Parameters:
  - `startDate`: String (YYYY-MM-DD)
  - `endDate`: String (YYYY-MM-DD)
  - `period`: "daily" | "weekly" | "monthly" (default: "daily")

Resposta:
```json
{
  "success": true,
  "data": [
    {
      "period": "2026-02-01",
      "totalUsers": 2,
      "newRides": 5,
      "hotelBookings": 3,
      "revenue": "15000.00"
    }
  ]
}
```

### 2. GESTÃO DE USUÁRIOS

#### GET `/api/admin/users`
Lista todos os usuários com paginação
- Query Parameters:
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
  - `search`: string (busca por email/nome)
  - `type`: "driver" | "hotel" | "client"
  - `status`: "suspended" | "verified"

Resposta:
```json
{
  "success": true,
  "data": [
    {
      "id": "user123",
      "email": "user@example.com",
      "fullName": "João Silva",
      "phone": "+258123456789",
      "can_drive": true,
      "can_manage_hotels": false,
      "can_book_services": true,
      "driver_verification_status": "verified",
      "createdAt": "2025-10-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

#### GET `/api/admin/users/:userId`
Detalhes completos de um usuário
```json
{
  "success": true,
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "fullName": "João Silva",
    "stats": {
      "rides": 5,
      "bookings": 3,
      "complaints": 0
    }
  }
}
```

### 3. SUSPENSÃO E REATIVAÇÃO DE USUÁRIOS

#### POST `/api/admin/users/:userId/suspend`
Suspende um usuário
- Body:
```json
{
  "reason": "Violação de termos de serviço",
  "end_date": "2026-03-25" // opcional
}
```

Resposta:
```json
{
  "success": true,
  "message": "Usuário suspenso com sucesso",
  "data": {
    "userId": "user123",
    "suspended": true,
    "reason": "Violação de termos de serviço"
  }
}
```

#### POST `/api/admin/users/:userId/reactivate`
Reativa um usuário suspenso
- Body:
```json
{
  "reason": "Apelo concedido após revisão"
}
```

### 4. PAGAMENTOS

#### GET `/api/admin/payments/stats`
Estatísticas gerais de pagamentos
```json
{
  "success": true,
  "data": {
    "total": "25000.00",
    "pending": "5000.00",
    "confirmed": "20000.00"
  }
}
```

#### GET `/api/admin/payments/stats-period`
Pagamentos por período
- Query Parameters:
  - `startDate`: String (YYYY-MM-DD)
  - `endDate`: String (YYYY-MM-DD)

Resposta:
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-25",
      "end": "2026-02-25"
    },
    "confirmed": {
      "total": "20000.00",
      "count": 8
    },
    "pending": {
      "total": "5000.00",
      "count": 2
    }
  }
}
```

#### POST `/api/admin/payments/:paymentId/confirm`
Confirma um pagamento
- Body:
```json
{
  "notes": "Transferência verificada"
}
```

### 5. ESTADIAS (HOTEL BOOKINGS)

#### GET `/api/admin/bookings/stats`
Estatísticas de estadias
- Query Parameters:
  - `startDate`: String (YYYY-MM-DD) (opcional)
  - `endDate`: String (YYYY-MM-DD) (opcional)

Resposta:
```json
{
  "success": true,
  "data": {
    "totalBookings": 15,
    "periodBookings": 8
  }
}
```

### 6. CAPABILITIES (VERIFICAÇÕES)

#### GET `/api/admin/capabilities/queue`
Fila de verificações pendentes
```json
{
  "success": true,
  "data": {
    "drivers": [
      {
        "id": "user123",
        "email": "driver@example.com",
        "fullName": "João Silva",
        "type": "driver",
        "status": "pending",
        "createdAt": "2026-02-25T10:00:00Z"
      }
    ],
    "hotelManagers": [],
    "total": 1
  }
}
```

#### POST `/api/admin/capabilities/:userId/approve-driver`
Aprova um motorista
- Body:
```json
{
  "reason": "Documentação completa e verificada"
}
```

#### POST `/api/admin/capabilities/:userId/reject-driver`
Rejeita um motorista
- Body:
```json
{
  "reason": "Documentação incompleta"
}
```

#### POST `/api/admin/capabilities/:userId/approve-hotel-manager`
Aprova um gestor de hotel

#### POST `/api/admin/capabilities/:userId/reject-hotel-manager`
Rejeita um gestor de hotel

### 7. DOCUMENTOS DE USUÁRIOS

#### GET `/api/admin/users/:userId/documents`
Lista documentos de um usuário
```json
{
  "success": true,
  "data": [
    {
      "id": "doc123",
      "user_id": "user123",
      "document_type": "driver_license",
      "file_name": "CNH_2025.pdf",
      "file_url": "https://storage.example.com/...",
      "status": "pending",
      "created_at": "2026-02-25T10:00:00Z"
    }
  ]
}
```

### 8. HOTÉIS

#### GET `/api/admin/hotels`
Lista hotéis/gestores de hotel
- Query Parameters:
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
  - `search`: string
  - `status`: "suspended" | "active"

#### POST `/api/admin/hotels/:hotelId/suspend`
Suspende um hotel
- Body:
```json
{
  "reason": "Violações de política"
}
```

#### POST `/api/admin/hotels/:hotelId/activate`
Reativa um hotel

### 9. RECLAMAÇÕES

#### GET `/api/admin/complaints`
Lista reclamações
- Query Parameters:
  - `page`: number
  - `limit`: number
  - `status`: string ("new", "resolved", "pending")
  - `priority`: string ("high", "medium", "low")

#### PUT `/api/admin/complaints/:complaintId/status`
Atualiza status de reclamação
- Body:
```json
{
  "status": "resolved",
  "resolution": "Ação corrigida com o usuário"
}
```

### 10. TAXAS/COMISSÕES

#### GET `/api/admin/fees/current`
Taxas atuais
```json
{
  "success": true,
  "data": {
    "rides": { "percentage": 15, "description": "Taxa de corridas" },
    "hotels": { "percentage": 12, "description": "Taxa de hotéis" },
    "events": { "percentage": 18, "description": "Taxa de eventos" }
  }
}
```

## 🔐 Autenticação

Todos os endpoints requerem:
- Header: `Authorization: Bearer {firebaseToken}`
- O usuário deve ter `is_admin = true`

## 📱 Estrutura de Resposta

Success:
```json
{
  "success": true,
  "data": {...},
  "message": "Operação concluída com sucesso"
}
```

Error:
```json
{
  "success": false,
  "message": "Descrição do erro",
  "code": "ERROR_CODE"
}
```

## 🎯 Frontend Pages

### Páginas Implementadas:

1. **Dashboard** (`/admin`)
   - Estatísticas gerais
   - KPIs principais
   - Ações rápidas

2. **Relatórios** (`/admin/reports`)
   - Estatísticas por período
   - Gráficos de tendências
   - Análise de receita
   - Comparação de atividades

3. **Users** (`/admin/users`)
   - Lista de usuários
   - Filtros avançados
   - Ações em massa
   - Detalhes do usuário

4. **Documentos** (`/admin/documents`)
   - Visualização de documentos
   - Download de arquivos
   - Revisão de documentos
   - Aprovação/Rejeição

5. **Capabilities** (`/admin/capabilities`)
   - Fila de verificações
   - Aprovação/Rejeição
   - Histórico de ações

6. **Payments** (`/admin/payments`)
   - Estatísticas de pagamentos
   - Lista de referências
   - Confirmação de pagamentos
   - Filtros por período

7. **Complaints** (`/admin/complaints`)
   - Lista de reclamações
   - Resolução de reclamações
   - Priorização

8. **Hotels** (`/admin/hotels`)
   - Gestão de hotéis
   - Suspensão/Ativação
   - Detalhes  

## 🚀 Como Usar

### 1. Acessar o Admin Panel
```
http://localhost:xxxx/admin
```

### 2. Selecionar Período para Relatórios
- Use o seletor de datas
- Escolha período (semanal/mensal/anual)
- Clique "Aplicar"

### 3. Revisar Documentos
- Vá até "Documentos"
- Procure por usuário
- Visualize/Baixe documentos
- Aprove ou Rejeite

### 4. Aprovar Capabilities
- Vá até "Capacidades"
- Revise fila de pendentes
- Aprove ou Rejeite com motivo

### 5. Gerenciar Pagamentos
- Vá até "Pagamentos"
- Veja estatísticas por período
- Confirme pagamentos pendentes

## 📊 Dados Reais Agora Disponíveis

✅ Total de usuários registados
✅ Motoristas verificados
✅ Gestores de hotel
✅ Estadias (reservas de hotéis)
✅ Corridas registadas
✅ Pagamentos (confirmados e pendentes)
✅ Reclamações
✅ Receitas por período
✅ Estatísticas de atividade
✅ Documentos de usuários

## 🔄 próximos Passos

1. Upload de documentos pelos usuários
2. Armazenamento em cloud storage
3. Notificações ao aprovar/rejeitar
4. Exportar relatórios em PDF/Excel
5. Auditoria completa de ações
