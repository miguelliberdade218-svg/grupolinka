// src/modules/payments/paymentPolicyRoutes.ts - Rotas de Políticas de Pagamento (27/02/2026)
// Gerencia: Políticas de pagamento para motoristas, hotéis e event spaces
import express from 'express';
import { db } from '../../../db';
import { hotel_payment_policies, driver_payment_policies, eventspace_payment_policies, users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// ==================== POLÍTICAS DE PAGAMENTO DE HOTÉIS ====================

/**
 * GET /api/payment-policies/hotels/:hotelId
 * Obter política de pagamento de um hotel
 */
router.get('/hotels/:hotelId', async (req, res) => {
  try {
    const { hotelId } = req.params;

    const policy = await db.select()
      .from(hotel_payment_policies)
      .where(eq(hotel_payment_policies.hotel_id, hotelId as any))
      .limit(1);

    if (!policy.length) {
      return res.json({
        success: true,
        message: 'Política padrão retornada',
        data: {
          advance_payment_enabled: false,
          advance_payment_percentage: 0.00,
          advance_payment_required: false,
          deposit_enabled: true,
          deposit_percentage: 30.00,
          deposit_required: true,
          final_payment_due_days: 7,
          pay_at_location_enabled: true,
          payment_instructions: ''
        }
      });
    }

    res.json({
      success: true,
      data: policy[0]
    });
  } catch (error: any) {
    console.error('Erro ao obter política de hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter política',
      details: error.message
    });
  }
});

/**
 * POST /api/payment-policies/hotels/:hotelId/update
 * Atualizar política de pagamento de um hotel
 * Body: { advance_payment_enabled, deposit_enabled, pay_at_location_enabled, ... }
 */
router.post('/hotels/:hotelId/update', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const policyData = req.body;

    // Verificar se já existe política
    const existing = await db.select()
      .from(hotel_payment_policies)
      .where(eq(hotel_payment_policies.hotel_id, hotelId as any))
      .limit(1);

    let result;
    if (existing.length) {
      // Update
      result = await db.update(hotel_payment_policies)
        .set({
          ...policyData,
          updated_at: new Date()
        })
        .where(eq(hotel_payment_policies.hotel_id, hotelId as any));
    } else {
      // Insert
      result = await db.insert(hotel_payment_policies)
        .values({
          hotel_id: hotelId as any,
          ...policyData,
          created_at: new Date(),
          updated_at: new Date()
        });
    }

    res.json({
      success: true,
      message: 'Política de pagamento atualizada com sucesso',
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao atualizar política de hotel:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar política',
      details: error.message
    });
  }
});

// ==================== POLÍTICAS DE PAGAMENTO DE MOTORISTAS ====================

/**
 * GET /api/payment-policies/drivers/:driverId
 * Obter política de pagamento de um motorista
 */
router.get('/drivers/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;

    const policy = await db.select()
      .from(driver_payment_policies)
      .where(eq(driver_payment_policies.driver_id, driverId))
      .limit(1);

    if (!policy.length) {
      return res.json({
        success: true,
        message: 'Política padrão retornada',
        data: {
          advance_payment_enabled: false,
          advance_payment_percentage: 0.00,
          pay_at_location_enabled: true,
          payment_instructions: ''
        }
      });
    }

    res.json({
      success: true,
      data: policy[0]
    });
  } catch (error: any) {
    console.error('Erro ao obter política de motorista:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter política',
      details: error.message
    });
  }
});

/**
 * POST /api/payment-policies/drivers/:driverId/update
 * Atualizar política de pagamento de um motorista
 * Body: { advance_payment_enabled, advance_payment_percentage, pay_at_location_enabled, ... }
 */
router.post('/drivers/:driverId/update', async (req, res) => {
  try {
    const { driverId } = req.params;
    const policyData = req.body;

    // Verificar se já existe política
    const existing = await db.select()
      .from(driver_payment_policies)
      .where(eq(driver_payment_policies.driver_id, driverId))
      .limit(1);

    let result;
    if (existing.length) {
      // Update
      result = await db.update(driver_payment_policies)
        .set({
          ...policyData,
          updated_at: new Date()
        })
        .where(eq(driver_payment_policies.driver_id, driverId));
    } else {
      // Insert
      result = await db.insert(driver_payment_policies)
        .values({
          driver_id: driverId,
          ...policyData,
          created_at: new Date(),
          updated_at: new Date()
        });
    }

    res.json({
      success: true,
      message: 'Política de pagamento atualizada com sucesso',
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao atualizar política de motorista:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar política',
      details: error.message
    });
  }
});

// ==================== POLÍTICAS DE PAGAMENTO DE EVENT SPACES ====================

/**
 * GET /api/payment-policies/event-spaces/:eventSpaceId
 * Obter política de pagamento de um event space
 */
router.get('/event-spaces/:eventSpaceId', async (req, res) => {
  try {
    const { eventSpaceId } = req.params;

    const policy = await db.select()
      .from(eventspace_payment_policies)
      .where(eq(eventspace_payment_policies.event_space_id, eventSpaceId as any))
      .limit(1);

    if (!policy.length) {
      return res.json({
        success: true,
        message: 'Política padrão retornada',
        data: {
          advance_payment_enabled: false,
          advance_payment_percentage: 0.00,
          advance_payment_required: false,
          deposit_enabled: true,
          deposit_percentage: 50.00,
          deposit_required: true,
          refund_policy: 'event_specific',
          refund_percentage: 50,
          refund_deadline_days: 14
        }
      });
    }

    res.json({
      success: true,
      data: policy[0]
    });
  } catch (error: any) {
    console.error('Erro ao obter política de event space:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter política',
      details: error.message
    });
  }
});

/**
 * POST /api/payment-policies/event-spaces/:eventSpaceId/update
 * Atualizar política de pagamento de um event space
 * Body: { advance_payment_enabled, deposit_enabled, refund_policy, ... }
 */
router.post('/event-spaces/:eventSpaceId/update', async (req, res) => {
  try {
    const { eventSpaceId } = req.params;
    const policyData = req.body;

    // Verificar se já existe política
    const existing = await db.select()
      .from(eventspace_payment_policies)
      .where(eq(eventspace_payment_policies.event_space_id, eventSpaceId as any))
      .limit(1);

    let result;
    if (existing.length) {
      // Update
      result = await db.update(eventspace_payment_policies)
        .set({
          ...policyData,
          updated_at: new Date()
        })
        .where(eq(eventspace_payment_policies.event_space_id, eventSpaceId as any));
    } else {
      // Insert
      result = await db.insert(eventspace_payment_policies)
        .values({
          event_space_id: eventSpaceId as any,
          ...policyData,
          created_at: new Date(),
          updated_at: new Date()
        });
    }

    res.json({
      success: true,
      message: 'Política de pagamento atualizada com sucesso',
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao atualizar política de event space:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar política',
      details: error.message
    });
  }
});

// ==================== HEALTH CHECK ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'payment-policies',
    status: 'operational',
    endpoints: {
      getHotelPolicy: 'GET /hotels/:hotelId',
      updateHotelPolicy: 'POST /hotels/:hotelId/update',
      getDriverPolicy: 'GET /drivers/:driverId',
      updateDriverPolicy: 'POST /drivers/:driverId/update',
      getEventSpacePolicy: 'GET /event-spaces/:eventSpaceId',
      updateEventSpacePolicy: 'POST /event-spaces/:eventSpaceId/update'
    }
  });
});

export default router;
