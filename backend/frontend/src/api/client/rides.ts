// src/api/client/rides.ts
// ✅ CORREÇÃO: Remover import não utilizado
// import { apiRequest } from '../../shared/lib/queryClient'; // ❌ REMOVIDO

// ✅ Interface de parâmetros de busca ATUALIZADA para get_rides_smart_final
export interface RideSearchParams {
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
  maxPrice?: number;
  minPrice?: number;
  page?: number;
  limit?: number;
  smartSearch?: boolean;
  vehicleType?: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  radius?: number;
  maxDistance?: number;
  radiusKm?: number;
  max_results?: number; // ✅ NOVO parâmetro
}

// ✅ Interface Ride COMPLETA com todos os campos da get_rides_smart_final
export interface Ride {
  ride_id: string;
  driver_id: string;
  driver_name: string;
  driver_rating: number; // ✅ CORRIGIDO: era string, agora number
  vehicle_make: string;
  vehicle_model: string;
  vehicle_type: string;
  vehicle_plate: string;
  vehicle_color: string;
  max_passengers: number;

  from_city: string;
  to_city: string;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;

  departuredate: string;
  availableseats: number;
  priceperseat: number; // ✅ CORRIGIDO: era string, agora number

  distance_from_city_km: number;
  distance_to_city_km: number;

  // ✅ CAMPOS NOVOS da função inteligente
  match_type: string; // ✅ OBRIGATÓRIO agora
  direction_score: number; // ✅ NOVO campo
  from_province?: string; // ✅ Adicionado para compatibilidade
  to_province?: string; // ✅ Adicionado para compatibilidade

  // ✅ Campos de metadados de busca (opcionais)
  match_description?: string;
  search_metadata?: {
    original_search: { from: string; to: string };
    normalized_search: { from: string; to: string };
    function_used?: string;
    fallback_used?: boolean;
  };
}

// ✅ Interface de estatísticas de matching ATUALIZADA COMPLETA
export interface MatchStats {
  // ✅ Campos básicos
  total: number;
  
  // ✅ Campos de matching específicos
  exact?: number; // ✅ ADICIONADO: para exact_matches
  exact_match?: number;
  compatible?: number; // ✅ ADICIONADO: para partial_from/partial_to
  same_segment?: number;
  same_direction?: number;
  same_origin?: number;
  same_destination?: number;
  potential?: number;
  potential_match?: number; // ✅ ADICIONADO: para nearby
  traditional?: number;
  
  // ✅ Campos de inteligência
  smart_matches?: number;
  total_smart_matches?: number;
  
  // ✅ Campos de driver/vehicle
  drivers_with_ratings?: number;
  average_driver_rating?: number;
  vehicle_types?: Record<string, number>;
  
  // ✅ NOVOS campos para matching inteligente
  match_types?: Record<string, number>;
  average_direction_score?: number;
  
  // ✅ Campos da resposta SMART SEARCH
  exact_matches?: number; // ✅ ADICIONADO: do backend
  partial_from?: number; // ✅ ADICIONADO: do backend
  partial_to?: number; // ✅ ADICIONADO: do backend
  exact_province?: number; // ✅ ADICIONADO: do backend
  from_correct_province_to?: number; // ✅ ADICIONADO: do backend
  to_correct_province_from?: number; // ✅ ADICIONADO: do backend
  nearby?: number; // ✅ ADICIONADO: do backend
}

// ✅ Interface de resposta completa ATUALIZADA
export interface RideSearchResponse {
  success: boolean;
  rides: Ride[];
  matchStats?: MatchStats;
  total?: number;
  smart_search?: boolean;
  data?: any;
  searchParams?: {
    from: string;
    to: string;
    date?: string;
    passengers?: number;
    smartSearch: boolean;
    appliedFilters?: any;
    radiusKm?: number;
    searchMethod?: string;
    functionUsed?: string; // ✅ NOVO: para saber qual função foi usada
    normalization?: {
      applied: boolean;
      original: { from: string; to: string };
      normalized: { from: string; to: string };
    };
  };
}

// ✅ CORREÇÃO: Função auxiliar para obter token corretamente
function getAuthToken(): string {
  // ✅ CORREÇÃO CRÍTICA: Tentar múltiplas chaves possíveis
  const possibleKeys = [
    'firebase_token', // ✅ Chave correta baseada nos logs
    'firebase_token', // Chave alternativa
    'auth_token',
    'token'
  ];

  for (const key of possibleKeys) {
    const token = localStorage.getItem(key);
    if (token) {
      console.log(`✅ [AUTH] Token encontrado com chave: ${key}`);
      return token;
    }
  }

  console.error('❌ [AUTH] Nenhum token encontrado. Chaves verificadas:', possibleKeys);
  console.log('🔍 [AUTH] Conteúdo do localStorage:', { ...localStorage });
  throw new Error('Token de autenticação não encontrado');
}

// ✅ CORREÇÃO: Função apiPost robusta
async function apiPost<T>(url: string, body?: any): Promise<T> {
  try {
    console.log('🚀 [API-POST] Fazendo requisição para:', url);
    
    // ✅ CORREÇÃO: Usar função auxiliar para obter token
    const token = getAuthToken();

    const response = await fetch(`http://localhost:8000${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    // ✅ CORREÇÃO: Verificação robusta da resposta
    if (!response) {
      throw new Error('Nenhuma resposta recebida do servidor');
    }

    if (typeof response.json !== 'function') {
      console.error('❌ [API-POST] Resposta inválida:', response);
      throw new Error('Resposta da API não é um objeto Response válido');
    }

    const text = await response.text();
    console.log('📨 [API-POST] Resposta texto:', text.substring(0, 200));
    
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('❌ [API-POST] Erro ao parsear JSON:', parseError);
      throw new Error('Resposta da API não é JSON válido');
    }

    console.log('✅ [API-POST] Resposta parseada:', {
      success: result.success,
      dataLength: result.data?.length,
      error: result.error
    });

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('❌ [API-POST] Erro na requisição:', error);
    throw error;
  }
}

// ✅ CORREÇÃO: Função apiGet robusta
async function apiGet<T>(url: string): Promise<T> {
  try {
    console.log('🚀 [API-GET] Fazendo requisição para:', url);
    
    // ✅ CORREÇÃO: Usar função auxiliar para obter token
    const token = getAuthToken();

    const response = await fetch(`http://localhost:8000${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // ✅ CORREÇÃO: Verificação robusta da resposta
    if (!response) {
      throw new Error('Nenhuma resposta recebida do servidor');
    }

    if (typeof response.json !== 'function') {
      console.error('❌ [API-GET] Resposta inválida:', response);
      throw new Error('Resposta da API não é um objeto Response válido');
    }

    const text = await response.text();
    console.log('📨 [API-GET] Resposta texto:', text.substring(0, 200));
    
    let result;
    try {
      result = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('❌ [API-GET] Erro ao parsear JSON:', parseError);
      throw new Error('Resposta da API não é JSON válido');
    }

    console.log('✅ [API-GET] Resposta parseada:', {
      success: result.success,
      dataLength: result.data?.length,
      error: result.error
    });

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('❌ [API-GET] Erro na requisição:', error);
    throw error;
  }
}

// ✅ CORREÇÃO: Função callSmartRidesFunction melhorada
async function callSmartRidesFunction(params: {
  search_from?: string;
  search_to?: string;
  radius_km?: number;
  max_results?: number;
}): Promise<any> {
  console.log('🧠 [RPC] Chamando get_rides_smart_final:', params);
  
  try {
    // ✅ CORREÇÃO: Usar parâmetros corretos para a função RPC
    const response = await apiPost<any>('/api/rpc', {
      function: 'get_rides_smart_final',
      params: [ // ✅ CORREÇÃO: usar "params" em vez de "parameters"
        params.search_from || '',
        params.search_to || '',
        params.radius_km || 100,
        params.max_results || 50
      ]
    });
    
    console.log('✅ [RPC] Resposta recebida com sucesso:', {
      success: response.success,
      dataLength: response.data?.length,
      metadata: response.metadata
    });
    
    return response;
  } catch (error) {
    console.error('❌ [RPC] Erro na chamada da função:', error);
    
    // ✅ FALLBACK ROBUSTO - CORREÇÃO: Usar apiGet em vez de apiRequest
    try {
      console.log('🔄 [RPC] Tentando fallback para rota universal...');
      const searchParams = new URLSearchParams({
        from: params.search_from || '',
        to: params.search_to || '',
        radiusKm: String(params.radius_km || 100),
        maxResults: String(params.max_results || 50)
      });
      
      // ✅ CORREÇÃO: Usar apiGet em vez de apiRequest
      const fallbackResponse = await apiGet<any>(`/api/rides/search/universal?${searchParams}`);
      return { success: true, data: fallbackResponse.rides || fallbackResponse.data?.rides || [] };
    } catch (fallbackError) {
      console.error('❌ [RPC] Fallback também falhou:', fallbackError);
      return { success: false, data: [] };
    }
  }
}

// ✅ FUNÇÃO AUXILIAR ATUALIZADA: Construir parâmetros para busca inteligente
function buildSmartSearchParams(params: RideSearchParams): any {
  const smartParams: any = {};
  
  if (params.from) smartParams.search_from = params.from;
  if (params.to) smartParams.search_to = params.to;
  
  // ✅ CORREÇÃO: Usar radius_km conforme a função espera
  const radius_km = params.radiusKm || params.maxDistance || params.radius || 100;
  smartParams.radius_km = radius_km;
  
  // ✅ CORREÇÃO: max_results em vez de limit
  const max_results = params.max_results || params.limit || 50;
  smartParams.max_results = max_results;
  
  console.log('🔧 [Params] Parâmetros para função inteligente:', smartParams);
  return smartParams;
}

// ✅ CLIENT API principal ATUALIZADA
export const clientRidesApi = {
  // ✅ Busca principal - NÃO REQUER AUTENTICAÇÃO
  search: async (params: RideSearchParams): Promise<RideSearchResponse> => {
    console.log('🔍 [CLIENT API] Buscando viagens (sem auth):', params);
    
    try {
      // ✅✅✅ CORREÇÃO CRÍTICA: Usar rota SMART SEARCH (get_rides_smart_final) em vez de universal
      // ✅ CORREÇÃO: Decodificar parâmetros para evitar dupla codificação
      const decodeParam = (param: string | undefined): string => {
        if (!param) return '';
        try {
          // Decodificar uma vez se estiver codificado
          return decodeURIComponent(param);
        } catch {
          return param;
        }
      };
      
      // ✅✅✅ USAR ROTA SMART SEARCH QUE CHAMA get_rides_smart_final DIRETAMENTE
      // ✅ CORREÇÃO: Usar raio de 100km (como funcionava antes)
      const searchParams = new URLSearchParams({
        from: decodeParam(params.from) || '',
        to: decodeParam(params.to) || '',
        date: params.date || '',
        passengers: params.passengers?.toString() || '1',
        radiusKm: (params.radiusKm || 100).toString(), // ← 100km, não 200km
        maxResults: '50'
      });
      
      const url = `/api/rides/smart/search?${searchParams.toString()}`;
      console.log('🧠 [CLIENT API] URL de busca SMART FINAL (sem auth):', url);
      
      // ✅ CORREÇÃO: Busca sem autenticação
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // ✅ NÃO enviar Authorization header para busca pública
        }
      });
      
      if (!response.ok) {
        console.error('❌ [CLIENT API] Erro HTTP:', response.status, response.statusText);
        // Fallback: retornar array vazio em vez de erro
        return {
          success: true,
          rides: [],
          total: 0,
          smart_search: false,
          searchParams: {
            from: params.from || '',
            to: params.to || '',
            date: params.date,
            passengers: params.passengers,
            smartSearch: false,
            appliedFilters: params
          }
        };
      }
      
      const data = await response.json();
      console.log('✅ [CLIENT API] Busca SMART FINAL bem-sucedida:', {
        success: data.success,
        ridesCount: data.results?.length || data.rides?.length || 0,
        smartFunction: data.metadata?.smart_function || data.smart_search
      });
      
      // ✅✅✅ CORREÇÃO: Processar resposta da rota SMART SEARCH
      let rides: Ride[] = [];
      
      // A rota /smart/search retorna rides em "results"
      if (Array.isArray(data.results)) {
        rides = data.results.map((ride: any) => ({
          ...ride,
          driver_rating: typeof ride.driver_rating === 'string' ? 
            parseFloat(ride.driver_rating) : (ride.driver_rating || 4.5),
          priceperseat: typeof ride.priceperseat === 'string' ?
            parseFloat(ride.priceperseat) : (ride.priceperseat || 0)
        }));
      } else if (Array.isArray(data.rides)) {
        // Fallback para estrutura antiga
        rides = data.rides.map((ride: any) => ({
          ...ride,
          driver_rating: typeof ride.driver_rating === 'string' ? 
            parseFloat(ride.driver_rating) : (ride.driver_rating || 4.5),
          priceperseat: typeof ride.priceperseat === 'string' ?
            parseFloat(ride.priceperseat) : (ride.priceperseat || 0)
        }));
      } else if (Array.isArray(data.data)) {
        // Fallback para estrutura universal
        rides = data.data.map((ride: any) => ({
          ...ride,
          driver_rating: typeof ride.driver_rating === 'string' ? 
            parseFloat(ride.driver_rating) : (ride.driver_rating || 4.5),
          priceperseat: typeof ride.priceperseat === 'string' ?
            parseFloat(ride.priceperseat) : (ride.priceperseat || 0)
        }));
      }
      
      // ✅✅✅ CORREÇÃO: Usar estatísticas da resposta SMART SEARCH ou calcular
      const matchStats: MatchStats = data.stats ? {
        total: data.stats.total || rides.length,
        // ✅ Campos de matching
        exact: data.stats.exact_matches,
        exact_match: data.stats.exact_matches,
        exact_matches: data.stats.exact_matches,
        compatible: data.stats.partial_from || data.stats.partial_to,
        partial_from: data.stats.partial_from,
        partial_to: data.stats.partial_to,
        same_segment: data.stats.exact_province,
        exact_province: data.stats.exact_province,
        same_direction: data.stats.from_correct_province_to || data.stats.to_correct_province_from,
        from_correct_province_to: data.stats.from_correct_province_to,
        to_correct_province_from: data.stats.to_correct_province_from,
        potential_match: data.stats.nearby,
        nearby: data.stats.nearby,
        // ✅ Campos de inteligência
        smart_matches: data.stats.total || rides.length,
        total_smart_matches: data.stats.total || rides.length,
        match_types: data.stats.match_types || rides.reduce((acc, ride) => {
          const type = ride.match_type || 'traditional';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        average_direction_score: data.stats.average_direction_score || (rides.length > 0 ? 
          Math.round(rides.reduce((sum, ride) => sum + (ride.direction_score || 0), 0) / rides.length) : 0),
        // ✅ Campos de driver/vehicle
        average_driver_rating: data.stats.average_driver_rating || (rides.length > 0 ?
          parseFloat((rides.reduce((sum, ride) => sum + (ride.driver_rating || 0), 0) / rides.length).toFixed(1)) : 0),
        drivers_with_ratings: data.stats.drivers_with_ratings || rides.filter(ride => ride.driver_rating && ride.driver_rating > 0).length,
        vehicle_types: data.stats.vehicle_types || rides.reduce((acc, ride) => {
          const type = ride.vehicle_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      } : {
        total: rides.length,
        // ✅ Campos calculados localmente
        match_types: rides.reduce((acc, ride) => {
          const type = ride.match_type || 'traditional';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        total_smart_matches: rides.length,
        average_direction_score: rides.length > 0 ? 
          Math.round(rides.reduce((sum, ride) => sum + (ride.direction_score || 0), 0) / rides.length) : 0,
        average_driver_rating: rides.length > 0 ?
          parseFloat((rides.reduce((sum, ride) => sum + (ride.driver_rating || 0), 0) / rides.length).toFixed(1)) : 0,
        drivers_with_ratings: rides.filter(ride => ride.driver_rating && ride.driver_rating > 0).length,
        vehicle_types: rides.reduce((acc, ride) => {
          const type = ride.vehicle_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      return {
        success: true,
        rides: rides,
        matchStats: matchStats,
        total: rides.length,
        smart_search: data.metadata?.smart_function || data.smart_search || true,
        data: data,
        searchParams: {
          from: params.from || '',
          to: params.to || '',
          date: params.date,
          passengers: params.passengers,
          smartSearch: data.metadata?.smart_function || data.smart_search || true,
          radiusKm: params.radiusKm || 200,
          searchMethod: 'smart_final',
          functionUsed: 'get_rides_smart_final',
          appliedFilters: params
        }
      };
      
    } catch (error) {
      console.error('❌ [CLIENT API] Erro na busca de viagens:', error);
      
      // ✅ Fallback simplificado - retornar array vazio em vez de erro
      return {
        success: false,
        rides: [],
        total: 0,
        smart_search: false,
        searchParams: {
          from: params.from || '',
          to: params.to || '',
          date: params.date,
          passengers: params.passengers,
          smartSearch: false,
          appliedFilters: params
        }
      };
    }
  },

  // ✅ Busca inteligente específica ATUALIZADA
  searchSmart: async (params: {
    from: string;
    to: string;
    date?: string;
    passengers?: number;
    radiusKm?: number;
    max_results?: number;
  }): Promise<RideSearchResponse> => {
    console.log('🧠 [CLIENT API] Busca SMART específica:', params);
    
    // ✅ Reutilizar a função principal
    return clientRidesApi.search({
      ...params,
      smartSearch: true
    });
  },

  // ✅ Busca universal inteligente ATUALIZADA
  searchUniversal: async (params: {
    from?: string;
    to?: string;
    lat?: number;
    lng?: number;
    toLat?: number;
    toLng?: number;
    radiusKm?: number;
    maxResults?: number;
  }): Promise<RideSearchResponse> => {
    console.log('🌍 [CLIENT API] Busca universal inteligente', params);
    
    // ✅ Reutilizar a função principal com parâmetros adaptados
    return clientRidesApi.search({
      from: params.from,
      to: params.to,
      radiusKm: params.radiusKm,
      max_results: params.maxResults
    });
  },

  // ✅ MANTER funções existentes (sem alterações)
  getDetails: async (rideId: string): Promise<{ success: boolean; ride: Ride }> => {
    console.log('🔍 [CLIENT API] Buscando detalhes da viagem:', rideId);
    
    try {
      const data = await apiGet<any>(`/api/rides/${rideId}`);
      
      if (data.success) {
        const rideData = data.data?.ride || data.ride || data;
        return {
          success: true,
          ride: rideData
        };
      } else {
        throw new Error(data.message || 'Erro ao buscar detalhes da viagem');
      }
    } catch (error) {
      console.error('❌ [CLIENT API] Erro ao buscar detalhes:', error);
      throw error;
    }
  },

  // ✅ MANTER função de rides próximos
  getNearby: async (location: string, radius: number = 50, passengers: number = 1): Promise<RideSearchResponse> => {
    console.log('📍 [CLIENT API] Buscando rides próximos:', { location, radius, passengers });
    
    // ✅ Reutilizar busca principal
    return clientRidesApi.search({
      from: location,
      to: location,
      radiusKm: radius,
      passengers: passengers
    });
  },

  // ✅ MANTER outras funções sem alterações
  requestRide: async (rideId: string, passengers: number, pickupLocation?: string, notes?: string): Promise<{ 
    success: boolean; 
    message: string; 
    booking: any;
    rideDetails: any;
  }> => {
    try {
      const data = await apiPost<any>('/api/bookings', {
        rideId,
        passengers,
        pickupLocation,
        notes,
        type: 'ride'
      });
      
      if (data.success) {
        return {
          success: true,
          message: data.message || 'Reserva solicitada com sucesso',
          booking: data.data?.booking || data.booking,
          rideDetails: data.data?.rideDetails || data.rideDetails
        };
      } else {
        throw new Error(data.message || 'Erro ao solicitar viagem');
      }
    } catch (error) {
      console.error('❌ [CLIENT API] Erro ao solicitar viagem:', error);
      throw error;
    }
  },

  getByDriver: async (driverId: string): Promise<{ success: boolean; rides: Ride[] }> => {
    try {
      const data = await apiGet<any>(`/api/rides/driver/${driverId}`);
      
      const ridesData = data.rides || data.data?.rides || [];
      
      return {
        success: true,
        rides: ridesData
      };
    } catch (error) {
      console.error('❌ [CLIENT API] Erro ao buscar viagens do motorista:', error);
      throw error;
    }
  },

  getMatchStats: async (from: string, to: string): Promise<{ 
    success: boolean; 
    stats: MatchStats;
    recommendations?: string[];
  }> => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('from', from);
      queryParams.append('to', to);
      
      const data = await apiGet<any>(`/api/rides/match-stats?${queryParams}`);
      
      return {
        success: true,
        stats: data.data?.stats || data.stats,
        recommendations: data.data?.recommendations || data.recommendations
      };
    } catch (error) {
      console.error('❌ [CLIENT API] Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
};

export default clientRidesApi;