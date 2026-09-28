# 🛠️ PLANO DE AÇÃO PRÁTICO - IMPLEMENTAÇÃO FASE POR FASE

## 📅 TIMELINE: 4-6 semanas de desenvolvimento

---

# ⚡ FASE 1: ADMIN PAYMENTS (CRÍTICO) - 5 DIAS

## Problema: Admin vê "Nenhum pagamento" mesmo com reservas confirmadas

### Dia 1-2: Backend - Corrigir Query de Pagamentos

**Arquivo**: `backend/src/modules/admin/adminService.ts`

**Código a adicionar**:
```typescript
// ==================== NOVO: Pagamentos Integrado ====================

async getPaymentReferences(filters: {
  page?: number;
  limit?: number;
  status?: string;
  booking_type?: string;
} = {}) {
  const { page = 1, limit = 20, status, booking_type } = filters;
  const offset = (page - 1) * limit;

  // 🔥 LOGICA CORRIGIDA: Buscar TODAS as sources de pagamento
  
  let whereConditions = [];

  // Filtro de status
  if (status) {
    whereConditions.push(eq(paymentReferences.status, status));
  }

  // Filtro de tipo se especificado
  if (booking_type) {
    whereConditions.push(eq(paymentReferences.booking_type, booking_type));
  }

  const whereClause = whereConditions.length > 0 
    ? and(...whereConditions) 
    : undefined;

  const [payments, totalResult, summaryResult] = await Promise.all([
    // Listar pagamentos com paginação
    db.select({
      id: paymentReferences.id,
      reference_number: paymentReferences.reference_number,
      booking_type: paymentReferences.booking_type,
      booking_id: paymentReferences.booking_id,
      gross_amount: paymentReferences.gross_amount,
      fee_amount: paymentReferences.fee_amount,
      status: paymentReferences.status,
      due_date: paymentReferences.due_date,
      created_at: paymentReferences.created_at,
      provider_entity_code: paymentReferences.provider_entity_code,
      paid_at: paymentReferences.paid_at
    })
      .from(paymentReferences)
      .where(whereClause)
      .orderBy(desc(paymentReferences.created_at))
      .limit(limit)
      .offset(offset),

    // Total de registros
    db.select({ count: count() })
      .from(paymentReferences)
      .where(whereClause),

    // Resumo: totais por status
    db.select({
      status: paymentReferences.status,
      count: count(),
      total_amount: sql<string>`SUM(CAST(gross_amount AS DECIMAL))`
    })
      .from(paymentReferences)
      .where(status ? eq(paymentReferences.status, status) : undefined)
      .groupBy(paymentReferences.status)
  ]);

  const totalPages = Math.ceil(Number(totalResult[0].count) / limit);

  return {
    payments: payments,
    summary: {
      total_pending: summaryResult.find(s => s.status === 'pending')?.total_amount || '0',
      total_paid: summaryResult.find(s => s.status === 'confirmed')?.total_amount || '0',
      total_overdue: summaryResult.find(s => s.status === 'overdue')?.total_amount || '0',
    },
    pagination: {
      page,
      limit,
      total: Number(totalResult[0].count),
      totalPages
    }
  };
}

// 🆕 NOVO MÉTODO: Trazer dados reais de reservas para pagamentos
async getExpectedRevenueFromReservations() {
  try {
    // 1. Hotel bookings confirmadas não pagas
    const hotelPayments = await db.select({
      booking_id: hotelBookings.id,
      booking_type: sql<string>`'hotel'`,
      gross_amount: hotelBookings.totalPrice,
      status: hotelBookings.status,
      check_in_date: hotelBookings.checkInDate,
      check_out_date: hotelBookings.checkOutDate,
      created_at: hotelBookings.createdAt
    })
      .from(hotelBookings)
      .where(
        and(
          eq(hotelBookings.status, 'confirmed'), // Confirmadas
          sql`NOT EXISTS(
            SELECT 1 FROM payment_references 
            WHERE booking_id = hotelBookings.id 
            AND booking_type = 'hotel'
          )` // Sem pagamento criado ainda
        )
      );

    // 2. Event bookings confirmadas não pagas
    const eventPayments = await db.select({
      booking_id: eventBookings.id,
      booking_type: sql<string>`'event'`,
      gross_amount: eventBookings.totalPrice,
      status: eventBookings.status,
      start_date: eventBookings.startDate,
      created_at: eventBookings.createdAt
    })
      .from(eventBookings)
      .where(
        and(
          sql`status NOT IN ('cancelled', 'rejected')`,
          sql`NOT EXISTS(
            SELECT 1 FROM payment_references 
            WHERE booking_id = eventBookings.id 
            AND booking_type = 'event'
          )`
        )
      );

    // 3. Rides confirmadas não pagas (future rides)
    const ridePayments = await db.select({
      booking_id: rides.id,
      booking_type: sql<string>`'ride'`,
      gross_amount: sql<string>`CAST(price_per_seat AS DECIMAL) * available_seats`,
      status: rides.status,
      departure_date: rides.departureDate,
      created_at: rides.createdAt
    })
      .from(rides)
      .where(
        and(
          eq(rides.status, 'completed'), // Apenas rides já completadas
          sql`NOT EXISTS(
            SELECT 1 FROM payment_references 
            WHERE booking_id = rides.id 
            AND booking_type = 'ride'
          )`
        )
      );

    // Calcular 12% de comissão para cada
    const expectedPayments = [
      ...hotelPayments.map(p => ({
        ...p,
        fee_amount: (parseFloat(p.gross_amount) * 0.12).toFixed(2),
        net_amount: (parseFloat(p.gross_amount) * 0.88).toFixed(2),
        status: 'expected'
      })),
      ...eventPayments.map(p => ({
        ...p,
        fee_amount: (parseFloat(p.gross_amount) * 0.12).toFixed(2),
        net_amount: (parseFloat(p.gross_amount) * 0.88).toFixed(2),
        status: 'expected'
      })),
      ...ridePayments.map(p => ({
        ...p,
        fee_amount: (parseFloat(p.gross_amount) * 0.12).toFixed(2),
        net_amount: (parseFloat(p.gross_amount) * 0.88).toFixed(2),
        status: 'expected'
      }))
    ];

    return expectedPayments;

  } catch (error) {
    console.error('Erro ao calcular receita esperada:', error);
    return [];
  }
}

// 🆕 NOVO MÉTODO: Dashboard de pagamentos com resumo completo
async getPaymentsDashboard() {
  try {
    const paymentReferences = await db.select({
      total_pending: sql<string>`SUM(CASE WHEN status = 'pending' THEN CAST(gross_amount AS DECIMAL) ELSE 0 END)`,
      total_paid: sql<string>`SUM(CASE WHEN status = 'confirmed' THEN CAST(gross_amount AS DECIMAL) ELSE 0 END)`,
      total_overdue: sql<string>`SUM(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN CAST(gross_amount AS DECIMAL) ELSE 0 END)`,
      pending_count: sql<number>`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
      overdue_count: sql<number>`COUNT(CASE WHEN status = 'pending' AND due_date < CURRENT_DATE THEN 1 END)`,
      confirmed_count: sql<number>`COUNT(CASE WHEN status = 'confirmed' THEN 1 END)`
    })
      .from(paymentReferences);

    const summary = paymentReferences[0];

    // Distribuição por tipo de booking
    const byType = await db.select({
      booking_type: paymentReferences.booking_type,
      count: count(),
      total: sql<string>`SUM(CAST(gross_amount AS DECIMAL))`
    })
      .from(paymentReferences)
      .groupBy(paymentReferences.booking_type);

    // Expected payments
    const expectedRevenue = await this.getExpectedRevenueFromReservations();
    const expectedTotal = expectedRevenue.reduce((sum, p) => sum + parseFloat(p.gross_amount), 0).toFixed(2);

    return {
      current: {
        total_pending: summary.total_pending || '0.00',
        total_paid: summary.total_paid || '0.00',
        total_overdue: summary.total_overdue || '0.00',
        pending_count: summary.pending_count,
        overdue_count: summary.overdue_count,
        confirmed_count: summary.confirmed_count
      },
      by_type: byType,
      expected_revenue: {
        amount: expectedTotal,
        count: expectedRevenue.length
      }
    };
  } catch (error) {
    console.error('Erro ao obter dashboard de pagamentos:', error);
    throw error;
  }
}
```

### Dia 3: Backend Routes - Criar Endpoints

**Arquivo**: `backend/routes/admin.ts` (ou criar novo se não existir)

```typescript
import { Router } from 'express';
import { verifyFirebaseToken } from '../src/shared/firebaseAuth';
import { AdminService } from '../src/modules/admin/adminService';

const router = Router();
const adminService = new AdminService();

// Middleware: Verificar se é admin
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(verifyFirebaseToken);
router.use(requireAdmin);

// 🆕 NOVO: GET /api/admin/payments/dashboard
router.get('/payments/dashboard', async (req: any, res: any) => {
  try {
    const dashboard = await adminService.getPaymentsDashboard();
    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 NOVO: GET /api/admin/payments/references
router.get('/payments/references', async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const booking_type = req.query.booking_type;

    const result = await adminService.getPaymentReferences({
      page,
      limit,
      status,
      booking_type
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 🆕 NOVO: GET /api/admin/payments/expected
router.get('/payments/expected', async (req: any, res: any) => {
  try {
    const expected = await adminService.getExpectedRevenueFromReservations();
    res.json(expected);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

**Registrar em** `backend/routes/index.ts`:
```typescript
// Adicionar no topo:
import adminRoutes from './admin';

// E depois:
app.use('/api/admin', adminRoutes);
```

### Dia 4-5: Frontend - Atualizar Admin Payments Page

**Arquivo**: `frontend/src/apps/admin-app/pages/payments.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

export default function AdminPayments() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar dashboard
      const dashRes = await fetch('/api/admin/payments/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` }
      });
      if (dashRes.ok) {
        setDashboard(await dashRes.json());
      }

      // Carregar pagamentos com filtro
      const payRes = await fetch(
        `/api/admin/payments/references?page=${page}&limit=20&status=${statusFilter}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` } }
      );
      if (payRes.ok) {
        setPayments(await payRes.json());
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">💰 Gestão de Pagamentos e Comissões</h1>

      {/* KPIs */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Pendente */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comissões Pendentes</p>
                  <p className="text-2xl font-bold">
                    R$ {parseFloat(dashboard.current.total_pending).toLocaleString('pt-PT')}
                  </p>
                  <p className="text-xs text-gray-500">{dashboard.current.pending_count} transações</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          {/* Vencidas */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comissões Vencidas</p>
                  <p className="text-2xl font-bold">
                    R$ {parseFloat(dashboard.current.total_overdue).toLocaleString('pt-PT')}
                  </p>
                  <p className="text-xs text-gray-500">{dashboard.current.overdue_count} transações</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          {/* Pagas */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comissões Pagas</p>
                  <p className="text-2xl font-bold">
                    R$ {parseFloat(dashboard.current.total_paid).toLocaleString('pt-PT')}
                  </p>
                  <p className="text-xs text-gray-500">{dashboard.current.confirmed_count} transações</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Esperado */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Esperada</p>
                  <p className="text-2xl font-bold">
                    R$ {parseFloat(dashboard.expected_revenue.amount).toLocaleString('pt-PT')}
                  </p>
                  <p className="text-xs text-gray-500">{dashboard.expected_revenue.count} reservas pendentes</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setStatusFilter(''); setPage(1); }}
              className={`px-4 py-2 rounded ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Todas
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
              className={`px-4 py-2 rounded ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
            >
              Pendentes
            </button>
            <button
              onClick={() => { setStatusFilter('confirmed'); setPage(1); }}
              className={`px-4 py-2 rounded ${statusFilter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              Pagas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      {payments.data && payments.data.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Referência</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                  <th className="px-4 py-2 text-right">Comissão (12%)</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {payments.data.map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs">{p.reference_number}</td>
                    <td className="px-4 py-2">{p.booking_type === 'hotel' ? '🏨' : p.booking_type === 'event' ? '🎪' : '🚗'}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      R$ {parseFloat(p.gross_amount).toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      R$ {parseFloat(p.fee_amount).toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-2">
                      <Badge className={
                        p.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                        p.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                        'bg-gray-200 text-gray-800'
                      }>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(p.due_date).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">Nenhum pagamento encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {payments.pagination && payments.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
          >
            ← Anterior
          </Button>
          <span className="text-sm flex items-center px-4">
            Página {page} de {payments.pagination.totalPages}
          </span>
          <Button
            onClick={() => setPage(Math.min(payments.pagination.totalPages, page + 1))}
            disabled={page === payments.pagination.totalPages}
            variant="outline"
          >
            Próximo →
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

# ⚡ FASE 2: VISUALIZAR DOCUMENTOS ANTES DE APROVAR - 3 DIAS

## Problema: Admin aprova usuários sem ver documentos

**Arquivo**: `backend/routes/admin.ts` - Adicionar:

```typescript
// GET /api/admin/users/:userId/documents
router.get('/users/:userId/documents', async (req: any, res: any) => {
  try {
    const userId = req.params.userId;
    
    const documents = await db.select()
      .from(userCapacityDocuments)
      .where(eq(userCapacityDocuments.userId, userId))
      .orderBy(desc(userCapacityDocuments.createdAt));

    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    res.json({
      user: user[0],
      documents: documents
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/documents/:docId/approve
router.post('/documents/:docId/approve', async (req: any, res: any) => {
  try {
    const docId = req.params.docId;
    const { notes } = req.body;
    const adminId = req.user.id;

    await db.update(userCapacityDocuments)
      .set({
        isVerified: true,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        verificationNotes: notes || 'Aprovado'
      })
      .where(eq(userCapacityDocuments.id, docId));

    // Check: Se TODOS os documentos do user foram aprovados, auto-approve user
    const userDoc = await db.select()
      .from(userCapacityDocuments)
      .where(eq(userCapacityDocuments.id, docId))
      .limit(1);

    const userId = userDoc[0].userId;
    const capacity = userDoc[0].capacity;

    const allDocs = await db.select()
      .from(userCapacityDocuments)
      .where(eq(userCapacityDocuments.userId, userId));

    const allApproved = allDocs.every((d: any) => d.isVerified);

    if (allApproved) {
      if (capacity === 'driver') {
        await db.update(users)
          .set({
            driverVerificationStatus: 'verified',
            driverVerifiedAt: new Date()
          })
          .where(eq(users.id, userId));
      } else if (capacity === 'hotel_manager') {
        await db.update(users)
          .set({
            hotelManagerVerificationStatus: 'verified',
            hotelManagerVerifiedAt: new Date()
          })
          .where(eq(users.id, userId));
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/documents/:docId/reject
router.post('/documents/:docId/reject', async (req: any, res: any) => {
  try {
    const docId = req.params.docId;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) throw new Error('Motivo obrigatório');

    const userDoc = await db.select()
      .from(userCapacityDocuments)
      .where(eq(userCapacityDocuments.id, docId))
      .limit(1);

    const userId = userDoc[0].userId;

    await db.update(userCapacityDocuments)
      .set({
        isVerified: false,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reason
      })
      .where(eq(userCapacityDocuments.id, docId));

    // Auto-reject user verification
    const capacity = userDoc[0].capacity;
    if (capacity === 'driver') {
      await db.update(users)
        .set({
          driverVerificationStatus: 'rejected',
          driverVerificationNotes: reason,
          canDrive: false
        })
        .where(eq(users.id, userId));
    } else if (capacity === 'hotel_manager') {
      await db.update(users)
        .set({
          hotelManagerVerificationStatus: 'rejected',
          hotelManagerVerificationNotes: reason,
          canManageHotels: false
        })
        .where(eq(users.id, userId));
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend**: `frontend/src/apps/admin-app/pages/user-documents.tsx` - Wire buttons:

```typescript
// No componente, substituir os botões por:

const handleApproveDoc = async (docId: string) => {
  try {
    const res = await fetch(`/api/admin/documents/${docId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes: 'Aprovado pela admin' })
    });
    if (res.ok) {
      toast.success('Documento aprovado');
      setTimeout(() => handleSelectUser(selectedUser), 500);
    }
  } catch (error) {
    toast.error('Erro ao aprovar');
  }
};

const handleRejectDoc = async (docId: string) => {
  const reason = prompt('Motivo da rejeição:');
  if (!reason) return;
  
  try {
    const res = await fetch(`/api/admin/documents/${docId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    if (res.ok) {
      toast.success('Documento rejeitado');
      setTimeout(() => handleSelectUser(selectedUser), 500);
    }
  } catch (error) {
    toast.error('Erro ao rejeitar');
  }
};

// Nos botões:
<button
  onClick={() => handleApproveDoc(doc.id)}
  className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium"
>
  ✅ Aprovar
</button>
<button
  onClick={() => handleRejectDoc(doc.id)}
  className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm font-medium"
>
  ❌ Rejeitar
</button>
```

---

# ⚡ FASE 3: ADICIONAR TABELAS DE REVIEWS DE RIDES

### Schema (schema.ts) - Adicionar:

```typescript
// ==================== REVIEWS DE RIDES ====================

export const rideReviews = pgTable("ride_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  ride_id: uuid("ride_id").references(() => rides.id, { onDelete: "cascade" }).notNull(),
  booking_id: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  from_user_id: text("from_user_id").notNull(), // Passageiro
  to_user_id: text("to_user_id").notNull(), // Motorista
  
  // Ratings multi-dimensionais
  driver_rating: integer("driver_rating").notNull(), // 1-5
  cleanliness_rating: integer("cleanliness_rating").notNull(),
  communication_rating: integer("communication_rating").notNull(),
  vehicle_condition_rating: integer("vehicle_condition_rating").notNull(),
  route_quality_rating: integer("route_quality_rating").notNull(),
  safety_rating: integer("safety_rating").notNull(),
  
  title: varchar("title", { length: 200 }).notNull(),
  comment: text("comment").notNull(),
  pros: text("pros"),
  cons: text("cons"),
  
  overall_rating: numeric("overall_rating", { precision: 3, scale: 2 }).default(sql`(
    ("driver_rating" + "cleanliness_rating" + "communication_rating" + "vehicle_condition_rating" + "route_quality_rating" + "safety_rating")::numeric / 6.0
  )`),
  
  is_verified: boolean("is_verified").default(true),
  is_published: boolean("is_published").default(true),
  helpful_votes: integer("helpful_votes").default(0),
  
  driver_response: text("driver_response"),
  driver_response_at: timestamp("driver_response_at"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  rideIdx: index("ride_reviews_ride_id_idx").on(table.ride_id),
  driverIdx: index("ride_reviews_driver_idx").on(table.to_user_id),
  ratingIdx: index("ride_reviews_overall_rating_idx").on(table.overall_rating),
  createdAtIdx: index("ride_reviews_created_at_idx").on(table.created_at),
  rideUnique: uniqueIndex("ride_reviews_ride_id_key").on(table.ride_id),
}));

export const ridePassengerReviews = pgTable("ride_passenger_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  ride_id: uuid("ride_id").references(() => rides.id, { onDelete: "cascade" }).notNull(),
  from_driver_id: text("from_driver_id").notNull(),
  to_passenger_id: text("to_passenger_id").notNull(),
  
  passenger_rating: integer("passenger_rating").notNull(), // 1-5
  cleanliness_rating: integer("cleanliness_rating").notNull(),
  communication_rating: integer("communication_rating").notNull(),
  payment_behavior_rating: integer("payment_behavior_rating").notNull(),
  punctuality_rating: integer("punctuality_rating").notNull(),
  
  title: varchar("title", { length: 200 }),
  comment: text("comment"),
  
  overall_rating: numeric("overall_rating", { precision: 3, scale: 2 }).default(sql`(
    ("passenger_rating" + "cleanliness_rating" + "communication_rating" + "payment_behavior_rating" + "punctuality_rating")::numeric / 5.0
  )`),
  
  is_published: boolean("is_published").default(true),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  rideIdx: index("ride_passenger_reviews_ride_id_idx").on(table.ride_id),
  driverIdx: index("ride_passenger_reviews_driver_idx").on(table.from_driver_id),
  passengerIdx: index("ride_passenger_reviews_passenger_idx").on(table.to_passenger_id),
  rideUnique: uniqueIndex("ride_passenger_reviews_ride_id_key").on(table.ride_id),
}));
```

---

# 🎯 RESUMO EXECUTIVO PARA COMEÇAR HOJE

## ✅ Próximas 4 Horas:
1. **Copiar código da FASE 1** para sistema de pagamentos
2. **Testar GET /api/admin/payments/dashboard**
3. **Atualizar admin-app/pages/payments.tsx**

## ✅ Próximas 24 Horas:
1. **Wire documentos approval** (FASE 2)
2. **Testar fluxo completo**

## ✅ Próximas 48-72 Horas:
1. **Adicionar tabelas de rideReviews** (FASE 3)
2. **Endpoints básicos**

---

**Este plano é implementável em 4 semanas com 1-2 devs**
