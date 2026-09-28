# 🚀 GUIA RÁPIDO: PAGAMENTOS FLEXÍVEIS - IMPLEMENTAÇÃO EM FASES

## 📌 FASES DE IMPLEMENTAÇÃO

| Fase | Tempo | O que faz | Valor |
|------|-------|----------|-------|
| **0** | 1h | Setup BD (triggers + tabelas) | 🔓 Desbloqueia tudo |
| **1** | 4h | PaymentPolicyService + Endpoints | ✅ Hotel configura política |
| **2** | 3h | Frontend Hotel Settings | 🎨 UI configurável |
| **3** | 2h | Frontend Driver Settings | 🎨 UI motorista |
| **4** | 2h | Admin Dashboard Integration | 📊 Admin vê tudo |

**Tempo Total: ~12h = 1.5 dias de dev**

---

# ⚡ FASE 0: SETUP BANCO DE DADOS (1 HORA)

## 0.1: Tabela Hotel Payment Policies

```sql
-- Copiar TUDO isto e colar no pgAdmin SQL Editor

DROP TABLE IF EXISTS hotel_payment_policies CASCADE;

CREATE TABLE hotel_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL UNIQUE REFERENCES hotels(id) ON DELETE CASCADE,
  
  advance_payment_enabled BOOLEAN DEFAULT false,
  advance_payment_percentage NUMERIC(5,2) DEFAULT 0.00,
  advance_payment_required BOOLEAN DEFAULT false,
  advance_payment_due_days INTEGER DEFAULT 3,
  
  deposit_enabled BOOLEAN DEFAULT true,
  deposit_percentage NUMERIC(5,2) DEFAULT 30.00,
  deposit_required BOOLEAN DEFAULT true,
  
  final_payment_due_days INTEGER DEFAULT 7,
  pay_at_location_enabled BOOLEAN DEFAULT false,
  default_payment_option VARCHAR(50) DEFAULT 'advance_deposit',
  pay_at_location_surcharge_percentage NUMERIC(5,2) DEFAULT 0.00,
  
  allow_guest_choice BOOLEAN DEFAULT true,
  cancellation_refund_policy VARCHAR(50) DEFAULT 'full',
  cancellation_free_until_days INTEGER DEFAULT 7,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hotel_payment_policies_hotel_id 
  ON hotel_payment_policies(hotel_id);

-- Status OK
SELECT 'hotel_payment_policies criada' AS status;
```

**Resultado esperado:** `hotel_payment_policies criada`

---

## 0.2: Tabela Hotel Booking Payment History

```sql
DROP TABLE IF EXISTS hotel_booking_payment_history CASCADE;

CREATE TABLE hotel_booking_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES "hotelBookings"(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('advance', 'deposit', 'partial', 'final', 'refund')),
  amount NUMERIC(10,2) NOT NULL,
  amount_percentage NUMERIC(5,2),
  
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  due_date DATE,
  paid_date DATE,
  payment_method VARCHAR(50),
  
  reference_number VARCHAR(100) UNIQUE,
  gateway_payment_id VARCHAR(200),
  gateway_response JSONB,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hotel_booking_payment_history_booking_id 
  ON hotel_booking_payment_history(booking_id);
CREATE INDEX idx_hotel_booking_payment_history_status 
  ON hotel_booking_payment_history(status);
CREATE INDEX idx_hotel_booking_payment_history_due_date 
  ON hotel_booking_payment_history(due_date)
  WHERE status = 'pending';

SELECT 'hotel_booking_payment_history criada' AS status;
```

---

## 0.3: Tabela Driver Payment Policies

```sql
DROP TABLE IF EXISTS driver_payment_policies CASCADE;

CREATE TABLE driver_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  advance_payment_enabled BOOLEAN DEFAULT false,
  advance_payment_percentage NUMERIC(5,2) DEFAULT 0.00,
  advance_payment_required BOOLEAN DEFAULT false,
  
  pay_at_location_enabled BOOLEAN DEFAULT true,
  advance_payment_discount_percentage NUMERIC(5,2) DEFAULT 0.00,
  
  installment_enabled BOOLEAN DEFAULT false,
  installments_allowed INTEGER DEFAULT 1,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_driver_payment_policies_driver_id 
  ON driver_payment_policies(driver_id);

SELECT 'driver_payment_policies criada' AS status;
```

---

## 0.4: Tabela Ride Payment History

```sql
DROP TABLE IF EXISTS ride_payment_history CASCADE;

CREATE TABLE ride_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('advance', 'full', 'partial')),
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  
  paid_at TIMESTAMP,
  due_date DATE,
  
  payment_method VARCHAR(50),
  gateway_payment_id VARCHAR(200),
  reference_number VARCHAR(100) UNIQUE,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ride_payment_history_ride_id 
  ON ride_payment_history(ride_id);
CREATE INDEX idx_ride_payment_history_driver_id 
  ON ride_payment_history(driver_id);

SELECT 'ride_payment_history criada' AS status;
```

---

## 0.5: Tabela Event Space Payment Policies

```sql
DROP TABLE IF EXISTS eventspace_payment_policies CASCADE;

CREATE TABLE eventspace_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_space_id UUID NOT NULL UNIQUE REFERENCES "eventSpaces"(id) ON DELETE CASCADE,
  
  advance_payment_enabled BOOLEAN DEFAULT true,
  advance_payment_percentage NUMERIC(5,2) DEFAULT 50.00,
  advance_payment_required BOOLEAN DEFAULT true,
  
  non_refundable_deposit_percentage NUMERIC(5,2) DEFAULT 0.00,
  
  final_payment_due_days INTEGER DEFAULT 14,
  
  installment_enabled BOOLEAN DEFAULT false,
  installments_allowed INTEGER DEFAULT 3,
  
  default_payment_option VARCHAR(50) DEFAULT 'advance_deposit',
  allow_guest_choice BOOLEAN DEFAULT false,
  
  cancellation_refund_policy VARCHAR(50) DEFAULT 'tiered',
  full_refund_until_days INTEGER DEFAULT 30,
  partial_refund_until_days INTEGER DEFAULT 14,
  partial_refund_percentage NUMERIC(5,2) DEFAULT 50.00,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eventspace_payment_policies_event_space_id 
  ON eventspace_payment_policies(event_space_id);

SELECT 'eventspace_payment_policies criada' AS status;
```

---

## 0.6: Alterar hotelBookings (Adicionar Colunas)

```sql
-- Colunas de Pré-pagamento
ALTER TABLE "hotelBookings" 
  ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS advance_payment_due DATE,
  ADD COLUMN IF NOT EXISTS advance_payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS advance_payment_paid_at TIMESTAMP;

-- Colunas de Depósito
ALTER TABLE "hotelBookings" 
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS deposit_due DATE,
  ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP;

-- Colunas de Saldo
ALTER TABLE "hotelBookings" 
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS balance_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMP;

-- Colunas Consolidadas
ALTER TABLE "hotelBookings" 
  ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_policy_id UUID REFERENCES hotel_payment_policies(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hotelBookings_payment_status 
  ON "hotelBookings"(payment_status);
CREATE INDEX IF NOT EXISTS idx_hotelBookings_payment_due_dates 
  ON "hotelBookings"(advance_payment_due, deposit_due);

SELECT 'hotelBookings alterada' AS status;
```

---

## 0.7: Alterar eventBookings

```sql
ALTER TABLE "eventBookings" 
  ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS advance_payment_due DATE,
  ADD COLUMN IF NOT EXISTS advance_payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS advance_payment_paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_policy_id UUID REFERENCES eventspace_payment_policies(id);

CREATE INDEX IF NOT EXISTS idx_eventBookings_payment_status 
  ON "eventBookings"(payment_status);

SELECT 'eventBookings alterada' AS status;
```

---

## 0.8: Alterar rides

```sql
ALTER TABLE rides 
  ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS advance_payment_due DATE,
  ADD COLUMN IF NOT EXISTS advance_payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS advance_payment_paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS driver_payment_policy_id UUID REFERENCES driver_payment_policies(id);

CREATE INDEX IF NOT EXISTS idx_rides_payment_status 
  ON rides(payment_status);

SELECT 'rides alterada' AS status;
```

---

## 0.9: Trigger para Auto-calcular Amounts (Hotel)

```sql
CREATE OR REPLACE FUNCTION calculate_hotel_payment_amounts()
RETURNS TRIGGER AS $$
DECLARE
  v_policy RECORD;
  v_total NUMERIC;
BEGIN
  -- Se booking aponta para policy, calcular
  IF NEW.payment_policy_id IS NOT NULL THEN
    SELECT * INTO v_policy 
    FROM hotel_payment_policies 
    WHERE id = NEW.payment_policy_id;
    
    IF FOUND THEN
      v_total := COALESCE(NEW."totalPrice", 0);
      
      -- Calcular advance
      IF v_policy.advance_payment_enabled AND v_policy.advance_payment_percentage > 0 THEN
        NEW.advance_payment_amount := (v_total * v_policy.advance_payment_percentage / 100);
        NEW.advance_payment_due := CURRENT_DATE + INTERVAL '1' day * v_policy.advance_payment_due_days;
      ELSE
        NEW.advance_payment_amount := 0;
        NEW.advance_payment_status := 'not_required';
      END IF;
      
      -- Calcular deposit
      IF v_policy.deposit_enabled AND v_policy.deposit_percentage > 0 THEN
        NEW.deposit_amount := (v_total * v_policy.deposit_percentage / 100);
        NEW.deposit_due := CURRENT_DATE + INTERVAL '1' day * v_policy.advance_payment_due_days;
      ELSE
        NEW.deposit_amount := 0;
        NEW.deposit_status := 'not_required';
      END IF;
      
      -- Calcular balance
      NEW.balance_due := v_total 
        - COALESCE(NEW.advance_payment_amount, 0)
        - COALESCE(NEW.deposit_amount, 0);
      
      NEW.payment_status := 'pending';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_hotel_payment_amounts ON "hotelBookings";
CREATE TRIGGER trigger_calculate_hotel_payment_amounts
BEFORE INSERT OR UPDATE ON "hotelBookings"
FOR EACH ROW
EXECUTE FUNCTION calculate_hotel_payment_amounts();

SELECT 'Trigger calculate_hotel_payment_amounts criado' AS status;
```

---

## 0.10: Trigger para Auto-update Status (Hotel)

```sql
CREATE OR REPLACE FUNCTION auto_update_hotel_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  advances_paid BOOLEAN;
  deposits_paid BOOLEAN;
  balances_paid BOOLEAN;
BEGIN
  -- Checar pagamentos quando status muda
  IF (NEW.status = 'checked_out' OR NEW.status = 'completed') THEN
    
    -- Se advance não é requirido ou foi pago
    advances_paid := (NEW.advance_payment_status IS NULL 
                     OR NEW.advance_payment_status = 'not_required'
                     OR NEW.advance_payment_status = 'paid');
    
    -- Se deposit não é requirido ou foi pago
    deposits_paid := (NEW.deposit_status IS NULL 
                     OR NEW.deposit_status = 'not_required'
                     OR NEW.deposit_status = 'paid');
    
    -- Se balance não é requirido ou foi pago
    balances_paid := (NEW.balance_status IS NULL 
                     OR NEW.balance_status = 'not_required'
                     OR NEW.balance_status = 'paid');
    
    -- Se todos foram pagos
    IF advances_paid AND deposits_paid AND balances_paid THEN
      NEW.payment_status := 'complete';
      NEW.total_paid := COALESCE(NEW."totalPrice", 0);
    ELSIF (NEW.advance_payment_status = 'paid' OR NEW.deposit_status = 'paid') THEN
      NEW.payment_status := 'partial';
      NEW.total_paid := COALESCE(NEW.advance_payment_amount, 0) + COALESCE(NEW.deposit_amount, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_hotel_payment_status ON "hotelBookings";
CREATE TRIGGER trigger_auto_update_hotel_payment_status
AFTER UPDATE ON "hotelBookings"
FOR EACH ROW
EXECUTE FUNCTION auto_update_hotel_payment_status();

SELECT 'Trigger auto_update_hotel_payment_status criado' AS status;
```

---

# 🔧 FASE 1: BACKEND SERVICE + ENDPOINTS (4 HORAS)

## 1.1: Criar arquivo `PaymentPolicyService.ts`

```bash
# Local: backend/src/modules/payments/paymentPolicyService.ts
```

Copiar código:

```typescript
import { db } from '../../../db';
import { eq } from 'drizzle-orm';

// Importar as tabelas
// Import conforme seu schema

export class PaymentPolicyService {
  
  // ==================== HOTELS ====================
  
  async getHotelPaymentPolicy(hotelId: string) {
    try {
      const policy = await db.query.hotelPaymentPolicies.findFirst({
        where: (table) => eq(table.hotelId, hotelId)
      });
      
      return policy || this.getDefaultHotelPolicy();
    } catch (error) {
      console.error('Erro fetching hotel policy:', error);
      return this.getDefaultHotelPolicy();
    }
  }

  async updateHotelPaymentPolicy(hotelId: string, data: any) {
    try {
      const existing = await db.query.hotelPaymentPolicies.findFirst({
        where: (table) => eq(table.hotelId, hotelId)
      });

      if (existing) {
        return await db.update(hotelPaymentPolicies)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(hotelPaymentPolicies.hotelId, hotelId));
      } else {
        return await db.insert(hotelPaymentPolicies)
          .values({
            hotelId,
            ...data,
            created_at: new Date(),
            updated_at: new Date()
          });
      }
    } catch (error) {
      console.error('Erro updating hotel policy:', error);
      throw error;
    }
  }

  private getDefaultHotelPolicy() {
    return {
      advance_payment_enabled: true,
      advance_payment_percentage: 30.00,
      advance_payment_required: true,
      advance_payment_due_days: 3,
      deposit_enabled: true,
      deposit_percentage: 30.00,
      deposit_required: true,
      final_payment_due_days: 7,
      pay_at_location_enabled: false,
      default_payment_option: 'advance_deposit'
    };
  }

  // ==================== DRIVERS ====================

  async getDriverPaymentPolicy(driverId: string) {
    try {
      const policy = await db.query.driverPaymentPolicies.findFirst({
        where: (table) => eq(table.driver_id, driverId)
      });
      
      return policy || this.getDefaultDriverPolicy();
    } catch (error) {
      return this.getDefaultDriverPolicy();
    }
  }

  async updateDriverPaymentPolicy(driverId: string, data: any) {
    try {
      const existing = await db.query.driverPaymentPolicies.findFirst({
        where: (table) => eq(table.driver_id, driverId)
      });

      if (existing) {
        return await db.update(driverPaymentPolicies)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(driverPaymentPolicies.driver_id, driverId));
      } else {
        return await db.insert(driverPaymentPolicies)
          .values({
            driver_id: driverId,
            ...data,
            created_at: new Date()
          });
      }
    } catch (error) {
      throw error;
    }
  }

  private getDefaultDriverPolicy() {
    return {
      advance_payment_enabled: false,
      advance_payment_percentage: 0,
      advance_payment_required: false,
      pay_at_location_enabled: true,
      advance_payment_discount_percentage: 0
    };
  }

  // ==================== EVENT SPACES ====================

  async getEventSpacePaymentPolicy(eventSpaceId: string) {
    try {
      const policy = await db.query.eventspacePaymentPolicies.findFirst({
        where: (table) => eq(table.event_space_id, eventSpaceId)
      });
      
      return policy || this.getDefaultEventSpacePolicy();
    } catch (error) {
      return this.getDefaultEventSpacePolicy();
    }
  }

  async updateEventSpacePaymentPolicy(eventSpaceId: string, data: any) {
    try {
      const existing = await db.query.eventspacePaymentPolicies.findFirst({
        where: (table) => eq(table.event_space_id, eventSpaceId)
      });

      if (existing) {
        return await db.update(eventspacePaymentPolicies)
          .set({
            ...data,
            updated_at: new Date()
          })
          .where(eq(eventspacePaymentPolicies.event_space_id, eventSpaceId));
      } else {
        return await db.insert(eventspacePaymentPolicies)
          .values({
            event_space_id: eventSpaceId,
            ...data,
            created_at: new Date()
          });
      }
    } catch (error) {
      throw error;
    }
  }

  private getDefaultEventSpacePolicy() {
    return {
      advance_payment_enabled: true,
      advance_payment_percentage: 50.00,
      advance_payment_required: true,
      final_payment_due_days: 14,
      installment_enabled: false,
      cancellation_refund_policy: 'tiered'
    };
  }
}

export const paymentPolicyService = new PaymentPolicyService();
```

---

## 1.2: Adicionar Endpoints no `routes/index.ts`

Adicionar isto no seu arquivo de rotas:

```typescript
import { paymentPolicyService } from '../src/modules/payments/paymentPolicyService';
import { verifyFirebaseToken } from '../middleware/auth';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// ==================== HOTEL ENDPOINTS ====================

app.get('/api/hotels/:hotelId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const hotelId = req.params.hotelId;
    
    // Verify hotel exists
    const hotel = await db.query.hotels.findFirst({
      where: (table) => eq(table.id, hotelId)
    });
    
    if (!hotel) return res.status(404).json({ error: 'Hotel não encontrado' });

    const policy = await paymentPolicyService.getHotelPaymentPolicy(hotelId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hotels/:hotelId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const hotelId = req.params.hotelId;
    const policyData = req.body;

    // Validações básicas
    if (policyData.advance_payment_percentage && policyData.advance_payment_percentage > 100) {
      return res.status(400).json({ error: 'Percentagem não pode ser > 100%' });
    }

    const updated = await paymentPolicyService.updateHotelPaymentPolicy(hotelId, policyData);
    
    res.json({
      success: true,
      message: 'Política de pagamento atualizada',
      policy: await paymentPolicyService.getHotelPaymentPolicy(hotelId)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DRIVER ENDPOINTS ====================

app.get('/api/drivers/:driverId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const driverId = req.params.driverId;

    // Verify is self
    if (driverId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const policy = await paymentPolicyService.getDriverPaymentPolicy(driverId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drivers/:driverId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const driverId = req.params.driverId;
    const policyData = req.body;

    if (driverId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (policyData.advance_payment_percentage && policyData.advance_payment_percentage > 100) {
      return res.status(400).json({ error: 'Percentagem não pode ser > 100%' });
    }

    const updated = await paymentPolicyService.updateDriverPaymentPolicy(driverId, policyData);
    
    res.json({
      success: true,
      message: 'Sua política de pagamento foi atualizada',
      policy: await paymentPolicyService.getDriverPaymentPolicy(driverId)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EVENT SPACE ENDPOINTS ====================

app.get('/api/event-spaces/:eventSpaceId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const eventSpaceId = req.params.eventSpaceId;

    const policy = await paymentPolicyService.getEventSpacePaymentPolicy(eventSpaceId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/event-spaces/:eventSpaceId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const eventSpaceId = req.params.eventSpaceId;
    const policyData = req.body;

    if (policyData.advance_payment_percentage && policyData.advance_payment_percentage > 100) {
      return res.status(400).json({ error: 'Percentagem não pode ser > 100%' });
    }

    const updated = await paymentPolicyService.updateEventSpacePaymentPolicy(eventSpaceId, policyData);
    
    res.json({
      success: true,
      message: 'Política de pagamento atualizada',
      policy: await paymentPolicyService.getEventSpacePaymentPolicy(eventSpaceId)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

**Status:** ✅ Endpoints prontos para consumo

---

# 🎨 FASE 2: FRONTEND HOTEL (3 HORAS)

## 2.1: Criar `hotels-app/pages/payment-settings.tsx`

Copiar TUDO:

```typescript
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { toast } from 'react-toastify';
import { DollarSign, Save, Info } from 'lucide-react';

interface PaymentPolicy {
  advance_payment_enabled: boolean;
  advance_payment_percentage: number;
  advance_payment_required: boolean;
  advance_payment_due_days: number;
  deposit_enabled: boolean;
  deposit_percentage: number;
  deposit_required: boolean;
  final_payment_due_days: number;
  pay_at_location_enabled: boolean;
  default_payment_option: string;
}

export default function HotelPaymentSettings() {
  const [hotelId, setHotelId] = useState('');
  const [policy, setPolicy] = useState<PaymentPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<PaymentPolicy>({
    advance_payment_enabled: true,
    advance_payment_percentage: 30,
    advance_payment_required: true,
    advance_payment_due_days: 3,
    deposit_enabled: true,
    deposit_percentage: 30,
    deposit_required: true,
    final_payment_due_days: 7,
    pay_at_location_enabled: false,
    default_payment_option: 'advance_deposit'
  });

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      // Pegar hotel ID do localStorage ou context
      const hId = localStorage.getItem('currentHotelId') || '';
      setHotelId(hId);

      const token = localStorage.getItem('firebaseToken');
      const res = await fetch(`/api/hotels/${hId}/payment-policy`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
        setForm(data);
      }
    } catch (error) {
      console.error('Erro ao carregar política:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('firebaseToken');
      const res = await fetch(`/api/hotels/${hotelId}/payment-policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        toast.success('✅ Configurações salvas com sucesso');
        const data = await res.json();
        setPolicy(data.policy);
      } else {
        toast.error('❌ Erro ao salvar');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">⏳ Carregando...</div>;

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8 text-green-600" />
          Configurações de Pagamento
        </h1>
        <p className="text-gray-600 mt-2">Defina como seus hóspedes pagam as estadias</p>
      </div>

      {/* PRÉ-PAGAMENTO */}
      <Card>
        <CardHeader className="bg-blue-50 border-b">
          <CardTitle className="flex items-center gap-2">
            💰 Pré-Pagamento (Adiantado)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Cobrar uma percentagem antes do check-in</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold">Ativar Pré-Pagamento?</p>
              <p className="text-sm text-gray-600">Exigir pagamento antes da estadia</p>
            </div>
            <input
              type="checkbox"
              checked={form.advance_payment_enabled}
              onChange={(e) => setForm({...form, advance_payment_enabled: e.target.checked})}
              className="w-5 h-5"
            />
          </div>

          {form.advance_payment_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-3">
                  📊 Percentagem de Pré-Pagamento: <span className="text-lg font-bold text-blue-600">{form.advance_payment_percentage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.advance_payment_percentage}
                  onChange={(e) => setForm({...form, advance_payment_percentage: parseInt(e.target.value)})}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  📝 Exemplo: Hóspede pagará R$ {(1000 * form.advance_payment_percentage / 100).toFixed(2)} de uma estadia de R$ 1000
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">É Obrigatório?</p>
                  <p className="text-sm text-gray-600">Se não, hóspede pode pagar no local</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.advance_payment_required}
                  onChange={(e) => setForm({...form, advance_payment_required: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ⏰ Prazo para Pagar (dias antes do check-in)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={form.advance_payment_due_days}
                  onChange={(e) => setForm({...form, advance_payment_due_days: parseInt(e.target.value)})}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DEPÓSITO */}
      <Card>
        <CardHeader className="bg-green-50 border-b">
          <CardTitle className="flex items-center gap-2">
            🛡️ Depósito de Segurança
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Garantia contra danos ou cancelamento</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold">Ativar Depósito?</p>
              <p className="text-sm text-gray-600">Cobrar uma garantia reembolsável</p>
            </div>
            <input
              type="checkbox"
              checked={form.deposit_enabled}
              onChange={(e) => setForm({...form, deposit_enabled: e.target.checked})}
              className="w-5 h-5"
            />
          </div>

          {form.deposit_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-3">
                  💵 Percentagem de Depósito: <span className="text-lg font-bold text-green-600">{form.deposit_percentage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.deposit_percentage}
                  onChange={(e) => setForm({...form, deposit_percentage: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold">É Obrigatório?</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.deposit_required}
                  onChange={(e) => setForm({...form, deposit_required: e.target.checked})}
                  className="w-5 h-5"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SALDO FINAL */}
      <Card>
        <CardHeader className="bg-yellow-50 border-b">
          <CardTitle className="flex items-center gap-2">
            ⏰ Pagamento do Saldo (Restante)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">Prazo para pagar o total menos pré-pag + depósito</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              📅 Dias antes do Check-in para pagar saldo
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={form.final_payment_due_days}
              onChange={(e) => setForm({...form, final_payment_due_days: parseInt(e.target.value)})}
              className="border rounded px-3 py-2 w-full"
            />
            <p className="text-xs text-gray-600 mt-2">
              Hóspede deve pagar {form.final_payment_due_days} dias antes da estadia
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OPÇÕES */}
      <Card>
        <CardHeader className="bg-purple-50 border-b">
          <CardTitle>🔄 Opções Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
            <div>
              <p className="font-semibold">Permitir Pagamento no Local?</p>
              <p className="text-sm text-gray-600">Aceitar em dinheiro/cartão na chegada</p>
            </div>
            <input
              type="checkbox"
              checked={form.pay_at_location_enabled}
              onChange={(e) => setForm({...form, pay_at_location_enabled: e.target.checked})}
              className="w-5 h-5"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">💡 Configuração Recomendada:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Pré-pagamento: 30% (não obrigatório)</li>
                  <li>Depósito: 30% (obrigatório e reembolsável)</li>
                  <li>Saldo: até 7 dias antes do check-in</li>
                  <li>Pagamento no local: ✅ Ativado</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex gap-2 sticky bottom-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          <Save size={16} />
          {saving ? '⏳ Salvando...' : '💾 Salvar Configurações'}
        </Button>
        <Button
          onClick={() => setForm(policy || {})}
          variant="outline"
        >
          ↺ Descartar Alterações
        </Button>
      </div>
    </div>
  );
}
```

---

# ✅ PRÓXIMAS FASES

## Fase 3 & 4: Frontend Driver + Admin
(Código similar ao hotel, adaptado para drivers)

## Integrações: 
- Webhook quando pagamento confirmado
- Email notifications
- SMS reminders
- Admin dashboard updates

---

**Tempo Total Implementação: ~12 horas = Uma semana com dev part-time!** 🚀
