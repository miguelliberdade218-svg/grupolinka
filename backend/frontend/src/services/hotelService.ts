// src/services/hotelService.ts
// Serviço para gerenciamento de hotéis - Integração com API real
// VERSÃO ATUALIZADA COM getMyHotels() E getActiveHotel()
// ✅ CORRIGIDO: Inclui suporte para novos campos de localização (location_id, lat, lng)
// ✅ CORRIGIDO: Todas as rotas ajustadas para backend existente (sem /api/v2 prefix)
// ✅ ATUALIZADO: Suporte completo a lazy loading com options (chunkSize, forceReload)
// ✅ ADICIONADO: Função de conversão para tipo compatível
// ✅ ADICIONADO: Cache para evitar múltiplas chamadas simultâneas
// ✅ CORREÇÃO APLICADA: Suporte para localização com vírgula (locality, province)
// ✅ ADIÇÃO APLICADA: Funções getHotelById e getHotelBySlug adicionadas
// ✅ CORREÇÃO APLICADA: Método getBookingById unificado com parâmetro opcional
// ✅ CORREÇÃO APLICADA: Normalização de status no método getHotelBookings
// ✅ ADIÇÃO APLICADA: Função confirmBooking adicionada

import { apiService } from './api';
import moment from 'moment';
import { auth } from '@/shared/lib/firebaseConfig';

// ==================== SISTEMA DE CACHE ====================
const requestCache = new Map<string, { data: any; timestamp: number }>();
// 🔧 AUMENTADO: 30 segundos para reduzir chamadas à API
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Obtém dados do cache se ainda forem válidos
 */
function getCached<T>(key: string): T | null {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🔄 [Cache] Retornando do cache: ${key}`);
    return cached.data;
  }
  return null;
}

/**
 * Armazena dados no cache
 */
function setCached(key: string, data: any): void {
  requestCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Limpa o cache para uma chave específica
 */
function clearCache(key: string): void {
  requestCache.delete(key);
}

// 🔧 ADICIONADO: Limpa todos os caches relacionados a hotéis
function clearAllHotelCaches(): void {
  const keysToDelete: string[] = [];
  requestCache.forEach((_, key) => {
    if (key.includes('Hotel') || key.includes('hotel')) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    requestCache.delete(key);
  });
  console.log(`🧹 [Cache] Limpos ${keysToDelete.length} caches de hotel`);
}

// ==================== FUNÇÕES DE NORMALIZAÇÃO DE STATUS ====================

/**
 * ✅ CORREÇÃO: Normaliza status do frontend para o backend
 * Converte status como 'rejected', 'pending' para os status válidos do banco
 */
function normalizeHotelBookingStatus(frontendStatus: string | undefined): string {
  if (!frontendStatus) return 'pending_confirmation';
  
  const statusMap: Record<string, string> = {
    'pending': 'pending_confirmation',
    'pending_confirmation': 'pending_confirmation',
    'confirmed': 'confirmed',
    'checked_in': 'checked_in',
    'checked_out': 'checked_out',
    'cancelled': 'cancelled',
    'no_show': 'no_show',
    // Mapear status antigos/inexistentes
    'rejected': 'cancelled',
    'pending_approval': 'pending_confirmation',
    'in_progress': 'checked_in',
    'completed': 'checked_out',
  };
  
  return statusMap[frontendStatus.toLowerCase()] || 'pending_confirmation';
}

/**
 * ✅ CORREÇÃO: Normaliza status do backend para o frontend
 */
function denormalizeHotelBookingStatus(backendStatus: string | undefined): string {
  if (!backendStatus) return 'pending_confirmation';
  
  const validStatuses = [
    'pending_confirmation',
    'confirmed', 
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show'
  ];
  
  if (validStatuses.includes(backendStatus)) {
    return backendStatus;
  }
  
  return 'pending_confirmation';
}

// ==================== TIPOS ====================
export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address: string;
  locality: string;
  province: string;
  country: string;
  lat?: string | null;           // ✅ ADICIONADO: Suporte para null
  lng?: string | null;           // ✅ ADICIONADO: Suporte para null
  location_id?: string | null;   // ✅ NOVO CAMPO: ID da localização no banco
  contact_email: string;
  contact_phone?: string;
  host_id: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  rating?: number;
  total_reviews?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelCreateRequest {
  name: string;
  description?: string;
  address: string;
  locality: string;               // OBRIGATÓRIO - Localidade/Cidade
  province: string;               // OBRIGATÓRIO - Província
  country?: string;
  lat?: string | number | null;   // ✅ ATUALIZADO: Aceita number e null
  lng?: string | number | null;   // ✅ ATUALIZADO: Aceita number e null
  location_id?: string;           // ✅ NOVO: ID opcional da localização
  contact_email: string;
  contact_phone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
}

export interface HotelUpdateRequest {
  name?: string;
  description?: string;
  address?: string;
  locality?: string;
  province?: string;
  country?: string;
  lat?: string | number | null;   // ✅ ATUALIZADO: Aceita number e null
  lng?: string | number | null;   // ✅ ATUALIZADO: Aceita number e null
  location_id?: string | null;    // ✅ NOVO: ID opcional da localização
  contact_email?: string;
  contact_phone?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description?: string;
  capacity: number;
  base_price: string;
  total_units: number;
  base_occupancy: number;
  min_nights?: number;
  extra_adult_price?: string;
  extra_child_price?: string;
  amenities?: string[];
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_type_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  units: number;
  nights?: number;
  total_price: string;
  base_price: string;
  taxes?: string;
  special_requests?: string;
  // ✅ CORREÇÃO: Alterado para string para aceitar qualquer status após normalização
  status: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  promo_code?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  hotel_id: string;
  promo_code: string;
  name: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  start_date: string;
  end_date: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotelReview {
  id: string;
  booking_id: string;
  hotel_id: string;
  user_id?: string;
  ratings: {
    cleanliness: number;
    comfort: number;
    location: number;
    facilities: number;
    staff: number;
    value: number;
  };
  title: string;
  comment: string;
  pros?: string;
  cons?: string;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  error?: string;
}

export interface HotelDashboard {
  hotel: Hotel;
  total_bookings: number;
  upcoming_bookings: number;
  total_revenue: string;
  occupancy_rate: number;
  room_types: RoomType[];
  active_promotions: Promotion[];
  recent_reviews: HotelReview[];
  payment_options: any[];
}

export interface AvailabilityUpdate {
  date: string;
  available_units?: number;
  price_override?: number | string;
  stop_sell?: boolean;
  min_nights?: number;
}

export interface CalendarOptions {
  chunkSize?: number;      // Tamanho sugerido do chunk em dias (ex: 90)
  forceReload?: boolean;   // Forçar recarregamento (ignora cache no backend se suportado)
}

// ==================== FUNÇÃO DE CONVERSÃO ====================
/**
 * Converte um Hotel do serviço (com campos opcionais) para o tipo compartilhado
 * (com campos obrigatórios como images e amenities)
 * ✅ ATUALIZADO: Inclui os novos campos de localização
 */
export function convertServiceHotelToSharedHotel(serviceHotel: any): any {
  // Importante: Esta função deve retornar o tipo Hotel de src/shared/types/hotels.ts
  // Aqui estamos garantindo que arrays vazios sejam fornecidos para campos obrigatórios
  return {
    id: serviceHotel.id,
    name: serviceHotel.name,
    slug: serviceHotel.slug || '',
    description: serviceHotel.description || '',
    address: serviceHotel.address,
    locality: serviceHotel.locality,
    province: serviceHotel.province,
    country: serviceHotel.country || 'Moçambique',
    lat: serviceHotel.lat || null,
    lng: serviceHotel.lng || null,
    location_id: serviceHotel.location_id || null,  // ✅ ADICIONADO
    contact_email: serviceHotel.contact_email,
    contact_phone: serviceHotel.contact_phone || null,
    policies: serviceHotel.policies || null,
    images: serviceHotel.images || [],           // ← Garante array vazio se undefined
    amenities: serviceHotel.amenities || [],     // ← Garante array vazio se undefined
    check_in_time: serviceHotel.check_in_time || null,
    check_out_time: serviceHotel.check_out_time || null,
    rating: serviceHotel.rating || 0,
    total_reviews: serviceHotel.total_reviews || 0,
    is_active: serviceHotel.is_active ?? true,
    is_featured: serviceHotel.is_featured ?? false,
    host_id: serviceHotel.host_id,
    created_at: serviceHotel.created_at,
    updated_at: serviceHotel.updated_at,
  };
}

// ==================== FUNÇÕES AUXILIARES ====================
/**
 * Prepara os dados de localização para envio à API
 * ✅ NOVA FUNÇÃO: Garante formatação correta dos campos de localização
 */
function prepareLocationData(data: any): any {
  const prepared = { ...data };
  
  // Converte números para strings se necessário
  if (prepared.lat !== undefined && prepared.lat !== null) {
    prepared.lat = String(prepared.lat);
  }
  if (prepared.lng !== undefined && prepared.lng !== null) {
    prepared.lng = String(prepared.lng);
  }
  
  // Remove campos vazios (string vazia)
  if (prepared.lat === '') delete prepared.lat;
  if (prepared.lng === '') delete prepared.lng;
  if (prepared.location_id === '') delete prepared.location_id;
  
  return prepared;
}

/**
 * Processa uma string de localização que pode conter vírgula
 * ✅ NOVA FUNÇÃO: Separa "Costa do Sol, Cidade de Maputo" em locality e province
 * @returns Objeto com locality e province separados
 */
function parseLocationString(location: string): { locality: string; province?: string } {
  if (!location) return { locality: '' };
  
  const parts = location.split(',').map(part => part.trim());
  
  if (parts.length > 1) {
    // Ex: "Costa do Sol, Cidade de Maputo"
    return {
      locality: parts[0],
      province: parts[1]
    };
  }
  
  // Se não há vírgula, assume que é apenas a localidade
  return { locality: parts[0] };
}

class HotelService {
  // ==================== HOTÉIS ====================

  /**
   * Buscar hotéis com filtros
   * ✅ ATUALIZADO: Suporte para localização com vírgula
   */
  async searchHotels(filters?: {
    query?: string;
    locality?: string;
    province?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }): Promise<ListResponse<Hotel>> {
    try {
      const params = new URLSearchParams();
      
      // ✅ CORREÇÃO: Se locality contém vírgula, separar em locality e province
      if (filters?.locality) {
        const parsedLocation = parseLocationString(filters.locality);
        if (parsedLocation.locality) {
          params.append('locality', parsedLocation.locality);
        }
        if (parsedLocation.province) {
          params.append('province', parsedLocation.province);
        }
      }
      
      // Adicionar outros filtros
      if (filters?.province && !filters.locality?.includes(filters.province)) {
        params.append('province', filters.province);
      }
      if (filters?.query) params.append('query', filters.query);
      if (filters?.checkIn) params.append('checkIn', filters.checkIn);
      if (filters?.checkOut) params.append('checkOut', filters.checkOut);
      if (filters?.guests) params.append('guests', filters.guests.toString());

      const queryString = params.toString();
      const url = `/api/hotels${queryString ? '?' + queryString : ''}`;
      
      console.log('🔍 Buscando hotéis com URL:', url);
      return await apiService.get<ListResponse<Hotel>>(url);
    } catch (error) {
      console.error('Erro ao buscar hotéis:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Obter hotel por ID
   * ✅ ADICIONADO: Função específica conforme solicitado
   */
  async getHotelById(hotelId: string): Promise<Hotel> {
    try {
      const response = await apiService.get<ApiResponse<Hotel>>(`/api/hotels/${hotelId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Hotel não encontrado');
    } catch (error) {
      console.error('Erro ao buscar hotel por ID:', error);
      throw error;
    }
  }

  /**
   * Obter hotel por slug
   * ✅ ADICIONADO: Função específica conforme solicitado
   */
  async getHotelBySlug(slug: string): Promise<Hotel> {
    try {
      const response = await apiService.get<ApiResponse<Hotel>>(`/api/hotels/slug/${slug}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Hotel não encontrado');
    } catch (error) {
      console.error('Erro ao buscar hotel por slug:', error);
      throw error;
    }
  }

  /**
   * Criar novo hotel
   * ✅ ATUALIZADO: Inclui suporte para campos de localização
   */
  async createHotel(data: HotelCreateRequest): Promise<ApiResponse<Hotel>> {
    try {
      // ✅ CORREÇÃO: Prepara dados de localização
      const preparedData = prepareLocationData(data);
      
      // ✅ GARANTE: Campos obrigatórios
      if (!preparedData.locality || !preparedData.province) {
        return {
          success: false,
          error: 'Localidade e província são obrigatórias'
        };
      }
      
      return await apiService.post<ApiResponse<Hotel>>('/api/hotels', preparedData);
    } catch (error) {
      console.error('Erro ao criar hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar hotel'
      };
    }
  }

  /**
   * Atualizar hotel
   * ✅ ATUALIZADO: Inclui suporte para campos de localização
   */
  async updateHotel(hotelId: string, data: HotelUpdateRequest): Promise<ApiResponse<Hotel>> {
    try {
      // ✅ CORREÇÃO: Prepara dados de localização
      const preparedData = prepareLocationData(data);
      
      return await apiService.put<ApiResponse<Hotel>>(`/api/hotels/${hotelId}`, preparedData);
    } catch (error) {
      console.error('Erro ao atualizar hotel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar hotel'
      };
    }
  }

  /**
   * Buscar hotéis do proprietário
   */
  async getHotelsByHost(hostId: string): Promise<ListResponse<Hotel>> {
    try {
      return await apiService.get<ListResponse<Hotel>>(`/api/hotels/host/${hostId}`);
    } catch (error) {
      console.error('Erro ao buscar hotéis do proprietário:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Obter dashboard do hotel
   */
  async getHotelDashboard(hotelId: string): Promise<ApiResponse<HotelDashboard>> {
    try {
      return await apiService.get<ApiResponse<HotelDashboard>>(`/api/hotels/${hotelId}/dashboard`);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar dashboard'
      };
    }
  }

  // ==================== ROOM TYPES ====================

  /**
   * Buscar tipos de quarto do hotel
   */
  async getRoomTypesByHotel(hotelId: string): Promise<ListResponse<RoomType>> {
    try {
      return await apiService.get<ListResponse<RoomType>>(`/api/hotels/${hotelId}/room-types`);
    } catch (error) {
      console.error('Erro ao buscar room types:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar tipos de quarto'
      };
    }
  }

  /**
   * Criar tipo de quarto
   */
  async createRoomType(hotelId: string, data: any): Promise<ApiResponse<RoomType>> {
    try {
      return await apiService.post<ApiResponse<RoomType>>(`/api/hotels/${hotelId}/room-types`, data);
    } catch (error) {
      console.error('Erro ao criar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar tipo de quarto'
      };
    }
  }

  /**
   * Atualizar tipo de quarto
   * ✅ CORRIGIDO: Ajustado para rota correta do backend
   */
  async updateRoomType(hotelId: string, roomTypeId: string, data: any): Promise<ApiResponse<RoomType>> {
    try {
      const response = await apiService.put<ApiResponse<RoomType>>(
        `/api/hotels/${hotelId}/room-types/${roomTypeId}`, 
        data
      );
      
      if (!response.success) {
        console.error('Erro ao atualizar room type:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao atualizar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar tipo de quarto'
      };
    }
  }

  /**
   * Deletar tipo de quarto
   */
  async deleteRoomType(hotelId: string, roomTypeId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<ApiResponse<void>>(`/api/hotels/${hotelId}/room-types/${roomTypeId}`);
    } catch (error) {
      console.error('Erro ao deletar room type:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar tipo de quarto'
      };
    }
  }

  // ==================== PROMOÇÕES ====================

  /**
   * Buscar promoções do hotel
   */
  async getPromotionsByHotel(hotelId: string): Promise<ListResponse<Promotion>> {
    try {
      return await apiService.get<ListResponse<Promotion>>(`/api/hotels/${hotelId}/promotions`);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar promoções'
      };
    }
  }

  /**
   * Criar promoção
   * ✅ CORRIGIDO: Garante que promo_code está presente
   */
  async createPromotion(hotelId: string, data: any): Promise<ApiResponse<Promotion>> {
    try {
      // Garante que promo_code está presente
      if (!data.promo_code) {
        return {
          success: false,
          error: 'promo_code é obrigatório'
        };
      }

      const payload = {
        ...data,
        promo_code: data.promo_code,
        name: data.name || `Promoção ${data.promo_code}`,
        start_date: data.start_date || new Date().toISOString().split('T')[0],
        end_date: data.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: data.is_active !== false
      };

      return await apiService.post<ApiResponse<Promotion>>(`/api/hotels/${hotelId}/promotions`, payload);
    } catch (error) {
      console.error('Erro ao criar promoção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar promoção'
      };
    }
  }

  /**
   * Atualizar promoção
   */
  async updatePromotion(hotelId: string, promotionId: string, data: any): Promise<ApiResponse<Promotion>> {
    try {
      return await apiService.put<ApiResponse<Promotion>>(`/api/hotels/${hotelId}/promotions/${promotionId}`, data);
    } catch (error) {
      console.error('Erro ao atualizar promoção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar promoção'
      };
    }
  }

  /**
   * Deletar promoção
   */
  async deletePromotion(hotelId: string, promotionId: string): Promise<ApiResponse<void>> {
    try {
      return await apiService.delete<ApiResponse<void>>(
        `/api/hotels/${hotelId}/promotions/${promotionId}`
      );
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ==================== DISPONIBILIDADE / CALENDÁRIO ====================

  /**
   * Obter calendário de disponibilidade
   * ✅ SUPORTE A LAZY LOADING: aceita chunkSize e forceReload
   * @param hotelId ID do hotel
   * @param roomTypeId ID do tipo de quarto
   * @param start Data inicial (YYYY-MM-DD)
   * @param end Data final (YYYY-MM-DD)
   * @param options Opcional: controle de chunk e recarregamento
   */
  async getAvailabilityCalendar(
    hotelId: string,
    roomTypeId: string,
    start: string,
    end: string,
    options?: CalendarOptions
  ): Promise<ApiResponse<any[]>> {
    try {
      // Validação básica de datas
      if (!moment(start, 'YYYY-MM-DD', true).isValid() || !moment(end, 'YYYY-MM-DD', true).isValid()) {
        throw new Error('Formato de data inválido. Use YYYY-MM-DD');
      }
      if (moment(end).isBefore(moment(start))) {
        throw new Error('Data final deve ser após a data inicial');
      }

      // Monta query string
      let url = `/api/hotels/${hotelId}/availability?startDate=${start}&endDate=${end}&roomTypeId=${roomTypeId}`;

      // Adiciona parâmetros opcionais
      if (options?.chunkSize) {
        url += `&chunkSize=${options.chunkSize}`;
      }
      if (options?.forceReload) {
        url += `&forceReload=true`;
      }

      console.log('📅 Buscando disponibilidade (lazy):', {
        url,
        period: `${start} → ${end}`,
        days: moment(end).diff(moment(start), 'days') + 1,
        chunkSize: options?.chunkSize || 'padrão do backend',
        forceReload: !!options?.forceReload
      });

      const response = await apiService.get<ApiResponse<any[]>>(url);

      // Log de resultado para debug (melhorado)
      if (response.success && response.data) {
        console.log('✅ Disponibilidade carregada:', {
          totalDias: response.data.length,
          periodo: `${response.data[0]?.date || '—'} → ${response.data[response.data.length - 1]?.date || '—'}`,
          comPrecoOverride: response.data.filter(d => d.price_override != null).length,
          bloqueados: response.data.filter(d => d.stop_sell).length
        });
      }

      return response;
    } catch (error) {
      console.error('❌ Erro ao carregar calendário de disponibilidade:', {
        hotelId,
        roomTypeId,
        start,
        end,
        options,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar calendário de disponibilidade',
        data: []
      };
    }
  }

  /**
   * Obter reservas por tipo de quarto
   * ✅ NOVA FUNÇÃO: Filtra reservas por roomTypeId de forma eficiente
   */
  async getBookingsByRoomType(hotelId: string, roomTypeId: string): Promise<ListResponse<Booking>> {
    try {
      // ✅ CORREÇÃO: Busca todas as reservas do hotel e filtra por roomTypeId
      const allBookings = await this.getBookingsByHotel(hotelId);
      
      if (!allBookings.success) {
        return allBookings;
      }
      
      // Filtra as reservas pelo roomTypeId
      const filteredBookings = allBookings.data.filter(booking => booking.room_type_id === roomTypeId);
      
      return {
        success: true,
        data: filteredBookings,
        count: filteredBookings.length
      };
    } catch (error) {
      console.error('Erro ao carregar reservas por tipo de quarto:', error);
      return { 
        success: false, 
        data: [], 
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao carregar reservas' 
      };
    }
  }

  /**
   * Atualização em massa de disponibilidade
   * ✅ CORRIGIDO: Usa rota correta do backend (/api/hotels/...)
   */
  async bulkUpdateAvailability(hotelId: string, roomTypeId: string, updates: AvailabilityUpdate[]): Promise<ApiResponse<void>> {
    try {
      // ✅ CORREÇÃO: Usa a rota correta /api/hotels/:hotelId/availability/bulk (sem v2)
      const payload = {
        roomTypeId,
        updates
      };
      
      console.log('📅 Atualizando disponibilidade em massa:', { hotelId, roomTypeId, updatesCount: updates.length });
      return await apiService.post<ApiResponse<void>>(
        `/api/hotels/${hotelId}/availability/bulk`,
        payload
      );
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade em massa:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade' 
      };
    }
  }

  /**
   * Atualizar disponibilidade de um dia específico
   * ✅ CORRIGIDO: Usa rota de bulk update com um único item
   */
  async updateDayAvailability(hotelId: string, roomTypeId: string, date: string, update: AvailabilityUpdate): Promise<ApiResponse<void>> {
    try {
      return await this.bulkUpdateAvailability(hotelId, roomTypeId, [{ ...update, date }]);
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade de um dia:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao atualizar disponibilidade' 
      };
    }
  }

  // ==================== REVIEWS ====================

  /**
   * Buscar reviews do hotel
   */
  async getReviewsByHotel(hotelId: string, limit = 10, offset = 0): Promise<ListResponse<HotelReview>> {
    try {
      return await apiService.get<ListResponse<HotelReview>>(
        `/api/hotels/${hotelId}/reviews?limit=${limit}&offset=${offset}`
      );
    } catch (error) {
      console.error('Erro ao buscar reviews:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar reviews'
      };
    }
  }

  /**
   * Buscar estatísticas de reviews
   */
  async getReviewStats(hotelId: string): Promise<ApiResponse<any>> {
    try {
      return await apiService.get<ApiResponse<any>>(`/api/hotels/${hotelId}/reviews/stats`);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de reviews:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      };
    }
  }

  // ==================== RESERVAS ====================

  /**
   * Buscar reservas do hotel
   */
  async getBookingsByHotel(hotelId: string, status?: string[]): Promise<ListResponse<Booking>> {
    try {
      const statusQuery = status && status.length > 0 ? `?status=${status.join(',')}` : '';
      return await apiService.get<ListResponse<Booking>>(`/api/hotels/${hotelId}/bookings${statusQuery}`);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar reservas'
      };
    }
  }

  /**
   * ✅ CORREÇÃO UNIFICADA: Buscar reserva por ID (com hotelId opcional)
   * Para BookingConfirmationPage: hotelService.getBookingById(bookingId)
   * Para outros usos: hotelService.getBookingById(bookingId, hotelId)
   */
  async getBookingById(bookingId: string, hotelId?: string): Promise<ApiResponse<any>> {
    try {
      // Se hotelId for fornecido, usa rota específica
      if (hotelId) {
        return await apiService.get<ApiResponse<any>>(`/api/hotels/${hotelId}/bookings/${bookingId}`);
      }
      
      // Caso contrário, tenta rota global
      const response = await apiService.get<ApiResponse<any>>(`/api/hotels/bookings/${bookingId}`);
      if (response.success) {
        return response;
      }
      
      // Fallback: buscar em todos os hotéis do usuário
      const myHotels = await this.getMyHotels();
      if (myHotels.success && myHotels.data.length > 0) {
        for (const hotel of myHotels.data) {
          try {
            const hotelResponse = await apiService.get<ApiResponse<any>>(`/api/hotels/${hotel.id}/bookings/${bookingId}`);
            if (hotelResponse.success) {
              return {
                ...hotelResponse,
                data: {
                  ...hotelResponse.data,
                  hotel: hotel
                }
              };
            }
          } catch (error) {
            continue;
          }
        }
      }
      
      return {
        success: false,
        error: 'Reserva não encontrada'
      };
    } catch (error) {
      console.error('Erro ao buscar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar reserva'
      };
    }
  }

  /**
   * Criar reserva
   */
  async createBooking(hotelId: string, data: any): Promise<ApiResponse<Booking>> {
    try {
      return await apiService.post<ApiResponse<Booking>>(`/api/hotels/${hotelId}/bookings`, data);
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar reserva'
      };
    }
  }

  /**
   * Calcular preço da reserva
   */
  async calculateBookingPrice(hotelId: string, data: any): Promise<ApiResponse<any>> {
    try {
      return await apiService.post<ApiResponse<any>>(`/api/hotels/${hotelId}/bookings/calculate-price`, data);
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular preço'
      };
    }
  }

  // ==================== NOVA FUNÇÃO: Confirmar Reserva ====================

  /**
   * ✅ NOVA FUNÇÃO: Confirmar reserva
   * Endpoint: POST /api/hotels/bookings/:bookingId/confirm
   */
  async confirmBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      console.log('✅ Confirmando reserva:', bookingId);
      
      const response = await apiService.post<ApiResponse<Booking>>(
        `/api/hotels/bookings/${bookingId}/confirm`,
        {}
      );
      
      return response;
    } catch (error) {
      console.error('Erro ao confirmar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao confirmar reserva'
      };
    }
  }

  // ==================== MÉTODOS DE BOOKINGS ====================

  /**
   * Buscar reservas do hotel
   * ✅ Endpoint existente: GET /api/hotels/:id/bookings
   * ✅ CORREÇÃO APLICADA: Normalização de status
   */
  async getHotelBookings(
    hotelId: string, 
    filters?: {
      status?: string | string[];
      payment_status?: string;
    }
  ): Promise<ListResponse<Booking>> {
    try {
      // Construir query string
      const params = new URLSearchParams();
      
      if (filters?.status) {
        let statusArray: string[];
        
        if (Array.isArray(filters.status)) {
          statusArray = filters.status;
        } else {
          statusArray = filters.status.split(',');
        }
        
        // ✅ CORREÇÃO: Converter status do frontend para backend
        const backendStatusArray = statusArray.map(s => normalizeHotelBookingStatus(s));
        params.append('status', backendStatusArray.join(','));
      }
      
      if (filters?.payment_status) {
        params.append('paymentStatus', filters.payment_status);
      }
      
      const queryString = params.toString();
      const url = `/api/hotels/${hotelId}/bookings${queryString ? '?' + queryString : ''}`;
      
      console.log('📅 Buscando reservas do hotel:', url);
      
      const response = await apiService.get<ListResponse<Booking>>(url);
      
      // ✅ CORREÇÃO: Normalizar status na resposta
      if (response.success && response.data) {
        response.data = response.data.map(booking => ({
          ...booking,
          // ✅ CORREÇÃO: status agora é string (aceita qualquer valor)
          status: denormalizeHotelBookingStatus(booking.status) || 'pending_confirmation',
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar reservas do hotel:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar reservas'
      };
    }
  }

  /**
   * Registrar pagamento manual
   * ✅ Endpoint existente: POST /api/hotels/:id/bookings/:bookingId/payments
   */
  async registerManualPayment(
    hotelId: string,
    bookingId: string,
    paymentData: {
      amount: number;
      paymentMethod: 'mpesa' | 'bank_transfer' | 'card' | 'cash' | 'mobile_money';
      reference: string;
      notes?: string;
      paymentType?: 'partial' | 'full';
    }
  ): Promise<ApiResponse<any>> {
    try {
      console.log('💰 Registrando pagamento manual:', {
        hotelId,
        bookingId,
        paymentData
      });
      
      const response = await apiService.post<ApiResponse<any>>(
        `/api/hotels/${hotelId}/bookings/${bookingId}/payments`,
        paymentData
      );
      
      if (response.success) {
        console.log('✅ Pagamento registrado com sucesso');
      } else {
        console.error('❌ Erro ao registrar pagamento:', response.error);
      }
      
      return response;
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao registrar pagamento'
      };
    }
  }

  /**
   * Fazer check-in
   * ✅ Endpoint existente: POST /api/hotels/bookings/:bookingId/check-in
   */
  async checkInBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      console.log('🏨 Fazendo check-in da reserva:', bookingId);
      
      const response = await apiService.post<ApiResponse<Booking>>(
        `/api/hotels/bookings/${bookingId}/check-in`,
        {}
      );
      
      return response;
    } catch (error) {
      console.error('Erro ao fazer check-in:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer check-in'
      };
    }
  }

  /**
   * Fazer check-out
   * ✅ Endpoint existente: POST /api/hotels/bookings/:bookingId/check-out
   */
  async checkOutBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    try {
      console.log('🏨 Fazendo check-out da reserva:', bookingId);
      
      const response = await apiService.post<ApiResponse<Booking>>(
        `/api/hotels/bookings/${bookingId}/check-out`,
        {}
      );
      
      return response;
    } catch (error) {
      console.error('Erro ao fazer check-out:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer check-out'
      };
    }
  }

  /**
   * Cancelar reserva
   * ✅ Endpoint existente: POST /api/hotels/bookings/:bookingId/cancel
   */
  async cancelBooking(
    bookingId: string, 
    reason?: string
  ): Promise<ApiResponse<Booking>> {
    try {
      console.log('❌ Cancelando reserva:', { bookingId, reason });
      
      const response = await apiService.post<ApiResponse<Booking>>(
        `/api/hotels/bookings/${bookingId}/cancel`,
        { reason: reason || 'Cancelado pelo host' }
      );
      
      return response;
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao cancelar reserva'
      };
    }
  }

  /**
   * Rejeitar reserva
   * ✅ Endpoint existente: POST /api/hotels/bookings/:bookingId/reject
   */
  async rejectBooking(
    bookingId: string, 
    reason?: string
  ): Promise<ApiResponse<Booking>> {
    try {
      console.log('❌ Rejeitando reserva:', { bookingId, reason });
      
      const response = await apiService.post<ApiResponse<Booking>>(
        `/api/hotels/bookings/${bookingId}/reject`,
        { reason: reason || 'Rejeitado pelo host' }
      );
      
      return response;
    } catch (error) {
      console.error('Erro ao rejeitar reserva:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao rejeitar reserva'
      };
    }
  }

  // ==================== MÉTODOS PARA O DASHBOARD DO HOST ====================

  /**
   * Lista todos os hotéis do usuário autenticado atual (host logado)
   * Usa a rota /host/me que infere o host_id automaticamente do token
   * ✅ ADICIONADO: Cache para evitar múltiplas chamadas simultâneas
   */
  async getMyHotels(): Promise<ListResponse<Hotel>> {
    const userId = auth.currentUser?.uid || 'anonymous';
    const cacheKey = `getMyHotels_${userId}`;
    const cached = getCached<ListResponse<Hotel>>(cacheKey);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await apiService.get<any>('/api/hotels/host/me');

      // Normaliza resposta (caso o backend retorne { success: true, data: [...] })
      const hotels = response.data?.data || response.data || [];

      const result = {
        success: true,
        data: hotels,
        count: hotels.length,
      };

      // Armazena no cache
      setCached(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar meus hotéis:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Falha ao carregar hotéis do host',
      };
    }
  }

  /**
   * Limpa o cache de getMyHotels (útil após criar/atualizar/deletar hotel)
   */
  clearMyHotelsCache(): void {
    const userId = auth.currentUser?.uid || 'anonymous';
    clearCache(`getMyHotels_${userId}`);
    // 🔧 ADICIONADO: Limpa também caches relacionados
    clearCache(`getActiveHotel_${userId}`);
    clearCache(`getActiveHotelConverted_${userId}`);
    console.log('🧹 [Cache] Caches de hotéis limpos');
  }

  /**
   * Pega o hotel atualmente ativo (salvo no localStorage ou fallback para o primeiro)
   * IMPORTANTE: Este método retorna o Hotel do tipo do serviço (com campos opcionais)
   * ✅ ADICIONADO: Cache para evitar múltiplas chamadas simultâneas
   */
  async getActiveHotel(): Promise<Hotel | null> {
    const userId = auth.currentUser?.uid || 'anonymous';
    const cacheKey = `getActiveHotel_${userId}`;
    const cached = getCached<Hotel | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    const savedId = localStorage.getItem('activeHotelId');
    
    // Tenta carregar o hotel salvo
    if (savedId) {
      try {
        const hotel = await this.getHotelById(savedId);
        setCached(cacheKey, hotel);
        return hotel; // Retorna o Hotel do tipo do serviço
      } catch (err) {
        console.warn('Hotel salvo não encontrado:', err);
        localStorage.removeItem('activeHotelId'); // limpa se inválido
      }
    }

    // Fallback: carrega todos e pega o primeiro
    const myHotels = await this.getMyHotels();
    if (myHotels.success && myHotels.data.length > 0) {
      const first = myHotels.data[0];
      localStorage.setItem('activeHotelId', first.id);
      setCached(cacheKey, first);
      return first; // Retorna o Hotel do tipo do serviço
    }

    setCached(cacheKey, null);
    return null;
  }

  /**
   * Limpa o cache de getActiveHotel (útil após mudar hotel ativo)
   */
  clearActiveHotelCache(): void {
    const userId = auth.currentUser?.uid || 'anonymous';
    clearCache(`getActiveHotel_${userId}`);
    clearCache(`getActiveHotelConverted_${userId}`);
    console.log('🧹 [Cache] Cache de hotel ativo limpo');
  }

  /**
   * Obtém o hotel ativo já convertido para o tipo compartilhado
   * (com images: string[] e amenities: string[] obrigatórios)
   * ✅ ATUALIZADO: Inclui campos de localização
   * ✅ ADICIONADO: Cache para evitar múltiplas chamadas simultâneas
   */
  async getActiveHotelConverted(): Promise<any> {
    const userId = auth.currentUser?.uid || 'anonymous';
    const cacheKey = `getActiveHotelConverted_${userId}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const hotel = await this.getActiveHotel();
    if (!hotel) {
      setCached(cacheKey, null);
      return null;
    }
    
    const converted = convertServiceHotelToSharedHotel(hotel);
    setCached(cacheKey, converted);
    return converted;
  }

  /**
   * Limpa TODOS os caches relacionados a hotéis
   */
  clearAllHotelCaches(): void {
    const userId = auth.currentUser?.uid || 'anonymous';
    clearCache(`getMyHotels_${userId}`);
    clearCache(`getActiveHotel_${userId}`);
    clearCache(`getActiveHotelConverted_${userId}`);
    console.log('🧹 [Cache] Todos os caches de hotel limpos');
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar disponibilidade para datas específicas
   */
  async checkAvailability(hotelId: string, roomTypeId: string, checkIn: string, checkOut: string, units: number = 1): Promise<ApiResponse<any>> {
    try {
      const url = `/api/hotels/${hotelId}/availability/check?roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&units=${units}`;
      return await apiService.get<ApiResponse<any>>(url);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar disponibilidade'
      };
    }
  }

  // ==================== NOVAS ROTAS ADICIONAIS (para completude) ====================

  /**
   * Buscar hotéis por província
   */
  async getHotelsByProvince(province: string): Promise<ListResponse<Hotel>> {
    try {
      return await apiService.get<ListResponse<Hotel>>(`/api/hotels/province/${province}`);
    } catch (error) {
      console.error('Erro ao buscar hotéis por província:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Buscar hotéis por localidade
   */
  async getHotelsByLocality(locality: string): Promise<ListResponse<Hotel>> {
    try {
      return await apiService.get<ListResponse<Hotel>>(`/api/hotels/locality/${locality}`);
    } catch (error) {
      console.error('Erro ao buscar hotéis por localidade:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Buscar hotéis próximos (por localização)
   * ✅ ATUALIZADO: Inclui suporte para novos campos de localização
   */
  async getNearbyHotels(lat: number, lng: number, radius: number = 60): Promise<ListResponse<Hotel>> {
    try {
      const url = `/api/hotels/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
      return await apiService.get<ListResponse<Hotel>>(url);
    } catch (error) {
      console.error('Erro ao buscar hotéis próximos:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Erro ao buscar hotéis'
      };
    }
  }

  /**
   * Submeter review de hotel
   */
  async submitReview(data: any): Promise<ApiResponse<HotelReview>> {
    try {
      return await apiService.post<ApiResponse<HotelReview>>('/api/hotels/reviews/submit', data);
    } catch (error) {
      console.error('Erro ao submeter review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao submeter review'
      };
    }
  }

  /**
   * Votar review como útil/não útil
   */
  async voteHelpful(reviewId: string, isHelpful: boolean): Promise<ApiResponse<void>> {
    try {
      return await apiService.post<ApiResponse<void>>(`/api/hotels/reviews/${reviewId}/vote-helpful`, { isHelpful });
    } catch (error) {
      console.error('Erro ao votar review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao votar review'
      };
    }
  }

  /**
   * Responder a um review
   */
  async respondToReview(hotelId: string, reviewId: string, responseText: string): Promise<ApiResponse<HotelReview>> {
    try {
      return await apiService.post<ApiResponse<HotelReview>>(
        `/api/hotels/${hotelId}/reviews/${reviewId}/respond`, 
        { responseText }
      );
    } catch (error) {
      console.error('Erro ao responder review:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao responder review'
      };
    }
  }

  /**
   * Gerar relatório de reservas (CSV/JSON)
   */
  async generateBookingsReport(hotelId: string, startDate: string, endDate: string, format: 'csv' | 'json' = 'json'): Promise<any> {
    try {
      const url = `/api/hotels/${hotelId}/reports/bookings?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      
      if (format === 'csv') {
        return await apiService.getRaw(url, { responseType: 'blob' });
      } else {
        return await apiService.get<ApiResponse<any>>(url);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório'
      };
    }
  }

  /**
   * Gerar relatório de pagamentos (CSV/JSON)
   */
  async generatePaymentsReport(hotelId: string, startDate: string, endDate: string, format: 'csv' | 'json' = 'json'): Promise<any> {
    try {
      const url = `/api/hotels/${hotelId}/reports/payments?startDate=${startDate}&endDate=${endDate}&format=${format}`;
      
      if (format === 'csv') {
        return await apiService.getRaw(url, { responseType: 'blob' });
      } else {
        return await apiService.get<ApiResponse<any>>(url);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório de pagamentos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar relatório de pagamentos'
      };
    }
  }

  /**
   * Processar reserva com pagamento
   */
  async processBookingWithPayment(hotelId: string, bookingId: string, paymentOptionId: string, selectedPromotionId?: string): Promise<ApiResponse<any>> {
    try {
      const payload: any = { paymentOptionId };
      if (selectedPromotionId) {
        payload.selectedPromotionId = selectedPromotionId;
      }
      
      return await apiService.post<ApiResponse<any>>(
        `/api/hotels/${hotelId}/bookings/${bookingId}/process-payment`,
        payload
      );
    } catch (error) {
      console.error('Erro ao processar reserva com pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar reserva'
      };
    }
  }
}

export const hotelService = new HotelService();