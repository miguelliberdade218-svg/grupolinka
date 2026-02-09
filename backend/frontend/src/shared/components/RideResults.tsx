import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format, isSameDay, parseISO, differenceInDays } from 'date-fns';
import Map from "./Map";

// ✅ Todos os imports necessários
import BookingModal from "./BookingModal";
import PreBookingChat from "./PreBookingChat"; 
import UserRatings from "./UserRatings";
import PaymentModal from "./PaymentModal";
import PriceNegotiationModal from "./PriceNegotiationModal";
import EnRoutePickupModal from "./EnRoutePickupModal";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { useToast } from "@/shared/hooks/use-toast";

// ✅ Importar a função normalizeRide do serviço API
import { normalizeRide, formatPrice } from "@/services/api";
import { formatLongDate } from "../../utils/dateFormatter";

// ✅✅✅ INTERFACE RIDE COMPLETAMENTE CORRIGIDA - COMPATÍVEL COM get_rides_smart_final
interface Ride {
  // ✅ Campos obrigatórios da função get_rides_smart_final
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
  
  // ✅ Campos de matching inteligente
  match_type?: string;
  direction_score?: number;
  
  // ✅ Campos opcionais
  from_province?: string;
  to_province?: string;
  
  // ✅✅✅ ALIAS para compatibilidade com frontend existente
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
  fromProvince?: string;
  toProvince?: string;
  departureDate: string;
  departureTime: string;
  price: number;
  pricePerSeat: number;
  availableSeats: number;
  maxPassengers: number;
  currentPassengers: number;
  vehicle: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  status: string;
  type: string;
  
  // ✅ Campos adicionais para compatibilidade
  vehicleInfo?: {
    make: string;
    model: string;
    type: string;
    typeDisplay: string;
    typeIcon: string;
    plate: string;
    color: string;
    maxPassengers: number;
  };
  
  description?: string;
  vehiclePhoto?: string;
  estimatedDuration?: number;
  estimatedDistance?: number;
  allowNegotiation?: boolean;
  allowPickupEnRoute?: boolean;
  isVerifiedDriver?: boolean;
  availableIn?: number;
  route_compatibility?: number;
  match_description?: string;
  vehicleFeatures?: string[];
  driver?: {
    firstName?: string;
    lastName?: string;
    rating?: number;
    isVerified?: boolean;
  };
  distanceFromCityKm?: number;
  distanceToCityKm?: number;
}

// ✅ INTERFACE PARA RIDE COM FLAGS DE DATA
interface RideWithDateFlags extends Ride {
  _isExactDate?: boolean;
  _dateDifferenceDays?: number;
  _formattedDate?: string;
  _isBeforeSearch?: boolean;
}

// ✅ INTERFACE ATUALIZADA com a prop rides
interface RideResultsProps {
  searchParams: {
    from: string;
    to: string;
    when: string;
  };
  rides?: Ride[];
  onRideSelect?: (ride: Ride) => void;
}

// ✅✅✅ FUNÇÃO: Adicionar flags de data aos rides
const enhanceRidesWithDateInfo = (rides: Ride[], searchDate: string): RideWithDateFlags[] => {
  if (!searchDate) return rides as RideWithDateFlags[];
  
  const searchDateObj = parseISO(searchDate);
  
  return rides.map(ride => {
    const rideDate = parseISO(ride.departuredate);
    const isExactDate = isSameDay(rideDate, searchDateObj);
    const dateDifferenceDays = Math.abs(differenceInDays(rideDate, searchDateObj));
    const isBeforeSearch = rideDate < searchDateObj;
    
    return {
      ...ride,
      _isExactDate: isExactDate,
      _dateDifferenceDays: dateDifferenceDays,
      _formattedDate: format(rideDate, 'dd/MM/yyyy, HH:mm'),
      _isBeforeSearch: isBeforeSearch
    };
  });
};

// ✅ COMPONENTE: Banner de aviso para datas diferentes - MODERNIZADO
const DateWarningBanner = ({ searchDate, hasExactDateRides }: { 
  searchDate: string; 
  hasExactDateRides: boolean;
}) => {
  if (hasExactDateRides) return null;
  
  const searchDateObj = parseISO(searchDate);
  const formattedSearchDate = format(searchDateObj, 'dd/MM/yyyy');
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '2px solid #fbbf24',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 20px rgba(251, 191, 36, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Efeito decorativo */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '100px',
        height: '100px',
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)',
        borderRadius: '50%'
      }}></div>
      
      <div style={{
        background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
        color: 'white',
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
      }}>
        ⚠️
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <h3 style={{ 
            color: '#92400e', 
            margin: 0, 
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Rides em datas diferentes
          </h3>
          <span style={{
            background: '#fef3c7',
            color: '#92400e',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            Aviso
          </span>
        </div>
        
        <p style={{ 
          color: '#92400e', 
          margin: '0 0 12px 0', 
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          Não encontramos rides na data <strong>{formattedSearchDate}</strong>, 
          mas temos essas opções em outras datas próximas:
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '4px 10px',
            borderRadius: '20px'
          }}>
            <span style={{ color: '#f97316' }}>📅</span> Datas próximas disponíveis
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '4px 10px',
            borderRadius: '20px'
          }}>
            <span style={{ color: '#f97316' }}>✅</span> Mesma rota garantida
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎯 MAPEAMENTO PARA TIPOS DE VEÍCULO - CORRIGIDO
const VEHICLE_TYPE_DISPLAY: Record<string, { label: string; icon: string }> = {
  economy: { label: 'Económico', icon: '🚗' },
  comfort: { label: 'Conforto', icon: '🚙' },
  luxury: { label: 'Luxo', icon: '🏎️' },
  family: { label: 'Familiar', icon: '🚐' },
  cargo: { label: 'Carga', icon: '🚚' },
  motorcycle: { label: 'Moto', icon: '🏍️' }
};

// ✅✅✅ COMPONENTE RIDECARD MODERNIZADO - COM DESTAQUE DE DATAS
const RideCard = ({ 
  ride, 
  onBookRide, 
  onNegotiatePrice, 
  onEnRoutePickup,
  searchDate 
}: { 
  ride: RideWithDateFlags;
  onBookRide?: (ride: any) => void;
  onNegotiatePrice?: (ride: any) => void;
  onEnRoutePickup?: (ride: any) => void;
  searchDate?: string;
}) => {
  
  // ✅ Função para formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(price);
  };

  // ✅ Função para obter badge de matching
  const getMatchBadge = () => {
    if (!ride.match_type) return null;

    const matchConfig: { [key: string]: { label: string; color: string } } = {
      'exact_match': { label: '🎯 Exato', color: '#10b981' },
      'exact_province': { label: '🏛️ Mesma Província', color: '#3b82f6' },
      'from_correct_province_to': { label: '📍 Origem Correta', color: '#0d9488' },
      'to_correct_province_from': { label: '🏁 Destino Correto', color: '#6366f1' },
      'partial_from': { label: '🧭 Origem Similar', color: '#f97316' },
      'partial_to': { label: '🧭 Destino Similar', color: '#f59e0b' },
      'nearby': { label: '📍 Próximo', color: '#8b5cf6' },
      'smart_match': { label: '🧠 Inteligente', color: '#6366f1' },
      'smart_final_direct': { label: '🧠 Inteligente', color: '#6366f1' }
    };

    const config = matchConfig[ride.match_type] || { label: ride.match_type, color: '#6b7280' };

    return (
      <span style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        marginLeft: '8px'
      }}>
        {config.label} {ride.direction_score && `(${ride.direction_score}pts)`}
      </span>
    );
  };

  // 🆕 Função para obter nome do motorista
  const getDriverName = (ride: Ride): string => {
    return ride.driver_name || ride.driverName || 'Motorista';
  };

  return (
    <div className="ride-card" style={{
      border: ride._isExactDate ? '1px solid #fed7aa' : '2px solid #fbbf24',
      padding: '20px',
      margin: '16px 0',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      backgroundColor: ride._isExactDate ? 'white' : '#fffdf6',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
    }}>
      
      {/* BADGE DE DESTAQUE PARA DATAS EXATAS */}
      {ride._isExactDate && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
        }}>
          🎯 Data Exata
        </div>
      )}
      
      {/* ✅ SEÇÃO DE LOCALIZAÇÃO */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '18px'
          }}>
            🚩
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {ride.from_city || ride.fromCity || ride.fromLocation || 'Origem não disponível'}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              marginTop: '2px'
            }}>
              <span style={{ color: '#f97316', margin: '0 8px' }}>➔</span>
              {ride.to_city || ride.toCity || ride.toLocation || 'Destino não disponível'}
            </div>
          </div>
        </div>
        
        {getMatchBadge()}
      </div>

      {/* ✅✅✅ SEÇÃO DE DATA/HORA - MODERNIZADA */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '14px',
        background: ride._isExactDate 
          ? 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)'
          : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        borderRadius: '12px',
        border: ride._isExactDate ? '2px solid #fbbf24' : '2px solid #fed7aa',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        position: 'relative'
      }}>
        <div style={{
          background: ride._isExactDate ? '#fbbf24' : '#fed7aa',
          color: ride._isExactDate ? '#7c2d12' : '#9a3412',
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px'
        }}>
          📅
        </div>
        <div>
          <div style={{ 
            fontWeight: '600', 
            color: ride._isExactDate ? '#7c2d12' : '#9a3412',
            marginBottom: '4px'
          }}>
            {ride._formattedDate || (ride.departuredate ? new Date(ride.departuredate).toLocaleDateString('pt-MZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Data não disponível')}
          </div>
          {!ride._isExactDate && searchDate && (
            <div style={{
              fontSize: '13px',
              color: '#ea580c',
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⚠️</span>
              {ride._dateDifferenceDays === 1 
                ? '1 dia de diferença' 
                : `${ride._dateDifferenceDays} dias de diferença`}
            </div>
          )}
        </div>
      </div>

      {/* ✅ SEÇÃO DO VEÍCULO MODERNIZADA */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '16px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        position: 'relative'
      }}>
        {/* MATRÍCULA DESTACADA */}
        <div style={{ 
          position: 'absolute',
          top: '-10px',
          left: '16px',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
          color: 'white',
          padding: '4px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)'
        }}>
          🚗 {ride.vehicle_plate || ride.vehiclePlate || 'MATRÍCULA'}
        </div>
        
        <div style={{ marginTop: '12px' }}>
          <div style={{ 
            fontWeight: 'bold', 
            color: '#1e293b', 
            fontSize: '16px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: '#f97316' }}>⚡</span>
            {ride.vehicle_make || ride.vehicleMake} {ride.vehicle_model || ride.vehicleModel}
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            fontSize: '13px', 
            color: '#475569'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              <span style={{ color: '#f97316' }}>🎨</span> {ride.vehicle_color || ride.vehicleColor || 'Cor não informada'}
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              <span style={{ color: '#f97316' }}>👥</span> Até {ride.max_passengers || ride.maxPassengers || 4} passageiros
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              <span style={{ color: '#f97316' }}>🏷️</span> {VEHICLE_TYPE_DISPLAY[ride.vehicle_type]?.label || 'Económico'}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SEÇÃO DE PREÇO MODERNIZADA */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '16px',
        background: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)',
        borderRadius: '12px',
        border: '2px solid #fbbf24'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>
            Preço por pessoa
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c2d12' }}>
            {ride.priceperseat ? formatPrice(ride.priceperseat) : 'Preço não disponível'}
          </div>
        </div>
        
        <div style={{ 
          textAlign: 'center',
          background: 'white',
          padding: '8px 16px',
          borderRadius: '10px',
          border: '1px solid #fbbf24'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
            Lugares disponíveis
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>🪑</span> {ride.availableseats || ride.availableSeats || 0}
          </div>
        </div>
      </div>

      {/* ✅ SEÇÃO DO MOTORISTA MODERNIZADA */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '14px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {getDriverName(ride).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#1f2937', fontSize: '16px', fontWeight: '600' }}>
              👤 {getDriverName(ride)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '2px' }}>
              Motorista verificado
            </div>
          </div>
        </div>
        
        <div style={{ 
          background: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          border: '1px solid #fbbf24',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ color: '#fbbf24', fontSize: '16px' }}>⭐</span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>
            {(ride.driver_rating || ride.driverRating || 4.5).toFixed(1)}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>/5.0</span>
        </div>
      </div>

      {/* ✅ BOTÕES DE AÇÃO */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button
          onClick={() => onBookRide?.(ride)}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
            color: 'white',
            border: 'none',
            padding: '14px 20px',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(251, 191, 36, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(251, 191, 36, 0.3)';
          }}
        >
          <span>🎫</span> Reservar Agora
        </button>

        {onNegotiatePrice && (
          <button
            onClick={() => onNegotiatePrice(ride)}
            style={{
              backgroundColor: 'transparent',
              color: '#f97316',
              border: '2px solid #f97316',
              padding: '12px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff7ed';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(249, 115, 22, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>💬</span> Negociar
          </button>
        )}
      </div>

      {onEnRoutePickup && (
        <button
          onClick={() => onEnRoutePickup(ride)}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            marginTop: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9f9f9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          🚗 Pedir recolha no caminho
        </button>
      )}
    </div>
  );
};

// ✅✅✅ FUNÇÃO: Formatar preço em MZN
const getDisplayPrice = (ride: any) => {
  const price = ride.priceperseat || ride.pricePerSeat;
  if (price === null || price === undefined) {
    return 'Preço não disponível';
  }
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2
  }).format(price);
};

// ✅ FUNÇÕES HELPER SIMPLIFICADAS - CORRIGIDAS
const getDisplayLocation = (ride: any, type: 'from' | 'to') => {
  const location = type === 'from' ? (ride.from_city || ride.fromCity) : (ride.to_city || ride.toCity);
  return location && location !== 'Cidade não disponível' ? location : 'Localização não disponível';
};

// 🎯 COMPONENTE DE DEBUG - MELHORADO PARA VERIFICAR OS DADOS
const DebugComponent = ({ rides }: { rides: any[] }) => {
  if (!rides || rides.length === 0) return null;
  
  return (
    <div style={{
      background: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '8px',
      padding: '15px',
      margin: '20px 0',
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>🔍 DEBUG - Dados Recebidos ({rides.length} rides):</h3>
      {rides.slice(0, 3).map((ride, index) => (
        <div key={ride.id} style={{
          border: '1px solid #ccc',
          padding: '8px',
          margin: '8px 0',
          background: '#f8f9fa'
        }}>
          <strong>Ride {index + 1}:</strong>
          <div>ID: {ride.id}</div>
          <div>Driver: "{ride.driver_name}" | Rating: {ride.driver_rating}</div>
          <div>Price: {ride.priceperseat} | PricePerSeat: {ride.priceperseat}</div>
          <div>From: {ride.from_city} → To: {ride.to_city}</div>
          <div>Departure: {ride.departuredate}</div>
          <div>Vehicle: {ride.vehicle_make} {ride.vehicle_model} - {ride.vehicle_color} ({ride.vehicle_plate})</div>
          <div>Seats: {ride.availableseats}</div>
          <div>Match Type: {ride.match_type} | Direction Score: {ride.direction_score}</div>
          <div>Vehicle Type: {ride.vehicle_type}</div>
          <div>Distance From City: {ride.distance_from_city_km} km | Distance To City: {ride.distance_to_city_km} km</div>
          <div>Exact Date: {ride._isExactDate ? 'SIM' : 'NÃO'} | Difference: {ride._dateDifferenceDays} days</div>
        </div>
      ))}
    </div>
  );
};

// 🆕 Função para obter badge de compatibilidade - CORRIGIDA
const getMatchBadge = (ride: Ride) => {
  if (!ride.match_type) return null;

  const matchConfig: { [key: string]: { label: string; color: string } } = {
    'exact_match': { label: '🎯 Exato', color: 'bg-green-100 text-green-800 border-green-200' },
    'exact_province': { label: '🏛️ Mesma Província', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'from_correct_province_to': { label: '📍 Origem Correta', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    'to_correct_province_from': { label: '🏁 Destino Correto', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'partial_from': { label: '🧭 Origem Similar', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    'partial_to': { label: '🧭 Destino Similar', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    'nearby': { label: '📍 Próximo', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'smart_match': { label: '🧠 Inteligente', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    'smart_final_direct': { label: '🧠 Inteligente', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  };

  const config = matchConfig[ride.match_type] || { label: ride.match_type, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <Badge className={`${config.color} border text-xs font-medium`}>
      {config.label} {ride.direction_score && `(${ride.direction_score}pts)`}
    </Badge>
  );
};

// 🆕 Função para obter nome do motorista - COMPLETAMENTE CORRIGIDA
const getDriverName = (ride: Ride): string => {
  return ride.driver_name || ride.driverName || 'Motorista';
};

// 🆕 Função para obter rating do motorista - COMPLETAMENTE CORRIGIDA
const getDriverRating = (ride: Ride): number => {
  return ride.driver_rating || ride.driverRating || 4.5;
};

// 🆕 Função para obter informações do veículo - COMPLETAMENTE CORRIGIDA
const getVehicleInfo = (ride: Ride) => {
  return {
    display: `${ride.vehicle_make || ''} ${ride.vehicle_model || ''}`.trim() || 'Veículo',
    typeDisplay: VEHICLE_TYPE_DISPLAY[ride.vehicle_type]?.label || 'Económico',
    typeIcon: VEHICLE_TYPE_DISPLAY[ride.vehicle_type]?.icon || '🚗',
    plate: ride.vehicle_plate || 'Não informada',
    color: ride.vehicle_color || 'Não informada',
    maxPassengers: ride.max_passengers || 4,
    make: ride.vehicle_make || '',
    model: ride.vehicle_model || ''
  };
};

// ✅ Interface para resposta da API
interface RideApiResponse {
  success: boolean;
  rides: Ride[];
  data?: {
    rides: Ride[];
  };
}

export default function RideResults({
  searchParams,
  rides: externalRides = [],
  onRideSelect
}: RideResultsProps) {
  const { toast } = useToast();
  console.log('🔍 [DEBUG] RideResults mounted with params:', searchParams);
  
  // ✅ States para funcionalidades
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<any>(null);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [negotiationRide, setNegotiationRide] = useState<Ride | null>(null);
  const [pickupRide, setPickupRide] = useState<Ride | null>(null);

  // ✅ Query para buscar viagens (só executa se não houver rides externos) - COMPLETAMENTE CORRIGIDA
  const { data: internalRides, isLoading } = useQuery<Ride[]>({
    queryKey: ["rides-search", searchParams.from, searchParams.to, searchParams.when, externalRides.length],
    queryFn: async () => {
      console.log('🔍 [DEBUG] Fetching rides with:', searchParams);
      
      const params = new URLSearchParams();
      if (searchParams.from) params.append('from', searchParams.from);
      if (searchParams.to) params.append('to', searchParams.to);
      if (searchParams.when) params.append('date', searchParams.when);
      
      // ✅✅✅ CORREÇÃO: Usar endpoint de busca inteligente
      params.append('smartSearch', 'true');
      params.append('radiusKm', '100');
      
      const url = `/api/rides/smart/search?${params.toString()}`;
      console.log('🔍 [DEBUG] Fetch URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar viagens');
      
      const result = await response.json() as RideApiResponse;
      console.log('🔍 [DEBUG] API response:', result);
      
      // ✅✅✅ CORREÇÃO: Usar dados consistentes da resposta
      const ridesData = Array.isArray(result.rides) ? result.rides : 
                       Array.isArray(result.data?.rides) ? result.data.rides : [];
      
      console.log('🔍 [DEBUG] Rides data to process:', ridesData);
      
      // ✅✅✅ CORREÇÃO CRÍTICA: Processar resposta com TODOS os campos do get_rides_smart_final
      const processedRides = ridesData.map((ride: any) => {
        console.log('🚗 [DEBUG] Processando ride individual:', ride);

        // ✅✅✅ CORREÇÃO: Criar ride compatível com a nova interface
        const processedRide: Ride = {
          // ✅ Campos ORIGINAIS do PostgreSQL (get_rides_smart_final)
          ride_id: ride.ride_id || ride.id || Math.random().toString(),
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
          departuredate: ride.departuredate || ride.departureDate || new Date().toISOString(),
          availableseats: Number(ride.availableseats ?? ride.availableSeats ?? 0),
          priceperseat: Number(ride.priceperseat ?? ride.pricePerSeat ?? 0),
          distance_from_city_km: Number(ride.distance_from_city_km ?? ride.distanceFromCityKm ?? 0),
          distance_to_city_km: Number(ride.distance_to_city_km ?? ride.distanceToCityKm ?? 0),
          
          // ✅ Campos de matching inteligente
          match_type: ride.match_type || 'traditional',
          direction_score: Number(ride.direction_score ?? 0),
          
          // ✅ Campos opcionais
          from_province: ride.from_province || ride.fromProvince,
          to_province: ride.to_province || ride.toProvince,
          
          // ✅✅✅ ALIAS para compatibilidade com frontend existente
          id: ride.ride_id || ride.id || Math.random().toString(),
          driverId: ride.driver_id || ride.driverId || '',
          driverName: ride.driver_name || ride.driverName || 'Motorista',
          driverRating: Number(ride.driver_rating ?? ride.driverRating ?? 4.5),
          fromLocation: ride.from_city || ride.fromCity || '',
          toLocation: ride.to_city || ride.toCity || '',
          fromAddress: ride.from_city || ride.fromCity || '',
          toAddress: ride.to_city || ride.toCity || '',
          fromCity: ride.from_city || ride.fromCity || '',
          toCity: ride.to_city || ride.toCity || '',
          fromProvince: ride.from_province || ride.fromProvince,
          toProvince: ride.to_province || ride.toProvince,
          departureDate: ride.departuredate || ride.departureDate || new Date().toISOString(),
          departureTime: ride.departureTime || '08:00',
          price: Number(ride.priceperseat ?? ride.pricePerSeat ?? 0),
          pricePerSeat: Number(ride.priceperseat ?? ride.pricePerSeat ?? 0),
          availableSeats: Number(ride.availableseats ?? ride.availableSeats ?? 0),
          maxPassengers: Number(ride.max_passengers ?? ride.maxPassengers ?? 4),
          currentPassengers: ride.currentPassengers || 0,
          vehicle: ride.vehicle_type || ride.vehicleType || 'Veículo',
          vehicleType: ride.vehicle_type || ride.vehicleType || 'economy',
          vehicleMake: ride.vehicle_make || ride.vehicleMake || '',
          vehicleModel: ride.vehicle_model || ride.vehicleModel || '',
          vehiclePlate: ride.vehicle_plate || ride.vehiclePlate || '',
          vehicleColor: ride.vehicle_color || ride.vehicleColor || '',
          status: ride.status || 'available',
          type: ride.type || ride.vehicle_type || 'economy',
          
          // ✅ Campos adicionais para compatibilidade
          vehicleInfo: {
            make: ride.vehicle_make || ride.vehicleMake || '',
            model: ride.vehicle_model || ride.vehicleModel || '',
            type: ride.vehicle_type || ride.vehicleType || 'economy',
            typeDisplay: VEHICLE_TYPE_DISPLAY[ride.vehicle_type]?.label || 'Económico',
            typeIcon: VEHICLE_TYPE_DISPLAY[ride.vehicle_type]?.icon || '🚗',
            plate: ride.vehicle_plate || ride.vehiclePlate || '',
            color: ride.vehicle_color || ride.vehicleColor || '',
            maxPassengers: Number(ride.max_passengers ?? ride.maxPassengers ?? 4)
          },
          
          route_compatibility: Number(ride.direction_score ?? ride.route_compatibility ?? 0),
          distanceFromCityKm: Number(ride.distance_from_city_km ?? ride.distanceFromCityKm ?? 0),
          distanceToCityKm: Number(ride.distance_to_city_km ?? ride.distanceToCityKm ?? 0)
        };

        console.log('🚗 [DEBUG] Ride processado:', {
          id: processedRide.id,
          driverName: processedRide.driver_name,
          driverRating: processedRide.driver_rating,
          vehicleInfo: processedRide.vehicleInfo,
          price: processedRide.priceperseat,
          availableSeats: processedRide.availableseats,
          fromLocation: processedRide.from_city,
          toLocation: processedRide.to_city,
          distanceFromCityKm: processedRide.distance_from_city_km,
          match_type: processedRide.match_type,
          direction_score: processedRide.direction_score
        });
        
        return processedRide;
      });
      
      console.log('✅ [DEBUG] Total de rides processados:', processedRides.length);
      return processedRides;
    },
    enabled: !!searchParams.from && !!searchParams.to && externalRides.length === 0,
  });

  // ✅ CORREÇÃO: Usar rides externos se disponíveis, senão usar os internos
  const ridesToShow = externalRides.length > 0 ? externalRides : internalRides ?? [];

  // ✅✅✅ ENHANCE RIDES COM INFO DE DATA
  const enhancedRides = enhanceRidesWithDateInfo(ridesToShow, searchParams.when);
  const hasExactDateRides = enhancedRides.some(ride => ride._isExactDate);

  console.log('🔍 [DEBUG] Rides data:', enhancedRides);
  console.log('🔍 [DEBUG] Loading state:', isLoading);
  console.log('🔍 [DEBUG] External rides provided:', externalRides.length > 0);
  console.log('🔍 [DEBUG] Exact date rides:', hasExactDateRides);

  // ✅ Função para lidar com sucesso de pagamento
  const handlePaymentSuccess = () => {
    console.log('💰 [DEBUG] Payment successful');
    setShowPaymentModal(false);
    setPaymentBooking(null);
    toast({
      title: "Pagamento confirmado!",
      description: "Sua reserva foi confirmada com sucesso.",
      variant: "default"
    });
  };

  // ✅ Funções para os modais
  const handleBookRide = (ride: Ride) => {
    console.log('📋 [DEBUG] Booking ride:', ride.id);
    
    if (onRideSelect) {
      onRideSelect(ride);
    } else {
      setSelectedRide(ride);
      setShowBookingModal(true);
    }
  };

  const handleNegotiatePrice = (ride: Ride) => {
    console.log('💬 [DEBUG] Negotiating price for ride:', ride.id);
    setNegotiationRide(ride);
    setShowNegotiationModal(true);
  };

  const handleEnRoutePickup = (ride: Ride) => {
    console.log('📍 [DEBUG] En route pickup for ride:', ride.id);
    setPickupRide(ride);
    setShowPickupModal(true);
  };

  const submitNegotiation = (negotiationData: any) => {
    console.log('💰 [DEBUG] Price negotiation submitted:', negotiationData);
    setShowNegotiationModal(false);
    setNegotiationRide(null);
    toast({
      title: "Negociação enviada!",
      description: "O motorista recebeu sua proposta de preço.",
    });
  };

  const submitPickupRequest = (pickupData: any) => {
    console.log('🚗 [DEBUG] Pickup request submitted:', pickupData);
    setShowPickupModal(false);
    setPickupRide(null);
    toast({
      title: "Pickup solicitado!",
      description: "O motorista foi notificado do seu ponto de encontro.",
    });
  };

  if (isLoading && externalRides.length === 0) {
    return <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto my-8" />;
  }

  return (
    <>
      {/* ✅ ADICIONAR BANNER DE AVISO PARA DATAS DIFERENTES */}
      <DateWarningBanner 
        searchDate={searchParams.when} 
        hasExactDateRides={hasExactDateRides}
      />
      
      {/* 🔍 COMPONENTE DE DEBUG - ADICIONADO PARA VERIFICAR OS DADOS */}
      <DebugComponent rides={enhancedRides} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mapa */}
        <div className="lg:col-span-2">
          <Map
            type="ride"
            from={searchParams.from}
            to={searchParams.to}
            markers={enhancedRides.map(ride => ({
              lat: ride.from_lat || -25.9692,
              lng: ride.from_lng || 32.5732,
              popup: `${getVehicleInfo(ride).typeDisplay} - ${getDisplayPrice(ride)} - ${getDriverName(ride)}`,
            }))}
          />
        </div>

        {/* Lista de Viagens */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Viagens Disponíveis
            {!hasExactDateRides && enhancedRides.length > 0 && (
              <span style={{
                fontSize: '14px',
                color: '#e65100',
                marginLeft: '8px',
                fontStyle: 'italic'
              }}>
                (em datas próximas)
              </span>
            )}
          </h3>
          
          {/* Estatísticas de Matching - ATUALIZADA COM INFO DE DATAS */}
          {enhancedRides.some(ride => ride.match_type) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                <span className="text-blue-600 mr-2">⚡</span>
                Busca Inteligente - Resultados
                {!hasExactDateRides && enhancedRides.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    color: '#e65100',
                    marginLeft: '8px',
                    fontStyle: 'italic'
                  }}>
                    • Mostrando rides em datas próximas
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-blue-700 font-bold">
                    {enhancedRides.filter(r => r._isExactDate).length}
                  </div>
                  <div className="text-blue-600">Na data</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-700 font-bold">
                    {enhancedRides.filter(r => !r._isExactDate).length}
                  </div>
                  <div className="text-blue-600">Datas próximas</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-700 font-bold">
                    {enhancedRides.filter(r => r.direction_score && r.direction_score >= 80).length}
                  </div>
                  <div className="text-blue-600">Alta Pont.</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-700 font-bold">{enhancedRides.length}</div>
                  <div className="text-blue-600">Total</div>
                </div>
              </div>
            </div>
          )}
          
          {enhancedRides.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🚗</span>
              </div>
              <p className="text-gray-500">Nenhuma viagem encontrada</p>
            </div>
          ) : (
            // ✅ RENDERIZAR RIDES ENHANCED COM DESTAQUE DE DATAS
            enhancedRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onBookRide={handleBookRide}
                onNegotiatePrice={handleNegotiatePrice}
                onEnRoutePickup={handleEnRoutePickup}
                searchDate={searchParams.when} // ✅ PASSAR A DATA DE BUSCA
              />
            ))
          )}
        </div>
      </div>

      {/* MODAIS ATIVADOS */}
      {selectedRide && !onRideSelect && (
        <BookingModal
          type="ride"
          item={selectedRide}
          searchParams={searchParams}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}

      {negotiationRide && (
        <PriceNegotiationModal
          ride={negotiationRide}
          isOpen={showNegotiationModal}
          onClose={() => setShowNegotiationModal(false)}
          onSubmit={submitNegotiation}
        />
      )}

      {pickupRide && (
        <EnRoutePickupModal
          ride={pickupRide}
          isOpen={showPickupModal}
          onClose={() => setShowPickupModal(false)}
          onSubmit={submitPickupRequest}
        />
      )}

      {paymentBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={paymentBooking}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}