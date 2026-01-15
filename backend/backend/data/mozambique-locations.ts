export interface MozambiqueLocation {
  id: string;
  name: string;
  province: string;
  district?: string;
  lat: number;
  lng: number;
  type: 'capital' | 'city' | 'town' | 'district';
  population?: number;
}

export const mozambiqueLocations: MozambiqueLocation[] = [
  // Maputo Province
  { id: 'maputo', name: 'Maputo', province: 'Maputo', lat: -25.9692, lng: 32.5732, type: 'capital', population: 1191613 },
  { id: 'matola', name: 'Matola', province: 'Maputo', lat: -25.9623, lng: 32.4589, type: 'city', population: 1032197 },
  { id: 'boane', name: 'Boane', province: 'Maputo', lat: -26.0464, lng: 32.3281, type: 'town' },
  { id: 'namaacha', name: 'Namaacha', province: 'Maputo', lat: -25.9919, lng: 32.0208, type: 'town' },
  
  // Gaza Province  
  { id: 'xai-xai', name: 'Xai-Xai', province: 'Gaza', lat: -25.0519, lng: 33.6442, type: 'city', population: 127366 },
  { id: 'chokwe', name: 'Chokwé', province: 'Gaza', lat: -24.5333, lng: 33.0167, type: 'city' },
  { id: 'chibuto', name: 'Chibuto', province: 'Gaza', lat: -24.6867, lng: 33.5308, type: 'town' },
  
  // Inhambane Province
  { id: 'inhambane', name: 'Inhambane', province: 'Inhambane', lat: -23.8647, lng: 35.3833, type: 'city', population: 79098 },
  { id: 'maxixe', name: 'Maxixe', province: 'Inhambane', lat: -23.8597, lng: 35.3467, type: 'city' },
  { id: 'vilanculos', name: 'Vilanculos', province: 'Inhambane', lat: -22.0133, lng: 35.3133, type: 'city' },
  { id: 'tofo', name: 'Tofo', province: 'Inhambane', lat: -23.8500, lng: 35.5333, type: 'town' },
  
  // Sofala Province
  { id: 'beira', name: 'Beira', province: 'Sofala', lat: -19.8436, lng: 34.8389, type: 'city', population: 592090 },
  { id: 'dondo', name: 'Dondo', province: 'Sofala', lat: -19.6108, lng: 34.7431, type: 'city' },
  { id: 'gorongosa', name: 'Gorongosa', province: 'Sofala', lat: -18.7417, lng: 34.0167, type: 'town' },
  
  // Manica Province
  { id: 'chimoio', name: 'Chimoio', province: 'Manica', lat: -19.1164, lng: 33.4833, type: 'city', population: 256936 },
  { id: 'catandica', name: 'Catandica', province: 'Manica', lat: -18.9667, lng: 32.8833, type: 'town' },
  { id: 'sussundenga', name: 'Sussundenga', province: 'Manica', lat: -19.3333, lng: 33.3833, type: 'town' },
  
  // Tete Province
  { id: 'tete', name: 'Tete', province: 'Tete', lat: -16.1564, lng: 33.5867, type: 'city', population: 307259 },
  { id: 'moatize', name: 'Moatize', province: 'Tete', lat: -16.1039, lng: 33.7233, type: 'city' },
  { id: 'cahora-bassa', name: 'Cahora Bassa', province: 'Tete', lat: -15.5833, lng: 32.6667, type: 'town' },
  
  // Zambézia Province
  { id: 'quelimane', name: 'Quelimane', province: 'Zambézia', lat: -17.8786, lng: 36.8883, type: 'city', population: 349842 },
  { id: 'mocuba', name: 'Mocuba', province: 'Zambézia', lat: -16.8372, lng: 36.9856, type: 'city' },
  { id: 'gurué', name: 'Gurué', province: 'Zambézia', lat: -15.4667, lng: 36.9833, type: 'city' },
  
  // Nampula Province
  { id: 'nampula', name: 'Nampula', province: 'Nampula', lat: -15.1165, lng: 39.2666, type: 'city', population: 743125 },
  { id: 'nacala', name: 'Nacala', province: 'Nampula', lat: -14.5428, lng: 40.6728, type: 'city' },
  { id: 'angoche', name: 'Angoche', province: 'Nampula', lat: -16.2333, lng: 39.9000, type: 'city' },
  
  // Cabo Delgado Province
  { id: 'pemba', name: 'Pemba', province: 'Cabo Delgado', lat: -12.9740, lng: 40.5178, type: 'city', population: 201845 },
  { id: 'montepuez', name: 'Montepuez', province: 'Cabo Delgado', lat: -13.1258, lng: 39.0042, type: 'city' },
  { id: 'palma', name: 'Palma', province: 'Cabo Delgado', lat: -10.7333, lng: 40.3667, type: 'town' },
  
  // Niassa Province
  { id: 'lichinga', name: 'Lichinga', province: 'Niassa', lat: -13.3133, lng: 35.2406, type: 'city', population: 142253 },
  { id: 'cuamba', name: 'Cuamba', province: 'Niassa', lat: -14.8000, lng: 36.5333, type: 'city' },
  
  // Additional important locations
  { id: 'ressano-garcia', name: 'Ressano Garcia', province: 'Maputo', lat: -25.4333, lng: 31.9833, type: 'town' },
  { id: 'chongoene', name: 'Chongoene', province: 'Gaza', lat: -24.0667, lng: 33.7667, type: 'town' },
  { id: 'ponta-do-ouro', name: 'Ponta do Ouro', province: 'Maputo', lat: -26.8500, lng: 32.8833, type: 'town' },
];

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Find location by name with fuzzy matching
export function findLocation(query: string): MozambiqueLocation | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Exact match first
  let location = mozambiqueLocations.find(loc => 
    loc.name.toLowerCase() === normalizedQuery
  );
  
  if (location) return location;
  
  // Partial match
  location = mozambiqueLocations.find(loc => 
    loc.name.toLowerCase().includes(normalizedQuery) ||
    normalizedQuery.includes(loc.name.toLowerCase())
  );
  
  return location || null;
}

// Get suggestions for autocomplete
export function getLocationSuggestions(query: string, limit: number = 5): MozambiqueLocation[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  const matches = mozambiqueLocations
    .filter(loc => 
      loc.name.toLowerCase().includes(normalizedQuery) ||
      loc.province.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      // Prioritize exact matches and major cities
      const aExact = a.name.toLowerCase().startsWith(normalizedQuery);
      const bExact = b.name.toLowerCase().startsWith(normalizedQuery);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by type (capitals and cities first)
      const typeOrder = { capital: 0, city: 1, town: 2, district: 3 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
  
  return matches.slice(0, limit);
}

// Validate if a location is in Mozambique
export function isValidMozambiqueLocation(locationName: string): boolean {
  return findLocation(locationName) !== null;
}