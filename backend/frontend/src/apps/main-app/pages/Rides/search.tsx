/**
 * src/apps/main-app/pages/Rides/search.tsx (MODERNO)
 * Página de resultados de rides com design moderno e tema laranja
 * Versão: 23/02/2026 - Estilo consistente com Hotéis e Event Spaces
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Slider } from "@/shared/components/ui/slider";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import { 
  ArrowLeft, Phone, Mail, CreditCard, User, Star, MapPin, Navigation, 
  RefreshCw, Car, Users, Clock, MapPinned, Filter, Search, Calendar,
  ChevronRight, Shield, CheckCircle, TrendingUp, ChevronLeft,
  Heart, Zap, Route, Award, Car as CarIcon, UserCheck, ShieldCheck,
  XCircle
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import PageHeader from "@/shared/components/PageHeader";
import MobileNavigation from "@/shared/components/MobileNavigation";
import useAuth from "@/shared/hooks/useAuth";
import { clientRidesApi, type Ride } from "@/api/client/rides";
import { formatPrice } from "@/shared/lib/api-utils";

// ✅ Interface local COMPATÍVEL com a Ride original
interface RideWithMatch {
  // ✅ Campos obrigatórios da interface Ride
  ride_id: string;
  driver_id: string;
  driver_name: string;
  driver_rating: number;
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
  priceperseat: number;
  distance_from_city_km: number;
  distance_to_city_km: number;
  
  // ✅ Campos opcionais da interface Ride
  from_province?: string;
  to_province?: string;
  match_type?: string;
  direction_score?: number;
  
  // ✅ Campos adicionais para compatibilidade com frontend
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  fromLocation: string;
  toLocation: string;
  fromAddress: string;
  toAddress: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  departureTime: string;
  price: number;
  pricePerSeat: number;
  availableSeats: number;
  maxPassengers: number;
  vehicle: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  status: string;
  type: string;
  
  // ✅ Campos de matching
  route_compatibility?: number;
  matchScore?: number;
  dist_from_user_km?: number;
  
  // ✅ Campos adicionais
  currentPassengers?: number;
  vehicleInfo?: string;
  description?: string;
  vehiclePhoto?: string;
  estimatedDuration?: string;
  estimatedDistance?: string;
  allowNegotiation?: boolean;
  allowPickupEnRoute?: boolean;
  isVerifiedDriver?: boolean;
  driver?: any;
  fromLatitude?: number;
  fromLongitude?: number;
  toLatitude?: number;
  toLongitude?: number;
  vehicleFeatures?: string[];
  
  // ✅ Campos formatados
  departureDateFormatted?: string;
  departureTimeFormatted?: string;
  departureDateTimeFormatted?: string;
  departureLongDate?: string;
  departureWeekday?: string;
}

// ✅ Interface MatchStats atualizada COMPLETA
export interface MatchStats {
  total: number;
  exact?: number;
  exact_match?: number;
  compatible?: number;
  same_segment?: number;
  same_direction?: number;
  potential_match?: number;
  smart_matches?: number;
  match_types?: Record<string, number>;
  
  // ✅ Campos adicionais da resposta SMART SEARCH
  exact_matches?: number;
  partial_from?: number;
  partial_to?: number;
  exact_province?: number;
  from_correct_province_to?: number;
  to_correct_province_from?: number;
  nearby?: number;
  average_direction_score?: number;
  average_driver_rating?: number;
  drivers_with_ratings?: number;
  vehicle_types?: Record<string, number>;
}

// ✅ INTERFACE EXTENDIDA PARA PARÂMETROS DE BUSCA COM COORDENADAS
interface RideSearchParamsExtended {
  from: string;
  to: string;
  date: string;
  passengers: number;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  radius?: number;
  transportType?: string;
  fromCity?: string;
  toCity?: string;
  fromId?: string;
  toId?: string;
}

interface LocationState {
  rides: RideWithMatch[];
  searchParams: RideSearchParamsExtended;
  timestamp?: number;
}

// ✅ INTERFACE PARA BOOKING REQUEST
interface BookingRequest {
  rideId: string;
  passengers: number;
  pickupLocation: string;
  notes: string;
}

// ✅ FUNÇÕES DE DATA
const formatDateForDisplay = (dateString: string) => {
  try {
    if (!dateString) return 'Data não disponível';
    
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    return format(date, 'dd/MM/yyyy, HH:mm');
  } catch (error) {
    console.error('❌ Erro ao formatar data:', error);
    return 'Erro na data';
  }
};

const isRideDateExact = (rideDate: string, searchDate: string) => {
  if (!rideDate || !searchDate) return false;
  
  try {
    const rideDateObj = parseISO(rideDate);
    const searchDateObj = parseISO(searchDate);
    return isSameDay(rideDateObj, searchDateObj);
  } catch (error) {
    console.error('❌ Erro ao comparar datas:', error);
    return false;
  }
};

const getDateDifference = (rideDate: string, searchDate: string) => {
  if (!rideDate || !searchDate) return 0;
  
  try {
    const rideDateObj = parseISO(rideDate);
    const searchDateObj = parseISO(searchDate);
    return Math.abs(differenceInDays(rideDateObj, searchDateObj));
  } catch (error) {
    console.error('❌ Erro ao calcular diferença de datas:', error);
    return 0;
  }
};

// ✅ FUNÇÃO: Ordenar rides - data correta primeiro, depois por proximidade
const sortRidesByDateRelevance = (rides: RideWithMatch[], searchDate: string) => {
  return [...rides].sort((a, b) => {
    const aIsExact = isRideDateExact(a.departureDate, searchDate);
    const bIsExact = isRideDateExact(b.departureDate, searchDate);
    
    // ✅ Primeiro: Rides na data exata
    if (aIsExact && !bIsExact) return -1;
    if (!aIsExact && bIsExact) return 1;
    
    // ✅ Segundo: Ambos na data exata - ordenar por horário mais próximo
    if (aIsExact && bIsExact) {
      const aDate = parseISO(a.departureDate);
      const bDate = parseISO(b.departureDate);
      return aDate.getTime() - bDate.getTime(); // Mais cedo primeiro
    }
    
    // ✅ Terceiro: Ambos em datas diferentes - ordenar por proximidade da data
    const aDiff = getDateDifference(a.departureDate, searchDate);
    const bDiff = getDateDifference(b.departureDate, searchDate);
    
    if (aDiff !== bDiff) {
      return aDiff - bDiff; // Menor diferença primeiro
    }
    
    // ✅ Quarto: Mesma diferença - ordenar por score de matching
    const aScore = a.direction_score || 0;
    const bScore = b.direction_score || 0;
    return bScore - aScore; // Maior score primeiro
  });
};

// ✅ COMPONENTE: Banner de aviso para datas diferentes
const DateWarningBanner = ({ searchDate, hasExactDateRides }: { 
  searchDate: string; 
  hasExactDateRides: boolean;
}) => {
  if (hasExactDateRides) return null;
  
  try {
    const searchDateObj = parseISO(searchDate);
    const formattedSearchDate = format(searchDateObj, 'dd/MM/yyyy');
    
    return (
      <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-l-4 border-l-orange-500 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 text-white p-2 rounded-full">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-orange-900">Rides em datas próximas</h3>
            <p className="text-orange-700 text-sm">
              Não encontramos rides na data <span className="font-semibold">{formattedSearchDate}</span>, 
              mas temos essas opções em outras datas próximas:
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ Erro no DateWarningBanner:', error);
    return null;
  }
};

// ✅ FUNÇÃO DE MAPEAMENTO COMPLETAMENTE CORRIGIDA
const mapRidesToFrontend = (rides: any[]): RideWithMatch[] => {
  console.log('🔄 [MAPEAMENTO-LOCAL] Mapeando rides para frontend:', rides?.length || 0);
  
  if (!rides || !Array.isArray(rides)) {
    console.warn('⚠️ [MAPEAMENTO-LOCAL] Dados inválidos para mapeamento');
    return [];
  }

  return rides.map((ride, index) => {
    console.log(`🚗 [MAPEAMENTO-${index}] Processando ride:`, {
      id: ride.ride_id || ride.id,
      driverName: ride.driver_name || ride.driverName,
      match_type: ride.match_type,
      direction_score: ride.direction_score
    });

    // ✅ Mapeamento COMPATÍVEL com ambas as interfaces
    const mappedRide: RideWithMatch = {
      // ✅ Campos ORIGINAIS da interface Ride (obrigatórios)
      ride_id: ride.ride_id || ride.id || '',
      driver_id: ride.driver_id || ride.driverId || '',
      driver_name: ride.driver_name || ride.driverName || 'Motorista',
      driver_rating: Number(ride.driver_rating ?? ride.driverRating ?? 4.5),
      vehicle_make: ride.vehicle_make || ride.vehicleMake || '',
      vehicle_model: ride.vehicle_model || ride.vehicleModel || '',
      vehicle_type: ride.vehicle_type || ride.vehicleType || 'economy',
      vehicle_plate: ride.vehicle_plate || ride.vehiclePlate || '',
      vehicle_color: ride.vehicle_color || ride.vehicleColor || '',
      max_passengers: Number(ride.max_passengers ?? ride.maxPassengers ?? 4),
      from_city: ride.from_city || ride.fromCity || '',
      to_city: ride.to_city || ride.toCity || '',
      from_lat: Number(ride.from_lat ?? ride.fromLat ?? 0),
      from_lng: Number(ride.from_lng ?? ride.fromLng ?? 0),
      to_lat: Number(ride.to_lat ?? ride.toLat ?? 0),
      to_lng: Number(ride.to_lng ?? ride.toLng ?? 0),
      departuredate: ride.departuredate || ride.departureDate || '',
      availableseats: Number(ride.availableseats ?? ride.availableSeats ?? 0),
      priceperseat: Number(ride.priceperseat ?? ride.pricePerSeat ?? 0),
      distance_from_city_km: Number(ride.distance_from_city_km ?? ride.distanceFromCityKm ?? 0),
      distance_to_city_km: Number(ride.distance_to_city_km ?? ride.distanceToCityKm ?? 0),
      
      // ✅ Campos opcionais da interface Ride
      from_province: ride.from_province || ride.fromProvince,
      to_province: ride.to_province || ride.toProvince,
      match_type: ride.match_type || 'traditional',
      direction_score: Number(ride.direction_score ?? ride.route_compatibility ?? ride.matchScore ?? 0),
      
      // ✅ ALIAS para compatibilidade com frontend
      id: ride.ride_id || ride.id || '',
      driverId: ride.driver_id || ride.driverId || '',
      driverName: ride.driver_name || ride.driverName || 'Motorista',
      driverRating: Number(ride.driver_rating ?? ride.driverRating ?? 4.5),
      fromLocation: ride.from_city || ride.fromCity || '',
      toLocation: ride.to_city || ride.toCity || '',
      fromAddress: ride.from_city || ride.fromCity || '',
      toAddress: ride.to_city || ride.toCity || '',
      fromCity: ride.from_city || ride.fromCity || '',
      toCity: ride.to_city || ride.toCity || '',
      departureDate: ride.departuredate || ride.departureDate || '',
      departureTime: ride.departureTime || '',
      price: Number(ride.priceperseat ?? ride.pricePerSeat ?? 0),
      pricePerSeat: Number(ride.priceperseat ?? ride.pricePerSeat ?? 0),
      availableSeats: Number(ride.availableseats ?? ride.availableSeats ?? 0),
      maxPassengers: Number(ride.max_passengers ?? ride.maxPassengers ?? 4),
      vehicle: ride.vehicle_type || ride.vehicleType || 'Veículo',
      vehicleType: ride.vehicle_type || ride.vehicleType || 'economy',
      vehicleMake: ride.vehicle_make || ride.vehicleMake || '',
      vehicleModel: ride.vehicle_model || ride.vehicleModel || '',
      vehiclePlate: ride.vehicle_plate || ride.vehiclePlate || '',
      vehicleColor: ride.vehicle_color || ride.vehicleColor || '',
      status: ride.status || 'available',
      type: ride.type || 'one-way',
      
      // ✅ Campos de compatibilidade
      route_compatibility: Number(ride.direction_score ?? ride.route_compatibility ?? ride.matchScore ?? 0),
      matchScore: Number(ride.direction_score ?? ride.route_compatibility ?? ride.matchScore ?? 0),
      dist_from_user_km: Number(ride.distance_from_city_km ?? ride.distanceFromCityKm ?? 0),
      
      // ✅ Campos de coordenadas (alias)
      fromLatitude: Number(ride.from_lat ?? ride.fromLat ?? 0),
      fromLongitude: Number(ride.from_lng ?? ride.fromLng ?? 0),
      toLatitude: Number(ride.to_lat ?? ride.toLat ?? 0),
      toLongitude: Number(ride.to_lng ?? ride.toLng ?? 0),
      
      // ✅ Campos formatados
      departureDateFormatted: '',
      departureTimeFormatted: '',
      departureDateTimeFormatted: '',
      departureLongDate: '',
      departureWeekday: '',
      
      // ✅ Campos opcionais
      currentPassengers: ride.currentPassengers || 0,
      vehicleInfo: ride.vehicleInfo || `${ride.vehicle_make || ''} ${ride.vehicle_model || ''}`.trim(),
      description: ride.description,
      vehiclePhoto: ride.vehiclePhoto,
      estimatedDuration: ride.estimatedDuration,
      estimatedDistance: ride.estimatedDistance,
      allowNegotiation: ride.allowNegotiation || false,
      allowPickupEnRoute: ride.allowPickupEnRoute || false,
      isVerifiedDriver: ride.isVerifiedDriver || false,
      driver: ride.driver,
      vehicleFeatures: ride.vehicleFeatures || [],
    };

    console.log(`✅ [MAPEAMENTO-${index}] Ride mapeado:`, {
      id: mappedRide.id,
      driverName: mappedRide.driverName,
      match_type: mappedRide.match_type,
      direction_score: mappedRide.direction_score,
      distance: mappedRide.distance_from_city_km
    });

    return mappedRide;
  });
};

// ✅ BUSCA USANDO A NOVA API CLIENT
const executeSearch = async (searchParams: RideSearchParamsExtended) => {
  try {
    console.log('🎯 Iniciando busca com API CLIENT...', searchParams);
    
    // ✅ Usar a nova API client em vez de fetch direto
    const searchResults = await clientRidesApi.search({
      from: searchParams.from,
      to: searchParams.to,
      date: searchParams.date,
      passengers: searchParams.passengers,
      radiusKm: searchParams.radius || 200,
      smartSearch: true // ✅ Sempre usar busca inteligente
    });

    console.log('✅ Resultados da API:', {
      success: searchResults.success,
      ridesCount: searchResults.rides?.length || 0,
      smartSearch: searchResults.smart_search,
      matchStats: searchResults.matchStats
    });

    if (searchResults.success && searchResults.rides) {
      const mappedRides = mapRidesToFrontend(searchResults.rides);
      
      return {
        success: true,
        rides: mappedRides,
        searchType: 'smart',
        total: mappedRides.length,
        matchStats: searchResults.matchStats
      };
    }

    // ✅ SE NÃO ENCONTRAR, RETORNAR VAZIO
    console.log('ℹ️ Nenhum resultado encontrado na busca');
    return {
      success: true,
      rides: [],
      searchType: 'smart',
      total: 0,
      message: 'Nenhuma viagem encontrada para os critérios especificados'
    };

  } catch (error) {
    console.error('❌ Erro na busca:', error);
    
    // ✅ EM CASO DE ERRO, RETORNAR VAZIO COM MENSAGEM
    return {
      success: false,
      rides: [],
      searchType: 'error',
      total: 0,
      message: 'Erro temporário na busca. Tente novamente.'
    };
  }
};

// ✅ Função tipada para obter tipo de match para exibição
const getMatchTypeDisplay = (ride: RideWithMatch): { text: string; color: string; icon: React.ReactNode } => {
  const matchType = ride.match_type;
  const directionScore = ride.direction_score || 0;
  
  switch (matchType) {
    case 'exact_match':
      return { 
        text: `Exato (${directionScore}pts)`, 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <Award className="w-3 h-3" />
      };
    case 'exact_province':
      return { 
        text: `Mesma Província (${directionScore}pts)`, 
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <MapPin className="w-3 h-3" />
      };
    case 'from_correct_province_to':
      return { 
        text: `Origem Correta (${directionScore}pts)`, 
        color: 'bg-teal-100 text-teal-800 border-teal-200',
        icon: <Route className="w-3 h-3" />
      };
    case 'to_correct_province_from':
      return { 
        text: `Destino Correto (${directionScore}pts)`, 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Route className="w-3 h-3" />
      };
    case 'partial_from':
      return { 
        text: `Origem Similar (${directionScore}pts)`, 
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <MapPin className="w-3 h-3" />
      };
    case 'partial_to':
      return { 
        text: `Destino Similar (${directionScore}pts)`, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <MapPin className="w-3 h-3" />
      };
    case 'nearby':
      return { 
        text: `Próximo (${directionScore}pts)`, 
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Navigation className="w-3 h-3" />
      };
    case 'smart_match':
    case 'smart_final_direct':
      return { 
        text: `Inteligente (${directionScore}pts)`, 
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Zap className="w-3 h-3" />
      };
    case 'potential_match':
      return { 
        text: `Compatível (${directionScore}pts)`, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <CheckCircle className="w-3 h-3" />
      };
    default:
      return { 
        text: `Tradicional (${directionScore}pts)`, 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <CarIcon className="w-3 h-3" />
      };
  }
};

// ✅ Função para decodificar parâmetros da URL
const decodeParam = (param: string): string => {
  if (!param) return '';
  try {
    return decodeURIComponent(param);
  } catch (error) {
    console.error('❌ Erro ao decodificar parâmetro:', error);
    return param;
  }
};

// ✅ COMPONENTE: RideCard moderno
const RideCard = ({ ride, onBook }: { ride: RideWithMatch; onBook: () => void }) => {
  const { user } = useAuth();
  const availableSeats = ride.availableseats || ride.availableSeats || 0;
  const isFullyBooked = availableSeats === 0;
  const matchInfo = getMatchTypeDisplay(ride);
  const isExactDate = isRideDateExact(ride.departureDate, ride.departureDate);
  const dateDifference = getDateDifference(ride.departureDate, ride.departureDate);
  
  return (
    <div className="group relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200">
        {/* Badge de distância */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className={`${matchInfo.color} flex items-center gap-1`}>
            {matchInfo.icon}
            {matchInfo.text}
          </Badge>
        </div>
        
        {/* Badge de data */}
        {!isExactDate && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {dateDifference === 1 ? '1 dia' : `${dateDifference} dias`}
            </Badge>
          </div>
        )}
        
        <CardContent className="p-0">
          {/* Header com origem e destino */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="bg-orange-100 p-1 rounded">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {decodeParam(ride.from_city || ride.fromCity || '')}
                    </h3>
                    <p className="text-xs text-gray-600">Origem</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center my-1">
                  <div className="w-8 h-0.5 bg-orange-300"></div>
                  <ChevronRight className="w-4 h-4 text-orange-500 mx-1" />
                  <div className="w-8 h-0.5 bg-orange-300"></div>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-orange-100 p-1 rounded">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {decodeParam(ride.to_city || ride.toCity || '')}
                    </h3>
                    <p className="text-xs text-gray-600">Destino</p>
                  </div>
                </div>
              </div>
              
              {/* Preço */}
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(ride.priceperseat || ride.pricePerSeat || 0)}
                </div>
                <p className="text-xs text-gray-600">por passageiro</p>
              </div>
            </div>
          </div>
          
          {/* Informações principais */}
          <div className="p-4">
            {/* Data e horário */}
            <div className={`mb-4 p-3 rounded-lg ${isExactDate ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${isExactDate ? 'text-green-600' : 'text-orange-600'}`} />
                <div>
                  <p className={`font-semibold ${isExactDate ? 'text-green-800' : 'text-orange-800'}`}>
                    {formatDateForDisplay(ride.departuredate || ride.departureDate || '')}
                  </p>
                  {!isExactDate && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ {dateDifference === 1 ? '1 dia de diferença' : `${dateDifference} dias de diferença`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Informações do motorista e veículo */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Motorista */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Motorista</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{ride.driver_name || ride.driverName || 'Motorista'}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {(ride.driver_rating || ride.driverRating || 4.5).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {ride.isVerifiedDriver && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Veículo */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Veículo</h4>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {ride.vehicle_make || ride.vehicleMake} {ride.vehicle_model || ride.vehicleModel}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    {ride.vehicle_plate && (
                      <span className="font-mono">{ride.vehicle_plate}</span>
                    )}
                    {ride.vehicle_color && (
                      <span>• {ride.vehicle_color}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-orange-50 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-orange-700 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-semibold">Lugares</span>
                </div>
                <p className={`text-lg font-bold ${isFullyBooked ? 'text-red-600' : 'text-orange-600'}`}>
                  {isFullyBooked ? 'LOTADO' : availableSeats}
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-700 mb-1">
                  <Car className="w-4 h-4" />
                  <span className="text-xs font-semibold">Tipo</span>
                </div>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {ride.vehicle_type || ride.vehicleType || 'standard'}
                </p>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-gray-700 mb-1">
                  <MapPinned className="w-4 h-4" />
                  <span className="text-xs font-semibold">Distância</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {ride.distance_from_city_km ? `${ride.distance_from_city_km.toFixed(1)} km` : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Features */}
            {(ride.allowNegotiation || ride.allowPickupEnRoute || ride.vehicleFeatures?.length) && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Comodidades</p>
                <div className="flex flex-wrap gap-2">
                  {ride.allowNegotiation && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      💰 Negociável
                    </Badge>
                  )}
                  {ride.allowPickupEnRoute && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      🚏 Pickup no caminho
                    </Badge>
                  )}
                  {ride.vehicleFeatures?.slice(0, 2).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                      {feature}
                    </Badge>
                  ))}
                  {ride.vehicleFeatures && ride.vehicleFeatures.length > 2 && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                      +{ride.vehicleFeatures.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Botão de reserva */}
            <Button 
              onClick={onBook}
              disabled={isFullyBooked || !user}
              className={`w-full ${
                !isFullyBooked && user
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              size="lg"
            >
              {!user ? (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Login para Reservar
                </>
              ) : isFullyBooked ? (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  LOTADO
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Reservar Agora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function RideSearchPage() {
  const [location, setLocation] = useLocation();
  const [selectedRide, setSelectedRide] = useState<RideWithMatch | null>(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    passengers: 1,
    phone: "",
    email: "",
    notes: ""
  });
  
  const { toast } = useToast();
  const { user } = useAuth();

  // ✅ USAR INTERFACE RIDE COM MATCHING - INICIALIZAR SEMPRE COMO ARRAY
  const [rides, setRides] = useState<RideWithMatch[]>([]);
  const [searchParams, setSearchParams] = useState<RideSearchParamsExtended>({
    from: "",
    to: "",
    date: "",
    passengers: 1,
    radius: 100 // ✅ Raio padrão de 100km
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Função para ler parâmetros da URL
  const getSearchParamsFromURL = (): Partial<RideSearchParamsExtended> => {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Partial<RideSearchParamsExtended> = {};
    
    // Parâmetros básicos
    if (urlParams.has('from')) params.from = decodeParam(urlParams.get('from') || '');
    if (urlParams.has('to')) params.to = decodeParam(urlParams.get('to') || '');
    if (urlParams.has('date')) params.date = urlParams.get('date') || '';
    if (urlParams.has('passengers')) params.passengers = parseInt(urlParams.get('passengers') || '1');
    if (urlParams.has('radius')) params.radius = parseInt(urlParams.get('radius') || '200');
    
    // IDs das localizações
    if (urlParams.has('fromId')) params.fromId = urlParams.get('fromId') || '';
    if (urlParams.has('toId')) params.toId = urlParams.get('toId') || '';
    
    // Coordenadas (se disponíveis)
    if (urlParams.has('fromLat')) params.fromLat = parseFloat(urlParams.get('fromLat') || '0');
    if (urlParams.has('fromLng')) params.fromLng = parseFloat(urlParams.get('fromLng') || '0');
    if (urlParams.has('toLat')) params.toLat = parseFloat(urlParams.get('toLat') || '0');
    if (urlParams.has('toLng')) params.toLng = parseFloat(urlParams.get('toLng') || '0');
    
    console.log('🔗 [DEBUG-URL-PARAMS] Parâmetros da URL:', params);
    return params;
  };

  // ✅ useEffect completamente corrigido
  useEffect(() => {
    console.log('🚗 RideSearchPage - Iniciando...');
    
    const currentState = (history.state || {}) as LocationState;
    const urlParams = getSearchParamsFromURL();
    
    console.log('🔍 [DEBUG-NAVIGATION] Dados recebidos:', {
      viaState: !!currentState?.searchParams,
      viaURL: Object.keys(urlParams).length > 0,
      stateDate: currentState?.searchParams?.date,
      urlDate: urlParams.date,
      fullURLParams: urlParams,
      fullStateParams: currentState?.searchParams
    });
    
    // ✅ Combinar parâmetros do state E da URL
    const combinedParams: RideSearchParamsExtended = {
      // Começar com state (se disponível) ou padrões
      ...(currentState?.searchParams || {
        from: "",
        to: "", 
        date: "",
        passengers: 1,
        radius: 200
      }),
      
      // URL tem PRIORIDADE MÁXIMA (sobrescreve tudo)
      ...urlParams
    };

    console.log('🎯 [DEBUG-COMBINED] Parâmetros finais:', {
      from: combinedParams.from,
      to: combinedParams.to, 
      date: combinedParams.date,
      passengers: combinedParams.passengers,
      source: urlParams.from ? 'URL' : currentState?.searchParams?.from ? 'STATE' : 'DEFAULT'
    });
    
    // ✅ Atualizar estado E executar busca de forma síncrona
    setSearchParams(combinedParams);
    
    // ✅ Executar busca DIRETAMENTE com os parâmetros combinados
    if (combinedParams.from && combinedParams.to) {
      console.log('📍 Parâmetros válidos, iniciando busca DIRETA...');
      
      // ✅ Pequeno delay para garantir que componentes estão montados
      setTimeout(() => {
        executeSearchWithParams(combinedParams);
      }, 50);
    } else {
      console.log('❌ Parâmetros insuficientes para busca');
      redirectToHome();
    }
  }, []); // ✅ Executar apenas no mount

  const redirectToHome = () => {
    toast({
      title: "Dados não encontrados",
      description: "Por favor, realize uma nova busca.",
      variant: "destructive",
      duration: 4000,
    });
    setLocation('/');
  };

  // ✅ executeSearchWithParams recebe parâmetros explicitamente
  const executeSearchWithParams = async (params: RideSearchParamsExtended) => {
    console.log('🚀 [EXECUTE-SEARCH] Executando busca com parâmetros:', {
      from: params.from,
      to: params.to,
      date: params.date
    });

    setIsLoading(true);
    
    try {
      // ✅ USAR NOVA API CLIENT
      const searchResults = await executeSearch(params);
      
      console.log('🎯 [SMART-SEARCH-RESULTS] Resultados:', searchResults.rides.length);
      
      // ✅ Exibir estatísticas de matching
      if (searchResults.rides.length > 0) {
        const matchTypes = searchResults.rides.reduce((acc, ride) => {
          acc[ride.match_type || 'traditional'] = (acc[ride.match_type || 'traditional'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const exactMatches = matchTypes['exact_match'] || 0;
        const smartMatches = Object.keys(matchTypes).filter(key => 
          key !== 'traditional'
        ).reduce((sum, key) => sum + (matchTypes[key] || 0), 0);
        
        console.log(`📊 Estatísticas:`, matchTypes);
        
        // ✅ FEEDBACK POSITIVO PARA BUSCA INTELIGENTE
        toast({
          title: `🎯 ${searchResults.rides.length} viagens encontradas`,
          description: `${exactMatches} matchs exatos + ${smartMatches} rotas inteligentes`,
          variant: "default",
          duration: 4000,
        });
      }

      // ✅ Usar os rides mapeados
      setRides(searchResults.rides);
      
      // ✅ ATUALIZAR SESSION STORAGE
      const searchState: LocationState = {
        rides: searchResults.rides,
        searchParams: params,
        timestamp: Date.now()
      };
      sessionStorage.setItem('lastSearchResults', JSON.stringify(searchState));

      if (searchResults.rides.length === 0) {
        toast({
          title: '🔍 Nenhuma viagem encontrada',
          description: 'Tente aumentar o raio de busca ou verificar outras datas. Estamos buscando em um raio de 200km.',
          duration: 8000,
        });
      } else {
        console.log('✅ [SEARCH-SUCCESS] Busca concluída:', searchResults.rides.length, 'resultados');
      }

    } catch (error) {
      console.error('❌ [SEARCH-ERROR] Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar viagens. Tente novamente.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Função: Recarregar resultados
  const handleRefreshResults = () => {
    executeSearchWithParams(searchParams);
  };

  // ✅ Função para obter assentos disponíveis
  const getAvailableSeats = (ride: RideWithMatch): number => {
    if (!ride) return 0;
    
    let availableSeats = Number(ride.availableseats || ride.availableSeats || 0);
    
    if (availableSeats === 0) {
      const maxPassengers = Number(ride.max_passengers || ride.maxPassengers || 0);
      const currentPassengers = Number(ride.currentPassengers || 0);
      
      if (maxPassengers > 0) {
        const calculatedSeats = maxPassengers - currentPassengers;
        if (calculatedSeats > 0) {
          availableSeats = calculatedSeats;
        }
      }
    }
    
    return Math.max(0, availableSeats);
  };

  const handleBookRide = (ride: RideWithMatch) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Por favor, faça login para reservar uma viagem.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    const availableSeats = getAvailableSeats(ride);
    if (availableSeats < bookingData.passengers) {
      toast({
        title: "Lugares insuficientes",
        description: `Apenas ${availableSeats} lugar(es) disponível(is)`,
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    setSelectedRide(ride);
    setBookingModal(true);
  };

  // ✅ Mutation com tipagem CORRIGIDA
  const bookingMutation = useMutation({
    mutationFn: async (data: BookingRequest) => {
      // ✅ Usar API client em vez de fetch direto
      const response = await clientRidesApi.requestRide(
        data.rideId, 
        data.passengers, 
        data.pickupLocation, 
        data.notes
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to book ride');
      }
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Reserva confirmada!",
        description: "Sua reserva foi criada com sucesso. Você receberá mais detalhes por email.",
        duration: 4000,
      });
      setBookingModal(false);
      setSelectedRide(null);
      setBookingData({
        passengers: 1,
        phone: "",
        email: "",
        notes: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na reserva",
        description: error.message || "Não foi possível processar sua reserva. Tente novamente.",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  const handleConfirmBooking = () => {
    if (!selectedRide) return;
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Por favor, faça login para confirmar a reserva.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    const availableSeats = getAvailableSeats(selectedRide);
    if (availableSeats < bookingData.passengers) {
      toast({
        title: "Lugares insuficientes",
        description: `Apenas ${availableSeats} lugar(es) disponível(is)`,
        variant: "destructive",
        duration: 4000,
      });
      return;
    }
    
    if (!bookingData.phone || !bookingData.email) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha telefone e email.",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    bookingMutation.mutate({
      rideId: selectedRide.id,
      passengers: bookingData.passengers,
      pickupLocation: `${selectedRide.fromLocation} (Ponto de encontro)`,
      notes: `Telefone: ${bookingData.phone}, Email: ${bookingData.email}. ${bookingData.notes}`
    });
  };

  // ✅ Função para validar mudança de passageiros
  const handlePassengersChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    const availableSeats = selectedRide ? getAvailableSeats(selectedRide) : 1;
    
    // ✅ Limitar ao máximo disponível
    const finalValue = Math.min(Math.max(1, numValue), availableSeats);
    
    setBookingData({...bookingData, passengers: finalValue});
  };

  // ✅ ORDENAR RIDES POR RELEVÂNCIA DE DATA
  const sortedRides = sortRidesByDateRelevance(rides, searchParams.date);

  // ✅ CALCULAR SE HÁ RIDES NA DATA EXATA
  const hasExactDateRides = sortedRides.some(ride => 
    isRideDateExact(ride.departureDate, searchParams.date)
  );

  // ✅ CALCULAR ESTATÍSTICAS
  const calculateStats = () => {
    const exactDateRides = sortedRides.filter(r => isRideDateExact(r.departureDate, searchParams.date));
    const nearbyDateRides = sortedRides.filter(r => !isRideDateExact(r.departureDate, searchParams.date));
    const highScoreRides = sortedRides.filter(r => r.direction_score && r.direction_score >= 80);
    
    return {
      exactDate: exactDateRides.length,
      nearbyDate: nearbyDateRides.length,
      highScore: highScoreRides.length,
      total: sortedRides.length
    };
  };

  const stats = calculateStats();

  // ✅ PAGINAÇÃO
  const itemsPerPage = 6;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRides = sortedRides.slice(startIndex, startIndex + itemsPerPage);
  const totalPagesCalc = Math.ceil(sortedRides.length / itemsPerPage);

  // Atualizar totalPages quando sortedRides mudar
  useEffect(() => {
    setTotalPages(totalPagesCalc);
  }, [sortedRides.length, totalPagesCalc]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ RENDERIZAR PAGINAÇÃO
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPagesCalc, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className={currentPage === i ? "bg-orange-600 hover:bg-orange-700" : ""}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header com busca */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold">Encontre Sua Viagem</h1>
              <p className="text-orange-100 mt-2">
                {sortedRides.length > 0 
                  ? `${sortedRides.length} viagens encontradas` 
                  : 'Busque viagens perfeitas para sua jornada'}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
          </div>

          {/* Barra de busca rápida */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Origem */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Saindo de</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <div className="pl-10 bg-white/20 border-white/30 text-white p-2 rounded-md">
                      <p className="font-medium">{decodeParam(searchParams.from)}</p>
                    </div>
                  </div>
                </div>

                {/* Destino */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Indo para</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <div className="pl-10 bg-white/20 border-white/30 text-white p-2 rounded-md">
                      <p className="font-medium">{decodeParam(searchParams.to)}</p>
                    </div>
                  </div>
                </div>

                {/* Data */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Data</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <div className="pl-10 bg-white/20 border-white/30 text-white p-2 rounded-md">
                      <p className="font-medium">{searchParams.date || "Não especificada"}</p>
                    </div>
                  </div>
                </div>

                {/* Passageiros */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Passageiros</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <div className="pl-10 bg-white/20 border-white/30 text-white p-2 rounded-md">
                      <p className="font-medium">{searchParams.passengers}</p>
                    </div>
                  </div>
                </div>

                {/* Raio de busca */}
                <div>
                  <Label className="text-white text-sm mb-2 block">Raio de busca</Label>
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <div className="pl-10 bg-white/20 border-white/30 text-white p-2 rounded-md">
                      <p className="font-medium">{searchParams.radius || 200} km</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Busca Inteligente Info */}
              <div className="mt-4 p-3 bg-white/20 rounded-lg border border-white/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <div>
                    <p className="text-sm font-medium">Busca Inteligente Final</p>
                    <p className="text-xs text-orange-100">
                      Raio: {searchParams.radius || 200}km • Função: get_rides_smart_final
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtros (sidebar) */}
          {showFilters && (
            <div className="lg:w-1/4">
              <Card className="sticky top-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <XCircle className="w-4 h-4 mr-1" />
                    Fechar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Raio de busca */}
                  <div>
                    <Label className="flex items-center gap-2 mb-4">
                      <Navigation className="w-4 h-4" />
                      Raio de busca: {searchParams.radius || 200} km
                    </Label>
                    <Slider
                      value={[searchParams.radius || 200]}
                      min={5}
                      max={500}
                      step={5}
                      onValueChange={([value]) => {
                        setSearchParams(prev => ({ ...prev, radius: value }));
                        // Atualizar busca automaticamente
                        setTimeout(() => executeSearchWithParams({...searchParams, radius: value}), 300);
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>5 km</span>
                      <span>500 km</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Tipo de veículo */}
                  <div>
                    <Label className="mb-4 block">Tipo de veículo</Label>
                    <Select
                      value={searchParams.transportType || "all"}
                      onValueChange={(value) => {
                        setSearchParams(prev => ({ ...prev, transportType: value === "all" ? undefined : value }));
                      }}
                    >
                      <SelectTrigger>
                        <Car className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="economy">Econômico</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="comfort">Conforto</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Data flexível */}
                  <div>
                    <Label className="mb-4 block flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data flexível (±3 dias)
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="flexible-date"
                          checked={true}
                          onCheckedChange={() => {}}
                        />
                        <Label htmlFor="flexible-date" className="cursor-pointer">
                          Mostrar viagens em datas próximas
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Motorista verificado */}
                  <div>
                    <Label className="mb-4 block flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Motorista
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="verified-driver"
                          checked={true}
                          onCheckedChange={() => {}}
                        />
                        <Label htmlFor="verified-driver" className="cursor-pointer">
                          Apenas motoristas verificados
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Botão de busca */}
                  <Button 
                    onClick={handleRefreshResults}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Buscando...' : 'Atualizar Resultados'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Conteúdo principal */}
          <div className={`${showFilters ? 'lg:w-3/4' : 'w-full'}`}>
            {/* Resultados */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isLoading ? 'Buscando viagens...' : `Viagens encontradas (${sortedRides.length})`}
                  </h2>
                  <div className="text-gray-600 mt-1">
                    <p>
                      de {decodeParam(searchParams.from)} para {decodeParam(searchParams.to)}
                      {searchParams.date && ` em ${searchParams.date}`}
                    </p>
                    {searchParams.radius && (
                      <p className="text-sm text-orange-600">
                        ✅ Buscando em raio de {searchParams.radius}km
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value="relevance"
                    onValueChange={() => {}}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Mais relevante</SelectItem>
                      <SelectItem value="price">Preço mais baixo</SelectItem>
                      <SelectItem value="date">Data mais próxima</SelectItem>
                      <SelectItem value="rating">Melhor classificação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loading state */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <Skeleton className="h-48 w-full rounded-t-lg" />
                      <CardContent className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : sortedRides.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="text-6xl mb-4">🚗</div>
                    <h3 className="text-xl font-semibold mb-2">Nenhuma viagem encontrada</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Não encontramos viagens de "{decodeParam(searchParams.from)}" para "{decodeParam(searchParams.to)}".
                      Tente aumentar o raio de busca ou verificar outras datas.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => setLocation('/')}>Nova busca</Button>
                      <Button variant="outline" onClick={() => setSearchParams(prev => ({ ...prev, radius: 500 }))}>
                        Aumentar raio para 500km
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* ✅ ADICIONAR BANNER DE AVISO PARA DATAS DIFERENTES */}
                  <DateWarningBanner 
                    searchDate={searchParams.date} 
                    hasExactDateRides={hasExactDateRides}
                  />
                  
                  {/* Estatísticas */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-orange-600" />
                        <div>
                          <span className="font-medium text-orange-800">
                            Busca Inteligente - Resultados
                          </span>
                          {!hasExactDateRides && sortedRides.length > 0 && (
                            <div className="text-sm text-orange-700 mt-1">
                              Mostrando rides em datas próximas
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {searchParams.radius && (
                          <Badge variant="outline" className="border-orange-300 text-orange-700">
                            Raio: {searchParams.radius}km
                          </Badge>
                        )}
                        {!hasExactDateRides && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                            📅 Datas próximas
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Grid de estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-orange-700 font-bold text-xl">{stats.exactDate}</div>
                        <div className="text-orange-600 text-sm">Na data</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-orange-700 font-bold text-xl">{stats.nearbyDate}</div>
                        <div className="text-orange-600 text-sm">Datas próximas</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-orange-700 font-bold text-xl">{stats.highScore}</div>
                        <div className="text-orange-600 text-sm">Alta Pontuação</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-orange-700 font-bold text-xl">{stats.total}</div>
                        <div className="text-orange-600 text-sm">Total</div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de rides */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedRides.map((ride) => (
                      <RideCard
                        key={ride.id}
                        ride={ride}
                        onBook={() => handleBookRide(ride)}
                      />
                    ))}
                  </div>

                  {/* Paginação */}
                  {sortedRides.length > itemsPerPage && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        Mostrando {Math.min(itemsPerPage, paginatedRides.length)} de {sortedRides.length} viagens
                        {currentPage > 1 && ` (Página ${currentPage} de ${totalPagesCalc})`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        
                        {renderPagination()}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPagesCalc}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Informações adicionais */}
            <Card className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Shield className="w-5 h-5" />
                  Por que reservar conosco
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">🏆</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Motoristas verificados</h4>
                    <p className="text-sm text-orange-700">
                      Todos os motoristas são verificados e avaliados para garantir sua segurança.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">💬</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Suporte 24/7</h4>
                    <p className="text-sm text-orange-700">
                      Nossa equipe está disponível para ajudar em qualquer momento da sua viagem.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/50">
                    <div className="text-2xl mb-3">🛡️</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Proteção total</h4>
                    <p className="text-sm text-orange-700">
                      Sua reserva está protegida com nosso sistema de garantia e seguro de viagem.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-orange-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-orange-700">
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <span>Preços transparentes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Disponibilidade em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>💰</span>
                      <span>Pagamento seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⭐</span>
                      <span>Avaliações verificadas</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de reserva */}
      <Dialog open={bookingModal} onOpenChange={setBookingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              Complete os dados para confirmar sua reserva
            </DialogDescription>
          </DialogHeader>
          
          {selectedRide && (
            <div className="space-y-6">
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-l-orange-600">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-sm">
                    <span className="font-semibold text-orange-900">{decodeParam(selectedRide.from_city || selectedRide.fromCity || '')}</span>
                    <span className="mx-2 text-orange-700">→</span>
                    <span className="font-semibold text-orange-900">{decodeParam(selectedRide.to_city || selectedRide.toCity || '')}</span>
                  </div>
                </div>
                <div className="text-sm text-orange-700">
                  {formatDateForDisplay(selectedRide.departuredate || selectedRide.departureDate || '')}
                </div>
                <div className="text-sm text-orange-700">
                  Motorista: {selectedRide.driver_name || selectedRide.driverName || 'Motorista'}
                </div>
                <div className="text-sm font-semibold mt-2 text-orange-900">
                  Preço: {formatPrice(selectedRide.priceperseat || selectedRide.pricePerSeat || 0)}
                </div>
                
                {selectedRide.match_type && (
                  <div className="text-sm text-orange-700 mt-2 bg-orange-100 p-2 rounded border border-orange-200">
                    🎯 {getMatchTypeDisplay(selectedRide).text}
                  </div>
                )}
                
                <div className={`text-sm font-medium mt-2 ${
                  getAvailableSeats(selectedRide) === 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {getAvailableSeats(selectedRide) === 0 
                    ? 'LOTADO' 
                    : `${getAvailableSeats(selectedRide)} lugar(es) disponível(is)`
                  }
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="passengers">Número de Passageiros</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max={getAvailableSeats(selectedRide)}
                    value={bookingData.passengers}
                    onChange={(e) => handlePassengersChange(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {getAvailableSeats(selectedRide)} lugares disponíveis
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="84 123 4567"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Alguma observação especial..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Total ({bookingData.passengers} passageiro{bookingData.passengers > 1 ? 's' : ''})</span>
                    <span className="text-xl font-bold text-orange-600">
                      {formatPrice((selectedRide.priceperseat || selectedRide.pricePerSeat || 0) * bookingData.passengers)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setBookingModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConfirmBooking}
                  disabled={bookingMutation.isPending || getAvailableSeats(selectedRide) < bookingData.passengers || !user}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                >
                  {bookingMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirmar Reserva
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}