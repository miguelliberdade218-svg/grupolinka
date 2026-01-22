import { auth } from '@/shared/lib/firebaseConfig';
import { Booking, RideBookingRequest, HotelBookingRequest } from '@/shared/types/booking';
import { Offer, HotelPartner } from '@/shared/types/dashboard';

/**
 * Serviço central de API para todas as apps
 * ATUALIZADO para compatibilidade com get_rides_smart_final e backend real
 */
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    console.log('🏗️ API Base URL:', this.baseURL);
  }

  // ✅ Função auxiliar para headers sem Content-Type padrão
  private async getAuthHeaders(includeContentType: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.debug('No auth token available:', error);
    }
    return headers;
  }

  // ✅ Endpoint base consistente
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Garantir que todas as URLs tenham /api
    const normalizedEndpoint = endpoint.startsWith('/api') 
      ? endpoint 
      : `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    return `${this.baseURL}${normalizedEndpoint}`;
  }

  // ✅ Tratamento de erros melhorado
  private async throwIfResNotOk(response: Response): Promise<void> {
    if (!response.ok) {
      let errorText = response.statusText;
      try {
        const data = await response.json();
        if (data?.message) errorText = data.message;
      } catch {
        // Se não conseguir parsear JSON, usa o texto padrão
      }
      throw new Error(`${response.status}: ${errorText}`);
    }
  }

  // ✅ Método request privado
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const headers = await this.getAuthHeaders(method !== 'GET' && data !== undefined);
    const url = this.buildURL(endpoint);
    
    const config: RequestInit = { 
      method, 
      headers, 
      credentials: 'include' 
    };
    
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }
    
    console.log(`🌐 API ${method} Request:`, { url, headers: Object.keys(headers), data });
    
    const response = await fetch(url, config);
    await this.throwIfResNotOk(response);
    
    // Para respostas sem conteúdo (como DELETE 204)
    if (response.status === 204) {
      return {} as T;
    }
    
    return response.json() as Promise<T>;
  }

  // ✅✅✅ MÉTODOS GENÉRICOS PÚBLICOS PARA REUTILIZAÇÃO
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // ✅✅✅ Método para chamadas RPC (PostgreSQL Functions)
  private async rpcRequest<T>(
    functionName: string,
    parameters: Record<string, any> = {}
  ): Promise<T> {
    const headers = await this.getAuthHeaders(true);
    const url = this.buildURL('/rpc');
    
    const payload = {
      function: functionName,
      parameters: parameters
    };
    
    console.log(`🧠 RPC Call ${functionName}:`, parameters);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    
    await this.throwIfResNotOk(response);
    return response.json() as Promise<T>;
  }

  // ✅ Helper para adicionar informações do passageiro
  private async attachUserInfo<T extends object>(payload: T): Promise<T & { userId: string; createdBy: string }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    return {
      ...payload,
      userId: user.uid,
      createdBy: user.uid
    };
  }

  // ✅ Helper para adicionar hostId
  private async attachHostInfo<T extends object>(payload: T): Promise<T & { hostId: string; createdBy: string }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    return {
      ...payload,
      hostId: user.uid,
      createdBy: user.uid
    };
  }

  // ✅ Helper para adicionar driverId
  private async attachDriverInfo<T extends object>(payload: T): Promise<T & { driverId: string; createdBy: string }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    return {
      ...payload,
      driverId: user.uid,
      createdBy: user.uid
    };
  }

  // ✅ Helper para adicionar updatedBy
  private async attachUpdatedBy<T extends object>(payload: T): Promise<T & { updatedBy: string }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuário não autenticado');
    }
    
    return {
      ...payload,
      updatedBy: user.uid
    };
  }

  // ===== RIDES API - COMPLETAMENTE ATUALIZADA =====
  
  // ✅✅✅ Busca usando get_rides_smart_final via RPC
  async searchRides(params: { 
    from?: string; 
    to?: string; 
    passengers?: number; 
    date?: string;
    radiusKm?: number;
    maxResults?: number;
  }): Promise<any> {
    console.log('🔍 [API] Buscando rides com função inteligente:', params);
    
    return this.rpcRequest('get_rides_smart_final', {
      search_from: params.from || '',
      search_to: params.to || '',
      radius_km: params.radiusKm || 100,
      max_results: params.maxResults || 50
    });
  }

  // ✅✅✅ Busca inteligente específica (alias para searchRides)
  async searchRidesSmart(params: {
    from: string;
    to: string;
    date?: string;
    passengers?: number;
    radiusKm?: number;
    maxResults?: number;
  }): Promise<any> {
    console.log('🧠 [API] Busca inteligente específica:', params);
    
    return this.searchRides({
      from: params.from,
      to: params.to,
      date: params.date,
      passengers: params.passengers,
      radiusKm: params.radiusKm,
      maxResults: params.maxResults
    });
  }

  // ✅✅✅ Busca universal simplificada (usando função inteligente)
  async searchRidesUniversal(params: { 
    from?: string; 
    to?: string; 
    lat?: number;
    lng?: number;
    toLat?: number;
    toLng?: number;
    radiusKm?: number;
    maxResults?: number;
  }): Promise<any> {
    console.log('🌍 [API] Busca universal:', params);
    
    return this.searchRides({
      from: params.from,
      to: params.to,
      radiusKm: params.radiusKm,
      maxResults: params.maxResults
    });
  }

  // ✅✅✅ Busca por proximidade (usando função inteligente)
  async searchNearby(params: { 
    location: string;
    radiusKm?: number;
    passengers?: number;
  }): Promise<any> {
    console.log('📍 [API] Busca por proximidade:', params);
    
    return this.searchRides({
      from: params.location,
      to: params.location,
      radiusKm: params.radiusKm,
      passengers: params.passengers
    });
  }

  // ✅ Endpoint atualizado de /rides-simple/create para /rides
  async createRide(rideData: {
    fromAddress: string;
    toAddress: string;
    fromProvince: string;
    toProvince: string;
    fromCity?: string;
    toCity?: string;
    fromDistrict?: string;
    toDistrict?: string;
    fromLocality?: string;
    toLocality?: string;
    fromLat?: number;
    fromLng?: number;
    toLat?: number;
    toLng?: number;
    departureDate: string;
    departureTime?: string;
    pricePerSeat: number;
    availableSeats: number;
    maxPassengers?: number;
    vehicleType?: string;
    additionalInfo?: string;
  }): Promise<any> {
    const rideDataWithDriver = await this.attachDriverInfo(rideData);
    
    return this.request<any>('POST', '/rides', rideDataWithDriver);
  }

  // ✅ Métodos de gestão de rides mantidos
  async updateRide(rideId: string, rideData: any): Promise<any> {
    const rideDataWithUpdate = await this.attachUpdatedBy(rideData);
    return this.request<any>('PUT', `/rides/${rideId}`, rideDataWithUpdate);
  }

  async deleteRide(rideId: string): Promise<void> {
    return this.request<void>('DELETE', `/rides/${rideId}`);
  }

  async getRideById(rideId: string): Promise<any> {
    return this.request<any>('GET', `/rides/${rideId}`);
  }

  async getRidesByDriver(driverId: string, status?: string): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (status) searchParams.append('status', status);
    
    return this.request<any[]>('GET', `/rides/driver/${driverId}?${searchParams.toString()}`);
  }

  // ✅✅✅ Estatísticas de matching
  async getRideMatchStats(from: string, to: string): Promise<any> {
    console.log('📊 [API] Buscando estatísticas de matching:', { from, to });
    
    const searchParams = new URLSearchParams();
    searchParams.append('from', from);
    searchParams.append('to', to);
    
    return this.request<any>('GET', `/rides/match-stats?${searchParams.toString()}`);
  }

  // ===== HOTEL WIZARD API =====
  
  /**
   * Criar hotel completo
   * ✅ CORREÇÃO: Alinhado com backend - POST /hotels
   */
  async createHotel(hotelData: any): Promise<{ hotelId: string; success: boolean; message: string }> {
    const hotelDataWithHost = await this.attachHostInfo(hotelData);
    console.log('🏨 Criando hotel com hostId:', hotelDataWithHost.hostId);

    return this.request<{ hotelId: string; success: boolean; message: string }>(
      'POST', 
      '/hotels', 
      hotelDataWithHost
    );
  }

  /**
   * Criar tipo de quarto para um hotel
   * ✅ CORREÇÃO: Endpoint correto do backend - POST /hotels/:id/room-types
   */
  async createRoomType(hotelId: string, roomTypeData: any): Promise<any> {
    const roomTypeDataWithHost = await this.attachHostInfo(roomTypeData);
    return this.request<any>('POST', `/hotels/${hotelId}/room-types`, roomTypeDataWithHost);
  }

  /**
   * Obter estatísticas de um hotel
   */
  async getHotelStats(hotelId: string): Promise<any> {
    return this.request<any>('GET', `/hotels/${hotelId}/stats`);
  }

  /**
   * Upload de imagens para hotel (usando FormData)
   */
  async uploadHotelImages(hotelId: string, images: File[]): Promise<any> {
    const formData = new FormData();
    formData.append('hotelId', hotelId);
    
    images.forEach((image, index) => {
      formData.append('images', image);
      formData.append(`imageOrder_${index}`, index.toString());
    });

    const headers = await this.getAuthHeaders(false);

    const url = this.buildURL('/hotels/upload-images');
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include'
    });

    await this.throwIfResNotOk(response);
    return response.json();
  }

  /**
   * Obter tipos de quarto de um hotel
   */
  async getRoomTypes(hotelId: string): Promise<any[]> {
    return this.request<any[]>('GET', `/hotels/${hotelId}/room-types`);
  }

  // ===== OFFERS API =====
  async createOffer(offerData: Offer): Promise<Offer> {
    const offerDataWithHost = await this.attachHostInfo(offerData);
    return this.request<Offer>('POST', '/offers', offerDataWithHost);
  }

  async getOffers(params?: { hotelId?: string; date?: string }): Promise<Offer[]> {
    const searchParams = new URLSearchParams();
    if (params?.hotelId) searchParams.append('hotelId', params.hotelId);
    if (params?.date) searchParams.append('date', params.date);
    
    return this.request<Offer[]>('GET', `/offers?${searchParams.toString()}`);
  }

  async getOfferById(offerId: string): Promise<Offer> {
    return this.request<Offer>('GET', `/offers/${offerId}`);
  }

  async deleteOffer(offerId: string): Promise<void> {
    return this.request<void>('DELETE', `/offers/${offerId}`);
  }

  // ===== BOOKINGS API =====
  async bookRide(bookingData: RideBookingRequest): Promise<{ success: boolean; booking: Booking }> {
    const bookingDataWithPassenger = await this.attachUserInfo(bookingData);
    
    return this.request<{ success: boolean; booking: Booking }>('POST', '/bookings/create', bookingDataWithPassenger);
  }

  async bookHotel(bookingData: HotelBookingRequest): Promise<{ success: boolean; booking: Booking }> {
    const bookingDataWithPassenger = await this.attachUserInfo(bookingData);
    return this.request<{ success: boolean; booking: Booking }>('POST', '/bookings/create', bookingDataWithPassenger);
  }

  // ===== MÉTODO UNIFICADO createBooking =====
  async createBooking(
    bookingData: RideBookingRequest | HotelBookingRequest
  ): Promise<{ success: boolean; booking: Booking }> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    const basePayload = {
      guestName: bookingData.guestName || user.displayName || 'Guest',
      guestEmail: bookingData.guestEmail || user.email || '',
      guestPhone: bookingData.guestPhone || '',
      totalPrice: bookingData.totalPrice,
    };

    if ('rideId' in bookingData) {
      const payload: RideBookingRequest = {
        ...basePayload,
        rideId: bookingData.rideId!,
        passengerId: user.uid,
        seatsBooked: bookingData.seatsBooked!,
      };

      return this.bookRide(payload);
    } else if ('accommodationId' in bookingData) {
      const payload: HotelBookingRequest = {
        ...basePayload,
        accommodationId: bookingData.accommodationId,
        passengerId: user.uid,
        checkInDate: bookingData.checkInDate!,
        checkOutDate: bookingData.checkOutDate!,
      };

      return this.bookHotel(payload);
    } else {
      throw new Error('Booking must have rideId or accommodationId');
    }
  }

  async getUserBookings(): Promise<Booking[]> {
    return this.request<Booking[]>('GET', '/bookings/user');
  }

  // ===== USER/AUTH API =====
  async getUserProfile(): Promise<any> {
    return this.request<any>('GET', '/auth/profile');
  }

  async updateUserProfile(userData: any): Promise<any> {
    const userDataWithUpdate = await this.attachUpdatedBy(userData);
    return this.request<any>('PUT', '/auth/profile', userDataWithUpdate);
  }

  async register(userData: any): Promise<any> {
    return this.request<any>('POST', '/auth/register', userData);
  }

  async checkUser(): Promise<any> {
    return this.request<any>('GET', '/auth/check');
  }

  async refresh(): Promise<any> {
    return this.request<any>('POST', '/auth/refresh');
  }

  // ===== HOTELS API =====
  
  /**
   * Obter todos os hotéis de um usuário (host)
   * ✅ CORREÇÃO: Endpoint correto - GET /hotels/host/me (usa token para inferir host)
   */
  async getUserHotels(): Promise<any[]> {
    return this.request<any[]>('GET', '/hotels/host/me');
  }

  /**
   * Obter acomodações do usuário (alias para getUserHotels para compatibilidade)
   */
  async getUserAccommodations(): Promise<any[]> {
    return this.getUserHotels();
  }

  async searchAccommodations(params: { location?: string; checkIn?: string; checkOut?: string; guests?: number }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params.location) searchParams.append('address', params.location);
    if (params.checkIn) searchParams.append('checkIn', params.checkIn);
    if (params.checkOut) searchParams.append('checkOut', params.checkOut);
    if (params.guests) searchParams.append('guests', params.guests.toString());
    searchParams.append('isAvailable', 'true');
    
    return this.request<any>('GET', `/hotels?${searchParams.toString()}`);
  }

  async createAccommodation(accommodationData: any): Promise<any> {
    const { pricePerNight, ...dataWithoutPrice } = accommodationData;
    const accommodationDataWithHost = await this.attachHostInfo(dataWithoutPrice);
    
    console.log('🏠 Criando acomodação com hostId:', accommodationDataWithHost.hostId);
    return this.request<any>('POST', '/hotels', accommodationDataWithHost);
  }

  // ===== HOTELS DETAIL/UPDATE/DELETE API =====
  async getHotelById(hotelId: string): Promise<HotelPartner> {
    return this.request<HotelPartner>('GET', `/hotels/${hotelId}`);
  }

  async updateAccommodation(hotelId: string, accommodationData: any): Promise<any> {
    const { pricePerNight, ...dataWithoutPrice } = accommodationData;
    const accommodationDataWithUpdate = await this.attachUpdatedBy(dataWithoutPrice);
    
    return this.request<any>('PUT', `/hotels/${hotelId}`, accommodationDataWithUpdate);
  }

  async deleteAccommodation(hotelId: string): Promise<void> {
    return this.request<void>('DELETE', `/hotels/${hotelId}`);
  }

  // ===== ROOMS API =====
  async getRoomsByHotel(hotelId: string): Promise<any[]> {
    return this.request<any[]>('GET', `/hotels/${hotelId}/rooms`);
  }

  /**
   * ✅ CORREÇÃO: Obtém um room-type específico com hotelId
   * Backend usa: GET /hotels/:hotelId/room-types/:roomTypeId
   */
  async getRoomById(hotelId: string, roomTypeId: string): Promise<any> {
    return this.request<any>('GET', `/hotels/${hotelId}/room-types/${roomTypeId}`);
  }

  /**
   * ✅ CORREÇÃO: Atualiza um room-type específico com hotelId
   * Backend usa: PUT /hotels/:hotelId/room-types/:roomTypeId
   */
  async updateRoom(hotelId: string, roomTypeId: string, roomData: any): Promise<any> {
    const roomDataWithUpdate = await this.attachUpdatedBy(roomData);
    return this.request<any>('PUT', `/hotels/${hotelId}/room-types/${roomTypeId}`, roomDataWithUpdate);
  }

  /**
   * ✅ CORREÇÃO: Remove um room-type específico com hotelId
   * Backend usa: DELETE /hotels/:hotelId/room-types/:roomTypeId
   */
  async deleteRoom(hotelId: string, roomTypeId: string): Promise<void> {
    return this.request<void>('DELETE', `/hotels/${hotelId}/room-types/${roomTypeId}`);
  }

  // ===== ROOM TYPES API =====
  async getRoomTypesByHotel(hotelId: string): Promise<any[]> {
    return this.request<any[]>('GET', `/hotels/${hotelId}/room-types`);
  }

  /**
   * ✅ CORREÇÃO: Atualiza um tipo de quarto específico com hotelId
   * Backend usa: PUT /hotels/:hotelId/room-types/:roomTypeId
   */
  async updateRoomType(hotelId: string, roomTypeId: string, roomTypeData: any): Promise<any> {
    const roomTypeDataWithUpdate = await this.attachUpdatedBy(roomTypeData);
    return this.request<any>('PUT', `/hotels/${hotelId}/room-types/${roomTypeId}`, roomTypeDataWithUpdate);
  }

  /**
   * ✅ CORREÇÃO: Remove um tipo de quarto específico com hotelId
   * Backend usa: DELETE /hotels/:hotelId/room-types/:roomTypeId
   */
  async deleteRoomType(hotelId: string, roomTypeId: string): Promise<void> {
    return this.request<void>('DELETE', `/hotels/${hotelId}/room-types/${roomTypeId}`);
  }

  // ===== ADMIN API =====
  async getAdminStats(): Promise<any> {
    return this.request<any>('GET', '/admin/stats');
  }

  async getAdminRides(): Promise<any> {
    return this.request<any>('GET', '/admin/rides');
  }

  async getAdminBookings(): Promise<any> {
    return this.request<any>('GET', '/admin/bookings');
  }

  // ===== PARTNERSHIPS API =====
  
  async getHotelPartnershipsProposals(): Promise<any> {
    return this.request('GET', '/hotel/partnerships/proposals');
  }

  async createHotelPartnershipProposal(data: any): Promise<any> {
    const dataWithHost = await this.attachHostInfo(data);
    return this.request('POST', '/hotel/partnerships/proposals', dataWithHost);
  }

  async getProposalApplications(proposalId: string): Promise<any> {
    return this.request('GET', `/hotel/partnerships/proposals/${proposalId}/applications`);
  }

  async updateApplicationStatus(applicationId: string, statusData: { status: string; feedback?: string }): Promise<any> {
    const statusDataWithUpdate = await this.attachUpdatedBy(statusData);
    return this.request('PUT', `/hotel/partnerships/applications/${applicationId}/status`, statusDataWithUpdate);
  }

  async getAvailableProposals(filters?: { city?: string; driverLevel?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.city) params.append('city', filters.city);
    if (filters?.driverLevel) params.append('driverLevel', filters.driverLevel);
    
    return this.request('GET', `/partnerships/proposals/available?${params}`);
  }

  async acceptProposal(proposalId: string): Promise<any> {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    
    const payload = await this.attachDriverInfo({ proposalId });
    return this.request('POST', `/driver/partnerships/proposals/${proposalId}/accept`, payload);
  }

  async getDriverApplications(): Promise<any> {
    return this.request('GET', '/driver/partnerships/applications');
  }

  async getDriverPartnerships(): Promise<any> {
    return this.request('GET', '/driver/partnerships');
  }

  // Métodos existentes de partnerships
  async createPartnership(partnershipData: { partnerId: string; type: 'driver-hotel' | 'hotel-driver'; terms: string }): Promise<any> {
    const partnershipDataWithUser = await this.attachUserInfo(partnershipData);
    return this.request<any>('POST', '/partnerships/create', partnershipDataWithUser);
  }

  async getPartnershipRequests(): Promise<any> {
    return this.request<any>('GET', '/partnerships/requests');
  }

  // ===== EVENTS API =====
  async getEvents(): Promise<any> {
    return this.request<any>('GET', '/events');
  }

  async createEvent(eventData: any): Promise<any> {
    const eventDataWithHost = await this.attachHostInfo(eventData);
    return this.request<any>('POST', '/events/create', eventDataWithHost);
  }

  // ===== FEATURED OFFERS API =====
  async getFeaturedOffers(): Promise<Offer[]> {
    return this.request<Offer[]>('GET', '/offers/featured');
  }

  // ===== CHAT API =====
  async getChatRooms(): Promise<any> {
    return this.request<any>('GET', '/chat/rooms');
  }

  async getChatMessages(roomId: string): Promise<any> {
    return this.request<any>('GET', `/chat/messages/${roomId}`);
  }

  async sendMessage(roomId: string, message: string): Promise<any> {
    return this.request<any>('POST', `/chat/messages/${roomId}`, { message });
  }

  // ===== NOVOS MÉTODOS PARA HOTEL MANAGEMENT =====
  
  /**
   * Atualizar hotel completo
   * ✅ CORREÇÃO: Endpoint correto - PUT /hotels/:id
   */
  async updateHotel(hotelId: string, hotelData: any): Promise<any> {
    const hotelDataWithUpdate = await this.attachUpdatedBy(hotelData);
    return this.request<any>('PUT', `/hotels/${hotelId}`, hotelDataWithUpdate);
  }

  /**
   * Obter disponibilidade de quartos
   */
  async getRoomAvailability(hotelId: string, checkIn: string, checkOut: string): Promise<any> {
    const searchParams = new URLSearchParams();
    searchParams.append('checkIn', checkIn);
    searchParams.append('checkOut', checkOut);
    
    return this.request<any>('GET', `/hotels/${hotelId}/availability?${searchParams.toString()}`);
  }

  /**
   * Obter reviews de um hotel
   */
  async getHotelReviews(hotelId: string): Promise<any[]> {
    return this.request<any[]>('GET', `/hotels/${hotelId}/reviews`);
  }

  /**
   * Criar review para um hotel
   */
  async createHotelReview(hotelId: string, reviewData: any): Promise<any> {
    const reviewDataWithUser = await this.attachUserInfo(reviewData);
    return this.request<any>('POST', `/hotels/${hotelId}/reviews`, reviewDataWithUser);
  }
}

export const apiService = new ApiService();
export default apiService;