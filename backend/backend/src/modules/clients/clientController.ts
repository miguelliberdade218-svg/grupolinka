import { Router } from "express";
import { verifyFirebaseToken } from "../../shared/firebaseAuth.js";
import type { AuthenticatedRequest } from "../../../shared/types.js";

const router = Router();

// ============================================
// ✅ REDIRECIONAMENTO PARA CONTROLLERS EXISTENTES
// ============================================

// Middleware para log de redirecionamento
router.use((req, res, next) => {
  console.log(`🔀 [CLIENT REDIRECT] ${req.method} ${req.originalUrl} → Redirecionando para controlador principal`);
  next();
});

// 🚀 BUSCA INTELIGENTE DE VIAGENS
// Redireciona: /api/clients/rides/search → /api/rides/search
router.get('/rides/search', async (req, res) => {
  try {
    console.log(`🔀 Redirecionando busca de rides: ${req.originalUrl} → /api/rides/search`);
    
    // Usar fetch para redirecionar para o rideController
    const fetch = (await import('node-fetch')).default;
    
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/rides/search${queryParams ? '?' + queryParams : ''}`;
    
    console.log(`🔀 Fazendo proxy para: ${targetUrl}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar busca de rides:", error);
    res.status(500).json({ 
      success: false,
      message: "Serviço de busca temporariamente indisponível" 
    });
  }
});

// 🆕 BUSCA DE RIDES PRÓXIMOS
// Redireciona: /api/clients/rides/nearby → /api/rides/nearby
router.get('/rides/nearby', async (req, res) => {
  try {
    console.log(`🔀 Redirecionando busca de rides próximos: ${req.originalUrl} → /api/rides/nearby`);
    
    const fetch = (await import('node-fetch')).default;
    const queryParams = new URLSearchParams(req.query as any).toString();
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/rides/nearby${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar busca de rides próximos:", error);
    res.status(500).json({ 
      success: false,
      message: "Serviço de busca temporariamente indisponível" 
    });
  }
});

// 🆕 DETALHES DE RIDE ESPECÍFICO
// Redireciona: /api/clients/rides/:rideId → /api/rides/:rideId
router.get('/rides/:rideId', async (req, res) => {
  try {
    const { rideId } = req.params;
    console.log(`🔀 Redirecionando detalhes do ride: ${req.originalUrl} → /api/rides/${rideId}`);
    
    const fetch = (await import('node-fetch')).default;
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/rides/${rideId}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar detalhes do ride:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao carregar detalhes da viagem" 
    });
  }
});

// SOLICITAR VIAGEM
// Redireciona: /api/clients/rides/request → /api/bookings (POST)
router.post('/rides/request', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    console.log(`🔀 Redirecionando solicitação de viagem: ${req.originalUrl} → /api/bookings`);
    
    const fetch = (await import('node-fetch')).default;
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/bookings`;
    
    // Transformar dados para formato do bookings controller
    const bookingData = {
      rideId: req.body.rideId,
      seats: req.body.passengers || 1,
      pickupLocation: req.body.pickupLocation,
      notes: req.body.notes,
      passengerId: userId
    };
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar solicitação de viagem:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao solicitar viagem" 
    });
  }
});

// HISTÓRICO DE VIAGENS DO CLIENTE
// Redireciona: /api/clients/bookings → /api/bookings (GET)
router.get('/bookings', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    console.log(`🔀 Redirecionando histórico de reservas: ${req.originalUrl} → /api/bookings`);
    
    const fetch = (await import('node-fetch')).default;
    const queryParams = new URLSearchParams({
      ...req.query as any,
      userId: userId
    }).toString();
    
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/bookings${queryParams ? '?' + queryParams : ''}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar histórico de reservas:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao carregar reservas" 
    });
  }
});

// DETALHES DE RESERVA ESPECÍFICA
// Redireciona: /api/clients/bookings/:bookingId → /api/bookings/:bookingId
router.get('/bookings/:bookingId', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { bookingId } = req.params;
    const userId = authReq.user?.uid;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    console.log(`🔀 Redirecionando detalhes da reserva: ${req.originalUrl} → /api/bookings/${bookingId}`);
    
    const fetch = (await import('node-fetch')).default;
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/bookings/${bookingId}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar detalhes da reserva:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao carregar detalhes da reserva" 
    });
  }
});

// CANCELAR RESERVA
// Redireciona: /api/clients/bookings/:bookingId/cancel → /api/bookings/:bookingId/cancel
router.post('/bookings/:bookingId/cancel', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { bookingId } = req.params;
    const userId = authReq.user?.uid;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    console.log(`🔀 Redirecionando cancelamento: ${req.originalUrl} → /api/bookings/${bookingId}/cancel`);
    
    const fetch = (await import('node-fetch')).default;
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/bookings/${bookingId}/cancel`;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        ...req.body,
        userId: userId
      })
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar cancelamento de reserva:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao cancelar reserva" 
    });
  }
});

// 🆕 ENDPOINT PARA AVALIAR VIAGEM
// Redireciona: /api/clients/bookings/:bookingId/rate → /api/bookings/:bookingId/rate
router.post('/bookings/:bookingId/rate', verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const { bookingId } = req.params;
    const userId = authReq.user?.uid;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "User ID not found" 
      });
    }

    console.log(`🔀 Redirecionando avaliação: ${req.originalUrl} → /api/bookings/${bookingId}/rate`);
    
    const fetch = (await import('node-fetch')).default;
    const targetUrl = `http://localhost:${process.env.PORT || 3000}/api/bookings/${bookingId}/rate`;
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify({
        ...req.body,
        userId: userId
      })
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error("❌ Erro ao redirecionar avaliação:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao avaliar reserva" 
    });
  }
});

// ============================================
// ✅ ROTA DE STATUS DO REDIRECIONAMENTO
// ============================================

router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: "Client Controller ativo - Redirecionando para controladores principais",
    redirects: {
      rides: {
        search: "/api/rides/search",
        nearby: "/api/rides/nearby",
        details: "/api/rides/:rideId"
      },
      bookings: {
        list: "/api/bookings",
        details: "/api/bookings/:bookingId",
        request: "/api/bookings (POST)",
        cancel: "/api/bookings/:bookingId/cancel",
        rate: "/api/bookings/:bookingId/rate"
      }
    },
    note: "Este controlador mantém compatibilidade com frontend enquanto redireciona para a nova arquitetura",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ✅ ROTA DE FALLBACK PARA COMPATIBILIDADE
// ============================================

router.get('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota de cliente não encontrada - Use os endpoints redirecionados",
    availableRedirects: [
      "GET /api/clients/rides/search → /api/rides/search",
      "GET /api/clients/rides/nearby → /api/rides/nearby", 
      "GET /api/clients/rides/:rideId → /api/rides/:rideId",
      "POST /api/clients/rides/request → /api/bookings",
      "GET /api/clients/bookings → /api/bookings",
      "GET /api/clients/bookings/:bookingId → /api/bookings/:bookingId",
      "POST /api/clients/bookings/:bookingId/cancel → /api/bookings/:bookingId/cancel",
      "POST /api/clients/bookings/:bookingId/rate → /api/bookings/:bookingId/rate"
    ]
  });
});

export default router;