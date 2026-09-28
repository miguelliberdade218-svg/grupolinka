# 🚀 START HERE - GUIA RÁPIDO (5 MINUTOS)

## O Que Fazer AGORA (Próximas 2 Horas)

### ✅ Problema 1: Admin vê "Nenhum pagamento"

**Passo 1: Execute SQL** (1 minuto)
```
Abra: pgAdmin ou qualquer cliente PostgreSQL
Copie o MySQL abaixo e EXECUTE
```

```sql
-- Trigger automático para hotel payments
CREATE OR REPLACE FUNCTION create_hotel_payment_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
    INSERT INTO payment_references (
      reference_number,
      booking_type,
      booking_id,
      gross_amount,
      fee_amount,
      status,
      due_date
    ) VALUES (
      'LINKA-HOTEL-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || NEW.id::text,
      'hotel',
      NEW.id,
      NEW."totalPrice",
      (NEW."totalPrice" * 0.12)::numeric,
      'pending',
      CURRENT_DATE + INTERVAL '7 days'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_hotel_payment ON "hotelBookings";
CREATE TRIGGER trigger_create_hotel_payment
AFTER UPDATE ON "hotelBookings"
FOR EACH ROW
EXECUTE FUNCTION create_hotel_payment_on_confirm();

-- Trigger automático para rides
CREATE OR REPLACE FUNCTION create_ride_payment_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    INSERT INTO payment_references (
      reference_number,
      booking_type,
      booking_id,
      gross_amount,
      fee_amount,
      status,
      due_date
    ) VALUES (
      'LINKA-RIDE-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || NEW.id::text,
      'ride',
      NEW.id,
      CAST(NEW."pricePerSeat" AS DECIMAL) * NEW."availableSeats",
      (CAST(NEW."pricePerSeat" AS DECIMAL) * NEW."availableSeats" * 0.12)::numeric,
      'pending',
      CURRENT_DATE + INTERVAL '7 days'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_ride_payment ON rides;
CREATE TRIGGER trigger_create_ride_payment
AFTER UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION create_ride_payment_on_complete();
```

**Resultado**: Agora quando um booking/ride é confirmado, automatically cria entrada em payment_references

---

**Passo 2: Adicione novo método ao AdminService** (15 minutos)

Arquivo: `backend/src/modules/admin/adminService.ts`

Copie isto e adicione ao final da class AdminService:

```typescript
// 🆕 NOVO MÉTODO: Dashboard de pagamentos completo
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

    return {
      total_pending: summary.total_pending || '0.00',
      total_paid: summary.total_paid || '0.00',
      total_overdue: summary.total_overdue || '0.00',
      pending_count: summary.pending_count || 0,
      overdue_count: summary.overdue_count || 0,
      confirmed_count: summary.confirmed_count || 0
    };
  } catch (error) {
    console.error('Erro ao obter dashboard de pagamentos:', error);
    throw error;
  }
}
```

---

**Passo 3: Adicione endpoint** (10 minutos)

Arquivo: `backend/routes/index.ts` (ou create novo arquivo `backend/routes/admin.ts`)

```typescript
// Adicione este um novo endpoint

app.get('/api/admin/payments/dashboard', async (req: any, res: any) => {
  try {
    const adminService = new AdminService();
    const dashboard = await adminService.getPaymentsDashboard();
    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

**Passo 4: Reinicie servidor**
```
Ctrl+C para parar
npm run dev para iniciar
```

---

**Passo 5: Teste**
```
Abra: http://localhost:3000/api/admin/payments/dashboard
Deve ver JSON com valores de pagamentos
```

---

### ✅ Problema 2: Adicionar Botões para Suspender Usuários

**Arquivo**: `frontend/src/apps/admin-app/pages/users-new.tsx`

Procure pela seção onde mostra a tabela de usuários.

Adicione esta coluna nova:

```typescript
// No thead:
<th className="px-6 py-3 text-right">Ações</th>

// No tbody, adicione:
<td className="px-6 py-4 text-right space-x-2">
  {user.status !== 'suspended' && (
    <button
      onClick={() => handleSuspendUser(user.id)}
      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
    >
      🚫 Suspender
    </button>
  )}
  {user.status === 'suspended' && (
    <button
      onClick={() => handleReactivateUser(user.id)}
      className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
    >
      ✅ Reativar
    </button>
  )}
</td>

// Adicione estas functions:
const handleSuspendUser = async (userId: string) => {
  const reason = prompt('Motivo da suspensão:');
  if (!reason) return;
  
  try {
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    if (res.ok) {
      alert('Usuário suspenso');
      loadUsers();
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};

const handleReactivateUser = async (userId: string) => {
  try {
    const res = await fetch(`/api/admin/users/${userId}/reactivate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      alert('Usuário reativado');
      loadUsers();
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};
```

---

**Backend**: Adicione endpoints em `backend/routes/index.ts`:

```typescript
// POST /api/admin/users/:userId/suspend
app.post('/api/admin/users/:userId/suspend', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const userId = req.params.userId;
    const { reason } = req.body;
    
    await db.update(users)
      .set({
        clientVerificationStatus: 'suspended',
        clientSuspensionReason: reason,
        clientSuspendedAt: new Date(),
        canBookServices: false
      })
      .where(eq(users.id, userId));
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/users/:userId/reactivate
app.post('/api/admin/users/:userId/reactivate', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const userId = req.params.userId;
    
    await db.update(users)
      .set({
        clientVerificationStatus: 'verified',
        clientSuspendedAt: null,
        clientSuspensionReason: null,
        canBookServices: true
      })
      .where(eq(users.id, userId));
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### ✅ Problema 3: Visualizar Documentos Antes de Aprovar

A página `user-documents.tsx` JÁ existe MAS os botões não fazem nada.

**Backend**: Adicione endpoints:

```typescript
// POST /api/admin/documents/:docId/approve
app.post('/api/admin/documents/:docId/approve', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const docId = req.params.docId;
    const adminId = req.user.id;
    
    await db.update(userCapacityDocuments)
      .set({
        isVerified: true,
        verifiedBy: adminId,
        verifiedAt: new Date()
      })
      .where(eq(userCapacityDocuments.id, docId));
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/documents/:docId/reject
app.post('/api/admin/documents/:docId/reject', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const docId = req.params.docId;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    await db.update(userCapacityDocuments)
      .set({
        isVerified: false,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reason
      })
      .where(eq(userCapacityDocuments.id, docId));
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Frontend**: Em `user-documents.tsx`, atualize os botões:

```typescript
const handleApproveDoc = async (docId: string) => {
  try {
    const res = await fetch(`/api/admin/documents/${docId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      alert('✅ Documento aprovado');
      // Reload documents
      handleSelectUser(selectedUser);
    } else {
      alert('❌ Erro ao aprovar');
    }
  } catch (error) {
    console.error('Erro:', error);
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
      alert('❌ Documento rejeitado');
      handleSelectUser(selectedUser);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Nos botões da UI:
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

## 🎯 RESUMO DO QUE VOCÊ ACABOU DE FAZER

✅ **Admin agora vê pagamentos** (Trigger automático + endpoint)
✅ **Admin pode suspender/reativar usuários** (2 botões + 2 endpoints)
✅ **Admin pode aprovar/rejeitar documentos** (Wire dos buttons + 2 endpoints)

---

## 📋 PRÓXIMO PASSO (Amanhã)

Leia os documentos:
1. **ANALISE_SISTEMA_COMPLETO_2026.md** - Visão geral
2. **PLANO_IMPLEMENTACAO_PRATICO.md** - Plano detalhado
3. **DIAGNOSTICO_E_RECOMENDACOES_FINAIS.md** - Recomendações

---

## 🔧 TROUBLESHOOTING

**P: "Erro ao executar SQL"**
- A: Verifique se payment_references table existe
- Se não existe, check em schema.ts

**P: "Endpoint retorna 404"**
- A: Certifique que adicionou em `routes/index.ts`
- Reinicie servidor com `npm run dev`

**P: "Frontend button não faz nada"**
- A: Abra DevTools (F12) → Console
- Veja se há erro de fetch/Authorization

**P: "Usuário aparece na tabela mas não tem status"**
- A: É normal, apenas mostrar clientVerificationStatus ou driverVerificationStatus se existente

---

**Time**: ~2 horas para tudo funcionar
**Effort**: Fácil (copy/paste)
**Impact**: Alto (admin consegue gerir sistema)
