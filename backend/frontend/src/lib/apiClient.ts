// API Client que usa Mock Service quando backend não está disponível
import { MockApiService } from "../services/mockApi";

// ===== INTERFACES TIPADAS =====

export interface CreateRideRequest {
  fromLocation: string;
  toLocation: string;
  fromAddress?: string;
  toAddress?: string;
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  availableSeats: number;
  maxPassengers?: number;
  vehicleType: string;
  additionalInfo?: string;
  description?: string;
  driverId: string;
  allowNegotiation?: boolean;
  isRecurring?: boolean;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
}

export interface SearchRidesParams {
  fromLocation?: string;
  toLocation?: string;
  passengers?: number;
  departureDate?: string;
  availableSeats?: number;
  pricePerSeatMax?: number;
}

export interface CreateBookingRequest {
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerEmail?: string;
  passengerPhone?: string;
  seats: number;
  totalPrice: number;
  status?: string;
  notes?: string;
}

export interface SearchAccommodationsParams {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export interface CreateAccommodationRequest {
  name: string;
  type: string;
  address: string;
  lat?: number;
  lng?: number;
  rating?: number;
  images?: string[];
  amenities?: string[];
  description?: string;
  hostId?: string;
  pricePerNight?: number;
  reviewCount?: number;
  distanceFromCenter?: number;
  isAvailable?: boolean;
  offerDriverDiscounts?: boolean;
  driverDiscountRate?: number;
  minimumDriverLevel?: string;
  partnershipBadgeVisible?: boolean;
  enablePartnerships?: boolean;
  accommodationDiscount?: number;
  transportDiscount?: number;
}

// ===== UTILITY FUNCTIONS =====

// ✅ CORREÇÃO: Função para obter mensagem de erro de forma segura
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return 'Unknown error occurred';
  }
}

// ✅ CORREÇÃO: Função para converter SearchRidesParams para formato compatível com MockApiService
function convertSearchRidesParams(params: SearchRidesParams): { 
  from?: string; 
  to?: string; 
  passengers?: string; 
  date?: string; 
} {
  return {
    from: params.fromLocation,
    to: params.toLocation,
    passengers: params.passengers !== undefined ? params.passengers.toString() : undefined,
    date: params.departureDate
  };
}

// ===== BACKEND AVAILABILITY CHECK =====

// ✅ CORREÇÃO: Timeout compatível com todos os navegadores
async function isBackendAvailable(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch("/api/health", {
      method: "GET",
      signal: controller.signal,
    });
    return response.ok;
  } catch (error: unknown) {
    console.error("❌ Backend health check failed:", getErrorMessage(error));
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ===== API CLIENT =====

export class ApiClient {
  private static useBackend = true;
  private static backendCheckPromise: Promise<boolean> | null = null;

  // ✅ CORREÇÃO: Função auxiliar para obter headers de autenticação
  private static getAuthHeaders(contentType: string = 'application/json'): HeadersInit {
    const firebaseToken = localStorage.getItem('firebaseToken') as string | null;
    const finalToken = firebaseToken;
    
    const headers: HeadersInit = {
      'Content-Type': contentType
    };
    
    if (finalToken) {
      headers['Authorization'] = `Bearer ${finalToken}`;
    }
    
    return headers;
  }

  // ✅ CORREÇÃO: Função auxiliar para obter headers sem Content-Type (para GET requests)
  private static getAuthHeadersWithoutContentType(): HeadersInit {
    const firebaseToken = localStorage.getItem('firebaseToken') as string | null;
    const finalToken = firebaseToken;
    
    const headers: HeadersInit = {};
    
    if (finalToken) {
      headers['Authorization'] = `Bearer ${finalToken}`;
    }
    
    return headers;
  }

  // ✅ CORREÇÃO: Singleton promise para evitar condições de corrida
  static async checkBackend(): Promise<boolean> {
    if (!this.backendCheckPromise) {
      this.backendCheckPromise = isBackendAvailable();
    }

    this.useBackend = await this.backendCheckPromise;
    console.log(`🔗 Using ${this.useBackend ? "real backend" : "mock service"}`);
    return this.useBackend;
  }

  // ✅ CORREÇÃO: Função auxiliar para verificar backend antes de operações críticas
  private static async ensureBackendChecked(): Promise<boolean> {
    if (this.backendCheckPromise === null) {
      return await this.checkBackend();
    }
    return this.useBackend;
  }

  // ✅ CORREÇÃO: Função auxiliar para tratamento de erros consistente
  private static async handleApiCall<T>(
    backendCall: () => Promise<T>,
    mockCall: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const isBackendReady = await this.ensureBackendChecked();

    try {
      if (isBackendReady) {
        console.log(`📝 API: ${operationName}`);
        return await backendCall();
      }
    } catch (error: unknown) {
      console.error(`❌ API Error in ${operationName}:`, getErrorMessage(error));
      
      // ✅ CORREÇÃO: Só usar fallback para erros de rede/timeout
      if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')) {
        console.log(`🔄 Fallback to mock service for ${operationName}`);
        this.useBackend = false;
      } else {
        // Re-throw outros erros (validação, autorização, etc.)
        throw error;
      }
    }

    // Usar mock service se backend não disponível ou erro de rede
    console.log(`🔄 Using mock service for ${operationName}`);
    return await mockCall();
  }

  // ===== RIDES API =====

  // ✅ CORREÇÃO: Tipagem adequada com autenticação
  static async createRide(rideData: CreateRideRequest) {
    return this.handleApiCall(
      async () => {
        // ✅ CORREÇÃO: Validar dados antes de enviar
        this.validateRideData(rideData);

        const response = await fetch("/api/rides", {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(rideData),
        });

        if (!response.ok) {
          // ✅ CORREÇÃO: Tratar erro de autenticação
          if (response.status === 401) {
            throw new Error("Não autenticado. Faça login novamente.");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return await response.json();
      },
      () => MockApiService.createRide(rideData),
      "Criando rota"
    );
  }

  // ✅ CORREÇÃO: Tipagem adequada e query params padronizados
  static async searchRides(params: SearchRidesParams) {
    return this.handleApiCall(
      async () => {
        const searchParams = new URLSearchParams();

        // ✅ CORREÇÃO: Query params padronizados e convertidos para string
        if (params.fromLocation) searchParams.append("from", params.fromLocation);
        if (params.toLocation) searchParams.append("to", params.toLocation);
        if (params.passengers !== undefined) searchParams.append("passengers", params.passengers.toString());
        if (params.departureDate) searchParams.append("date", params.departureDate);
        if (params.availableSeats !== undefined) searchParams.append("availableSeats", params.availableSeats.toString());
        if (params.pricePerSeatMax !== undefined) searchParams.append("pricePerSeatMax", params.pricePerSeatMax.toString());

        // ✅✅✅ CORREÇÃO CRÍTICA: Mudar de /api/rides/search para /api/rides/smart/search
        const response = await fetch(`/api/rides/smart/search?${searchParams.toString()}`, {
          headers: this.getAuthHeadersWithoutContentType(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return await response.json();
      },
      async () => {
        // ✅ CORREÇÃO: Converter parâmetros para formato compatível com MockApiService
        const mockParams = convertSearchRidesParams(params);
        const result = await MockApiService.searchRides(mockParams);
        return {
          success: true,
          rides: result.rides,
          message: `Encontradas ${result.rides.length} viagens disponíveis`,
          pagination: result.pagination,
        };
      },
      "Buscando viagens"
    );
  }

  // ===== ACCOMMODATIONS API =====

  // ✅ CORREÇÃO: Tipagem adequada e query params padronizados
  static async searchAccommodations(params: SearchAccommodationsParams) {
    return this.handleApiCall(
      async () => {
        const searchParams = new URLSearchParams();

        // ✅ CORREÇÃO: Query params padronizados e convertidos para string
        if (params.location) searchParams.append("location", params.location);
        if (params.checkIn) searchParams.append("checkIn", params.checkIn);
        if (params.checkOut) searchParams.append("checkOut", params.checkOut);
        if (params.guests !== undefined) searchParams.append("guests", params.guests.toString());

        const response = await fetch(`/api/accommodations/search?${searchParams.toString()}`, {
          headers: this.getAuthHeadersWithoutContentType(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return await response.json();
      },
      async () => {
        // ✅ CORREÇÃO: Converter parâmetros para formato compatível com MockApiService
        const mockParams = {
          location: params.location,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          guests: params.guests !== undefined ? params.guests.toString() : undefined
        };
        return await MockApiService.searchAccommodations(mockParams);
      },
      "Buscando acomodações"
    );
  }

  // ✅ CORREÇÃO: Validação de dados com autenticação
  static async createAccommodation(data: CreateAccommodationRequest) {
    return this.handleApiCall(
      async () => {
        // ✅ CORREÇÃO: Validar dados antes de enviar
        this.validateAccommodationData(data);

        const response = await fetch('/api/accommodations', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          // ✅ CORREÇÃO: Tratar erro de autenticação
          if (response.status === 401) {
            throw new Error("Não autenticado. Faça login novamente.");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar acomodação');
        }

        return await response.json();
      },
      () => MockApiService.createAccommodation(data),
      "Criando acomodação"
    );
  }

  // ===== BOOKINGS API =====

  // ✅ CORREÇÃO: Tipagem adequada com autenticação
  static async createBooking(bookingData: CreateBookingRequest) {
    return this.handleApiCall(
      async () => {
        // ✅ CORREÇÃO: Validar dados antes de enviar
        this.validateBookingData(bookingData);

        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(bookingData),
        });

        if (!response.ok) {
          // ✅ CORREÇÃO: Tratar erro de autenticação
          if (response.status === 401) {
            throw new Error("Não autenticado. Faça login novamente.");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return await response.json();
      },
      () => MockApiService.createBooking(bookingData),
      "Criando reserva"
    );
  }

  // ===== VALIDATION METHODS =====

  private static validateRideData(data: CreateRideRequest): void {
    if (!data.fromLocation || !data.toLocation) {
      throw new Error("Origem e destino são obrigatórios");
    }
    if (!data.departureDate || !data.departureTime) {
      throw new Error("Data e hora de partida são obrigatórias");
    }
    if (data.pricePerSeat <= 0) {
      throw new Error("Preço por lugar deve ser maior que zero");
    }
    if (data.availableSeats < 1 || data.availableSeats > 8) {
      throw new Error("Número de lugares deve estar entre 1 e 8");
    }
    if (!data.vehicleType) {
      throw new Error("Tipo de veículo é obrigatório");
    }
  }

  private static validateAccommodationData(data: CreateAccommodationRequest): void {
    if (!data.name || !data.type || !data.address) {
      throw new Error("Nome, tipo e endereço são obrigatórios");
    }
    if (data.pricePerNight && data.pricePerNight < 0) {
      throw new Error("Preço por noite não pode ser negativo");
    }
  }

  private static validateBookingData(data: CreateBookingRequest): void {
    if (!data.rideId || !data.passengerId || !data.passengerName) {
      throw new Error("ID da viagem, ID do passageiro e nome são obrigatórios");
    }
    if (data.seats < 1) {
      throw new Error("Número de lugares deve ser maior que zero");
    }
    if (data.totalPrice <= 0) {
      throw new Error("Preço total deve ser maior que zero");
    }
  }

  // ===== HEALTH CHECK =====
  static async healthCheck() {
    return this.handleApiCall(
      async () => {
        const response = await fetch("/api/health", {
          headers: this.getAuthHeadersWithoutContentType(),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      },
      () => MockApiService.healthCheck(),
      "Health check"
    );
  }

  // ===== AUTH UTILITIES =====
  
  // ✅ CORREÇÃO: Verificar se usuário está autenticado
  static isAuthenticated(): boolean {
    const firebaseToken = localStorage.getItem('firebaseToken') as string | null;
    return !!firebaseToken;
  }

  // ✅ CORREÇÃO: Obter token (útil para debug)
  static getToken(): string | null {
    const firebaseToken = localStorage.getItem('firebaseToken') as string | null;
    return firebaseToken;
  }

  // ===== MANUAL CONTROL =====
  static forceMockMode(): void {
    this.useBackend = false;
    console.log("🔧 Mock mode forced");
  }

  static forceBackendMode(): void {
    this.useBackend = true;
    this.backendCheckPromise = null;
    console.log("🔧 Backend mode forced");
  }

  // ===== STATUS =====
  static getCurrentMode(): string {
    return this.useBackend ? "backend" : "mock";
  }
}

// ✅ CORREÇÃO: Inicialização assíncrona controlada
let initializationPromise: Promise<boolean> | null = null;

export async function initializeApiClient(): Promise<boolean> {
  if (!initializationPromise) {
    initializationPromise = ApiClient.checkBackend();
  }
  return await initializationPromise;
}

// Inicializar API Client (para uso em app startup)
initializeApiClient().then(backendAvailable => {
  console.log(`🚀 API Client initialized - Backend ${backendAvailable ? 'available' : 'unavailable'}`);
});