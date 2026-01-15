// Mock API middleware para interceptar requests
import type { RequestHandler } from 'express';

export const apiMockMiddleware: RequestHandler = (req, res, next) => {
  const url = req.url;
  const method = req.method;
  
  console.log(`🔄 API Request: ${method} ${url}`);
  
  // Interceptar todas as requisições para /api/
  if (url.startsWith('/api/')) {
    console.log('🎯 Handling API request with mock');
    
    // Health check
    if (url === '/api/health') {
      return res.json({
        status: 'OK',
        message: 'Link-A API funcionando (mock)',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: 'development'
      });
    }
    
    // Buscar viagens (GET)
    if (url.startsWith('/api/rides/search')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      const from = urlParams.get('from') || 'Maputo';
      const to = urlParams.get('to') || 'Matola';
      
      console.log(`Mock API: Buscar viagens de ${from} para ${to}`);
      
      const mockRides = [
        {
          id: '1',
          type: 'Standard',
          fromAddress: from,
          toAddress: to,
          price: '50.00',
          estimatedDuration: 30,
          availableSeats: 3,
          driverName: 'João Silva',
          vehicleInfo: 'Toyota Corolla Branco',
          departureDate: new Date().toISOString()
        }
      ];
      
      return res.json({
        rides: mockRides,
        pagination: { page: 1, limit: 20, total: mockRides.length }
      });
    }
    
    // Criar nova rota (POST)
    if (url === '/api/rides' && method === 'POST') {
      console.log('✅ Mock API: Criando nova rota');
      console.log('📝 Dados da rota recebidos:', req.body);
      
      // Simular criação bem-sucedida
      const newRide = {
        id: Date.now().toString(),
        status: 'published',
        createdAt: new Date().toISOString(),
        message: 'Rota publicada com sucesso!',
        ...req.body
      };
      
      return res.status(201).json(newRide);
    }
    
    // Endpoint não encontrado
    return res.status(404).json({ 
      error: 'API endpoint não encontrado',
      path: url,
      method: method
    });
  }
  
  next();
};