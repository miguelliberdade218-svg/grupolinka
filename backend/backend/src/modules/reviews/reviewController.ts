// src/modules/reviews/reviewController.ts
// Rotas REST para Reviews

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createHotelReview,
  voteReviewHelpful,
  getReviewsByHotel,
  verifyReview,
  getReviewStats,
} from './reviewService';

const router = Router();

// POST /api/reviews - Criar review
router.post('/', async (req: Request, res: Response) => {
  try {
    const review = await createHotelReview(req.body, req.user?.email);

    res.status(201).json({
      success: true,
      message: 'Avaliação submetida com sucesso! Obrigado pelo feedback.',
      data: review,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(400).json({ success: false, message: (error as Error).message });
  }
});

// POST /api/reviews/:id/helpful - Votar útil
router.post('/:id/helpful', async (req: Request, res: Response) => {
  try {
    const votes = await voteReviewHelpful(req.params.id);
    res.json({ success: true, message: 'Obrigado pelo voto!', data: { helpful_votes: votes } });
  } catch (error) {
    res.status(404).json({ success: false, message: 'Avaliação não encontrada' });
  }
});

// GET /api/reviews/hotels/:hotelId - Listar reviews de hotel
router.get('/hotels/:hotelId', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sort = (req.query.sort as "recent" | "helpful" | "highest" | "lowest") || "recent";

    const result = await getReviewsByHotel(req.params.hotelId, page, limit, sort);

    res.json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar avaliações' });
  }
});

// GET /api/reviews/hotels/:hotelId/stats - Estatísticas de reviews
router.get('/hotels/:hotelId/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getReviewStats(req.params.hotelId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas' });
  }
});

// PATCH /api/reviews/:id/verify - (Admin/Host) Verificar review
router.patch('/:id/verify', async (req: Request, res: Response) => {
  // Adiciona middleware de admin/host se necessário
  try {
    const { verified = true } = req.body;
    const review = await verifyReview(req.params.id, verified);
    if (!review) return res.status(404).json({ success: false, message: 'Avaliação não encontrada' });

    res.json({ success: true, message: 'Avaliação verificada', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao verificar avaliação' });
  }
});

export default router;