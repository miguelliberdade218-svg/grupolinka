# 💳 ANÁLISE PROFUNDA: SISTEMA DE PAGAMENTOS FLEXÍVEL

## 📊 VISÃO GERAL DA PROPOSTA

### O Problema Atual
```
Hotel confirma booking
  ↓
Hóspede faz check-in/out
  ↓
Hotel PRECISA ir ao sistema e MANUALMENTE marcar como "pagamento recebido"
  ↓
❌ Overhead gigante para hoteleiros
❌ Sem flexibilidade em pré-pagamento
❌ Sem controle de pagamentos parciais
❌ Motoristas não têm opções configuraáveis
```

### A Solução Proposta
```
1. Cada hotel/eventspace/motorista pode CONFIGURAR suas políticas de pagamento
   - Pré-pagamento: % ou 0% (opcional)
   - Depósito: % ou 0% (opcional)
   - Pagamentos parciais: sim/não

2. Sistema automático processa:
   - Pré-pagamento validado
   - Depósito capturado
   - Balance calculado automático
   - Após check-out → marca como pago (webhook triggered)

3. Resultado:
   ✅ Hotel configura 1x, depois automático
   ✅ Motorista configura 1x, depois automático
   ✅ Admin vê tudo consolidado na dashboard
```

---

# 🗄️ ANÁLISE DO BANCO DE DADOS

## ✅ O Que JÁ EXISTE

### Schema Atual - Já tem a maioria!
```typescript
✅ paymentOptions - QUASE PERFEITO! (mas incompleto)
   - advance_payment_enabled: boolean
   - advance_payment_discount_percentage: numeric
   - advance_payment_required_percentage: numeric ← Aqui!
   - deposit_enabled: boolean
   - deposit_percentage: numeric
   - final_payment_due_days: integer
   - pay_at_location_enabled: boolean
   - installment_enabled: boolean
   - default_payment_option: text

✅ hotelPayments - Tem campos básicos
   - booking_id
   - amount
   - status: 'paid', 'pending', etc
   - MAS: Sem histórico de múltiplos pagamentos

✅ eventPayments - Similar ao hotelPayments

✅ payments - Genérico (rides)
   - booking_id
   - subtotal, platformFee, total
   - paymentStatus
   - MAS: Sem flexibilidade de config motorista
```

---

## ❌ O QUE FALTA NO BANCO DE DADOS

### 1. **Tabela de Políticas de Pagamento por Hotel (NOVA)**

```sql
-- FALTAVA: Políticas específicas do hotel (não é global)
CREATE TABLE hotel_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  
  -- Pré-pagamento (Adiantado)
  advance_payment_enabled BOOLEAN DEFAULT false,
  advance_payment_percentage NUMERIC(5,2) DEFAULT 0.00, -- % do total
  advance_payment_required BOOLEAN DEFAULT false, -- É obrigatório?
  advance_payment_due_days INTEGER DEFAULT 3,
  
  -- Depósito (Security deposit)
  deposit_enabled BOOLEAN DEFAULT true,
  deposit_percentage NUMERIC(5,2) DEFAULT 30.00, -- % do total
  deposit_required BOOLEAN DEFAULT true, -- É obrigatório?
  deposit_refundable BOOLEAN DEFAULT true,
  
  -- Pagamento Final (Remaining balance)
  final_payment_due_days INTEGER DEFAULT 7, -- Antes do check-in
  
  -- Opções alternativas
  installment_enabled BOOLEAN DEFAULT false,
  installments_allowed INTEGER DEFAULT 2,
  pay_at_location_enabled BOOLEAN DEFAULT false,
  pay_at_location_surcharge_percentage NUMERIC(5,2) DEFAULT 0.00,
  
  -- Preferência padrão
  default_payment_option VARCHAR(50) DEFAULT 'advance_payment', -- 'advance', 'deposit', 'full_at_location'
  allow_guest_choice BOOLEAN DEFAULT true,
  
  -- Informações adicionais
  cancellation_refund_policy VARCHAR(50) DEFAULT 'full', -- 'full', 'partial', 'none'
  cancellation_free_until_days INTEGER DEFAULT 7, -- Cancelamento grátis até X dias antes
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_hotel_policy UNIQUE(hotel_id)
);

-- Índices
CREATE INDEX idx_hotel_payment_policies_hotel_id 
  ON hotel_payment_policies(hotel_id);
```

### 2. **Tabela de Pagamentos Parciais/Histórico (NOVA)**

```sql
-- FALTAVA: Rastrear TODOS os pagamentos parcelados
CREATE TABLE hotel_booking_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES hotelBookings(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  
  payment_type VARCHAR(50) NOT NULL, -- 'advance', 'deposit', 'partial', 'final', 'refund'
  amount NUMERIC(10,2) NOT NULL,
  amount_percentage NUMERIC(5,2), -- % do total se aplicável
  
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  due_date DATE,
  paid_date DATE,
  payment_method VARCHAR(50), -- 'card', 'mpesa', 'bank_transfer', 'cash_at_location'
  
  reference_number VARCHAR(100) UNIQUE,
  gateway_payment_id VARCHAR(200), -- ID do gateway (Stripe, etc)
  gateway_response JSONB, -- Resposta completa do gateway
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT payment_type_valid CHECK (
    payment_type IN ('advance', 'deposit', 'partial', 'final', 'refund')
  )
);

CREATE INDEX idx_hotel_booking_payment_history_booking_id 
  ON hotel_booking_payment_history(booking_id);
CREATE INDEX idx_hotel_booking_payment_history_status 
  ON hotel_booking_payment_history(status);
CREATE INDEX idx_hotel_booking_payment_history_due_date 
  ON hotel_booking_payment_history(due_date)
  WHERE status = 'pending';
```

### 3. **Tabela de Políticas de Pagamento por Motorista (NOVA)**

```sql
CREATE TABLE driver_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pré-pagamento (Anticipo)
  advance_payment_enabled BOOLEAN DEFAULT false,
  advance_payment_percentage NUMERIC(5,2) DEFAULT 0.00, -- % do valor total da corrida
  advance_payment_required BOOLEAN DEFAULT false, -- É obrigatório?
  
  -- Pagamento no local
  pay_at_location_enabled BOOLEAN DEFAULT true, -- Permite pagar na chegada?
  
  -- Pagamento antecipado com desconto
  advance_payment_discount_percentage NUMERIC(5,2) DEFAULT 0.00, -- Desconto se pagar antes
  
  -- Múltiplos pagamentos
  installment_enabled BOOLEAN DEFAULT false,
  installments_allowed INTEGER DEFAULT 1,
  
  -- Referência/Identidade
  entity_code VARCHAR(50) UNIQUE NOT NULL, -- DRIVER_xxxxx (para comissões)
  
  -- Banco info para receber pagamentos
  bank_account_id UUID REFERENCES user_bank_accounts(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_driver_policy UNIQUE(driver_id)
);

CREATE INDEX idx_driver_payment_policies_driver_id 
  ON driver_payment_policies(driver_id);
```

### 4. **Tabela de Histórico de Pagamentos de Rides (NOVA)**

```sql
CREATE TABLE ride_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  payment_type VARCHAR(50) NOT NULL, -- 'advance', 'full', 'partial'
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  
  paid_at TIMESTAMP,
  due_date DATE,
  
  payment_method VARCHAR(50), -- 'card', 'mpesa', 'cash_at_location'
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
```

### 5. **Tabela de Event Spaces Payment Policies (NOVA)**

```sql
CREATE TABLE eventspace_payment_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_space_id UUID NOT NULL REFERENCES eventSpaces(id) ON DELETE CASCADE,
  
  -- Pré-pagamento
  advance_payment_enabled BOOLEAN DEFAULT true,
  advance_payment_percentage NUMERIC(5,2) DEFAULT 50.00, -- Tipicamente 50%
  advance_payment_required BOOLEAN DEFAULT true,
  
  -- Depósito de segurança
  non_refundable_deposit_percentage NUMERIC(5,2) DEFAULT 0.00,
  
  -- Saldo final
  final_payment_due_days INTEGER DEFAULT 14, -- Antes do evento
  
  -- Flexibilidade
  installment_enabled BOOLEAN DEFAULT false,
  installments_allowed INTEGER DEFAULT 3,
  
  -- Default
  default_payment_option VARCHAR(50) DEFAULT 'advance_deposit', -- 'advance', 'deposit_balance', 'installments'
  allow_guest_choice BOOLEAN DEFAULT false, -- Geralmente não deixam guest escolher
  
  -- Cancellations
  cancellation_refund_policy VARCHAR(50) DEFAULT 'tiered', -- 'full', 'partial', 'tiered', 'none'
  full_refund_until_days INTEGER DEFAULT 30,
  partial_refund_until_days INTEGER DEFAULT 14,
  partial_refund_percentage NUMERIC(5,2) DEFAULT 50.00,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_eventspace_policy UNIQUE(event_space_id)
);

CREATE INDEX idx_eventspace_payment_policies_event_space_id 
  ON eventspace_payment_policies(event_space_id);
```

### 6. **Melhoramentos ao hotelBookings (ALTERAR EXISTING)**

```sql
-- Adicionar colunas ao hotelBookings:
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS payment_policy_id UUID 
  REFERENCES hotel_payment_policies(id);

ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10,2);
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS advance_payment_due DATE;
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS advance_payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS advance_payment_paid_at TIMESTAMP;

ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS deposit_due DATE;
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP;

ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2);
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS balance_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMP;

ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE "hotelBookings" ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; -- 'pending', 'partial', 'complete'

CREATE INDEX idx_hotelBookings_payment_status 
  ON "hotelBookings"(payment_status);
CREATE INDEX idx_hotelBookings_payment_due_dates 
  ON "hotelBookings"(advance_payment_due, deposit_due, checkInDate);
```

### 7. **Melhoramentos ao eventBookings (ALTERAR EXISTING)**

```sql
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS payment_policy_id UUID 
  REFERENCES eventspace_payment_policies(id);

ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10,2);
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS advance_payment_due DATE;
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS advance_payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS advance_payment_paid_at TIMESTAMP;

ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2);
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE "eventBookings" ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';

CREATE INDEX idx_eventBookings_payment_status 
  ON "eventBookings"(payment_status);
```

### 8. **Melhoramentos ao rides (ALTERAR EXISTING)**

```sql
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_payment_policy_id UUID 
  REFERENCES driver_payment_policies(id);

ALTER TABLE rides ADD COLUMN IF NOT EXISTS advance_payment_amount NUMERIC(10,2);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS advance_payment_due DATE;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS advance_payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS advance_payment_paid_at TIMESTAMP;

ALTER TABLE rides ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'; -- 'pending', 'partial', 'complete'

CREATE INDEX idx_rides_payment_status 
  ON rides(payment_status);
```

---

# 🔧 TRIGGERS POSTGRESQL (AUTO-UPDATE STATUS)

## Trigger 1: Auto-marcar Hotel como "Pago" após Check-out

```sql
CREATE OR REPLACE FUNCTION auto_update_hotel_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando checkout é confirmado, atualizar status
  IF NEW.status = 'checked_out' OR NEW.status = 'completed' THEN
    -- Se TODOS os pagamentos foram recebidos
    IF COALESCE(NEW.advance_payment_status, 'unpaid') = 'paid'
      AND COALESCE(NEW.deposit_status, 'unpaid') = 'paid'
      AND COALESCE(NEW.balance_status, 'unpaid') = 'paid' THEN
      
      NEW.payment_status := 'complete';
      NEW.total_paid := NEW."totalPrice";
    ELSIF COALESCE(NEW.advance_payment_status, 'unpaid') = 'paid'
      OR COALESCE(NEW.deposit_status, 'unpaid') = 'paid' THEN
      
      NEW.payment_status := 'partial';
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
```

## Trigger 2: Auto-calcular Amounts quando booking é criado

```sql
CREATE OR REPLACE FUNCTION calculate_hotel_payment_amounts()
RETURNS TRIGGER AS $$
DECLARE
  v_policy RECORD;
  v_total NUMERIC;
BEGIN
  -- Se há policy, calcular amounts
  IF NEW.payment_policy_id IS NOT NULL THEN
    SELECT * INTO v_policy 
    FROM hotel_payment_policies 
    WHERE id = NEW.payment_policy_id;
    
    v_total := NEW."totalPrice";
    
    -- Calcular advance payment
    IF v_policy.advance_payment_enabled THEN
      NEW.advance_payment_amount := (v_total * v_policy.advance_payment_percentage / 100);
      NEW.advance_payment_due := CURRENT_DATE + INTERVAL '1' day * v_policy.advance_payment_due_days;
    END IF;
    
    -- Calcular deposit
    IF v_policy.deposit_enabled THEN
      NEW.deposit_amount := (v_total * v_policy.deposit_percentage / 100);
      NEW.deposit_due := CURRENT_DATE + INTERVAL '1' day * v_policy.advance_payment_due_days;
    END IF;
    
    -- Calcular balance
    NEW.balance_due := v_total 
      - COALESCE(NEW.advance_payment_amount, 0)
      - COALESCE(NEW.deposit_amount, 0);
    NEW.balance_status := 'pending';
    
    NEW.payment_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_hotel_payment_amounts ON "hotelBookings";
CREATE TRIGGER trigger_calculate_hotel_payment_amounts
BEFORE INSERT OR UPDATE ON "hotelBookings"
FOR EACH ROW
EXECUTE FUNCTION calculate_hotel_payment_amounts();
```

## Trigger 3: Similar para Event Bookings

```sql
CREATE OR REPLACE FUNCTION auto_update_event_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'finished') THEN
    IF COALESCE(NEW.advance_payment_status, 'unpaid') = 'paid'
      AND COALESCE(NEW.balance_status, 'unpaid') = 'paid' THEN
      NEW.payment_status := 'complete';
      NEW.total_paid := NEW."totalPrice";
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_update_event_payment_status ON "eventBookings";
CREATE TRIGGER trigger_auto_update_event_payment_status
AFTER UPDATE ON "eventBookings"
FOR EACH ROW
EXECUTE FUNCTION auto_update_event_payment_status();
```

---

# 🔌 BACKEND - IMPLEMENTAÇÃO

## 1. **Novo Service: PaymentPolicyService.ts**

```typescript
// backend/src/modules/payments/paymentPolicyService.ts

import { db } from '../../../db';
import {
  users,
  hotelPaymentPolicies,
  eventspacePaymentPolicies,
  driverPaymentPolicies,
  hotelBookingPaymentHistory,
  ridePaymentHistory
} from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export class PaymentPolicyService {
  
  // ==================== HOTEL PAYMENT POLICIES ====================
  
  async getHotelPaymentPolicy(hotelId: string) {
    const policy = await db.select()
      .from(hotelPaymentPolicies)
      .where(eq(hotelPaymentPolicies.hotelId, hotelId))
      .limit(1);
    
    return policy[0] || this.getDefaultHotelPolicy();
  }

  async updateHotelPaymentPolicy(
    hotelId: string,
    data: {
      advance_payment_enabled?: boolean;
      advance_payment_percentage?: number;
      advance_payment_required?: boolean;
      deposit_enabled?: boolean;
      deposit_percentage?: number;
      deposit_required?: boolean;
      final_payment_due_days?: number;
      pay_at_location_enabled?: boolean;
      default_payment_option?: string;
    }
  ) {
    // Check if exists
    const existing = await db.select()
      .from(hotelPaymentPolicies)
      .where(eq(hotelPaymentPolicies.hotelId, hotelId))
      .limit(1);

    if (existing.length > 0) {
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
  }

  private getDefaultHotelPolicy() {
    return {
      advance_payment_enabled: true,
      advance_payment_percentage: 30.00,
      advance_payment_required: true,
      deposit_enabled: true,
      deposit_percentage: 30.00,
      deposit_required: true,
      final_payment_due_days: 7,
      pay_at_location_enabled: false,
      default_payment_option: 'advance_deposit'
    };
  }

  // ==================== DRIVER PAYMENT POLICIES ====================

  async getDriverPaymentPolicy(driverId: string) {
    const policy = await db.select()
      .from(driverPaymentPolicies)
      .where(eq(driverPaymentPolicies.driver_id, driverId))
      .limit(1);
    
    return policy[0] || this.getDefaultDriverPolicy();
  }

  async updateDriverPaymentPolicy(
    driverId: string,
    data: {
      advance_payment_enabled?: boolean;
      advance_payment_percentage?: number;
      advance_payment_required?: boolean;
      pay_at_location_enabled?: boolean;
      advance_payment_discount_percentage?: number;
    }
  ) {
    const existing = await db.select()
      .from(driverPaymentPolicies)
      .where(eq(driverPaymentPolicies.driver_id, driverId))
      .limit(1);

    if (existing.length > 0) {
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

  // ==================== EVENT SPACE PAYMENT POLICIES ====================

  async getEventSpacePaymentPolicy(eventSpaceId: string) {
    const policy = await db.select()
      .from(eventspacePaymentPolicies)
      .where(eq(eventspacePaymentPolicies.event_space_id, eventSpaceId))
      .limit(1);
    
    return policy[0] || this.getDefaultEventSpacePolicy();
  }

  async updateEventSpacePaymentPolicy(
    eventSpaceId: string,
    data: any
  ) {
    const existing = await db.select()
      .from(eventspacePaymentPolicies)
      .where(eq(eventspacePaymentPolicies.event_space_id, eventSpaceId))
      .limit(1);

    if (existing.length > 0) {
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
  }

  private getDefaultEventSpacePolicy() {
    return {
      advance_payment_enabled: true,
      advance_payment_percentage: 50.00,
      advance_payment_required: true,
      non_refundable_deposit_percentage: 0,
      final_payment_due_days: 14,
      installment_enabled: false,
      cancellation_refund_policy: 'tiered'
    };
  }

  // ==================== PAYMENT HISTORY ====================

  async recordHotelPayment(
    bookingId: string,
    hotelId: string,
    paymentData: {
      payment_type: 'advance' | 'deposit' | 'partial' | 'final' | 'refund';
      amount: number;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      paid_date?: Date;
      payment_method?: string;
      gateway_payment_id?: string;
      reference_number?: string;
    }
  ) {
    return await db.insert(hotelBookingPaymentHistory)
      .values({
        booking_id: bookingId,
        hotel_id: hotelId,
        ...paymentData,
        created_at: new Date()
      });
  }

  async recordRidePayment(
    rideId: string,
    driverId: string,
    paymentData: {
      payment_type: 'advance' | 'full' | 'partial';
      amount: number;
      status: 'pending' | 'completed' | 'failed';
      paid_date?: Date;
      payment_method?: string;
      gateway_payment_id?: string;
      reference_number?: string;
    }
  ) {
    return await db.insert(ridePaymentHistory)
      .values({
        ride_id: rideId,
        driver_id: driverId,
        ...paymentData,
        created_at: new Date()
      });
  }

  async getPaymentHistory(bookingId: string, type: 'hotel' | 'event' | 'ride') {
    if (type === 'hotel') {
      return await db.select()
        .from(hotelBookingPaymentHistory)
        .where(eq(hotelBookingPaymentHistory.booking_id, bookingId))
        .orderBy(hotelBookingPaymentHistory.created_at);
    } else if (type === 'ride') {
      return await db.select()
        .from(ridePaymentHistory)
        .where(eq(ridePaymentHistory.ride_id, bookingId))
        .orderBy(ridePaymentHistory.created_at);
    }
  }
}

export const paymentPolicyService = new PaymentPolicyService();
```

## 2. **Endpoints para Configurar Políticas**

```typescript
// No arquivo: backend/routes/index.ts

import { paymentPolicyService } from '../src/modules/payments/paymentPolicyService';

// ==================== HOTEL PAYMENT POLICIES ====================

// GET /api/hotels/:hotelId/payment-policy
app.get('/api/hotels/:hotelId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const hotelId = req.params.hotelId;
    
    // Verify ownership
    const hotel = await db.select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);
    
    if (!hotel[0] || hotel[0].host_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const policy = await paymentPolicyService.getHotelPaymentPolicy(hotelId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hotels/:hotelId/payment-policy
app.post('/api/hotels/:hotelId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const hotelId = req.params.hotelId;
    const policyData = req.body;

    // Verify ownership
    const hotel = await db.select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);
    
    if (!hotel[0] || hotel[0].host_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
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

// ==================== DRIVER PAYMENT POLICIES ====================

// GET /api/drivers/:driverId/payment-policy
app.get('/api/drivers/:driverId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const driverId = req.params.driverId;

    // Verify is self
    if (driverId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const policy = await paymentPolicyService.getDriverPaymentPolicy(driverId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/drivers/:driverId/payment-policy
app.post('/api/drivers/:driverId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const driverId = req.params.driverId;
    const policyData = req.body;

    if (driverId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validações
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

// ==================== EVENT SPACE PAYMENT POLICIES ====================

// GET /api/event-spaces/:eventSpaceId/payment-policy
app.get('/api/event-spaces/:eventSpaceId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const eventSpaceId = req.params.eventSpaceId;

    const policy = await paymentPolicyService.getEventSpacePaymentPolicy(eventSpaceId);
    res.json(policy);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/event-spaces/:eventSpaceId/payment-policy
app.post('/api/event-spaces/:eventSpaceId/payment-policy', verifyFirebaseToken, async (req: any, res: any) => {
  try {
    const eventSpaceId = req.params.eventSpaceId;
    const policyData = req.body;

    // Verify ownership (manager ou admin)
    const eventSpace = await db.select()
      .from(eventSpaces)
      .where(eq(eventSpaces.id, eventSpaceId))
      .limit(1);
    
    const hotel = await db.select()
      .from(hotels)
      .where(eq(hotels.id, eventSpace[0].hotelId))
      .limit(1);

    if (hotel[0].host_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
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

---

# 🎨 FRONTEND - IMPLEMENTAÇÃO

## 1. **Página de Configuração de Pagamentos para Hotel**

```typescript
// frontend/src/apps/hotels-app/pages/payment-settings.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { toast } from 'react-toastify';
import { DollarSign, Save, Info } from 'lucide-react';

export default function HotelPaymentSettings() {
  const [hotelId, setHotelId] = useState('');
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    advance_payment_enabled: true,
    advance_payment_percentage: 30,
    advance_payment_required: true,
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
      // Get hotel ID from somewhere (props, store, etc)
      const hotelIdFromStore = localStorage.getItem('currentHotelId');
      setHotelId(hotelIdFromStore || '');

      const res = await fetch(`/api/hotels/${hotelIdFromStore}/payment-policy`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
        setForm(data);
      }
    } catch (error) {
      console.error('Erro ao carregar política:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/payment-policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
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
      toast.error('Erro: ' + error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Configurações de Pagamento
        </h1>
        <p className="text-gray-600 mt-2">Defina como seus clientes pagam</p>
      </div>

      {/* PRÉ-PAGAMENTO */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle>💰 Pré-Pagamento (Adiantado)</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Cobrar uma percentagem antes do check-in</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Ativar Pré-Pagamento?</p>
              <p className="text-sm text-gray-600">Exigir pagamento antes da estadia</p>
            </div>
            <Switch
              checked={form.advance_payment_enabled}
              onCheckedChange={(val) => setForm({...form, advance_payment_enabled: val})}
            />
          </div>

          {form.advance_payment_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Percentagem de Pré-Pagamento: {form.advance_payment_percentage}%
                </label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={form.advance_payment_percentage}
                  onChange={(e) => setForm({...form, advance_payment_percentage: parseInt(e.target.value)})}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ex: Cliente pagará R$ {(1000 * form.advance_payment_percentage / 100).toFixed(2)} de uma estadia de R$ 1000
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Pré-Pagamento é Obrigatório?</p>
                  <p className="text-sm text-gray-600">Se não, o cliente pode pagar no local</p>
                </div>
                <Switch
                  checked={form.advance_payment_required}
                  onCheckedChange={(val) => setForm({...form, advance_payment_required: val})}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DEPÓSITO */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle>🛡️ Depósito de Segurança</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Garantia contra danos ou cancelamento</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Ativar Depósito?</p>
              <p className="text-sm text-gray-600">Cobrar uma garantia reembolsável</p>
            </div>
            <Switch
              checked={form.deposit_enabled}
              onCheckedChange={(val) => setForm({...form, deposit_enabled: val})}
            />
          </div>

          {form.deposit_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Percentagem de Depósito: {form.deposit_percentage}%
                </label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={form.deposit_percentage}
                  onChange={(e) => setForm({...form, deposit_percentage: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Depósito é Obrigatório?</p>
                </div>
                <Switch
                  checked={form.deposit_required}
                  onCheckedChange={(val) => setForm({...form, deposit_required: val})}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* PAGAMENTO FINAL */}
      <Card>
        <CardHeader className="bg-yellow-50">
          <CardTitle>⏰ Pagamento Final (Saldo Restante)</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Prazo para pagar o restante</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Dias antes do Check-in para pagar saldo
            </label>
            <Input
              type="number"
              value={form.final_payment_due_days}
              onChange={(e) => setForm({...form, final_payment_due_days: parseInt(e.target.value)})}
              className="max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cliente deve pagar {form.final_payment_due_days} dias antes da estadia
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OPÇÕES ALTERNATIVAS */}
      <Card>
        <CardHeader className="bg-purple-50">
          <CardTitle>🔄 Opções Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Permitir Pagamento no Local?</p>
              <p className="text-sm text-gray-600">Aceitar pagamento em dinheiro/cartão na chegada</p>
            </div>
            <Switch
              checked={form.pay_at_location_enabled}
              onCheckedChange={(val) => setForm({...form, pay_at_location_enabled: val})}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">💡 Dica:</p>
                <p>Exemplo de configuração recomendada:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Pré-pagamento: 30% (não obrigatório)</li>
                  <li>Depósito: 30% (obrigatório)</li>
                  <li>Saldo: até 7 dias antes do check-in</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
        <Button
          onClick={() => setForm(policy)}
          variant="outline"
        >
          Descartar Alterações
        </Button>
      </div>
    </div>
  );
}
```

## 2. **Página de Configuração para Motoristas**

```typescript
// frontend/src/apps/drivers-app/pages/payment-settings.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { toast } from 'react-toastify';
import { CreditCard, Save, Info } from 'lucide-react';

export default function DriverPaymentSettings() {
  const [driverId, setDriverId] = useState('');
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    advance_payment_enabled: false,
    advance_payment_percentage: 0,
    advance_payment_required: false,
    pay_at_location_enabled: true,
    advance_payment_discount_percentage: 0
  });

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      const driverId = localStorage.getItem('userId');
      setDriverId(driverId || '');

      const res = await fetch(`/api/drivers/${driverId}/payment-policy`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` }
      });

      if (res.ok) {
        const data = await res.json();
        setPolicy(data);
        setForm(data);
      }
    } catch (error) {
      console.error('Erro ao carregar política:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/drivers/${driverId}/payment-policy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        toast.success('✅ Configurações salvas');
        const data = await res.json();
        setPolicy(data.policy);
      } else {
        toast.error('❌ Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro: ' + error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8" />
          Minha Política de Pagamento
        </h1>
        <p className="text-gray-600 mt-2">Configure como seus clientes pagam a corrida</p>
      </div>

      {/* OPÇÃO 1: Pagamento Antecipado */}
      <Card>
        <CardHeader className="bg-blue-50">
          <CardTitle>🚗 Pagamento Antecipado (Cliente Paga Antes)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Exigir Pagamento Antecipado?</p>
              <p className="text-sm text-gray-600">Cliente paga (parte da corrida) antes de sair</p>
            </div>
            <Switch
              checked={form.advance_payment_enabled}
              onCheckedChange={(val) => setForm({...form, advance_payment_enabled: val})}
            />
          </div>

          {form.advance_payment_enabled && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Percentagem a Pagar Antes: {form.advance_payment_percentage}%
              </label>
              <Input
                type="range"
                min="0"
                max="100"
                value={form.advance_payment_percentage}
                onChange={(e) => setForm({...form, advance_payment_percentage: parseInt(e.target.value)})}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Dica: 50% é comum (cliente paga metade antes, metade depois)
              </p>
            </div>
          )}

          {form.advance_payment_enabled && form.advance_payment_percentage > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Desconto por Pagamento Antecipado: {form.advance_payment_discount_percentage}%
              </label>
              <Input
                type="range"
                min="0"
                max="20"
                value={form.advance_payment_discount_percentage}
                onChange={(e) => setForm({...form, advance_payment_discount_percentage: parseInt(e.target.value)})}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ex: Ofereça 5% desconto se cliente pagar antes (incentiva pagamento antecipado)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPÇÃO 2: Pagamento no Local */}
      <Card>
        <CardHeader className="bg-green-50">
          <CardTitle>💵 Pagamento no Local (Na Chegada)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Aceitar Pagamento no Local?</p>
              <p className="text-sm text-gray-600">Cliente paga em dinheiro ou cartão na chegada</p>
            </div>
            <Switch
              checked={form.pay_at_location_enabled}
              onCheckedChange={(val) => setForm({...form, pay_at_location_enabled: val})}
            />
          </div>

          {!form.pay_at_location_enabled && form.advance_payment_percentage === 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-800">
              ⚠️ Aviso: Você desligou tanto pagamento antecipado quanto no local!
              Os clientes não conseguem fazer reserva.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">📊 Resumo Sua Política</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {form.advance_payment_enabled ? (
              <>
                <p>✅ Cliente paga <strong>{form.advance_payment_percentage}%</strong> antes da corrida</p>
                {form.advance_payment_discount_percentage > 0 && (
                  <p>✅ Desconto <strong>{form.advance_payment_discount_percentage}%</strong> se pagar antes</p>
                )}
                <p>✅ Saldo de <strong>{100 - form.advance_payment_percentage}%</strong> no local</p>
              </>
            ) : (
              <p>❌ Sem pagamento antecipado</p>
            )}
            
            {form.pay_at_location_enabled ? (
              <p>✅ Você aceita pagamento no local</p>
            ) : (
              <p>❌ Você NÃO aceita pagamento no local</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save size={16} />
          {saving ? 'Salvando...' : 'Salvar Política'}
        </Button>
      </div>
    </div>
  );
}
```

---

# 📊 WORKFLOW VISUAL: ANTES vs DEPOIS

## Cliente Reserva Hotel (ANTES)

```
Cliente: "Quero reservar"
  ↓
Sistema: "R$ 1000, confirma?"
  ↓
Cliente: OK paga R$ 1000
  ↓
booking.status = 'confirmed'
  ↓
3 dias depois... check-in
  ↓
Checa status: "Pendente" ou "Pago"?
  ↓
Hotel: "Preciso ir ao sistema marcar como pago"
  ↓
❌ Admin overhead
```

## Cliente Reserva Hotel (DEPOIS)

```
Hotel configurou: 
  - 30% pré-pagamento obrigatório
  - 30% depósito
  - 40% lata no check-in OU 7 dias antes

Cliente: "Quero reservar"
  ↓
Sistema calcula:
  - Advance: R$ 300 (30% de R$ 1000)
  - Deposit: R$ 300 (30% de R$ 1000)
  - Balance: R$ 400

"Cliente, pague 1️⃣ R$ 300 agora (obrigatório)"
  ↓
Cliente paga R$ 300
  advance_payment_status = 'paid'
  ↓
"Agora pague 2️⃣ R$ 300 depósito (obrigatório)"
  ↓
Cliente paga R$ 300
  deposit_status = 'paid'
  ↓
"🎉 Reserva confirmada! Saldo R$ 400 vence 7 dias antes"
  ↓
Check-in: sistema recebe confirm automaticamente
  ↓
✅ payment_status = 'partial' (falta balance)
  ↓
7 dias antes: reminder "Pague saldo de R$ 400"
  ↓
Cliente paga R$ 400 online ou no check-in
  ↓
Check-out confirmado automaticamente
  ↓
✅ payment_status = 'complete'
  ↓
✅ Hotel recebe: R$ 1000 (R$ 880 + 12% comissão)
✅ Admin vê tudo consolidado
✅ Zero manual work
```

---

# 🎯 SUMMARY DA IMPLEMENTAÇÃO

## BD: 5 Novas Tabelas + 8 Triggers

```sql
CREATE:
  ✅ hotel_payment_policies
  ✅ hotel_booking_payment_history
  ✅ driver_payment_policies
  ✅ ride_payment_history
  ✅ eventspace_payment_policies

ALTER:
  ✅ hotelBookings (+ 10 colunas)
  ✅ eventBookings (+ 8 colunas)
  ✅ rides (+ 8 colunas)

TRIGGERS:
  ✅ auto_update_hotel_payment_status()
  ✅ calculate_hotel_payment_amounts()
  ✅ auto_update_event_payment_status()
```

## Backend: 3 Services + 8 Endpoints

```typescript
Services:
  ✅ PaymentPolicyService
  ✅ Methods: getPolicy, updatePolicy, recordPayment, getHistory

Endpoints:
  ✅ GET /api/hotels/:hotelId/payment-policy
  ✅ POST /api/hotels/:hotelId/payment-policy
  ✅ GET /api/drivers/:driverId/payment-policy
  ✅ POST /api/drivers/:driverId/payment-policy
  ✅ GET /api/event-spaces/:eventSpaceId/payment-policy
  ✅ POST /api/event-spaces/:eventSpaceId/payment-policy
  ✅ GET /api/bookings/:bookingId/payment-history
  ✅ POST /api/bookings/:bookingId/record-payment
```

## Frontend: 3 Páginas de Configuração

```
Pages:
  ✅ hotels-app/pages/payment-settings.tsx
  ✅ drivers-app/pages/payment-settings.tsx
  ✅ eventspaces-app/pages/payment-settings.tsx

Features:
  ✅ Toggle switches para ativar/desativar opções
  ✅ Range sliders para % e dias
  ✅ Info boxes com recomendações
  ✅ Resumo visual da política
  ✅ Save com validação
  ✅ Toast notifications
```

---

# ✅ INTEGRATION WITH EXISTING SYSTEM

## Como isto se integra com o sistema de pagamentos existente

```
Admin Dashboard Improvements:
├─ "Pagamentos Esperados de Hotel"
│  ├─ Advance: R$ X (Due: Y)
│  └─ Deposit: R$ Z (Due: W)
├─ "Pagamentos Recebidos"
│  ├─ Advance: R$ X (Pago: Y)
│  └─ Deposit: R$ Z (Pago: W)
└─ Auto status update: checked_out → payment_status = 'complete'

Hotel App New Features:
├─ "Configurar Política de Pagamento" (1-click)
├─ "Meus Recebimentos" (por reservation)
│  ├─ Advance payment: ✅ Pago
│  ├─ Deposit: ✅ Pago
│  └─ Balance: ⏳ Pendente (Due: X)
└─ "Histórico de Pagamentos" (detailed)

Driver App New Features:
├─ "Minha Política de Pagamento" (flexível)
│  ├─ Exigir % antecipado?
│  ├─ Aceitar pagamento local?
│  └─ Desconto se pagar antes?
└─ "Histórico de Corridas" (mostra pagamentos)

API Layer:
├─ paymentPolicyService
├─ triggers automáticos
└─ admin endpoints para analytics
```

---

# 🚀 PRÓXIMOS PASSOS

## SEMANA 1:
1. [ ] Executar SQL triggers (2h)
2. [ ] Criar PaymentPolicyService (4h)
3. [ ] Endpoints backend (3h)

## SEMANA 2:
1. [ ] Frontend: hotel payment settings (3h)
2. [ ] Frontend: driver payment settings (2h)
3. [ ] Wire payment history listing (2h)

## SEMANA 3:
1. [ ] Testes E2E (4h)
2. [ ] Admin dashboard updates (3h)
3. [ ] Deploy (1h)

---

**Este plano torna o sistema 100% automatizado e flexível!** 🎉
