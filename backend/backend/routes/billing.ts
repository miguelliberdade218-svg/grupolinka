import { Router } from 'express';
import { billingService } from '../services/billingService';
import { calculateDistance, getLocationCoordinates, calculateSuggestedPrice } from '../services/distanceService';
import { type AuthenticatedRequest } from '../src/shared/firebaseAuth';

const router = Router();

/**
 * GET /api/billing/fee-percentage
 * Obtém a taxa actual da plataforma
 */
router.get('/fee-percentage', async (req, res) => {
  try {
    const feePercentage = await billingService.getPlatformFeePercentage();
    res.json({ feePercentage });
  } catch (error) {
    console.error('Erro ao obter taxa da plataforma:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/billing/fee-percentage
 * Actualiza a taxa da plataforma (apenas admin)
 */
router.put('/fee-percentage', async (req, res) => {
  try {
    const { percentage } = req.body;
    const authReq = req as AuthenticatedRequest;
    const adminUserId = authReq.user?.uid; // Firebase usa 'uid' ao invés de 'id'

    if (!adminUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 50) {
      return res.status(400).json({ error: 'Percentual inválido (deve ser entre 0 e 50)' });
    }

    await billingService.updatePlatformFeePercentage(percentage, adminUserId);
    res.json({ success: true, message: 'Taxa actualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao actualizar taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/calculate-ride-price
 * Calcula preço de boleia baseado na distância
 */
router.post('/calculate-ride-price', async (req, res) => {
  try {
    const { from, to, fromLat, fromLng, toLat, toLng } = req.body;

    let coordinates = { fromLat, fromLng, toLat, toLng };

    // Se não foram fornecidas coordenadas, tentar obter das localizações
    if (!fromLat || !fromLng) {
      const fromCoords = getLocationCoordinates(from);
      if (fromCoords) {
        coordinates.fromLat = fromCoords.lat;
        coordinates.fromLng = fromCoords.lng;
      }
    }

    if (!toLat || !toLng) {
      const toCoords = getLocationCoordinates(to);
      if (toCoords) {
        coordinates.toLat = toCoords.lat;
        coordinates.toLng = toCoords.lng;
      }
    }

    if (!coordinates.fromLat || !coordinates.fromLng || !coordinates.toLat || !coordinates.toLng) {
      return res.status(400).json({ 
        error: 'Coordenadas não encontradas para as localizações fornecidas' 
      });
    }

    const result = await billingService.calculateRidePrice(
      coordinates.fromLat,
      coordinates.fromLng,
      coordinates.toLat,
      coordinates.toLng
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao calcular preço da boleia:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/calculate
 * Calcula facturação para um valor
 */
router.post('/calculate', async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const billing = await billingService.calculateBilling(amount);
    res.json(billing);
  } catch (error) {
    console.error('Erro ao calcular facturação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/billing/pending-fees/:providerId
 * Obtém taxas pendentes para um provedor
 */
router.get('/pending-fees/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const pendingFees = await billingService.getPendingFees(providerId);
    res.json(pendingFees);
  } catch (error) {
    console.error('Erro ao obter taxas pendentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/mark-fee-paid
 * Marca uma taxa como paga
 */
router.post('/mark-fee-paid', async (req, res) => {
  try {
    const { feeId, paymentMethod } = req.body;

    if (!feeId || !paymentMethod) {
      return res.status(400).json({ error: 'ID da taxa e método de pagamento são obrigatórios' });
    }

    await billingService.markFeeAsPaid(feeId, paymentMethod);
    res.json({ success: true, message: 'Taxa marcada como paga' });
  } catch (error) {
    console.error('Erro ao marcar taxa como paga:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/billing/financial-report
 * Obtém relatório financeiro
 */
router.get('/financial-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const report = await billingService.getFinancialReport(start, end);
    res.json(report);
  } catch (error) {
    console.error('Erro ao gerar relatório financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/create-ride-fee
 * Cria fee para motorista após viagem concluída
 */
router.post('/create-ride-fee', async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng, driverId, clientId, pricePerKm = 15 } = req.body;

    if (!fromLat || !fromLng || !toLat || !toLng || !driverId || !clientId) {
      return res.status(400).json({ 
        error: 'Coordenadas, driverId e clientId são obrigatórios' 
      });
    }

    // Calcular preço da viagem baseado na distância
    const ridePrice = await billingService.calculateRidePrice(fromLat, fromLng, toLat, toLng);
    
    // Criar fee pendente para o motorista
    await billingService.createFeeForProvider({
      providerId: driverId,
      type: 'ride',
      totalAmount: ridePrice.suggestedPrice,
      clientId
    });

    console.log(`✅ Fee criada para motorista ${driverId}: ${ridePrice.suggestedPrice} MZN`);

    res.json({
      success: true,
      ridePrice: ridePrice.suggestedPrice,
      distance: ridePrice.distance,
      pricePerKm: ridePrice.pricePerKm,
      message: 'Fee de viagem criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar fee de viagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/create-hotel-fee
 * Cria fee para hotel após reserva confirmada
 */
router.post('/create-hotel-fee', async (req, res) => {
  try {
    const { nights, pricePerNight, hotelId, clientId } = req.body;

    if (!nights || !pricePerNight || !hotelId || !clientId) {
      return res.status(400).json({ 
        error: 'Noites, preço por noite, hotelId e clientId são obrigatórios' 
      });
    }

    if (nights < 1 || pricePerNight <= 0) {
      return res.status(400).json({ 
        error: 'Número de noites deve ser >= 1 e preço deve ser > 0' 
      });
    }

    // Calcular preço total da estadia
    const totalPrice = nights * pricePerNight;
    
    // Criar fee pendente para o hotel
    await billingService.createFeeForProvider({
      providerId: hotelId,
      type: 'hotel',
      totalAmount: totalPrice,
      clientId
    });

    console.log(`✅ Fee criada para hotel ${hotelId}: ${totalPrice} MZN (${nights} noites)`);

    res.json({
      success: true,
      bookingPrice: totalPrice,
      nights,
      pricePerNight,
      message: 'Fee de hotel criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar fee de hotel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/create-billing
 * Cria facturação para uma reserva confirmada
 */
router.post('/create-billing', async (req, res) => {
  try {
    const { bookingId, userId, providerUserId, serviceType, amount, distanceKm, pricePerKm } = req.body;

    if (!bookingId || !userId || !providerUserId || !serviceType || !amount) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });
    }

    await billingService.createBilling({
      bookingId,
      userId,
      providerUserId,
      serviceType,
      amount,
      distanceKm,
      pricePerKm
    });

    res.json({ success: true, message: 'Facturação criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar facturação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/automatic-pricing
 * Configura preços automáticos
 */
router.post('/automatic-pricing', async (req, res) => {
  try {
    const { enable, basePrice, pricePerKm } = req.body;

    await billingService.setAutomaticPricing(enable, basePrice, pricePerKm);
    res.json({ success: true, message: 'Configuração de preços actualizada' });
  } catch (error) {
    console.error('Erro ao configurar preços automáticos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/billing/distance
 * Calcula distância entre duas coordenadas
 */
router.post('/distance', (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.body;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res.status(400).json({ error: 'Coordenadas obrigatórias' });
    }

    const distance = calculateDistance(fromLat, fromLng, toLat, toLng);
    const suggestedPrice = calculateSuggestedPrice(distance);

    res.json({
      distance,
      suggestedPrice,
      estimatedTime: Math.round(distance / 50 * 60) // Assumindo 50 km/h
    });
  } catch (error) {
    console.error('Erro ao calcular distância:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;