import { Router, Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken, requireDriverRole, ensureUserId } from '../../middleware/role-auth';
import { AuthenticatedUser } from '../../shared/types';
import { rideService } from '../../src/services/rideService';
import { insertRideSchema, updateRideSchema } from '../../shared/schema';
import { z } from 'zod';
import { db } from '../../db';
import { sql, eq, and } from 'drizzle-orm';
import { vehicles } from '../../shared/schema';
import { vehicleQueries } from '../../shared/db-helpers';

const router = Router();

// ✅ CORREÇÃO: Logger profissional
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`ℹ️  PROVIDER-RIDES: ${message}`, data || '');
    }
  },
  error: (message: string, error?: any) => {
    console.error(`❌ PROVIDER-RIDES: ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`⚠️  PROVIDER-RIDES: ${message}`, data || '');
  }
};

// ✅✅✅ CORREÇÃO CRÍTICA: Função para converter coordenadas em geometrias PostGIS
const createGeometryFromCoords = (lat: number, lng: number): string | null => {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.log('❌ [GEOMETRY] Coordenadas inválidas:', { lat, lng });
    return null;
  }
  
  // Formato: POINT(lng lat) para PostGIS
  const wkt = `POINT(${lng} ${lat})`;
  console.log('✅ [GEOMETRY] Geometria criada:', wkt);
  return wkt;
};

// ✅✅✅ CORREÇÃO CRÍTICA: Normalizador usando PostgreSQL
async function normalizeLocation(locationName: string): Promise<string> {
  if (!locationName || locationName.trim() === '') {
    return '';
  }

  try {
    console.log('🔍 [PROVIDER-NORMALIZER] Normalizando:', locationName);
    
    const result = await db.execute<{ normalized: string }>(sql`
      SELECT normalize_location_name(${locationName}) as normalized
    `);
    
    // ✅ CORREÇÃO: Extração segura com type assertion
    let normalizedValue = locationName.split(',')[0].trim().toLowerCase();
    
    if (Array.isArray(result) && typeof result[0]?.normalized === 'string') {
      normalizedValue = result[0].normalized;
    } else if (result && Array.isArray((result as any).rows)) {
      normalizedValue = (result as any).rows[0]?.normalized || normalizedValue;
    } else if (result && typeof result === 'object') {
      const values = Object.values(result);
      if (Array.isArray(values[0]) && values[0].length > 0 && typeof values[0][0]?.normalized === 'string') {
        normalizedValue = values[0][0].normalized;
      }
    }
    
    console.log('✅ [PROVIDER-NORMALIZER] Resultado:', {
      original: locationName,
      normalized: normalizedValue
    });
    
    return normalizedValue;

  } catch (error) {
    console.error('❌ [PROVIDER-NORMALIZER] Erro, usando fallback:', error);
    return locationName.split(',')[0].trim().toLowerCase();
  }
}

// ✅✅✅ CORREÇÃO: Função para chamar RPC do PostgreSQL (CORRIGIDA COM URL DECODING)
async function callPostgresFunction(functionName: string, params: any[] = []): Promise<any[]> {
  try {
    console.log('🧠 [RPC] Chamando função PostgreSQL:', {
      function: functionName,
      params,
      timestamp: new Date().toISOString()
    });

    // ✅ VALIDAR FUNÇÕES PERMITIDAS (SEGURANÇA)
    const allowedFunctions = [
      'get_rides_smart_final',
      'normalize_location_name',
      'search_rides_by_location',
      'find_nearby_rides'
    ];

    if (!allowedFunctions.includes(functionName)) {
      throw new Error(`Função não permitida: ${functionName}`);
    }

    // ✅✅✅ CORREÇÃO CRÍTICA: DECODIFICAR PARÂMETROS URL ENCODED
    const decodedParams = params.map(param => {
      if (typeof param === 'string') {
        try {
          // Decodificar URL encoding
          const decoded = decodeURIComponent(param);
          console.log('🔤 [RPC-DECODING] URL decoding:', {
            original: param,
            decoded: decoded,
            wasEncoded: param !== decoded
          });
          return decoded;
        } catch (error) {
          console.warn('⚠️ [RPC-DECODING] Falha ao decodificar:', { param, error });
          return param;
        }
      }
      return param;
    });

    console.log('✅ [RPC] Parâmetros decodificados:', {
      original: params,
      decoded: decodedParams,
      changed: JSON.stringify(params) !== JSON.stringify(decodedParams)
    });

    // ✅✅✅ CORREÇÃO CRÍTICA: Construir query com parâmetros DECODIFICADOS
    let query: string;
    let queryParams: any[] = [];

    if (functionName === 'get_rides_smart_final') {
      const [search_from, search_to, radius_km, max_results] = decodedParams;
      
      query = `SELECT * FROM get_rides_smart_final($1, $2, $3, $4)`;
      queryParams = [
        search_from || '',
        search_to || '', 
        radius_km || 100,
        max_results || 50
      ];
    } else {
      // ✅ FUNÇÃO GENÉRICA PARA OUTRAS FUNÇÕES
      const placeholders = decodedParams.map((_, index) => `$${index + 1}`).join(', ');
      query = `SELECT * FROM ${functionName}(${placeholders})`;
      queryParams = decodedParams;
    }

    console.log('🔍 [RPC] Executando query:', {
      query,
      params: queryParams,
      paramsOriginalForDebug: params
    });

    // ✅✅✅ CORREÇÃO CRÍTICA: Usar sql.raw corretamente sem parâmetros extras
    // Construir a query com os parâmetros já interpolados
    const rawQuery = sql.raw(query);
    
    // ✅ CORREÇÃO: Executar com parâmetros usando método execute correto
    let result: any;
    
    // Tentar diferentes métodos de execução baseado na configuração do Drizzle
    try {
      // Método 1: Usando db.execute com sql template (mais seguro)
      if (functionName === 'get_rides_smart_final') {
        const [p1, p2, p3, p4] = queryParams;
        result = await db.execute(sql`
          SELECT * FROM get_rides_smart_final(${p1}, ${p2}, ${p3}, ${p4})
        `);
      } else {
        // Para outras funções, construir dinamicamente
        const dynamicSql = sql`SELECT * FROM ${sql.raw(functionName)}(${sql.join(queryParams.map(p => sql`${p}`), sql`, `)})`;
        result = await db.execute(dynamicSql);
      }
    } catch (executeError) {
      console.warn('❌ [RPC] Método seguro falhou, tentando raw query:', executeError);
      
      // Método 2: Fallback para raw query (menos seguro mas funcional)
      const interpolatedQuery = query.replace(/\$(\d+)/g, (_, index) => {
        const paramIndex = parseInt(index) - 1;
        const param = queryParams[paramIndex];
        return typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
      });
      
      result = await db.execute(sql.raw(interpolatedQuery));
    }

    // ✅ EXTRAIR RESULTADOS DE FORMA SEGURA
    let rows: any[] = [];
    
    if (Array.isArray(result)) {
      rows = result;
    } else if (result && typeof result === 'object' && 'rows' in result) {
      rows = (result as any).rows;
    } else if (result && typeof result === 'object') {
      const values = Object.values(result);
      if (Array.isArray(values[0])) {
        rows = values[0] as any[];
      }
    }

    console.log('✅ [RPC] Função executada com sucesso:', {
      function: functionName,
      results: rows.length,
      sample: rows[0] || 'Nenhum resultado'
    });

    return rows;

  } catch (error) {
    console.error('❌ [RPC] Erro ao executar função:', error);
    throw error;
  }
}

// ✅ CORREÇÃO: Funções auxiliares type-safe
const safeString = (value: unknown, defaultValue: string = ''): string => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value);
};

const safeNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const safeDate = (value: unknown, defaultValue: Date = new Date()): Date => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  try {
    const date = new Date(value as string);
    return isNaN(date.getTime()) ? defaultValue : date;
  } catch {
    return defaultValue;
  }
};

const normalizeLocationField = (value: unknown): string => {
  return safeString(value).toLowerCase();
};

// ✅✅✅ CORREÇÃO: Função para decodificar URL encoded strings
const decodeIfEncoded = (str: string): string => {
  if (!str || typeof str !== 'string') return str;
  
  try {
    // Verificar se está URL encoded
    if (str.includes('%') || str.includes('+')) {
      const decoded = decodeURIComponent(str.replace(/\+/g, ' '));
      console.log('🔤 [URL-DECODING] Decodificado:', { original: str, decoded });
      return decoded;
    }
    return str;
  } catch (error) {
    console.warn('⚠️ [URL-DECODING] Falha ao decodificar:', { str, error });
    return str;
  }
};

// ✅ CORREÇÃO: Funções específicas para query parameters COM DECODING
const getQueryString = (query: any, key: string, defaultValue: string = ''): string => {
  const value = query[key];
  const strValue = safeString(value, defaultValue);
  // ✅✅✅ CORREÇÃO: Aplicar decodificação URL
  return decodeIfEncoded(strValue);
};

const getQueryNumber = (query: any, key: string, defaultValue: number = 0): number => {
  const value = query[key];
  return safeNumber(value, defaultValue);
};

// ✅ CORREÇÃO: Interface para request autenticada
interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// ✅✅✅ CORREÇÃO CRÍTICA: Helper para obter driverId com logs detalhados
const getDriverId = (req: AuthenticatedRequest): string | null => {
  console.log('🆔 [GET-DRIVER-ID] Verificando driverId...', {
    hasUser: !!req.user,
    userEmail: req.user?.email || 'NO_EMAIL',
    userId: req.user?.id || 'NO_ID',
    userUid: (req.user as any)?.uid || 'NO_UID',
    allUserKeys: req.user ? Object.keys(req.user) : 'NO_USER'
  });

  // ✅ CORREÇÃO ROBUSTA: Tentar todas as possíveis propriedades de ID
  const user = req.user;
  if (!user) {
    console.log('❌ [GET-DRIVER-ID] req.user está undefined/null');
    return null;
  }
  
  // Tentar id primeiro, depois uid, depois email como fallback
  const possibleIds = [
    user.id,
    (user as any).uid,
    (user as any).user_id,
    (req.user as any)?.uid // ✅ CORREÇÃO: Acessar uid diretamente do req.user
  ].filter(Boolean);
  
  if (possibleIds.length === 0) {
    console.log('❌ [GET-DRIVER-ID] Nenhum ID encontrado no user:', {
      userKeys: Object.keys(user),
      userEmail: user.email
    });
    return null;
  }
  
  const driverId = possibleIds[0];
  console.log('✅ [GET-DRIVER-ID] ID encontrado:', {
    driverId,
    allPossible: possibleIds,
    userKeys: Object.keys(user)
  });
  
  return driverId;
};

// ✅✅✅ CORREÇÃO: Função auxiliar para calcular receita de forma segura
const calculateRideRevenue = (ride: any): number => {
  // ✅ CORREÇÃO APLICADA: Usar safeNumber em todas as variáveis antes da comparação
  const pricePerSeat = safeNumber(ride.pricePerSeat);
  const bookedSeatsNum = safeNumber((ride as any).bookedSeats);
  const occupiedSeatsNum = safeNumber((ride as any).occupiedSeats);
  const maxPassengersNum = safeNumber(ride.maxPassengers);
  
  // ✅ CORREÇÃO APLICADA: Comparação segura com números convertidos
  const actualOccupiedSeats = bookedSeatsNum > 0 
    ? bookedSeatsNum 
    : occupiedSeatsNum > 0 
      ? occupiedSeatsNum 
      : maxPassengersNum;
  
  return pricePerSeat * actualOccupiedSeats;
};

// ✅ CORREÇÃO: Função para verificar propriedade da ride
const verifyRideOwnership = async (rideId: string, driverId: string): Promise<{ride: any, isOwner: boolean}> => {
  const ride = await rideService.getRideById(rideId);
  if (!ride) {
    return { ride: null, isOwner: false };
  }
  
  // ✅ CORREÇÃO: Comparação segura de IDs
  const isOwner = safeString(ride.driverId) === driverId;
  return { ride, isOwner };
};

// ✅✅✅ CORREÇÃO: Middleware de debug para a rota POST
const debugRideCreation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('🚗 [RIDES-DEBUG] === INICIANDO CRIAÇÃO DE RIDE ===');
  console.log('📨 Headers recebidos:', {
    authorization: req.headers.authorization ? 'PRESENT' : 'MISSING',
    contentType: req.headers['content-type'],
    userAgent: req.headers['user-agent']
  });
  
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace('Bearer ', '');
    console.log('🔐 Token JWT:', {
      length: token.length,
      first20: token.substring(0, 20) + '...',
      last10: '...' + token.substring(token.length - 10),
      isJWT: token.split('.').length === 3
    });
  }
  
  console.log('📦 Body recebido:', {
    bodyKeys: Object.keys(req.body || {}),
    bodyPreview: req.body ? {
      fromCity: req.body.fromCity,
      toCity: req.body.toCity, 
      departureDate: req.body.departureDate,
      pricePerSeat: req.body.pricePerSeat,
      availableSeats: req.body.availableSeats,
      vehicle_uuid: req.body.vehicleId,
      // ✅✅✅ NOVO: Debug das coordenadas
      fromLat: req.body.fromLat,
      fromLng: req.body.fromLng,
      toLat: req.body.toLat,
      toLng: req.body.toLng
    } : 'NO_BODY'
  });
  
  next();
};

// ✅✅✅ CORREÇÃO CRÍTICA: Rota POST com validação de vehicleId e GEOMETRIAS (CORRIGIDA)
router.post('/', 
  debugRideCreation,
  verifyFirebaseToken,
  ensureUserId,
  requireDriverRole, 
  async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🚗 [RIDES-POST] === INICIANDO CRIAÇÃO DE RIDE ===');
    
    const driverId = getDriverId(req);
    const body = req.body;
    
    console.log('📋 Dados recebidos para criação:', {
      driverId,
      bodyKeys: Object.keys(body),
      bodyPreview: {
        fromCity: body.fromCity,
        toCity: body.toCity,
        departureDate: body.departureDate,
        pricePerSeat: body.pricePerSeat,
        vehicle_uuid: body.vehicleId || body.vehicle_uuid,
        // ✅✅✅ NOVO: Debug das coordenadas
        fromLat: body.fromLat,
        fromLng: body.fromLng,
        toLat: body.toLat,
        toLng: body.toLng
      },
      user: req.user ? {
        id: req.user.id,
        uid: (req.user as any).uid,
        email: req.user.email,
        roles: req.user.roles
      } : 'NO_USER'
    });
    
    if (!driverId) {
      console.log('❌ [RIDES-POST] driverId não encontrado. User object:', req.user);
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    // ✅✅✅ VALIDAÇÃO OBRIGATÓRIA DO VEÍCULO (NOVO)
    if (!body.vehicleId) {
      return res.status(400).json({
        success: false,
        error: 'Seleção de veículo é obrigatória'
      });
    }

    // ✅✅✅ CORREÇÃO: Usar helper para validação do veículo
    const vehicle = await vehicleQueries.getVehicleByIdAndDriver(body.vehicleId, driverId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Veículo não encontrado ou não pertence a você'
      });
    }

    // ✅✅✅ VERIFICAR CAPACIDADE DO VEÍCULO
    if (body.maxPassengers > vehicle.max_passengers) {
      return res.status(400).json({
        success: false,
        error: `Número de passageiros (${body.maxPassengers}) excede a capacidade do veículo (máximo: ${vehicle.max_passengers})`
      });
    }

    console.log('✅ [RIDES-POST] Validação do veículo concluída:', {
      vehicle_uuid: body.vehicleId || body.vehicle_uuid,
      vehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.color}) - ${vehicle.plate_number}`,
      capacity: `${body.maxPassengers}/${vehicle.max_passengers} passageiros`
    });

    logger.info('📝 Iniciando criação de ride', { driverId, vehicle_uuid: body.vehicleId });

    const { 
      fromAddress, 
      toAddress, 
      fromProvince,
      toProvince,
      fromCity,
      toCity,
      fromLocality,
      toLocality,
      departureDate, 
      departureTime,
      availableSeats, 
      maxPassengers, 
      pricePerSeat, 
      vehicleType, 
      additionalInfo,
      vehicleId, // ✅ NOVO: Incluir vehicleId
      // ✅✅✅ NOVO: Coordenadas para geometrias
      fromLat,
      fromLng,
      toLat,
      toLng
    } = body;

    // ✅✅✅ CORREÇÃO CRÍTICA: Converter coordenadas para geometrias PostGIS
    console.log('📍 [COORD-DEBUG] Coordenadas recebidas:', {
      fromLat, fromLng, toLat, toLng,
      hasFromCoords: !!(fromLat && fromLng),
      hasToCoords: !!(toLat && toLng)
    });

    const fromGeom = createGeometryFromCoords(fromLat, fromLng);
    const toGeom = createGeometryFromCoords(toLat, toLng);

    console.log('🗺️ [GEOMETRY-DEBUG] Geometrias criadas:', {
      fromGeom,
      toGeom,
      hasFromGeom: !!fromGeom,
      hasToGeom: !!toGeom
    });
    
    const rideInput = {
      driverId,
      fromAddress: safeString(fromAddress),
      toAddress: safeString(toAddress),
      fromProvince: normalizeLocationField(fromProvince),
      toProvince: normalizeLocationField(toProvince),
      fromCity: normalizeLocationField(fromCity),
      toCity: normalizeLocationField(toCity),
      fromLocality: normalizeLocationField(fromLocality),
      toLocality: normalizeLocationField(toLocality),
      // ✅✅✅ CORREÇÃO CRÍTICA: ADICIONAR GEOMETRIAS
      from_geom: fromGeom,
      to_geom: toGeom,
      departureDate: safeDate(departureDate),
      departureTime: safeString(departureTime, '08:00'),
      availableSeats: safeNumber(availableSeats, 1),
      maxPassengers: safeNumber(maxPassengers, 4),
      pricePerSeat: safeNumber(pricePerSeat, 0),
      vehicleType: safeString(vehicleType, 'car'),
      additionalInfo: safeString(additionalInfo),
      vehicle_uuid: safeString(vehicleId), // ✅ NOVO: Incluir vehicleId
      status: 'available' as const
    };

    console.log('📝 Dados normalizados para ride (COM GEOMETRIAS):', {
      ...rideInput,
      from_geom: rideInput.from_geom ? 'PRESENT' : 'NULL',
      to_geom: rideInput.to_geom ? 'PRESENT' : 'NULL'
    });

    const validatedData = insertRideSchema.parse({
      ...rideInput,
      pricePerSeat: rideInput.pricePerSeat.toString()
    });

    console.log('✅ Dados validados com Zod, criando ride no banco...');

    // ✅✅✅ CORREÇÃO CRÍTICA: Passar driverId explicitamente para o RideService
    const rideData = {
      ...validatedData,
      driverId, // ← CORREÇÃO ADICIONADA AQUI
    };

    const newRide = await rideService.createRide(rideData as any);
    
    console.log('🎉 Ride criada com sucesso no banco:', { 
      rideId: newRide.id,
      driverId,
      vehicle_uuid: body.vehicleId || body.vehicle_uuid,
      hasGeometries: !!(fromGeom && toGeom)
    });

    res.status(201).json({
      success: true,
      message: 'Viagem criada com sucesso',
      data: { 
        ride: newRide,
        vehicleInfo: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          color: vehicle.color,
          plateNumber: vehicle.plate_number,
          maxPassengers: vehicle.max_passengers
        },
        // ✅✅✅ NOVO: Informações de geometria para debug
        geometryInfo: {
          fromGeom: !!fromGeom,
          toGeom: !!toGeom,
          coordinatesProvided: !!(fromLat && fromLng && toLat && toLng)
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Erro de validação Zod:', error.errors);
      logger.warn('❌ Validação Zod falhou', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.log('❌ Erro inesperado ao criar ride:', error);
    logger.error('Erro ao criar viagem:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// ✅✅✅ CORREÇÃO: Nova rota para busca inteligente de rides do motorista
// GET /api/provider/rides/smart/search - Busca inteligente para motoristas
router.get('/smart/search', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    // ✅✅✅ CORREÇÃO CRÍTICA: NORMALIZAR LOCALIZAÇÕES ANTES DA BUSCA
    const originalFrom = getQueryString(req.query, 'from');
    const originalTo = getQueryString(req.query, 'to');
    
    // ✅✅✅ CORREÇÃO: getQueryString já aplica decodeIfEncoded, mas vamos logar
    console.log('🔤 [SMART-SEARCH] Localizações após getQueryString:', {
      originalFrom,
      originalTo,
      fromLength: originalFrom.length,
      toLength: originalTo.length
    });

    const date = getQueryString(req.query, 'date');
    const radiusKm = getQueryNumber(req.query, 'radiusKm', 100);
    const maxResults = getQueryNumber(req.query, 'maxResults', 50);

    // ✅ APLICAR NORMALIZAÇÃO DO POSTGRESQL
    const normalizedFrom = await normalizeLocation(originalFrom);
    const normalizedTo = await normalizeLocation(originalTo);

    logger.info('🧠 PROVIDER: Busca inteligente NORMALIZADA e DECODIFICADA', {
      driverId,
      original: { from: originalFrom, to: originalTo },
      normalized: { from: normalizedFrom, to: normalizedTo },
      date,
      radiusKm,
      maxResults,
      normalizationApplied: originalFrom !== normalizedFrom || originalTo !== normalizedTo
    });

    let matchingRides: any[] = [];
    let searchMethod = 'smart_final';

    try {
      // ✅✅✅ CORREÇÃO CRÍTICA: Usar RPC para busca SMART FINAL com nomes NORMALIZADOS
      // A função callPostgresFunction agora aplica decodeURIComponent automaticamente
      matchingRides = await callPostgresFunction('get_rides_smart_final', [
        normalizedFrom,
        normalizedTo,
        radiusKm,
        maxResults
      ]);
      searchMethod = 'smart_final_normalized';
    } catch (smartError) {
      console.warn("❌ PROVIDER: Smart final falhou, usando universal como fallback:", smartError);
      matchingRides = await rideService.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        radiusKm: radiusKm,
        maxResults: maxResults
      });
      searchMethod = 'universal_fallback';
    }

    // ✅ Filtrar por data se fornecida
    if (date) {
      const searchDate = new Date(date);
      matchingRides = matchingRides.filter(ride => {
        if (!ride.departureDate) return false;
        const rideDate = new Date(ride.departureDate);
        return rideDate.toDateString() === searchDate.toDateString();
      });
    }

    // ✅ Aplicar limite de resultados
    matchingRides = matchingRides.slice(0, maxResults);

    // ✅✅✅ CORREÇÃO: ESTATÍSTICAS ATUALIZADAS COM DADOS DA FUNÇÃO INTELIGENTE
    const matchStats = {
      exact_match: matchingRides.filter(r => r.match_type === 'exact_match').length,
      exact_province: matchingRides.filter(r => r.match_type === 'exact_province').length,
      from_correct_province_to: matchingRides.filter(r => r.match_type === 'from_correct_province_to').length,
      to_correct_province_from: matchingRides.filter(r => r.match_type === 'to_correct_province_from').length,
      partial_from: matchingRides.filter(r => r.match_type === 'partial_from').length,
      partial_to: matchingRides.filter(r => r.match_type === 'partial_to').length,
      nearby: matchingRides.filter(r => r.match_type === 'nearby').length,
      all_rides: matchingRides.filter(r => r.match_type === 'all_rides').length,
      other: matchingRides.filter(r => r.match_type === 'other').length,
      total: matchingRides.length,
      // ✅ NOVAS ESTATÍSTICAS: Dados dos motoristas e veículos
      drivers_with_ratings: matchingRides.filter(r => r.driver_rating && r.driver_rating > 0).length,
      average_driver_rating: matchingRides.length > 0 
        ? parseFloat((matchingRides.reduce((sum, ride) => sum + (safeNumber(ride.driver_rating) || 0), 0) / matchingRides.length).toFixed(1))
        : 0,
      average_direction_score: matchingRides.length > 0 
        ? Math.round(matchingRides.reduce((sum, ride) => sum + (safeNumber(ride.direction_score) || 0), 0) / matchingRides.length)
        : 0,
      vehicle_types: matchingRides.reduce((acc: any, ride) => {
        const type = ride.vehicle_type || ride.vehicleType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    // ✅✅✅ CORREÇÃO: DEBUG COM DADOS COMPLETOS DA FUNÇÃO INTELIGENTE
    console.log('🎯 [PROVIDER-SMART-SEARCH] Resultados com dados completos:', {
      totalResults: matchingRides.length,
      sampleResults: matchingRides.slice(0, 3).map(ride => ({
        driverName: ride.driver_name || ride.driverName,
        driverRating: ride.driver_rating || ride.driverRating,
        vehicle: ride.vehicle_make ? `${ride.vehicle_make} ${ride.vehicle_model}` : 'N/A',
        vehicleType: ride.vehicle_type || 'N/A',
        price: ride.priceperseat || ride.pricePerSeat,
        match_type: ride.match_type,
        direction_score: ride.direction_score,
        // ✅✅✅ NOVO: Informações de geometria
        hasFromGeom: !!ride.from_geom,
        hasToGeom: !!ride.to_geom
      })),
      stats: matchStats
    });

    logger.info('✅ PROVIDER: Busca inteligente concluída', {
      driverId,
      total: matchingRides.length,
      method: searchMethod,
      stats: matchStats,
      normalization: {
        applied: originalFrom !== normalizedFrom || originalTo !== normalizedTo,
        original: { from: originalFrom, to: originalTo },
        normalized: { from: normalizedFrom, to: normalizedTo }
      }
    });

    res.json({
      success: true,
      data: {
        rides: matchingRides,
        stats: matchStats,
        searchParams: {
          from: originalFrom,
          to: originalTo,
          normalizedFrom,
          normalizedTo,
          date: date || 'qualquer',
          radiusKm,
          maxResults,
          searchMethod
        },
        normalization: {
          applied: originalFrom !== normalizedFrom || originalTo !== normalizedTo,
          original: { from: originalFrom, to: originalTo },
          normalized: { from: normalizedFrom, to: normalizedTo }
        },
        data_completeness: {
          driver_names: matchingRides.filter(r => r.driver_name && r.driver_name !== 'Motorista').length,
          driver_ratings: matchingRides.filter(r => r.driver_rating && safeNumber(r.driver_rating) > 0).length,
          vehicle_data: matchingRides.filter(r => r.vehicle_make && r.vehicle_model).length,
          prices: matchingRides.filter(r => r.priceperseat && safeNumber(r.priceperseat) > 0).length,
          direction_scores: matchingRides.filter(r => r.direction_score && safeNumber(r.direction_score) > 0).length,
          // ✅✅✅ NOVO: Estatísticas de geometria
          from_geometries: matchingRides.filter(r => r.from_geom).length,
          to_geometries: matchingRides.filter(r => r.to_geom).length
        },
        smart_search: true,
        smart_function_used: true
      }
    });
  } catch (error) {
    logger.error('❌ PROVIDER: Erro em busca inteligente:', error);
    
    try {
      const { from, to, maxResults = '50' } = req.query;
      
      // ✅ CORREÇÃO: Aplicar normalização do PostgreSQL mesmo no fallback
      const normalizedFromFallback = await normalizeLocation(from as string);
      const normalizedToFallback = await normalizeLocation(to as string);
      
      const traditionalRides = await rideService.getRides({
        fromLocation: normalizedFromFallback,
        toLocation: normalizedToFallback,
        status: 'available'
      }).then(rides => rides.slice(0, safeNumber(maxResults, 50)));

      res.json({
        success: true,
        data: {
          rides: traditionalRides,
          stats: {
            exact_match: 0,
            same_segment: 0,
            same_direction: 0,
            potential: 0,
            traditional: traditionalRides.length,
            total: traditionalRides.length
          },
          searchParams: {
            from: from as string,
            to: to as string,
            normalizedFrom: normalizedFromFallback,
            normalizedTo: normalizedToFallback,
            maxResults: safeNumber(maxResults, 50)
          },
          normalization: {
            applied: (from as string) !== normalizedFromFallback || (to as string) !== normalizedToFallback,
            original: { from: from as string, to: to as string },
            normalized: { from: normalizedFromFallback, to: normalizedToFallback }
          },
          warning: "Sistema inteligente temporariamente indisponível, usando busca tradicional"
        }
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: "Erro interno do servidor no sistema de busca"
      });
    }
  }
});

// ✅✅✅ CORREÇÃO: Nova rota para análise de mercado do motorista
// GET /api/provider/rides/market-analysis - Análise de mercado para motoristas
router.get('/market-analysis', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    // ✅✅✅ CORREÇÃO: NORMALIZAR LOCALIZAÇões PARA ANÁLISE DE MERCADO
    const originalFrom = getQueryString(req.query, 'from');
    const originalTo = getQueryString(req.query, 'to');
    const radiusKm = getQueryNumber(req.query, 'radiusKm', 100);

    const normalizedFrom = await normalizeLocation(originalFrom);
    const normalizedTo = await normalizeLocation(originalTo);

    logger.info('📊 PROVIDER: Análise de mercado NORMALIZADA', {
      driverId,
      original: { from: originalFrom, to: originalTo },
      normalized: { from: normalizedFrom, to: normalizedTo },
      radiusKm,
      normalizationApplied: originalFrom !== normalizedFrom || originalTo !== normalizedTo
    });

    // ✅✅✅ CORREÇÃO: Usar RPC para busca SMART FINAL com nomes NORMALIZADOS
    let marketRides: any[] = [];
    
    try {
      marketRides = await callPostgresFunction('get_rides_smart_final', [
        normalizedFrom,
        normalizedTo,
        radiusKm,
        50
      ]);
    } catch (smartError) {
      console.warn("❌ PROVIDER: Smart final falhou na análise, usando universal:", smartError);
      marketRides = await rideService.getRidesUniversal({
        fromLocation: normalizedFrom,
        toLocation: normalizedTo,
        radiusKm: radiusKm,
        maxResults: 50
      });
    }

    // ✅✅✅ CORREÇÃO: ANÁLISE COMPLETA COM NOVOS DADOS DA FUNÇÃO INTELIGENTE
    const prices = marketRides
      .filter(ride => safeNumber(ride.priceperseat || ride.pricePerSeat) > 0)
      .map(ride => safeNumber(ride.priceperseat || ride.pricePerSeat));
    
    const averagePrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
      : 0;
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // ✅ Análise de demanda
    const totalAvailableSeats = marketRides.reduce((sum, ride) => sum + safeNumber(ride.availableseats || ride.availableSeats), 0);
    const totalRides = marketRides.length;
    
    // ✅✅✅ CORREÇÃO: ANÁLISE DE MOTORISTAS E VEÍCULOS COMPLETA
    const vehicleTypes = marketRides.reduce((acc, ride) => {
      const type = ride.vehicle_type || ride.vehicleType || 'desconhecido';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ✅ Análise de ratings dos motoristas
    const driverRatings = marketRides
      .filter(ride => safeNumber(ride.driver_rating || ride.driverRating) > 0)
      .map(ride => safeNumber(ride.driver_rating || ride.driverRating));
    
    const averageDriverRating = driverRatings.length > 0 
      ? driverRatings.reduce((sum, rating) => sum + rating, 0) / driverRatings.length 
      : 0;

    // ✅ Análise de direction scores
    const directionScores = marketRides
      .filter(ride => safeNumber(ride.direction_score) > 0)
      .map(ride => safeNumber(ride.direction_score));
    
    const averageDirectionScore = directionScores.length > 0 
      ? directionScores.reduce((sum, score) => sum + score, 0) / directionScores.length 
      : 0;

    // ✅ Análise de datas
    const upcomingRides = marketRides.filter(ride => {
      const departureDate = safeDate(ride.departuredate || ride.departureDate);
      return departureDate >= new Date();
    }).length;

    // ✅✅✅ CORREÇÃO: ANÁLISE DE MERCADO COMPLETA COM NOVOS DADOS
    const marketAnalysis = {
      route: { from: originalFrom, to: originalTo, normalizedFrom, normalizedTo },
      pricing: {
        average: Math.round(averagePrice),
        min: Math.round(minPrice),
        max: Math.round(maxPrice),
        recommendation: averagePrice > 0 
          ? `Preço sugerido: ${Math.round(averagePrice * 0.9)} - ${Math.round(averagePrice * 1.1)} MZN`
          : 'Dados insuficientes para recomendação'
      },
      demand: {
        totalRides,
        totalAvailableSeats,
        demandLevel: totalRides === 0 ? 'baixa' : 
                    totalRides < 5 ? 'média' : 'alta',
        recommendation: totalRides === 0 
          ? 'Ótima oportunidade - pouca concorrência'
          : `Mercado ${totalRides < 5 ? 'moderado' : 'competitivo'} - ${totalRides} rides ativas`
      },
      drivers: {
        totalUnique: new Set(marketRides.map(ride => ride.driver_id || ride.driverId)).size,
        averageRating: parseFloat(averageDriverRating.toFixed(1)),
        averageDirectionScore: Math.round(averageDirectionScore),
        recommendation: averageDriverRating > 4.5 
          ? 'Mercado com motoristas bem avaliados - mantenha alta qualidade'
          : 'Oportunidade para se destacar com bom atendimento'
      },
      vehicles: {
        types: vehicleTypes,
        mostCommon: Object.keys(vehicleTypes).length > 0 
          ? Object.keys(vehicleTypes).reduce((a, b) => vehicleTypes[a] > vehicleTypes[b] ? a : b)
          : 'desconhecido',
        recommendation: Object.keys(vehicleTypes).length > 0 
          ? `Veículo mais comum: ${Object.keys(vehicleTypes).reduce((a, b) => vehicleTypes[a] > vehicleTypes[b] ? a : b)}`
          : 'Diversidade de veículos no mercado'
      },
      timing: {
        upcomingRides,
        recommendation: upcomingRides === 0 
          ? 'Horários flexíveis - baixa competição'
          : `Considere horários alternativos - ${upcomingRides} rides futuras`
      },
      match_quality: {
        averageDirectionScore: Math.round(averageDirectionScore),
        qualityLevel: averageDirectionScore >= 80 ? 'alta' : averageDirectionScore >= 60 ? 'média' : 'baixa',
        recommendation: averageDirectionScore >= 80 
          ? 'Mercado com alta qualidade de correspondência'
          : 'Oportunidade para oferecer rotas mais precisas'
      },
      // ✅✅✅ NOVO: Análise de geometrias
      geometry_analysis: {
        rides_with_geometries: marketRides.filter(r => r.from_geom && r.to_geom).length,
        geometry_coverage: totalRides > 0 ? Math.round((marketRides.filter(r => r.from_geom && r.to_geom).length / totalRides) * 100) : 0,
        recommendation: marketRides.filter(r => r.from_geom && r.to_geom).length === 0 
          ? '⚠️ Nenhuma ride com geometrias - buscas podem não funcionar corretamente'
          : `✅ ${marketRides.filter(r => r.from_geom && r.to_geom).length}/${totalRides} rides com geometrias`
      }
    };

    // ✅✅✅ CORREÇÃO: DEBUG DETALHADO DA ANÁLISE
    console.log('📊 [PROVIDER-MARKET-ANALYSIS] Análise completa:', {
      totalRides,
      averagePrice: marketAnalysis.pricing.average,
      driverStats: marketAnalysis.drivers,
      vehicleStats: marketAnalysis.vehicles,
      matchQuality: marketAnalysis.match_quality,
      geometryStats: marketAnalysis.geometry_analysis,
      sampleRides: marketRides.slice(0, 3).map(ride => ({
        driverName: ride.driver_name || ride.driverName,
        driverRating: ride.driver_rating || ride.driverRating,
        vehicle: ride.vehicle_make ? `${ride.vehicle_make} ${ride.vehicle_model}` : 'N/A',
        price: ride.priceperseat || ride.pricePerSeat,
        direction_score: ride.direction_score,
        hasGeometries: !!(ride.from_geom && ride.to_geom)
      }))
    });

    logger.info('✅ PROVIDER: Análise de mercado concluída', {
      driverId,
      totalRides,
      averagePrice: marketAnalysis.pricing.average,
      averageDriverRating: marketAnalysis.drivers.averageRating,
      averageDirectionScore: marketAnalysis.drivers.averageDirectionScore,
      geometryCoverage: marketAnalysis.geometry_analysis.geometry_coverage,
      normalization: {
        applied: originalFrom !== normalizedFrom || originalTo !== normalizedTo,
        original: { from: originalFrom, to: originalTo },
        normalized: { from: normalizedFrom, to: normalizedTo }
      }
    });

    res.json({
      success: true,
      data: {
        analysis: marketAnalysis,
        sampleRides: marketRides.slice(0, 5).map(ride => ({
          id: ride.ride_id || ride.id,
          driverName: ride.driver_name || ride.driverName,
          driverRating: ride.driver_rating || ride.driverRating,
          vehicleInfo: ride.vehicle_make ? {
            make: ride.vehicle_make,
            model: ride.vehicle_model,
            type: ride.vehicle_type
          } : ride.vehicleInfo,
          pricePerSeat: ride.priceperseat || ride.pricePerSeat,
          availableSeats: ride.availableseats || ride.availableSeats,
          departureDate: ride.departuredate || ride.departureDate,
          match_type: ride.match_type,
          direction_score: ride.direction_score,
          // ✅✅✅ NOVO: Informações de geometria
          hasGeometries: !!(ride.from_geom && ride.to_geom)
        })),
        searchParams: {
          from: originalFrom,
          to: originalTo,
          normalizedFrom,
          normalizedTo,
          radiusKm,
          totalRidesAnalyzed: marketRides.length
        },
        normalization: {
          applied: originalFrom !== normalizedFrom || originalTo !== normalizedTo,
          original: { from: originalFrom, to: originalTo },
          normalized: { from: normalizedFrom, to: normalizedTo }
        },
        data_completeness: {
          driver_names: marketRides.filter(r => r.driver_name && r.driver_name !== 'Motorista').length,
          driver_ratings: marketRides.filter(r => r.driver_rating && safeNumber(r.driver_rating) > 0).length,
          vehicle_data: marketRides.filter(r => r.vehicle_make && r.vehicle_model).length,
          prices: marketRides.filter(r => r.priceperseat && safeNumber(r.priceperseat) > 0).length,
          direction_scores: marketRides.filter(r => r.direction_score && safeNumber(r.direction_score) > 0).length,
          // ✅✅✅ NOVO: Estatísticas de geometria
          from_geometries: marketRides.filter(r => r.from_geom).length,
          to_geometries: marketRides.filter(r => r.to_geom).length,
          both_geometries: marketRides.filter(r => r.from_geom && r.to_geom).length
        },
        smart_analysis: true,
        smart_function_used: true
      }
    });
  } catch (error) {
    logger.error('❌ PROVIDER: Erro na análise de mercado:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor na análise de mercado"
    });
  }
});

// Rotas específicas primeiro
router.get('/driver/stats', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    logger.info('📊 Buscando estatísticas do motorista', { driverId });

    const driverRides = await rideService.getRidesByDriver(driverId);

    const totalRides = driverRides.length;
    const availableRides = driverRides.filter(ride => safeString(ride.status) === 'available').length;
    const completedRides = driverRides.filter(ride => safeString(ride.status) === 'completed').length;
    const cancelledRides = driverRides.filter(ride => safeString(ride.status) === 'cancelled').length;

    const totalRevenue = driverRides
      .filter(ride => safeString(ride.status) === 'completed')
      .reduce((sum, ride) => sum + calculateRideRevenue(ride), 0);

    const ratings = driverRides
      .filter(ride => safeNumber(ride.driverRating) > 0)
      .map(ride => safeNumber(ride.driverRating));
    
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
      : 4.8;

    logger.info('✅ Estatísticas calculadas com sucesso', {
      driverId,
      totalRides,
      completedRides,
      totalRevenue
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalRides,
          availableRides,
          completedRides,
          cancelledRides,
          totalRevenue,
          averageRating: Math.round(averageRating * 10) / 10
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

router.get('/dashboard/summary', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }

    logger.info('📈 Buscando resumo do dashboard', { driverId });

    const driverRides = await rideService.getRidesByDriver(driverId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeToday = driverRides.filter(ride => {
      const departureDate = safeDate(ride.departureDate);
      if (!departureDate) return false;
      
      const rideDate = new Date(departureDate);
      rideDate.setHours(0, 0, 0, 0);
      
      const rideStatus = safeString(ride.status);
      return rideDate.getTime() === today.getTime() && 
             (rideStatus === 'available' || rideStatus === 'active');
    }).length;

    const upcomingRides = driverRides
      .filter(ride => {
        const departureDate = safeDate(ride.departureDate);
        if (!departureDate) return false;
        
        const rideStatus = safeString(ride.status);
        return departureDate >= new Date() && rideStatus === 'available';
      })
      .slice(0, 5);

    const totalEarnings = driverRides
      .filter(ride => safeString(ride.status) === 'completed')
      .reduce((sum, ride) => sum + calculateRideRevenue(ride), 0);

    logger.info('✅ Resumo do dashboard gerado com sucesso', {
      driverId,
      activeToday,
      upcomingRides: upcomingRides.length,
      totalEarnings
    });

    res.json({
      success: true,
      data: {
        summary: {
          activeToday,
          totalRides: driverRides.length,
          upcomingRides: upcomingRides.length,
          totalEarnings
        },
        upcomingRides
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar resumo do dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/provider/rides - Listar viagens do motorista
router.get('/', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }
    
    const status = getQueryString(req.query, 'status');
    const page = getQueryNumber(req.query, 'page', 1);
    const limit = getQueryNumber(req.query, 'limit', 10);
    
    logger.info('📋 Listando viagens do motorista', {
      driverId,
      status,
      page,
      limit
    });

    const driverRides = await rideService.getRidesByDriver(driverId, status);
    
    // ✅ CORREÇÃO APLICADA: Usar safeNumber para garantir que são números
    const pageNum = Math.max(safeNumber(page), 1);
    const limitNum = Math.min(Math.max(safeNumber(limit), 1), 100);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRides = driverRides.slice(startIndex, endIndex);
    
    // ✅✅✅ CORREÇÃO: DEBUG COM DADOS COMPLETOS
    console.log('📋 [PROVIDER-RIDES-LIST] Rides do motorista:', {
      total: driverRides.length,
      returned: paginatedRides.length,
      sampleRides: paginatedRides.slice(0, 3).map(ride => ({
        id: ride.id,
        driverName: ride.driverName,
        driverRating: ride.driverRating,
        vehicle: ride.vehicleInfo ? `${ride.vehicleInfo.make} ${ride.vehicleInfo.model}` : 'N/A',
        price: ride.pricePerSeat,
        status: ride.status,
        // ✅✅✅ NOVO: Informações de geometria
        hasFromGeom: !!ride.from_geom,
        hasToGeom: !!ride.to_geom
      }))
    });

    logger.info('✅ Listagem de viagens concluída', {
      driverId,
      total: driverRides.length,
      returned: paginatedRides.length
    });

    res.json({
      success: true,
      data: {
        rides: paginatedRides,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: driverRides.length,
          totalPages: Math.ceil(driverRides.length / limitNum)
        },
        data_completeness: {
          driver_names: paginatedRides.filter(r => r.driverName && r.driverName !== 'Motorista').length,
          driver_ratings: paginatedRides.filter(r => r.driverRating && safeNumber(r.driverRating) > 0).length,
          vehicle_data: paginatedRides.filter(r => r.vehicleInfo && r.vehicleInfo.make).length,
          prices: paginatedRides.filter(r => r.pricePerSeat && safeNumber(r.pricePerSeat) > 0).length,
          // ✅✅✅ NOVO: Estatísticas de geometria
          from_geometries: paginatedRides.filter(r => r.from_geom).length,
          to_geometries: paginatedRides.filter(r => r.to_geom).length,
          both_geometries: paginatedRides.filter(r => r.from_geom && r.to_geom).length
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar viagens:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// PUT /api/provider/rides/:id - Atualizar viagem
router.put('/:id', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = getDriverId(req);
    const body = req.body;
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }
    
    const rideId = safeString(id);
    if (!rideId) {
      return res.status(400).json({
        success: false,
        error: 'ID da viagem é obrigatório'
      });
    }
    
    logger.info('✏️ Iniciando atualização de ride', { driverId, rideId });

    const { ride: existingRide, isOwner } = await verifyRideOwnership(rideId, driverId);

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        error: 'Viagem não encontrada'
      });
    }
    
    if (!isOwner) {
      logger.warn('🚫 Tentativa de editar ride não pertencente ao motorista', {
        driverId,
        rideOwner: existingRide.driverId,
        rideId
      });
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para editar esta viagem'
      });
    }

    const updateData: any = {
      ...body,
      ...(body.maxPassengers !== undefined && { 
        maxPassengers: safeNumber(body.maxPassengers, safeNumber(existingRide.maxPassengers))
      }),
      ...(body.availableSeats !== undefined && { 
        availableSeats: safeNumber(body.availableSeats, safeNumber(existingRide.availableSeats))
      }),
      ...(body.pricePerSeat !== undefined && { 
        pricePerSeat: safeNumber(body.pricePerSeat, safeNumber(existingRide.pricePerSeat))
      }),
      ...(body.departureDate !== undefined && { 
        departureDate: safeDate(body.departureDate)
      }),
      ...(body.fromProvince !== undefined && { 
        fromProvince: normalizeLocationField(body.fromProvince)
      }),
      ...(body.toProvince !== undefined && { 
        toProvince: normalizeLocationField(body.toProvince)
      }),
      ...(body.fromCity !== undefined && { 
        fromCity: normalizeLocationField(body.fromCity)
      }),
      ...(body.toCity !== undefined && { 
        toCity: normalizeLocationField(body.toCity)
      }),
      ...(body.fromLocality !== undefined && { 
        fromLocality: normalizeLocationField(body.fromLocality)
      }),
      ...(body.toLocality !== undefined && { 
        toLocality: normalizeLocationField(body.toLocality)
      }),
      // ✅✅✅ NOVO: Atualizar geometrias se coordenadas forem fornecidas
      ...(body.fromLat !== undefined && body.fromLng !== undefined && { 
        from_geom: createGeometryFromCoords(body.fromLat, body.fromLng)
      }),
      ...(body.toLat !== undefined && body.toLng !== undefined && { 
        to_geom: createGeometryFromCoords(body.toLat, body.toLng)
      }),
    };

    const validatedUpdateData = updateRideSchema.partial().parse({
      ...updateData,
      ...(updateData.pricePerSeat !== undefined && { 
        pricePerSeat: updateData.pricePerSeat.toString() 
      })
    });

    const updatedRide = await rideService.updateRide(rideId, validatedUpdateData as any);

    if (!updatedRide) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar viagem'
      });
    }
    
    logger.info(`✅ Viagem atualizada com sucesso`, { driverId, rideId });

    res.json({
      success: true,
      message: 'Viagem atualizada com sucesso',
      data: { ride: updatedRide }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('❌ Validação Zod falhou na atualização', { errors: error.errors });
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    logger.error('Erro ao atualizar viagem:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// DELETE /api/provider/rides/:id - Cancelar viagem
router.delete('/:id', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }
    
    const rideId = safeString(id);
    if (!rideId) {
      return res.status(400).json({
        success: false,
        error: 'ID da viagem é obrigatório'
      });
    }
    
    logger.info('🗑️ Iniciando cancelamento de ride', { driverId, rideId });

    const { ride: existingRide, isOwner } = await verifyRideOwnership(rideId, driverId);

    if (!existingRide) {
      return res.status(404).json({
        success: false,
        error: 'Viagem não encontrada'
      });
    }
    
    if (!isOwner) {
      logger.warn('🚫 Tentativa de cancelar ride não pertencente ao motorista', {
        driverId,
        rideOwner: existingRide.driverId,
        rideId
      });
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para cancelar esta viagem'
      });
    }
    
    const rideStatus = safeString(existingRide.status);
    const cancellableStatuses = ['available', 'active', 'pending', 'confirmed'];
    
    if (!cancellableStatuses.includes(rideStatus)) {
      return res.status(400).json({
        success: false,
        error: `Não é possível cancelar viagens com status "${rideStatus}". Status canceláveis: ${cancellableStatuses.join(', ')}`
      });
    }
    
    const cancelled = await rideService.updateRide(rideId, { 
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    } as any);
    
    if (!cancelled) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao cancelar viagem'
      });
    }
    
    logger.info(`✅ Viagem cancelada com sucesso`, { driverId, rideId });

    res.json({
      success: true,
      message: 'Viagem cancelada com sucesso',
      data: {
        rideId,
        cancelledAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Erro ao cancelar viagem:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/provider/rides/:id - Obter detalhes de uma viagem específica
router.get('/:id', verifyFirebaseToken, requireDriverRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverId = getDriverId(req);
    
    if (!driverId) {
      return res.status(401).json({ 
        success: false,
        error: 'Usuário não autenticado' 
      });
    }
    
    const rideId = safeString(id);
    if (!rideId) {
      return res.status(400).json({
        success: false,
        error: 'ID da viagem é obrigatório'
      });
    }
    
    logger.info('🔍 Buscando detalhes da ride', { driverId, rideId });

    const { ride, isOwner } = await verifyRideOwnership(rideId, driverId);
    
    if (!ride) {
      return res.status(404).json({
        success: false,
        error: 'Viagem não encontrada'
      });
    }
    
    if (!isOwner) {
      logger.warn('🚫 Tentativa de acessar ride não pertencente ao motorista', {
        driverId,
        rideOwner: ride.driverId,
        rideId
      });
      return res.status(403).json({
        success: false,
        error: 'Sem permissão para visualizar esta viagem'
      });
    }
    
    // ✅✅✅ CORREÇÃO: DEBUG COM DADOS COMPLETOS
    console.log('🔍 [PROVIDER-RIDE-DETAILS] Detalhes completos da ride:', {
      rideId,
      driverName: ride.driverName,
      driverRating: ride.driverRating,
      vehicleInfo: ride.vehicleInfo,
      price: ride.pricePerSeat,
      status: ride.status,
      // ✅✅✅ NOVO: Informações de geometria
      hasFromGeom: !!ride.from_geom,
      hasToGeom: !!ride.to_geom
    });

    logger.info('✅ Detalhes da ride retornados com sucesso', { driverId, rideId });

    res.json({
      success: true,
      data: { 
        ride,
        data_completeness: {
          has_driver_name: !!ride.driverName && ride.driverName !== 'Motorista',
          has_driver_rating: !!ride.driverRating && safeNumber(ride.driverRating) > 0,
          has_vehicle_data: !!ride.vehicleInfo && !!ride.vehicleInfo.make,
          has_price: !!ride.pricePerSeat && safeNumber(ride.pricePerSeat) > 0,
          // ✅✅✅ NOVO: Informações de geometria
          has_from_geometry: !!ride.from_geom,
          has_to_geometry: !!ride.to_geom
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar detalhes da viagem:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;