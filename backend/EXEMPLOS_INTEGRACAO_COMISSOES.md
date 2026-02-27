# 📝 EXEMPLOS DE INTEGRAÇÃO - CÓDIGO PRONTO

## 1️⃣ INTEGRAR NO SERVIDOR EXPRESS

**File: `server.js` ou seu arquivo principal de Express**

```javascript
// Adicione isto no final das outras rotas, antes de iniciar o servidor:

// ==================== ROTAS DE PAGAMENTOS ====================
import providerPaymentsRouter from "./api/routes/provider-payments.ts";
import rideCompletionRouter from "./api/routes/ride-completion.ts"; 
import hotelCheckoutRouter from "./api/routes/hotel-checkout.ts";

// Registrar rotas
app.use("/api/provider/payments", providerPaymentsRouter);
app.use("/api/rides", rideCompletionRouter);
app.use("/api/hotel-bookings", hotelCheckoutRouter);

console.log("✅ Rotas de pagamentos registradas");
```

---

## 2️⃣ MARCAR RIDE COMO CONCLUÍDA

**Onde usar:** Após passageiro sair da ride e motorista confirmar conclusão

**File: `frontend/src/apps/driver-app/pages/ride-active.tsx` (ou similar)**

```typescript
// Após ride ser concluída fisicamente:

const completeRide = async () => {
  try {
    const token = localStorage.getItem('firebaseToken');
    
    const response = await fetch(`/api/rides/${rideId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        confirmationCode: 'ABC123', // opcional
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao concluir ride');
    }

    const data = await response.json();

    // Mostrar alerta com informação de pagamento
    toast.success(
      `✅ Ride concluída!\n\n` +
      `💰 Comissão a pagar: MZN ${data.commission.amount.toFixed(2)}\n` +
      `📅 Vencimento: ${data.commission.dueDate}\n` +
      `📌 Referência: ${data.commission.referenceNumber}\n\n` +
      `Acesse "Meus Pagamentos" para mais detalhes`,
      { autoClose: 10000 }
    );

    // Redirecionar para home ou para pagamentos
    setTimeout(() => {
      window.location.href = '/driver/payments';
    }, 3000);
  } catch (error: any) {
    console.error('Erro:', error);
    toast.error('Erro ao concluir ride: ' + error.message);
  }
};

// Botão na interface:
<Button onClick={completeRide} className="w-full bg-green-600 hover:bg-green-700">
  ✅ Concluir Ride e Calcular Comissão
</Button>
```

---

## 3️⃣ FAZER CHECKOUT EM HOTEL

**Onde usar:** Após cliente fazer pagamento no hotel, hotel clica "Checkout"

**File: `frontend/src/apps/hotel-app/pages/booking-checkout.tsx` (ou similar)**

```typescript
// Após cliente confirmar pagamento:

const performCheckout = async () => {
  try {
    const token = localStorage.getItem('firebaseToken');
    
    const response = await fetch(`/api/hotel-bookings/${bookingId}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentMethod: 'cash', // ou 'card', 'mpesa', etc
        paymentReference: 'COMP-12345', // opcional
        amount: totalPrice, // opcional
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer checkout');
    }

    const data = await response.json();

    // Mostrar confirmação
    toast.success(
      `✅ Checkout Realizado!\n\n` +
      `💰 Comissão a pagar: MZN ${data.commission.amount.toFixed(2)}\n` +
      `📅 Vencimento: ${data.commission.dueDate}\n` +
      `📌 Referência: ${data.commission.referenceNumber}\n\n` +
      `Você tem 7 dias para pagar. Acesse seu dashboard de pagamentos para pagar.`,
      { autoClose: 10000 }
    );

    // Redirecionar
    setTimeout(() => {
      window.location.href = '/hotel/dashboard';
    }, 3000);
  } catch (error: any) {
    console.error('Erro:', error);
    toast.error('Erro ao fazer checkout: ' + error.message);
  }
};

// Botão:
<Button onClick={performCheckout} className="w-full bg-blue-600">
  ✅ Fazer Checkout & Calcular Comissão
</Button>
```

---

## 4️⃣ ADICIONAR PÁGINA DE PAGAMENTOS AO PROVIDER APP

**File: `frontend/src/apps/provider-app/App.tsx` (ou router)**

```typescript
import ProviderPayments from './pages/payments';

// Adicione esta rota:
<Route path="/provider/payments" component={ProviderPayments} />

// Ou se usar React Router v6:
{
  path: 'payments',
  element: <ProviderPayments />,
}
```

**Adicione link no menu:**

```typescript
// No menu/sidebar do provider app:
<li>
  <Link to="/provider/payments" className="flex items-center gap-2">
    💰 Meus Pagamentos
  </Link>
</li>
```

---

## 5️⃣ EXIBIR NOTIFICAÇÃO APÓS COMPLETAR RIDE/CHECKOUT

**No componente de conclusão:**

```typescript
// ==================== NOTIFICAÇÃO COM DETALHES ====================

const showPaymentNotification = (commission: any) => {
  const Alert = (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
      <div className="font-bold text-blue-900">
        💰 Nova Comissão a Pagar
      </div>
      <div className="text-sm text-blue-800 space-y-1">
        <div>💵 Valor: <span className="font-bold">MZN {commission.amount.toFixed(2)}</span></div>
        <div>📅 Vencimento: <span className="font-bold">{new Date(commission.dueDate).toLocaleDateString('pt-PT')}</span></div>
        <div>📌 Referência: <span className="font-mono text-xs">{commission.referenceNumber}</span></div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button 
          size="sm" 
          onClick={() => window.location.href = '/provider/payments'}
        >
          Ver Pagamentos
        </Button>
      </div>
    </div>
  );

  toast.info(Alert, { autoClose: 8000 });
};

// Usar após ride/checkout:
showPaymentNotification(data.commission);
```

---

## 6️⃣ LISTAR COMISSÕES DO USUÁRIO

**Usecase: Componente que mostra "Você deve MZN XXX à plataforma"**

```typescript
import { useEffect, useState } from 'react';

export function MyCommissionsWidget() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const token = localStorage.getItem('firebaseToken');
      const response = await fetch('/api/provider/payments?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="text-sm font-medium text-orange-900">
        💰 Valores a Pagar à Plataforma
      </div>
      <div className="text-2xl font-bold text-orange-600 mt-2">
        MZN {parseFloat(summary?.pendingAmount || 0).toFixed(2)}
      </div>
      {parseInt(summary?.overdueCount || 0) > 0 && (
        <div className="text-sm text-red-600 mt-2">
          ⚠️ {summary.overdueCount} pagamento(s) vencido(s)
        </div>
      )}
      <button 
        onClick={() => window.location.href = '/provider/payments'}
        className="mt-3 text-blue-600 text-sm font-medium hover:underline"
      >
        Ver Detalhes →
      </button>
    </div>
  );
}
```

---

## 7️⃣ ADMIN CONFIRMAR PAGAMENTO

**Onde usar:** Na dashboard admin de pagamentos

**File: `frontend/src/apps/admin-app/pages/payments.tsx`**

```typescript
const confirmPayment = async (paymentId: string) => {
  try {
    const token = localStorage.getItem('firebaseToken');
    const notes = prompt('Adicione uma nota (opcional):');

    const response = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) throw new Error('Erro ao confirmar');

    toast.success('Pagamento confirmado com sucesso! ✅');
    // Recarregar tabela
    loadPayments();
  } catch (error: any) {
    toast.error(error.message);
  }
};

// Botão na tabela:
<Button 
  size="sm" 
  className="bg-green-600"
  onClick={() => confirmPayment(payment.id)}
>
  ✅ Confirmar
</Button>
```

---

## 8️⃣ VERIFICAR SE COMISSÃO ESTÁ VENCIDA

**Utility function:**

```typescript
export function isCommissionOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

export function daysUntilDue(dueDate: string): number {
  const diffTime = new Date(dueDate).getTime() - new Date().getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Usar:
{commission.isOverdue ? (
  <span className="text-red-600">⚠️ VENCIDO</span>
) : (
  <span className="text-blue-600">
    {daysUntilDue(commission.dueDate)} dias
  </span>
)}
```

---

## 9️⃣ FILTRAR COMISSÕES POR STATUS

**Componente de Filtros:**

```typescript
const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');

const fetchWithFilter = async () => {
  let status = '';
  if (filter === 'pending') status = 'pending';
  else if (filter === 'paid') status = 'confirmed';
  // overdue não é um status, mas calculamos no frontend

  const url = new URL('/api/provider/payments', window.location.origin);
  if (status) url.searchParams.append('status', status);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  // Se filter é 'overdue', filtramos no frontend
  if (filter === 'overdue') {
    data.data = data.data.filter((c: any) => c.isOverdue);
  }

  return data;
};
```

---

## 🔟 EXEMPLAR DE RESPOSTA COMPLETA

**GET /api/provider/payments?page=1&limit=5**

```json
{
  "success": true,
  "data": [
    {
      "id": "payment_1708900000000_ride789",
      "referenceNumber": "LINKA-RIDE-1708900000000-ride0789",
      "bookingType": "ride",
      "bookingId": "ride789",
      "grossAmount": "2500",
      "feeAmount": "300",
      "status": "pending",
      "dueDate": "2026-03-04",
      "serviceDate": "2026-02-25",
      "paidAt": null,
      "paymentProofUrl": null,
      "notes": "Comissão de corrida ID: ride789",
      "metadata": "{\"from_city\": \"Maputo\", \"to_city\": \"Gaza\"}",
      "daysUntilDue": 7,
      "isOverdue": false
    },
    {
      "id": "payment_1708900001000_hotel456",
      "referenceNumber": "LINKA-HOTEL-1708900001000-hote0456",
      "bookingType": "hotel",
      "bookingId": "hotel456",
      "grossAmount": "5000",
      "feeAmount": "600",
      "status": "pending_confirmation",
      "dueDate": "2026-03-02",
      "serviceDate": "2026-02-24",
      "paidAt": "2026-02-25T14:30:00Z",
      "paymentProofUrl": "https://storage/proof-123.jpg",
      "notes": "Comissão de reserva de hotel ID: hotel456",
      "metadata": "{\"guest_name\": \"João Silva\", \"nights\": 3}",
      "daysUntilDue": 5,
      "isOverdue": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 27,
    "pages": 6
  },
  "summary": {
    "pendingAmount": "8500",
    "overdueCount": 2,
    "overdueAmount": "1200"
  }
}
```

---

**Pronto para integrar! Copia e cola nos locais indicados! 🚀**
