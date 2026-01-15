import { getDistance, convertDistance } from 'geolib';

/**
 * Calcula a distância entre duas coordenadas em quilómetros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const distanceInMeters = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );
  
  // Converter para quilómetros e arredondar para 2 casas decimais
  const distanceInKm = convertDistance(distanceInMeters, 'km');
  return Math.round(distanceInKm * 100) / 100;
}

/**
 * Obtém coordenadas aproximadas para localizações conhecidas em Moçambique
 */
export function getLocationCoordinates(locationName: string): { lat: number; lng: number } | null {
  const locations: { [key: string]: { lat: number; lng: number } } = {
    // Principais cidades
    'maputo': { lat: -25.966375, lng: 32.580611 },
    'matola': { lat: -25.962370, lng: 32.458885 },
    'beira': { lat: -19.843277, lng: 34.838892 },
    'nampula': { lat: -15.116667, lng: 39.266667 },
    'quelimane': { lat: -17.878447, lng: 36.888642 },
    'tete': { lat: -16.156389, lng: 33.586667 },
    'xai-xai': { lat: -25.051944, lng: 33.644167 },
    'inhambane': { lat: -23.865000, lng: 35.383333 },
    'pemba': { lat: -12.974722, lng: 40.517775 },
    'lichinga': { lat: -13.312222, lng: 35.240556 },
    'chimoio': { lat: -19.116389, lng: 33.483889 },
    'gurué': { lat: -15.466667, lng: 36.983333 },
    
    // Distritos de Maputo
    'polana': { lat: -25.964222, lng: 32.588331 },
    'sommerschield': { lat: -25.961667, lng: 32.580000 },
    'baixa': { lat: -25.970000, lng: 32.573333 },
    'alto maé': { lat: -25.955000, lng: 32.603333 },
    'coop': { lat: -25.953333, lng: 32.578333 },
    'maxaquene': { lat: -25.983333, lng: 32.566667 },
    'malanga': { lat: -25.990000, lng: 32.560000 },
    'zimpeto': { lat: -25.995000, lng: 32.515000 },
    'costa do sol': { lat: -25.933333, lng: 32.650000 },
    
    // Destinos turísticos
    'bilene': { lat: -25.300000, lng: 33.200000 },
    'tofo': { lat: -23.850000, lng: 35.550000 },
    'vilanculos': { lat: -22.016667, lng: 35.316667 },
    'bazaruto': { lat: -21.533333, lng: 35.450000 },
    'gorongosa': { lat: -18.966667, lng: 34.350000 },
    'cahora bassa': { lat: -15.600000, lng: 32.750000 },
    
    // Outras localidades importantes
    'ressano garcia': { lat: -25.433333, lng: 32.016667 },
    'moamba': { lat: -25.700000, lng: 32.166667 },
    'namaacha': { lat: -25.983333, lng: 32.016667 },
    'manhiça': { lat: -25.400000, lng: 32.800000 },
    'marracuene': { lat: -25.566667, lng: 32.650000 }
  };

  const normalizedName = locationName.toLowerCase()
    .trim()
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèê]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óòô]/g, 'o')
    .replace(/[úù]/g, 'u')
    .replace(/ç/g, 'c');

  return locations[normalizedName] || null;
}

/**
 * Obtém termos de proximidade para busca inteligente
 */
export function getProximityTerms(location: string): string[] {
  const proximityMap: { [key: string]: string[] } = {
    'maputo': ['matola', 'costa do sol', 'marracuene', 'polana', 'baixa'],
    'matola': ['maputo', 'machava', 'liberdade'],
    'malanga': ['zimpeto', 'albazine', 'khongolote', 'bilene'],
    'zimpeto': ['malanga', 'albazine', 'khongolote', 'bilene'],
    'polana': ['sommerschield', 'baixa', 'alto maé'],
    'beira': ['dondo', 'buzi', 'chimoio'],
    'nampula': ['nacala', 'ilha de moçambique', 'angoche'],
    'xai-xai': ['bilene', 'chokwe', 'chibuto'],
    'bilene': ['xai-xai', 'malanga', 'zimpeto', 'chokwe'],
    'inhambane': ['tofo', 'vilanculos', 'massinga'],
    'tofo': ['inhambane', 'vilanculos', 'jangamo'],
    'chimoio': ['beira', 'manica', 'gondola']
  };

  const normalizedLocation = location.toLowerCase()
    .trim()
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèê]/g, 'e')
    .replace(/[íì]/g, 'i')
    .replace(/[óòô]/g, 'o')
    .replace(/[úù]/g, 'u')
    .replace(/ç/g, 'c');

  return proximityMap[normalizedLocation] || [];
}

/**
 * Calcula preço sugerido baseado na distância
 */
export function calculateSuggestedPrice(distanceKm: number, pricePerKm: number = 15): number {
  const basePrice = 50; // Preço base de 50 MZN
  const totalPrice = basePrice + (distanceKm * pricePerKm);
  return Math.round(totalPrice * 100) / 100;
}

/**
 * Estima tempo de viagem baseado na distância
 */
export function estimateTravelTime(distanceKm: number): number {
  // Assumindo velocidade média de 50 km/h em estradas moçambicanas
  const averageSpeed = 50;
  const timeInHours = distanceKm / averageSpeed;
  return Math.round(timeInHours * 60); // Retorna em minutos
}

/**
 * Verifica se duas localizações estão dentro de um raio próximo
 */
export function isWithinProximity(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  radiusKm: number = 50
): boolean {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= radiusKm;
}

/**
 * Encontra a localização mais próxima de uma lista
 */
export function findNearestLocation(
  targetLat: number,
  targetLng: number,
  locations: Array<{ name: string; lat: number; lng: number }>
): { name: string; lat: number; lng: number; distance: number } | null {
  if (locations.length === 0) return null;

  let nearest = locations[0];
  let shortestDistance = calculateDistance(targetLat, targetLng, nearest.lat, nearest.lng);

  for (const location of locations.slice(1)) {
    const distance = calculateDistance(targetLat, targetLng, location.lat, location.lng);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearest = location;
    }
  }

  return {
    ...nearest,
    distance: shortestDistance
  };
}