// API Mock para desenvolvimento
export const mockApiHandler = (req, res, next) => {
  if (req.url.startsWith('/api/')) {
    const path = req.url.replace('/api', '');
    
    // Health check
    if (path === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'OK',
        message: 'Link-A Backend API funcionando (mock)',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: 'development'
      }));
      return;
    }
    
    // Buscar viagens
    if (path.startsWith('/rides/search')) {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const from = urlParams.get('from') || 'Maputo';
      const to = urlParams.get('to') || 'Matola';
      const passengers = urlParams.get('passengers') || '1';
      
      console.log(`Mock API: Buscar viagens de ${from} para ${to}, ${passengers} passageiros`);
      
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
        },
        {
          id: '2', 
          type: 'Comfort',
          fromAddress: from,
          toAddress: to,
          price: '75.00',
          estimatedDuration: 25,
          availableSeats: 2,
          driverName: 'Maria Santos',
          vehicleInfo: 'Honda Civic Prata',
          departureDate: new Date().toISOString()
        }
      ];
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        rides: mockRides,
        pagination: {
          page: 1,
          limit: 20,
          total: mockRides.length
        }
      }));
      return;
    }
    
    // API não encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'API endpoint não encontrado',
      path: req.url
    }));
    return;
  }
  
  next();
};