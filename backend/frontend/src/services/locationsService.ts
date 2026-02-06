// ✅ CORREÇÃO: Usar variável de ambiente para base URL
const LOCATIONS_API_BASE = import.meta.env.VITE_LOCATIONS_API_URL || 'http://localhost:8000/api/locations';

// ✅ CORREÇÃO: Timeout configurável
const DEFAULT_TIMEOUT = 8000; // 8 segundos
const FALLBACK_TIMEOUT = 5000; // 5 segundos

export interface LocationSuggestion {
  id: string;
  name: string;
  province?: string;
  district?: string;
  locality?: string;
  lat?: number | null;      // ✅ CORREÇÃO: number → number | null | undefined
  lng?: number | null;      // ✅ CORREÇÃO: number → number | null | undefined
  type: string;
  relevance_rank?: number;
}

export interface LocationSearchResult {
  results: LocationSuggestion[];
  total: number;
}

export interface AutocompleteResult {
  suggestions: LocationSuggestion[];
  total: number;
}

// ✅ INTERFACE: Para Accommodation Location
export interface AccommodationLocation {
  id: string;
  name: string;
  province?: string;
  district?: string;
  locality?: string;
  type: string;
  lat?: number | null;      // ✅ CORREÇÃO: number → number | null | undefined
  lng?: number | null;      // ✅ CORREÇÃO: number → number | null | undefined
  relevance_rank?: number;
}

// ✅ INTERFACE PARA CACHE COM TIPAGEM GENÉRICA
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class LocationsService {
  // ✅ CORREÇÃO: Cache com tipagem genérica
  private cache = new Map<string, CacheEntry<any>>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  private setToCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // ✅ CORREÇÃO: Função auxiliar para fazer fetch com timeout
  private async fetchWithTimeout(url: string, timeout: number = DEFAULT_TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ✅ CORREÇÃO CRÍTICA: Normalizar dados da API mantendo null/undefined quando apropriado
  private normalizeLocationSuggestion(location: any): LocationSuggestion {
    return {
      id: location.id || '',
      name: location.name || '',
      province: location.province || undefined,
      district: location.district || undefined,
      locality: location.locality || undefined,
      
      // ✅ CORREÇÃO CRÍTICA: Não transformar null em 0, manter como undefined
      lat: location.lat !== undefined ? location.lat : undefined,
      lng: location.lng !== undefined ? location.lng : undefined,
      
      type: location.type || 'unknown',
      relevance_rank: location.relevance_rank
    };
  }

  // Buscar sugestões para autocomplete (endpoint otimizado)
  async searchSuggestions(query: string, limit: number = 8): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = `suggestions:${query}:${limit}`;
    const cached = this.getFromCache<LocationSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${LOCATIONS_API_BASE}/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await this.fetchWithTimeout(url, DEFAULT_TIMEOUT);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: AutocompleteResult = await response.json();
      const suggestions = (data.suggestions || []).map(loc => this.normalizeLocationSuggestion(loc));
      
      this.setToCache(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('Erro ao buscar sugestões de localização:', error);
      
      // ✅ CORREÇÃO: Fallback simplificado com cache antigo se disponível
      const oldCache = this.getFromCache<LocationSuggestion[]>(cacheKey);
      if (oldCache) {
        console.warn('⚠️ Usando cache expirado como fallback');
        return oldCache;
      }

      // Fallback: busca no endpoint normal se o autocomplete falhar
      try {
        const fallbackUrl = `${LOCATIONS_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        const fallbackResponse = await this.fetchWithTimeout(fallbackUrl, FALLBACK_TIMEOUT);
        
        const fallbackData: LocationSearchResult = await fallbackResponse.json();
        const fallbackResults = (fallbackData.results || []).map(loc => this.normalizeLocationSuggestion(loc));
        
        this.setToCache(cacheKey, fallbackResults);
        return fallbackResults;
      } catch (fallbackError) {
        console.error('Fallback também falhou:', fallbackError);
        return [];
      }
    }
  }

  // Buscar localidades por província
  async getByProvince(province: string): Promise<LocationSuggestion[]> {
    const cacheKey = `province:${province}`;
    const cached = this.getFromCache<LocationSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `${LOCATIONS_API_BASE}/search?q=${encodeURIComponent(province)}&limit=50`;
      const response = await this.fetchWithTimeout(url, DEFAULT_TIMEOUT);
      
      const data: LocationSearchResult = await response.json();
      // ✅ CORREÇÃO: Checagem segura para province
      const filteredResults = data.results
        .filter(location => 
          location.province?.toLowerCase() === province.toLowerCase()
        )
        .map(loc => this.normalizeLocationSuggestion(loc));
      
      this.setToCache(cacheKey, filteredResults);
      return filteredResults;
    } catch (error) {
      console.error('Erro ao buscar localidades por província:', error);
      return [];
    }
  }

  // Obter lista de províncias
  async getProvinces(): Promise<string[]> {
    const cacheKey = 'provinces';
    const cached = this.getFromCache<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchWithTimeout(`${LOCATIONS_API_BASE}/provinces`, DEFAULT_TIMEOUT);
      const data = await response.json();
      const provinces = data.provinces || [];
      
      this.setToCache(cacheKey, provinces);
      return provinces;
    } catch (error) {
      console.error('Erro ao buscar províncias:', error);
      return [];
    }
  }

  // Normalizar nome da localidade para exibição
  formatLocationName(location: LocationSuggestion): string {
    const parts = [location.name];
    // ✅ CORREÇÃO: Checagem segura para district
    if (location.district && location.district !== location.name) {
      parts.push(location.district);
    }
    // ✅ CORREÇÃO: Incluir locality se disponível
    if (location.locality && location.locality !== location.name && location.locality !== location.district) {
      parts.push(location.locality);
    }
    if (location.province) {
      parts.push(location.province);
    }
    return parts.join(', ');
  }

  // Formatação curta (apenas nome e província)
  formatShortLocationName(location: LocationSuggestion): string {
    // ✅ CORREÇÃO: Checagem segura para province
    if (location.province && location.province !== location.name) {
      return `${location.name}, ${location.province}`;
    }
    return location.name;
  }

  // ✅ CORREÇÃO: Buscar localidade por ID usando endpoint específico
  async getById(id: string): Promise<LocationSuggestion | null> {
    const cacheKey = `id:${id}`;
    const cached = this.getFromCache<LocationSuggestion>(cacheKey);
    if (cached) return cached;

    try {
      // ✅ CORREÇÃO: Tentar endpoint específico primeiro
      try {
        const response = await this.fetchWithTimeout(`${LOCATIONS_API_BASE}/${id}`, DEFAULT_TIMEOUT);
        if (response.ok) {
          const location = await response.json();
          const normalizedLocation = this.normalizeLocationSuggestion(location);
          this.setToCache(cacheKey, normalizedLocation);
          return normalizedLocation;
        }
      } catch (endpointError) {
        console.warn('Endpoint específico por ID não disponível, usando busca geral:', endpointError);
      }

      // ✅ CORREÇÃO: Fallback para busca geral com limite menor
      const url = `${LOCATIONS_API_BASE}/search?q=&limit=100`;
      const response = await this.fetchWithTimeout(url, DEFAULT_TIMEOUT);
      
      const data: LocationSearchResult = await response.json();
      const location = data.results.find(loc => loc.id === id) || null;
      
      if (location) {
        const normalizedLocation = this.normalizeLocationSuggestion(location);
        this.setToCache(cacheKey, normalizedLocation);
        return normalizedLocation;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar localidade por ID:', error);
      return null;
    }
  }

  // Obter estatísticas
  async getStats(): Promise<any> {
    const cacheKey = 'stats';
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.fetchWithTimeout(`${LOCATIONS_API_BASE}/stats`, DEFAULT_TIMEOUT);
      const data = await response.json();
      const stats = data.stats || {};
      
      this.setToCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {};
    }
  }

  // ✅ CORREÇÃO: Converter LocationSuggestion para AccommodationLocation preservando lat/lng
  convertToAccommodationLocation(location: LocationSuggestion): AccommodationLocation {
    return {
      id: location.id,
      name: location.name,
      province: location.province,
      district: location.district,
      locality: location.locality,
      type: location.type,
      
      // ✅ CORREÇÃO: Preservar lat/lng como estão (pode ser null/undefined)
      lat: location.lat,
      lng: location.lng,
      
      relevance_rank: location.relevance_rank
    };
  }

  // ✅ CORREÇÃO: Converter array de LocationSuggestion
  convertToAccommodationLocations(locations: LocationSuggestion[]): AccommodationLocation[] {
    return locations.map(loc => this.convertToAccommodationLocation(loc));
  }

  // Limpar cache manualmente (útil para desenvolvimento)
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache de localidades limpo');
  }

  // Obter informações do cache (para debugging)
  getCacheInfo(): { size: number; keys: string[] } {
    this.clearExpiredCache();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // ✅ MÉTODO: Buscar localidades populares
  async getPopularLocations(limit: number = 10): Promise<LocationSuggestion[]> {
    const cacheKey = `popular:${limit}`;
    const cached = this.getFromCache<LocationSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      // Buscar localidades com maior relevance_rank
      const url = `${LOCATIONS_API_BASE}/search?q=&limit=${limit}&sort=relevance`;
      const response = await this.fetchWithTimeout(url, DEFAULT_TIMEOUT);
      
      const data: LocationSearchResult = await response.json();
      const popularLocations = data.results
        .filter(loc => (loc.relevance_rank || 0) > 0)
        .map(loc => this.normalizeLocationSuggestion(loc))
        .slice(0, limit);
      
      this.setToCache(cacheKey, popularLocations);
      return popularLocations;
    } catch (error) {
      console.error('Erro ao buscar localidades populares:', error);
      return [];
    }
  }
}

export const locationsService = new LocationsService();