import express from 'express';

const router = express.Router();

// Base de dados de localizações de Moçambique
const mozambiqueLocations = [
  // Capitais e Cidades Principais
  { id: 'maputo', name: 'Maputo', province: 'Maputo', lat: -25.9692, lng: 32.5732, type: 'capital' },
  { id: 'matola', name: 'Matola', province: 'Maputo', lat: -25.9623, lng: 32.4589, type: 'city' },
  { id: 'beira', name: 'Beira', province: 'Sofala', lat: -19.8436, lng: 34.8389, type: 'city' },
  { id: 'nampula', name: 'Nampula', province: 'Nampula', lat: -15.1165, lng: 39.2666, type: 'city' },
  { id: 'chimoio', name: 'Chimoio', province: 'Manica', lat: -19.1164, lng: 33.4833, type: 'city' },
  { id: 'quelimane', name: 'Quelimane', province: 'Zambézia', lat: -17.8786, lng: 36.8883, type: 'city' },
  { id: 'tete', name: 'Tete', province: 'Tete', lat: -16.1564, lng: 33.5867, type: 'city' },
  { id: 'xai-xai', name: 'Xai-Xai', province: 'Gaza', lat: -25.0519, lng: 33.6442, type: 'city' },
  { id: 'inhambane', name: 'Inhambane', province: 'Inhambane', lat: -23.8647, lng: 35.3833, type: 'city' },
  { id: 'pemba', name: 'Pemba', province: 'Cabo Delgado', lat: -12.9740, lng: 40.5178, type: 'city' },
  { id: 'lichinga', name: 'Lichinga', province: 'Niassa', lat: -13.3133, lng: 35.2406, type: 'city' },
  
  // Outras Cidades Importantes
  { id: 'nacala', name: 'Nacala', province: 'Nampula', lat: -14.5428, lng: 40.6728, type: 'city' },
  { id: 'angoche', name: 'Angoche', province: 'Nampula', lat: -16.2333, lng: 39.9000, type: 'city' },
  { id: 'cuamba', name: 'Cuamba', province: 'Niassa', lat: -14.8000, lng: 36.5333, type: 'city' },
  { id: 'montepuez', name: 'Montepuez', province: 'Cabo Delgado', lat: -13.1258, lng: 39.0042, type: 'city' },
  { id: 'dondo', name: 'Dondo', province: 'Sofala', lat: -19.6108, lng: 34.7431, type: 'city' },
  { id: 'chokwe', name: 'Chokwé', province: 'Gaza', lat: -24.5333, lng: 33.0167, type: 'city' },
  { id: 'maxixe', name: 'Maxixe', province: 'Inhambane', lat: -23.8597, lng: 35.3467, type: 'city' },
  { id: 'vilanculos', name: 'Vilanculos', province: 'Inhambane', lat: -22.0133, lng: 35.3133, type: 'city' },
  { id: 'mocuba', name: 'Mocuba', province: 'Zambézia', lat: -16.8372, lng: 36.9856, type: 'city' },
  { id: 'gurué', name: 'Gurué', province: 'Zambézia', lat: -15.4667, lng: 36.9833, type: 'city' },
  { id: 'moatize', name: 'Moatize', province: 'Tete', lat: -16.1039, lng: 33.7233, type: 'city' },
  { id: 'catandica', name: 'Catandica', province: 'Manica', lat: -18.9667, lng: 32.8833, type: 'town' },
  { id: 'ressano-garcia', name: 'Ressano Garcia', province: 'Maputo', lat: -25.4333, lng: 31.9833, type: 'town' },
  { id: 'boane', name: 'Boane', province: 'Maputo', lat: -26.0464, lng: 32.3281, type: 'town' },
  { id: 'namaacha', name: 'Namaacha', province: 'Maputo', lat: -25.9919, lng: 32.0208, type: 'town' },
];

// Calcular distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Buscar localização por nome
function findLocation(query: string) {
  const normalizedQuery = query.toLowerCase().trim();
  return mozambiqueLocations.find(loc => 
    loc.name.toLowerCase() === normalizedQuery ||
    loc.name.toLowerCase().includes(normalizedQuery)
  ) || null;
}

// Obter sugestões para autocompletar
function getLocationSuggestions(query: string, limit: number = 5) {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  const matches = mozambiqueLocations
    .filter(loc => 
      loc.name.toLowerCase().includes(normalizedQuery) ||
      loc.province.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      const aExact = a.name.toLowerCase().startsWith(normalizedQuery);
      const bExact = b.name.toLowerCase().startsWith(normalizedQuery);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // ✅ CORREÇÃO: Definir typeOrder com assinatura de índice
      const typeOrder: Record<string, number> = {
        capital: 0,
        city: 1,
        town: 2
      };
      
      // ✅ CORREÇÃO: Usar fallback para tipos desconhecidos
      const aOrder = typeOrder[a.type] ?? 3;
      const bOrder = typeOrder[b.type] ?? 3;
      
      return aOrder - bOrder;
    });
  
  return matches.slice(0, limit);
}

// API Endpoints

// Autocomplete de localizações
router.get('/autocomplete', (req, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Parâmetro de busca obrigatório' });
    }
    
    const suggestions = getLocationSuggestions(q, limit ? parseInt(limit as string) : 5);
    
    res.json({
      suggestions: suggestions.map(loc => ({
        id: loc.id,
        name: loc.name,
        province: loc.province,
        fullName: `${loc.name}, ${loc.province}`,
        type: loc.type,
        coordinates: { lat: loc.lat, lng: loc.lng }
      }))
    });
    
  } catch (error) {
    console.error('Erro no autocomplete:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Validar localização
router.get('/validate', (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'Parâmetro location obrigatório' });
    }
    
    const locationData = findLocation(location);
    const isValid = locationData !== null;
    
    res.json({
      isValid,
      location: locationData ? {
        id: locationData.id,
        name: locationData.name,
        province: locationData.province,
        coordinates: { lat: locationData.lat, lng: locationData.lng }
      } : null
    });
    
  } catch (error) {
    console.error('Erro na validação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Calcular distância entre localizações
router.get('/distance', (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return res.status(400).json({ error: 'Parâmetros from e to obrigatórios' });
    }
    
    const fromLocation = findLocation(from);
    const toLocation = findLocation(to);
    
    if (!fromLocation || !toLocation) {
      return res.status(404).json({ error: 'Uma ou ambas localizações não encontradas em Moçambique' });
    }
    
    const distance = calculateDistance(
      fromLocation.lat, fromLocation.lng,
      toLocation.lat, toLocation.lng
    );
    
    // Estimar tempo de viagem (assumindo média de 60 km/h)
    const estimatedTime = Math.round(distance / 60 * 60); // em minutos
    
    res.json({
      from: { name: fromLocation.name, province: fromLocation.province },
      to: { name: toLocation.name, province: toLocation.province },
      distance: Math.round(distance),
      distanceUnit: 'km',
      estimatedTime,
      estimatedTimeUnit: 'minutos'
    });
    
  } catch (error) {
    console.error('Erro no cálculo de distância:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todas as localizações
router.get('/locations', (req, res) => {
  try {
    const { province, type } = req.query;
    
    let filteredLocations = mozambiqueLocations;
    
    if (province) {
      filteredLocations = filteredLocations.filter(loc => 
        loc.province.toLowerCase() === (province as string).toLowerCase()
      );
    }
    
    if (type) {
      filteredLocations = filteredLocations.filter(loc => loc.type === type);
    }
    
    res.json({
      locations: filteredLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        province: loc.province,
        type: loc.type,
        coordinates: { lat: loc.lat, lng: loc.lng }
      })),
      total: filteredLocations.length
    });
    
  } catch (error) {
    console.error('Erro ao obter localizações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;