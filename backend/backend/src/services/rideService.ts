import { db } from "../../db";
import { rides, vehicles } from "../../shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { formatDateOnly, formatTimeOnly, formatLongDate, formatWeekday } from '../utils/dateFormatter';
import { v4 as uuidv4 } from 'uuid';
import { insertRideSchema } from "../../shared/schema";
import { z } from "zod";

// 🆕 Import do serviço de comissões automáticas
import providerPaymentService from "../modules/payments/providerPaymentService";

// ✅ MAPEAMENTO PARA TIPOS DE VEÍCULO
const VEHICLE_TYPE_DISPLAY: Record<string, { label: string; icon: string }> = {
  economy: { label: 'Económico', icon: '🚗' },
  comfort: { label: 'Conforto', icon: '🚙' },
  luxury: { label: 'Luxo', icon: '🏎️' },
  family: { label: 'Familiar', icon: '🚐' },
  cargo: { label: 'Carga', icon: '🚚' },
  motorcycle: { label: 'Moto', icon: '🏍️' }
};

// ✅ FUNÇÃO AUXILIAR PARA FORMATAR DATA/HORA
function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  return `${formatDateOnly(d)} ${formatTimeOnly(d)}`;
}

// ✅✅✅ FUNÇÃO DE NORMALIZAÇÃO CORRIGIDA - TOLERANTE A TODOS OS CASES + PREÇOS SEMPRE NUMBER
function normalizeDbRideToDto(raw: any) {
  // ✅ HELPER: lê um campo aceitando TODOS os cases possíveis
  //    (camelCase, snake_case, lowercase) — resolve o bug de 0 values
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') return raw[k];
    }
    return undefined;
  };

  const toNum = (v: any, fallback = 0) => {
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  };

  // ✅ Função para formatar matrícula moçambicana
  const formatVehiclePlate = (plate: string) => {
    if (!plate) return null;
    // Formatar: "MAT-123-AB" → "MAT 123 AB"
    return plate.replace(/-/g, ' ').toUpperCase();
  };

  // ✅ VALORES — agora aceitam "availableSeats" E "availableseats"
  const pricePerSeatValue = toNum(pick('pricePerSeat', 'priceperseat', 'price_per_seat'), 0);
  const availableSeatsValue = toNum(pick('availableSeats', 'availableseats', 'available_seats'), 0);
  const maxPassengersValue = toNum(pick('maxPassengers', 'max_passengers', 'maxpassengers'), 4);
  const driverRatingValue = pick('driver_rating', 'driverRating') != null
    ? toNum(pick('driver_rating', 'driverRating'))
    : null;

  // ✅ DATAS — aceitam "departureDate" E "departuredate"
  const rawDepartureDate = pick('departureDate', 'departuredate', 'departure_date');
  const rawDepartureTime = pick('departureTime', 'departuretime', 'departure_time');
  const rawCreatedAt = pick('createdAt', 'createdat', 'created_at');
  const rawUpdatedAt = pick('updatedAt', 'updatedat', 'updated_at');

  // ✅✅✅ BUG X: combinar data (dia) + hora (texto "HH:mm") num único Date
  //    departureDate vem como timestamp a 00:00; a hora real está em departureTime.
  let departureDateTime: Date | null = null;
  if (rawDepartureDate) {
    const base = new Date(rawDepartureDate);
    if (!isNaN(base.getTime())) {
      if (rawDepartureTime && /^\d{1,2}:\d{2}/.test(String(rawDepartureTime))) {
        const [h, m] = String(rawDepartureTime).split(':').map(Number);
        base.setHours(h || 0, m || 0, 0, 0);
      }
      departureDateTime = base;
    }
  }

  // ✅ DADOS DO VEÍCULO - CORREÇÃO: Buscar informações completas do veículo
  const vehicleInfo = pick('vehicle_id', 'vehicle_uuid', 'vehicleId') ? {
    id: pick('vehicle_id', 'vehicle_uuid', 'vehicleId'),
    make: pick('vehicle_make', 'vehicleMake') || null,
    model: pick('vehicle_model', 'vehicleModel') || null,
    color: pick('vehicle_color', 'vehicleColor') || null,
    plateNumber: formatVehiclePlate(pick('vehicle_plate', 'vehiclePlate')),
    plateNumberRaw: pick('vehicle_plate', 'vehiclePlate') || null,
    type: pick('vehicle_type', 'vehicleType') || null,
    typeDisplay: VEHICLE_TYPE_DISPLAY[pick('vehicle_type', 'vehicleType')]?.label || 'Veículo',
    maxPassengers: toNum(pick('vehicle_max_passengers', 'vehicleMaxPassengers'), maxPassengersValue)
  } : null;

  return {
    // Identificação
    id: pick('ride_id', 'id'),
    driverId: pick('driver_id', 'driverId'),
    
    // Informações do motorista
    // ✅✅✅ ALTERAÇÃO 2 (Fase 2.4): prioriza nome real do JOIN
    driverName: pick('driver_user_name', 'driver_name', 'driverName') || null,
    driverRating: driverRatingValue,
    
    // Localização - origem
    fromAddress: pick('from_address', 'fromAddress') || null,
    fromCity: pick('from_city', 'fromCity') || null,
    fromDistrict: pick('from_district', 'fromDistrict') || null,
    fromProvince: pick('from_province', 'fromProvince') || null,
    fromLocality: pick('from_locality', 'fromLocality') || null,
    from_geom: raw.from_geom || null,
    
    // Localização - destino
    toAddress: pick('to_address', 'toAddress') || null,
    toCity: pick('to_city', 'toCity') || null,
    toDistrict: pick('to_district', 'toDistrict') || null,
    toProvince: pick('to_province', 'toProvince') || null,
    toLocality: pick('to_locality', 'toLocality') || null,
    to_geom: raw.to_geom || null,
    
    // ✅ DATAS FORMATADAS — agora com data+hora combinadas e guarda contra Invalid Date
    departureDate: departureDateTime ? departureDateTime.toISOString() : null,
    departureDateFormatted: departureDateTime ? formatDateOnly(departureDateTime) : null, // "20/12/2025"
    departureTimeFormatted: departureDateTime ? formatTimeOnly(departureDateTime) : null, // "14:30" (24h)
    departureDateTimeFormatted: departureDateTime ? formatDateTime(departureDateTime) : null, // "20/12/2025 14:30"
    departureLongDate: departureDateTime ? formatLongDate(departureDateTime) : null, // "Sexta-feira, 20 de Dezembro de 2025"
    departureWeekday: departureDateTime ? formatWeekday(departureDateTime) : null, // "Sexta-feira"
    departureTime: rawDepartureTime || null,
    
    // ✅ INFORMAÇÕES COMPLETAS DO VEÍCULO COM MATRÍCULA
    vehicle_uuid: pick('vehicle_uuid', 'vehicle_id', 'vehicleId') || null,
    vehicleInfo: vehicleInfo,
    vehicle: `${pick('vehicle_make', 'vehicleMake') || ''} ${pick('vehicle_model', 'vehicleModel') || ''}`.trim() || null,
    vehicleType: pick('vehicle_type', 'vehicleType') || null,
    vehiclePlate: formatVehiclePlate(pick('vehicle_plate', 'vehiclePlate')), // "MAT 123 AB"
    vehiclePlateRaw: pick('vehicle_plate', 'vehiclePlate') || null, // Original: "MAT-123-AB"
    vehicleColor: pick('vehicle_color', 'vehicleColor') || null,
    vehicleMake: pick('vehicle_make', 'vehicleMake') || null,
    vehicleModel: pick('vehicle_model', 'vehicleModel') || null,
    maxPassengers: maxPassengersValue,
    
    // ✅✅✅ CORREÇÃO: Disponibilidade e preço SEMPRE como number
    availableSeats: availableSeatsValue,
    pricePerSeat: pricePerSeatValue, // ← AGORA SEMPRE number (nunca null)

    // ✅ Lugares reservados / total (para a UI mostrar "X reservados")
    bookedSeats: toNum(pick('bookedSeats', 'bookedseats', 'booked_seats'), 0),
    bookingsCount: toNum(pick('bookingsCount', 'bookingscount', 'bookings_count'), 0),
    
    // Campos adicionais do schema
    additionalInfo: pick('additionalInfo', 'additionalinfo', 'additional_info') || null,
    distance_real_km: pick('distance_real_km') != null ? toNum(pick('distance_real_km')) : null,
    polyline: raw.polyline || null,
    type: raw.type || 'regular',
    
    // Metadados
    distanceFromUserKm: pick('distance_from_city_km') != null ? toNum(pick('distance_from_city_km')) : null,
    matchType: pick('match_type', 'matchType') || null,
    status: raw.status || 'available',
    searchMetadata: pick('search_metadata', 'searchMetadata') || null,
    
    // Timestamps
    createdAt: rawCreatedAt ? new Date(rawCreatedAt).toISOString() : null,
    updatedAt: rawUpdatedAt ? new Date(rawUpdatedAt).toISOString() : null,

    // ✅ NOVOS CAMPOS DA FUNÇÃO get_rides_smart_final
    ride_id: pick('ride_id', 'id'),
    driver_id: pick('driver_id', 'driverId'),
    driver_name: pick('driver_name', 'driverName'),
    driver_rating: pick('driver_rating', 'driverRating'),
    vehicle_make: pick('vehicle_make', 'vehicleMake'),
    vehicle_model: pick('vehicle_model', 'vehicleModel'),
    vehicle_type: pick('vehicle_type', 'vehicleType'),
    vehicle_plate: pick('vehicle_plate', 'vehiclePlate'),
    vehicle_color: pick('vehicle_color', 'vehicleColor'),
    max_passengers: pick('max_passengers', 'maxPassengers', 'maxpassengers'),
    from_city: pick('from_city', 'fromCity'),
    to_city: pick('to_city', 'toCity'),
    from_lat: pick('from_lat', 'fromLat'),
    from_lng: pick('from_lng', 'fromLng'),
    to_lat: pick('to_lat', 'toLat'),
    to_lng: pick('to_lng', 'toLng'),
    departuredate: rawDepartureDate,
    availableseats: pick('availableseats', 'availableSeats', 'available_seats'),
    priceperseat: pick('priceperseat', 'pricePerSeat', 'price_per_seat'),
    distance_from_city_km: pick('distance_from_city_km'),
    distance_to_city_km: pick('distance_to_city_km'),
    direction_score: pick('direction_score')
  };
}

// ✅ NORMALIZADOR CORRIGIDO - APENAS DRIZZLE SQL
class LocationNormalizerCorrigido {
  static async normalizeLocation(locationName: string): Promise<string> {
    if (!locationName || locationName.trim() === '') {
      return locationName;
    }

    try {
      console.log('🔍 [NORMALIZADOR] Normalizando:', locationName);
      
      // ✅ CORREÇÃO: Usar sql do Drizzle - NUNCA db.query() ou db.execute()
      const result = await db.execute(
        sql`SELECT normalize_location_name(${locationName}) as normalized`
      );

      // ✅ Extração segura do resultado do Drizzle
      let normalizedValue: string = locationName.split(',')[0].trim().toLowerCase();
      
      if (result && Array.isArray(result) && result.length > 0) {
        normalizedValue = (result[0] as any)?.normalized || normalizedValue;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        const rows = (result as any).rows;
        normalizedValue = rows[0]?.normalized || normalizedValue;
      }

      console.log('✅ [NORMALIZADOR] Resultado:', {
        original: locationName,
        normalized: normalizedValue
      });

      return normalizedValue;

    } catch (error: any) {
      console.error('❌ [NORMALIZADOR] Erro, usando fallback:', error.message || error);
      return locationName.split(',')[0].trim().toLowerCase();
    }
  }

  static normalizeForSearch(locationName: string): string {
    console.warn('⚠️ [NORMALIZADOR] Usando normalizeForSearch síncrono');
    return locationName.split(',')[0].trim().toLowerCase();
  }
}

// ✅ INTERFACE SIMPLIFICADA - USANDO APENAS OS CAMPOS ESSENCIAIS
interface CreateRideBaseData {
  driverId: string;
  fromAddress: string;
  toAddress: string;
  departureDate: Date;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  driverName?: string;
  fromCity?: string;
  toCity?: string;
  fromProvince?: string;
  toProvince?: string;
  vehicleId?: string;
  vehicleType?: string;
  additionalInfo?: string;
}

export class RideService {
  
  // 🎯 MÉTODO UNIVERSAL CENTRALIZADO - CORRIGIDO PARA USAR get_rides_smart_final
  async getRidesUniversal(params: {
    fromLocation?: string;
    toLocation?: string;
    userLat?: number;
    userLng?: number;
    toLat?: number;
    toLng?: number;
    radiusKm?: number;
    maxResults?: number;
    status?: string;
  }): Promise<any[]> {
    try {
      const {
        fromLocation,
        toLocation,
        userLat,
        userLng,
        toLat,
        toLng,
        radiusKm = 100,
        maxResults = 50, // ✅ Aumentado para 50
      } = params;

      // ✅ CORREÇÃO: Usar normalizador assíncrono
      const normalizedFrom = fromLocation ? await LocationNormalizerCorrigido.normalizeLocation(fromLocation) : '';
      const normalizedTo = toLocation ? await LocationNormalizerCorrigido.normalizeLocation(toLocation) : '';

      console.log('🎯 [NORMALIZAÇÃO-CORRIGIDA]', {
        original: { from: fromLocation, to: toLocation },
        normalized: { from: normalizedFrom, to: normalizedTo },
        radius: radiusKm,
        maxResults
      });

      // ✅✅✅ CORREÇÃO: Usar get_rides_smart_final com todos os parâmetros
      const result = await db.execute(
        sql`SELECT * FROM get_rides_smart_final(
          ${normalizedFrom || ''}, 
          ${normalizedTo || ''}, 
          ${radiusKm},
          ${maxResults}
        )`
      );

      // ✅ Extração segura dos resultados
      let rows: any[] = [];
      
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        rows = (result as any).rows;
      } else if (result && typeof result === 'object') {
        const arrayProperties = Object.values(result).filter(val => Array.isArray(val));
        if (arrayProperties.length > 0) {
          rows = arrayProperties[0] as any[];
        }
      }
      
      console.log('✅ [SMART-SERVICE] Resultados processados:', {
        totalEncontrado: rows.length,
        primeiroResultado: rows[0] ? {
          id: rows[0].ride_id,
          from: rows[0].from_city,
          to: rows[0].to_city,
          match_type: rows[0].match_type,
          direction_score: rows[0].direction_score
        } : 'Nenhum'
      });

      // ✅ APLICAÇÃO DA NORMALIZAÇÃO PARA FRONTEND
      const normalizedRides = rows.map(normalizeDbRideToDto);

      console.log('🎯 [NORMALIZAÇÃO-FRONTEND] Rides normalizados:', normalizedRides.length);
      normalizedRides.forEach((ride: any, index: number) => {
        console.log(`🎯 Ride ${index + 1}:`, {
          id: ride.id,
          fromCity: ride.fromCity,
          toCity: ride.toCity,
          departureDate: ride.departureDate,
          pricePerSeat: ride.pricePerSeat,
          availableSeats: ride.availableSeats,
          matchType: ride.matchType,
          directionScore: ride.direction_score,
          vehicleInfo: ride.vehicleInfo ? `${ride.vehicleInfo.make} ${ride.vehicleInfo.model}` : 'Sem veículo'
        });
      });
      
      return normalizedRides;

    } catch (error: any) {
      console.error("❌ Erro em getRidesUniversal:", error.message || error);
      return [];
    }
  }

  // 🔍 BUSCA TRADICIONAL POR TEXTO - CORRIGIDA
  async findRidesExact(fromLocation: string, toLocation: string): Promise<any[]> {
    try {
      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(fromLocation);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(toLocation);

      console.log('🔍 [FIND-EXACT] Busca exata normalizada:', {
        original: { from: fromLocation, to: toLocation },
        normalized: { from: normalizedFrom, to: normalizedTo }
      });

      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        maxResults: 20
      });
    } catch (error: any) {
      console.error("❌ Erro em findRidesExact:", error.message || error);
      return [];
    }
  }

  // 🎯 BUSCA INTELIGENTE USANDO POSTGRES - CORRIGIDA
  async findSmartRides(
    passengerFrom: string, 
    passengerTo: string, 
    passengerFromProvince?: string, 
    passengerToProvince?: string
  ): Promise<any[]> {
    try {
      console.log('🧠 [FIND-SMART] Busca inteligente:', {
        from: passengerFrom,
        to: passengerTo,
        fromProvince: passengerFromProvince,
        toProvince: passengerToProvince
      });

      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(passengerFrom);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(passengerTo);

      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        maxResults: 50,
        radiusKm: 100
      });
    } catch (error: any) {
      console.error("❌ Erro em findSmartRides:", error.message || error);
      
      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(passengerFrom);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(passengerTo);
      
      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        maxResults: 50
      });
    }
  }

  // 🆕 MÉTODO PARA BUSCA HÍBRIDA - CORRIGIDA
  async searchRidesHybrid(
    fromLocation: string, 
    toLocation: string, 
    options?: { 
      passengerFromProvince?: string; 
      passengerToProvince?: string;
      maxResults?: number;
      useNearby?: boolean;
      userLat?: number;
      userLng?: number;
      toLat?: number;
      toLng?: number;
      radiusKm?: number;
    }
  ): Promise<any[]> {
    try {
      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(fromLocation);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(toLocation);

      console.log('🎯 [NORMALIZAÇÃO-CORRIGIDA-HYBRID]', {
        original: { from: fromLocation, to: toLocation },
        normalized: { from: normalizedFrom, to: normalizedTo },
        radius: options?.radiusKm
      });

      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        userLat: options?.userLat,
        userLng: options?.userLng,
        toLat: options?.toLat,
        toLng: options?.toLng,
        radiusKm: options?.radiusKm || 100,
        maxResults: options?.maxResults || 50
      });
    } catch (error: any) {
      console.error("❌ Erro em searchRidesHybrid:", error.message || error);
      
      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(fromLocation);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(toLocation);
      
      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        maxResults: options?.maxResults || 50
      });
    }
  }

  // 🎯 BUSCA BÁSICA - CORRIGIDA
  async getRides(filters: { 
    fromLocation?: string; 
    toLocation?: string;
    status?: string;
  } = {}): Promise<any[]> {
    try {
      const { fromLocation, toLocation, status } = filters;
      
      const normalizedFrom = fromLocation ? await LocationNormalizerCorrigido.normalizeLocation(fromLocation) : undefined;
      const normalizedTo = toLocation ? await LocationNormalizerCorrigido.normalizeLocation(toLocation) : undefined;

      console.log('🎯 [NORMALIZAÇÃO-CORRIGIDA-BASIC]', { 
        original: { fromLocation, toLocation },
        normalized: { normalizedFrom, normalizedTo }
      });

      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        status,
        maxResults: 50,
        radiusKm: 100
      });

    } catch (error: any) {
      console.error("❌ Erro em getRides:", error.message || error);
      throw error;
    }
  }

  // 🌍 BUSCA RIDES ENTRE DUAS CIDADES - CORRIGIDA
  async getRidesBetweenCities(fromCity: string, toCity: string, radiusKm: number = 100): Promise<any[]> {
    try {
      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(fromCity);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(toCity);

      console.log('🎯 [NORMALIZAÇÃO-CORRIGIDA-CITIES]', {
        original: { from: fromCity, to: toCity },
        normalized: { from: normalizedFrom, to: normalizedTo },
        radius: radiusKm
      });

      return await this.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        radiusKm,
        maxResults: 50
      });
    } catch (error: any) {
      console.error('❌ Erro em getRidesBetweenCities:', error.message || error);
      return [];
    }
  }

  // 🌍 BUSCA VIAGENS PRÓXIMAS AO USUÁRIO
  async findNearbyRides(
    lat: number, 
    lng: number, 
    radiusKm: number = 100,
    toLat?: number,
    toLng?: number
  ): Promise<any[]> {
    try {
      console.log('🧠 [NEARBY-RIDES] Busca por proximidade:', {
        lat, lng, radiusKm
      });

      return await this.getRidesUniversal({
        userLat: lat,
        userLng: lng,
        toLat,
        toLng,
        radiusKm,
        maxResults: 50
      });
    } catch (error: any) {
      console.error("❌ Erro em findNearbyRides:", error.message || error);
      throw error;
    }
  }

  // ✅✅✅ MÉTODO ESPECÍFICO PARA BUSCA SMART FINAL - CORRIGIDO COM FILTRO DE DIREÇÃO
  async searchRidesSmartFinal(params: {
    fromCity?: string;
    toCity?: string;
    fromLat?: number;
    fromLng?: number;
    toLat?: number;
    toLng?: number;
    date?: string;
    passengers?: number;
    radiusKm?: number;
    maxResults?: number;
  }): Promise<any[]> {
    try {
      const { 
        fromCity, 
        toCity, 
        fromLat, 
        fromLng, 
        toLat, 
        toLng, 
        date, 
        passengers = 1, 
        radiusKm = 100,
        maxResults = 50
      } = params;

      // ✅ VALIDAÇÃO CRÍTICA: Origem e destino obrigatórios
      if (!fromCity || !toCity) {
        console.error('❌ [DIRECTION-VALIDATION] Origem e destino são obrigatórios');
        return [];
      }

      console.log('🎯 [DIRECTION-SEARCH] Iniciando busca com direção:', {
        passageiro: `${fromCity} → ${toCity}`,
        date: date || 'Qualquer data',
        radiusKm,
        maxResults
      });

      // ✅✅✅ CORREÇÃO: REMOVER COMPLETAMENTE O FILTRO DE DATA
      // A função PostgreSQL get_rides_smart_final já faz matching inteligente
      // O frontend pode ordenar por data e direction_score
      // Usuário vê opções mesmo que não seja na data exata
      // Melhor experiência - mostra rides disponíveis

      // ✅ NORMALIZAÇÃO MELHORADA
      const normalizedFrom = await LocationNormalizerCorrigido.normalizeLocation(fromCity);
      const normalizedTo = await LocationNormalizerCorrigido.normalizeLocation(toCity);

      console.log('📍 [NORMALIZATION] Localizaçãoes normalizadas:', {
        original: { from: fromCity, to: toCity },
        normalized: { from: normalizedFrom, to: normalizedTo }
      });

      // ✅✅✅ USAR A FUNÇÃO get_rides_smart_final DIRETAMENTE - SEM FILTRO DE DATA
      let result: any;
      
      try {
        // ✅✅✅ CORREÇÃO: SEMPRE usar a função sem filtro de data
        result = await db.execute(
          sql`SELECT * FROM get_rides_smart_final(
            ${normalizedFrom}, 
            ${normalizedTo}, 
            ${radiusKm},
            ${maxResults}
          )`
        );
      } catch (error: any) {
        console.log('⚠️ [FUNCTION-FALLBACK] Função original falhou, usando busca direta:', error.message || error);
        // Fallback para busca direta se a função não existir
        return await this.searchRidesDirectFallback(normalizedFrom, normalizedTo, radiusKm, maxResults);
      }

      // ✅ Extração segura dos resultados
      let rows: any[] = [];
      
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        rows = (result as any).rows;
      }

      console.log('🔍 [INITIAL-RESULTS] Resultados iniciais:', {
        busca: `${normalizedFrom} → ${normalizedTo}`,
        total: rows.length,
        resultados: rows.map(row => ({
          id: row.ride_id,
          ride: `${row.from_city} → ${row.to_city}`,
          match_type: row.match_type,
          direction_score: row.direction_score
        }))
      });

      // ✅✅✅ CORREÇÃO: REMOVER filtro de direção (a função PostgreSQL já faz isso)
      // Aceitar TODOS os resultados da função PostgreSQL
      const filteredRows = rows; // ← SIMPLES ASSIM!

      console.log('🎯 [NO-DIRECTION-FILTER] Aceitando todos os resultados da função PostgreSQL:', {
        total: filteredRows.length
      });

      const normalizedRides = filteredRows.map(normalizeDbRideToDto);
      
      console.log(`✅ [SEARCH-SUCCESS] Busca concluída: ${normalizedRides.length} rides`, {
        parametros: { from: normalizedFrom, to: normalizedTo, date },
        resultados: normalizedRides.map(ride => ({
          id: ride.id,
          ride: `${ride.fromCity} → ${ride.toCity}`,
          price: ride.pricePerSeat,
          seats: ride.availableSeats,
          matchType: ride.matchType || 'postgres_function',
          directionScore: ride.direction_score
        }))
      });
      
      return normalizedRides;

    } catch (error: any) {
      console.error("❌ [SEARCH-ERROR] Erro na busca smart final:", error.message || error);
      
      // ✅ FALLBACK ROBUSTO
      try {
        const normalizedFrom = params.fromCity ? await LocationNormalizerCorrigido.normalizeLocation(params.fromCity) : '';
        const normalizedTo = params.toCity ? await LocationNormalizerCorrigido.normalizeLocation(params.toCity) : '';
        
        console.log('🔄 [FALLBACK] Usando busca direta como fallback');
        return await this.searchRidesDirectFallback(normalizedFrom, normalizedTo, params.radiusKm || 100, params.maxResults || 50);
      } catch (fallbackError: any) {
        console.error("❌ [FALLBACK-ERROR] Fallback também falhou:", fallbackError.message || fallbackError);
        return [];
      }
    }
  }

  // 🆕 MÉTODO DE FALLBACK DIRETO - USANDO DRIZZLE ORM
  async searchRidesDirectFallback(
    fromCity: string,
    toCity: string, 
    radiusKm: number = 100,
    maxResults: number = 50
  ): Promise<any[]> {
    try {
      console.log('🔧 [FALLBACK] Usando busca direta como fallback:', {
        fromCity,
        toCity,
        radiusKm,
        maxResults
      });

      // ✅ CORREÇÃO: Usar Drizzle ORM para queries SQL complexas
      const result = await db.execute(sql`
        SELECT 
          r.id as ride_id,
          r."driverId" as driver_id,
          u."firstName" || ' ' || u."lastName" as driver_name,
          r."fromAddress",
          r."toAddress", 
          r."fromCity",
          r."toCity",
          r."fromProvince",
          r."toProvince",
          r."fromLocality",
          r."toLocality",
          r."departureDate",
          r."departureTime",
          r."availableSeats",
          r."pricePerSeat",
          r."vehicleType",
          r."vehicle_uuid",
          v."make" as vehicle_make,
          v."model" as vehicle_model,
          v."color" as vehicle_color,
          v."plate_number" as vehicle_plate,
          v."max_passengers" as vehicle_max_passengers,
          r.status
        FROM rides r
        LEFT JOIN users u ON r."driverId" = u.id
        LEFT JOIN vehicles v ON r."vehicle_uuid" = v.id
        WHERE r.status = 'available'
        AND r."departureDate" >= NOW()
        AND (
          r."fromCity" ILIKE '%' || ${fromCity} || '%'
          OR r."toCity" ILIKE '%' || ${toCity} || '%'
          OR r."fromProvince" ILIKE '%' || ${fromCity} || '%'
          OR r."toProvince" ILIKE '%' || ${toCity} || '%'
        )
        ORDER BY 
          CASE 
            WHEN r."fromCity" ILIKE ${fromCity} AND r."toCity" ILIKE ${toCity} THEN 1
            WHEN r."fromCity" ILIKE ${fromCity} THEN 2
            WHEN r."toCity" ILIKE ${toCity} THEN 3
            ELSE 4
          END,
          r."departureDate"
        LIMIT ${maxResults}
      `);

      // ✅ Extração segura dos resultados
      let rows: any[] = [];
      
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        rows = (result as any).rows;
      }
      
      console.log('✅ [FALLBACK] Resultados da busca direta:', {
        fromCity,
        toCity,
        resultsCount: rows.length
      });

      return rows.map(normalizeDbRideToDto);

    } catch (error: any) {
      console.error("❌ Erro em searchRidesDirectFallback:", error.message || error);
      return [];
    }
  }

  // 🆕 MÉTODO SIMPLIFICADO PARA USAR A FUNÇÃO INTELIGENTE
  async searchRidesSmart(
    from: string = '',
    to: string = '',
    radiusKm: number = 100,
    maxResults: number = 50
  ): Promise<any[]> {
    try {
      console.log('🧠 [SMART-SEARCH] Busca inteligente simplificada:', {
        from,
        to,
        radiusKm,
        maxResults
      });

      return await this.searchRidesSmartFinal({
        fromCity: from,
        toCity: to,
        radiusKm,
        maxResults
      });
    } catch (error: any) {
      console.error("❌ Erro em searchRidesSmart:", error.message || error);
      return await this.searchRidesDirectFallback(from, to, radiusKm, maxResults);
    }
  }

  // ✅✅✅ MÉTODO getRideById CORRIGIDO
  async getRideById(id: string): Promise<any | null> {
    try {
      console.log('🔍 [RIDE-SERVICE] Buscando ride com ID:', id);
      
      const result = await db.execute(sql`
        SELECT 
          r.id as ride_id,
          r."driverId" as driver_id,
          r."driverName",
          r."fromAddress",
          r."toAddress", 
          r."fromCity",
          r."toCity",
          r."fromProvince",
          r."toProvince",
          r."fromLocality",
          r."toLocality",
          r."from_geom",
          r."to_geom",
          r."departureDate",
          r."departureTime",
          r."availableSeats",
          r."maxPassengers",
          r."pricePerSeat",
          r."vehicleType",
          r."vehicle_uuid",
          r."additionalInfo",
          r."distance_real_km",
          r."polyline",
          r.status,
          r.type,
          r."createdAt",
          r."updatedAt",
          v."make" as vehicle_make,
          v."model" as vehicle_model,
          v."color" as vehicle_color,
          v."plate_number" as vehicle_plate,
          v."max_passengers" as vehicle_max_passengers
        FROM rides r
        LEFT JOIN vehicles v ON r."vehicle_uuid" = v.id
        WHERE r.id = ${id}
      `);

      // ✅ Extração segura dos resultados
      let rows: any[] = [];
      
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        rows = (result as any).rows;
      }
      
      console.log('🔍 [RIDE-SERVICE] Resultado da query:', {
        idBuscado: id,
        rowsEncontradas: rows.length,
        primeiraRow: rows[0] ? { id: rows[0].ride_id, fromCity: rows[0].fromCity, toCity: rows[0].toCity } : 'Nenhuma'
      });
      
      if (rows.length === 0) {
        console.log('❌ [RIDE-SERVICE] Nenhuma ride encontrada com ID:', id);
        return null;
      }

      const normalizedRide = normalizeDbRideToDto(rows[0]);
      console.log('✅ [RIDE-SERVICE] Ride normalizada:', {
        id: normalizedRide.id,
        driverId: normalizedRide.driverId,
        fromTo: `${normalizedRide.fromCity} → ${normalizedRide.toCity}`
      });

      return normalizedRide;

    } catch (error: any) {
      console.error("❌ [RIDE-SERVICE] Erro em getRideById:", error.message || error);
      throw error;
    }
  }

  // 🆕 MÉTODO PARA BUSCAR RIDES POR MOTORISTA - CORRIGIDO COM JOIN A USERS + bookedSeats
  async getRidesByDriver(driverId: string, status?: string): Promise<any[]> {
    try {
      // ✅ CORREÇÃO: Usar SQL direto para JOIN complexo - SEM COMENTÁRIOS
      // ✅✅✅ ALTERAÇÃO 1 (Fase 2.4): JOIN a users + driver_user_name
      // ✅✅✅ + bookedSeats e bookingsCount (subqueries de bookings)
      let query = sql`
        SELECT 
          r.id as ride_id,
          r."driverId" as driver_id,
          r."driverName",
          u."firstName" || ' ' || u."lastName" AS driver_user_name,
          r."fromAddress",
          r."toAddress", 
          r."fromCity",
          r."toCity",
          r."fromProvince",
          r."toProvince",
          r."fromLocality",
          r."toLocality",
          r."from_geom",
          r."to_geom",
          r."departureDate",
          r."departureTime",
          r."availableSeats",
          r."maxPassengers",
          r."pricePerSeat",
          r."vehicleType",
          r."vehicle_uuid",
          r."additionalInfo",
          r."distance_real_km",
          r."polyline",
          r.status,
          r.type,
          r."createdAt",
          r."updatedAt",
          v."make" as vehicle_make,
          v."model" as vehicle_model,
          v."color" as vehicle_color,
          v."plate_number" as vehicle_plate,
          v."max_passengers" as vehicle_max_passengers,
          COALESCE((
            SELECT SUM(b."seatsBooked")
            FROM bookings b
            WHERE b."rideId" = r.id
              AND b.status NOT IN ('cancelled', 'rejected')
          ), 0) AS "bookedSeats",
          COALESCE((
            SELECT COUNT(*)
            FROM bookings b
            WHERE b."rideId" = r.id
              AND b.status NOT IN ('cancelled', 'rejected')
          ), 0) AS "bookingsCount"
        FROM rides r
        LEFT JOIN vehicles v ON r."vehicle_uuid" = v.id
        LEFT JOIN users u ON r."driverId" = u.id
        WHERE r."driverId" = ${driverId}
      `;

      if (status) {
        query = sql`${query} AND r.status = ${status}`;
      }

      query = sql`${query} ORDER BY r."departureDate" DESC`;

      const result = await db.execute(query);
      
      // ✅ Extração segura dos resultados
      let rows: any[] = [];
      
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        rows = (result as any).rows;
      }
      
      return rows.map(ride => normalizeDbRideToDto(ride));

    } catch (error: any) {
      console.error("❌ Erro em getRidesByDriver:", error.message || error);
      throw error;
    }
  }

  // 🆕 MÉTODO SIMPLES PARA TODOS OS RIDES DISPONÍVEIS
  async getAllAvailableRides(): Promise<any[]> {
    try {
      return await this.getRidesUniversal({
        maxResults: 100,
        radiusKm: 200
      });
    } catch (error: any) {
      console.error("❌ Erro em getAllAvailableRides:", error.message || error);
      throw error;
    }
  }

  // ✅✅✅ MÉTODO createRide CORRIGIDO - SOLUÇÃO 1 APLICADA
  async createRide(rideData: any): Promise<any> {
    try {
      console.log('🚗 [RIDE-SERVICE] Criando ride com dados:', {
        id: rideData.id,
        driverId: rideData.driverId, // ✅ ADICIONAR LOG EXPLÍCITO
        hasDriverId: !!rideData.driverId,
        from: `${rideData.fromCity} → ${rideData.toCity}`
      });

      // ✅✅✅ CORREÇÃO CRÍTICA: driverId É OBRIGATÓRIO
      if (!rideData.driverId) {
        console.error('❌ [RIDE-SERVICE] ERRO CRÍTICO: driverId não fornecido!');
        console.error('Dados recebidos:', {
          keys: Object.keys(rideData),
          driverId: rideData.driverId,
          data: rideData
        });
        throw new Error('driverId é obrigatório para criar uma ride');
      }

      const rideId = rideData.id || uuidv4();
      
      console.log('🎯 [RIDE-SERVICE] ID que será usado:', rideId);

      // ✅✅✅ CORREÇÃO CRÍTICA: Usar o schema do Drizzle diretamente
      const insertData = {
        id: rideId,
        // ✅✅✅ driverId DEVE SER A PRIMEIRA PROPRIEDADE DEPOIS DO ID
        driverId: rideData.driverId,
        driverName: rideData.driverName || 'Motorista',
        fromAddress: rideData.fromAddress,
        toAddress: rideData.toAddress,
        fromProvince: rideData.fromProvince,
        toProvince: rideData.toProvince,
        fromCity: rideData.fromCity,
        toCity: rideData.toCity,
        fromDistrict: rideData.fromDistrict || '',
        toDistrict: rideData.toDistrict || '',
        fromLocality: rideData.fromLocality || '',
        toLocality: rideData.toLocality || '',
        from_geom: rideData.from_geom || null,
        to_geom: rideData.to_geom || null,
        departureDate: rideData.departureDate,
        departureTime: rideData.departureTime,
        availableSeats: rideData.availableSeats,
        maxPassengers: rideData.maxPassengers || rideData.availableSeats,
        pricePerSeat: rideData.pricePerSeat.toString(), // Converter para string
        vehicleType: rideData.vehicleType,
        additionalInfo: rideData.additionalInfo || null,
        status: rideData.status || 'available',
        type: rideData.type || 'regular',
        vehicle_uuid: rideData.vehicleId || rideData.vehicle_uuid,
        distance_real_km: rideData.distance_real_km || null,
        polyline: rideData.polyline || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // ✅ VERIFICAÇÃO FINAL ANTES DA INSERÇÃO
      console.log('🔍 [RIDE-SERVICE] VERIFICAÇÃO FINAL - driverId presente?', {
        hasDriverId: !!insertData.driverId,
        driverId: insertData.driverId,
        totalKeys: Object.keys(insertData).length,
        first5Keys: Object.keys(insertData).slice(0, 5)
      });

      // ✅ LOG EXTRA: mostrar exatamente o que será inserido
      console.log('🔍 [RIDE-SERVICE] Dados antes da inserção:', JSON.stringify({
        id: insertData.id,
        driverId: insertData.driverId,
        driverName: insertData.driverName,
        fromTo: `${insertData.fromCity} → ${insertData.toCity}`
      }, null, 2));

      // ✅ INSERÇÃO COM LOG EXTRA
      console.log('🚀 [RIDE-SERVICE] Executando INSERT com driverId:', insertData.driverId);
      const result = await db.insert(rides).values(insertData).returning();
      
      // ✅ VERIFICAÇÃO PÓS-INSERÇÃO
      console.log('✅ [RIDE-SERVICE] Inserção concluída:', {
        idRetornado: result[0]?.id,
        driverIdRetornado: result[0]?.driverId,
        success: !!result[0]?.id
      });

      // ✅ VERIFICAÇÃO DIRETA NO BANCO
      const directCheck = await db.select().from(rides).where(eq(rides.id, rideId));
      console.log('🔍 [RIDE-SERVICE] Verificação direta no banco:', {
        idBuscado: rideId,
        encontrada: directCheck.length > 0,
        idEncontrado: directCheck[0]?.id || 'NÃO ENCONTRADA',
        driverIdEncontrado: directCheck[0]?.driverId || 'NÃO ENCONTRADO'
      });

      if (directCheck.length === 0) {
        console.error('❌ [RIDE-SERVICE] Ride criada mas não encontrada no banco!');
        throw new Error(`Ride criada mas não encontrada: ${rideId}`);
      }

      // ✅ Buscar a ride completa
      const fullRide = await this.getRideById(rideId);
      
      if (!fullRide) {
        console.log('⚠️ [RIDE-SERVICE] getRideById retornou null, retornando dados básicos');
        // ✅ FALLBACK: Retornar dados básicos
        return {
          id: rideId,
          driverId: rideData.driverId,
          driverName: rideData.driverName || 'Motorista',
          fromAddress: rideData.fromAddress,
          toAddress: rideData.toAddress,
          fromCity: rideData.fromCity,
          toCity: rideData.toCity,
          fromProvince: rideData.fromProvince,
          toProvince: rideData.toProvince,
          departureDate: rideData.departureDate,
          departureTime: rideData.departureTime,
          availableSeats: rideData.availableSeats,
          pricePerSeat: rideData.pricePerSeat,
          vehicleType: rideData.vehicleType,
          status: 'available',
          vehicle_uuid: rideData.vehicleId || rideData.vehicle_uuid,
          maxPassengers: rideData.maxPassengers || rideData.availableSeats
        };
      }

      console.log('✅ [RIDE-SERVICE] Ride criada com sucesso! DriverId:', fullRide.driverId);
      return fullRide;

    } catch (error: any) {
      console.error('❌ [RIDE-SERVICE] ERRO NA INSERÇÃO:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // 🆕 MÉTODO PARA ATUALIZAR RIDE - CORRIGIDO
  async updateRide(id: string, rideData: Partial<CreateRideBaseData> & {
    distance_real_km?: number;
    polyline?: string;
    [key: string]: any;
  }): Promise<any | null> {
    try {
      const updateData: any = { 
        ...rideData, 
        updatedAt: new Date() 
      };
      
      // ✅ CORREÇÃO: Remover campos undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // ✅✅✅ CORREÇÃO CRÍTICA: Converter campos decimal para string
      if (updateData.pricePerSeat !== undefined) {
        updateData.pricePerSeat = updateData.pricePerSeat.toString();
      }
      
      if (updateData.distance_real_km !== undefined) {
        updateData.distance_real_km = updateData.distance_real_km.toString();
      }
      
      // ✅ CORREÇÃO: Normalizar campos de localização
      const locationFields = [
        'fromProvince', 'toProvince', 'fromCity', 'toCity', 
        'fromDistrict', 'toDistrict', 'fromLocality', 'toLocality'
      ] as const;
      
      locationFields.forEach(field => {
        if (updateData[field] !== undefined && updateData[field] !== null) {
          updateData[field] = this.normalizeString(updateData[field]);
        }
      });

      const [updatedRide] = await db.update(rides)
        .set(updateData)
        .where(eq(rides.id, id))
        .returning();

      if (!updatedRide) return null;

      console.log('✅ Ride atualizado com sucesso:', { id, updatedFields: Object.keys(updateData) });

      // ✅ CORREÇÃO: Buscar dados completos com informações do veículo
      return await this.getRideById(id);

    } catch (error: any) {
      console.error("❌ Erro em updateRide:", error.message || error);
      throw error;
    }
  }

  // 🆕 MÉTODO PARA DELETAR RIDE
  async deleteRide(id: string): Promise<boolean> {
    try {
      const [deleted] = await db.delete(rides)
        .where(eq(rides.id, id))
        .returning();
      
      return !!deleted;

    } catch (error: any) {
      console.error("❌ Erro em deleteRide:", error.message || error);
      throw error;
    }
  }

  // 🔄 MÉTODOS AUXILIARES PRIVADOS
  private async getRidesByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    
    try {
      // ✅ CORREÇÃO: Usar SQL direto para JOIN complexo - SEM COMENTÁRIOS
      const result = await db.execute(sql`
        SELECT 
          r.id as ride_id,
          r."driverId" as driver_id,
          r."driverName",
          r."fromAddress",
          r."toAddress", 
          r."fromCity",
          r."toCity",
          r."fromProvince",
          r."toProvince",
          r."fromLocality",
          r."toLocality",
          r."from_geom",
          r."to_geom",
          r."departureDate",
          r."departureTime",
          r."availableSeats",
          r."maxPassengers",
          r."pricePerSeat",
          r."vehicleType",
          r."vehicle_uuid",
          r."additionalInfo",
          r."distance_real_km",
          r."polyline",
          r.status,
          r.type,
          r."createdAt",
          r."updatedAt",
          v."make" as vehicle_make,
          v."model" as vehicle_model,
          v."color" as vehicle_color,
          v."plate_number" as vehicle_plate,
          v."max_passengers" as vehicle_max_passengers
        FROM rides r
        LEFT JOIN vehicles v ON r."vehicle_uuid" = v.id
        WHERE r.id IN (${sql.raw(ids.map(id => `'${id}'`).join(', '))})
      `);
      
      // ✅ Extração segura dos resultados
      let rows: any[] = [];
      
      if (Array.isArray(result)) {
        rows = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        rows = (result as any).rows;
      }
      
      return rows.map(ride => normalizeDbRideToDto(ride));
    } catch (error: any) {
      console.error("❌ Erro em getRidesByIds:", error.message || error);
      return [];
    }
  }

  private normalizeString(str: string): string {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /**
   * 🆕 Complete uma ride (marcar como completed) e cria comissão automaticamente
   * - Atualiza status para 'completed'
   * - Cria comissão via providerPaymentService.createRideCommission
   * - Registra completed_at
   */
  async completeRide(rideId: string, driverId?: string): Promise<any> {
    try {
      console.log(`🏁 [RIDE-SERVICE] Completando ride ${rideId}...`);
      
      // 1. Buscar a ride
      const rideData = await db
        .select()
        .from(rides)
        .where(eq(rides.id, rideId))
        .limit(1);

      if (!rideData || rideData.length === 0) {
        throw new Error(`Ride ${rideId} não encontrada`);
      }

      const ride = rideData[0];

      // NOVO: validar dono da ride
      if (driverId && ride.driverId !== driverId) {
        throw new Error('Acesso negado: voce nao e o dono desta ride');
      }
      
      // 2. Verificar se já está completed
      if (ride.status === 'completed') {
        console.log(`⚠️ [RIDE-SERVICE] Ride ${rideId} já está completed`);
        return await this.getRideById(rideId);
      }
      
      // 3. Verificar se pode ser completada (status válido para completar)
      const validStatuses = ['in_progress', 'confirmed', 'available'];
      if (!validStatuses.includes(ride.status || '')) {
        throw new Error(`Ride ${rideId} com status "${ride.status}" não pode ser completada`);
      }
      
      // 4. Atualizar status para completed
      const now = new Date();
      await db.update(rides)
        .set({
          status: 'completed',
          completed_at: now,
          updatedAt: now,
        } as any)
        .where(eq(rides.id, rideId));
      
      console.log(`✅ [RIDE-SERVICE] Ride ${rideId} marcada como completed`);

      // 5. 🆕 GANCHO AUTOMÁTICO: Criar comissão (aguardado — garante idempotência e reporta)
      try {
        console.log(`🔗 [RIDE-SERVICE] Gatilho: criando comissão para ride ${rideId}`);
        const commission = await providerPaymentService.createRideCommission(rideId);
        console.log(`✅ [RIDE-SERVICE] Comissão (ride ${rideId}):`, commission?.skipped ? 'já existia (skipped)' : 'criada');
      } catch (error: any) {
        console.error('❌ [RIDE-SERVICE] Erro ao criar comissão:', error.message);
        // Não relançar: a ride já está completed; a comissão pode ser recriada
      }

      // 6. Retornar dados atualizados
      return await this.getRideById(rideId);
      
    } catch (error: any) {
      console.error('❌ [RIDE-SERVICE] Erro ao completar ride:', error.message || error);
      throw error;
    }
  }
  async startRide(rideId: string, driverId: string): Promise<any> {
    const rideData = await db.select().from(rides).where(eq(rides.id, rideId)).limit(1);
    if (!rideData || rideData.length === 0) throw new Error('Ride nao encontrada');
    const ride = rideData[0];
    if (ride.driverId !== driverId) throw new Error('Acesso negado');
    if (ride.status === 'in_progress') return await this.getRideById(rideId);
    if (!['available','confirmed'].includes(ride.status || '')) throw new Error('Status invalido para iniciar: ' + ride.status);
    const now = new Date();
    await db.update(rides).set({ status: 'in_progress', started_at: now, updatedAt: now } as any).where(eq(rides.id, rideId));
    return await this.getRideById(rideId);
  }

  async cancelRide(rideId: string, driverId: string, reason?: string): Promise<any> {
    const rideData = await db.select().from(rides).where(eq(rides.id, rideId)).limit(1);
    if (!rideData || rideData.length === 0) throw new Error('Ride nao encontrada');
    const ride = rideData[0];
    if (ride.driverId !== driverId) throw new Error('Acesso negado');
    if (ride.status === 'completed') throw new Error('Ride ja concluida');
    const now = new Date();
    await db.update(rides).set({ status: 'cancelled', cancelled_at: now, cancellation_reason: reason || null, updatedAt: now } as any).where(eq(rides.id, rideId));
    return await this.getRideById(rideId);
  }
}

export const rideService = new RideService();