// src/modules/reviews/rideReviewController.ts - Controller de Ride Reviews (27/02/2026)
// Gerencia: Ride reviews de passageiros para motoristas, Reviews de motoristas para passageiros
import express from 'express';
import { rideReviewService } from './rideReviewService';

const router = express.Router();

// ==================== RIDES REVIEWS ====================

/**
 * POST /api/ride-reviews/:rideId/passenger-review
 * Criar review de passageiro para motorista
 * Body: { from_user_id, to_user_id (driver), driver_rating, cleanliness_rating, ... }
 */
router.post('/:rideId/passenger-review', async (req, res) => {
  try {
    const { rideId } = req.params;
    const reviewData = {
      ride_id: rideId,
      ...req.body
    };

    const result = await rideReviewService.createPassengerReview(reviewData);
    
    res.json({
      success: true,
      message: 'Review de passageiro criado com sucesso',
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao criar review de passageiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar review',
      details: error.message
    });
  }
});

/**
 * POST /api/ride-reviews/:rideId/driver-review
 * Criar review de motorista para passageiro
 * Body: { from_driver_id, to_passenger_id, passenger_behavior_rating, ... }
 */
router.post('/:rideId/driver-review', async (req, res) => {
  try {
    const { rideId } = req.params;
    const reviewData = {
      ride_id: rideId,
      ...req.body
    };

    const result = await rideReviewService.createDriverReview(reviewData);
    
    res.json({
      success: true,
      message: 'Review de motorista criado com sucesso',
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao criar review de motorista:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar review',
      details: error.message
    });
  }
});

/**
 * GET /api/ride-reviews/drivers/:driverId/reviews
 * Obter todas as reviews de um motorista
 */
router.get('/drivers/:driverId/reviews', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const reviews = await rideReviewService.getDriverReviews(driverId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Erro ao obter reviews do motorista:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter reviews',
      details: error.message
    });
  }
});

/**
 * GET /api/ride-reviews/drivers/:driverId/stats
 * Obter estatísticas (rating médio, distribuição) de um motorista
 */
router.get('/drivers/:driverId/stats', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const stats = await rideReviewService.getDriverStats(driverId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas do motorista:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      details: error.message
    });
  }
});

/**
 * GET /api/ride-reviews/rides/:rideId/reviews
 * Obter todas as reviews de uma viagem específica
 */
router.get('/rides/:rideId/reviews', async (req, res) => {
  try {
    const { rideId } = req.params;
    
    const reviews = await rideReviewService.getRideReviews(rideId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Erro ao obter reviews da viagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter reviews',
      details: error.message
    });
  }
});

/**
 * GET /api/ride-reviews/passengers/:passengerId/reviews
 * Obter todas as reviews que um passageiro recebeu (de motoristas)
 */
router.get('/passengers/:passengerId/reviews', async (req, res) => {
  try {
    const { passengerId } = req.params;
    
    const reviews = await rideReviewService.getPassengerReviews(passengerId);
    
    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error: any) {
    console.error('Erro ao obter reviews do passageiro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter reviews',
      details: error.message
    });
  }
});

/**
 * POST /api/ride-reviews/drivers/:driverId/check-reputation
 * Verificar reputação do motorista e suspender se necessário (< 3.5 com 10+ reviews)
 */
router.post('/drivers/:driverId/check-reputation', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    await rideReviewService.checkDriverReputation(driverId);
    
    res.json({
      success: true,
      message: 'Reputação do motorista verificada'
    });
  } catch (error: any) {
    console.error('Erro ao verificar reputação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar reputação',
      details: error.message
    });
  }
});

// ==================== HEALTH CHECK ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'ride-reviews',
    status: 'operational',
    endpoints: {
      createPassengerReview: 'POST /:rideId/passenger-review',
      createDriverReview: 'POST /:rideId/driver-review',
      getDriverReviews: 'GET /drivers/:driverId/reviews',
      getDriverStats: 'GET /drivers/:driverId/stats',
      getRideReviews: 'GET /rides/:rideId/reviews',
      getPassengerReviews: 'GET /passengers/:passengerId/reviews',
      checkReputation: 'POST /drivers/:driverId/check-reputation'
    }
  });
});

export default router;
