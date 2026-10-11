import React, { useState } from 'react'; 
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, MapPin, Users, Star, Car, ArrowRight, Zap } from 'lucide-react';
import LocationAutocomplete from '@/shared/components/LocationAutocomplete';
import { useToast } from '@/shared/hooks/use-toast';
import { useBookings } from '@/shared/hooks/useBookings';
import { useAuth } from '@/shared/hooks/useAuth';

// ✅ CORREÇÃO: Importar do ApiService atualizado
import { apiService, type Ride, type RideSearchResponse } from '@/services/api';

// ✅ CORREÇÃO: Definir LocationOption localmente
interface LocationOption {
  label: string;
  city?: string;
  district?: string;
  id?: string;
  lat?: number;
  lng?: number;
  type?: string;
  province?: string;
}

interface RideSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParams?: {
    fromOption?: LocationOption;
    toOption?: LocationOption;
    date: string;
    passengers: number;
  };
  onShowAllResults?: (rides: Ride[], searchParams: any) => void;
}

// ✅ CORREÇÃO: Interface para SearchParams
interface SearchParams {
  from: LocationOption;
  to: LocationOption;
  date: string;
  passengers: number;
}

// ✅ CORREÇÃO: Interface para MatchStats
interface MatchStats {
  exact_match?: number;
  same_segment?: number;
  same_direction?: number;
  same_origin?: number;
  same_destination?: number;
  potential?: number;
  traditional?: number;
  smart_matches?: number;
  total: number;
}

// ✅ CORREÇÃO: Interface para SearchResult
interface SearchResult {
  rides: Ride[];
  matchStats: MatchStats | null;
  searchParams: any;
  success: boolean;
  smart_search?: boolean; // ✅ CORREÇÃO: Adicionar propriedade faltante
}

// 🆕 Função para obter badge de compatibilidade
const getMatchBadge = (ride: Ride) => {
  if (!ride.match_type && !ride.matchType) return null;

  const matchType = ride.match_type || ride.matchType;
  const compatibility = ride.route_compatibility || ride.matchScore;

  const matchConfig: { [key: string]: { label: string; color: string } } = {
    'exact_match': { label: '🎯 Match Exato', color: 'bg-green-100 text-green-800 border-green-200' },
    'same_segment': { label: '📍 Mesmo Trecho', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    'same_direction': { label: '🧭 Mesma Direção', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    'potential_match': { label: '💡 Potencial', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    'smart_match': { label: '🧠 Inteligente', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    'smart_final_direct': { label: '🚗 Rota Similar', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }
  };

  const config = matchConfig[matchType || ''];
  if (!config) return null;

  return (
    <Badge className={`${config.color} border text-xs font-medium`}>
      {config.label} {compatibility && `(${compatibility}%)`}
    </Badge>
  );
};

// 🆕 Função para obter nome do motorista (compatibilidade)
const getDriverName = (ride: Ride): string => {
  if (ride.driver) {
    return `${ride.driver.firstName} ${ride.driver.lastName}`;
  }
  return ride.driverName || 'Motorista';
};

// 🆕 Função para obter rating do motorista (compatibilidade)
const getDriverRating = (ride: Ride): number => {
  if (ride.driver?.rating !== undefined) {
    return ride.driver.rating;
  }
  return ride.driverRating || 0;
};

// 🆕 Função para formatar preço
const formatPrice = (price: number): string => {
  return `MZN ${price.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// 🆕 Função para obter localização de exibição
const getDisplayLocation = (ride: Ride, type: 'from' | 'to'): string => {
  if (type === 'from') {
    // ✅ CORREÇÃO: Usar propriedades corretas da interface Ride
    return ride.fromAddress || ride.fromLocation || 'Origem não especificada';
  }
  return ride.toAddress || ride.toLocation || 'Destino não especificado';
};

// 🆕 Função para formatar data
const formatDate = (dateString: string): string => {
  if (!dateString) return 'Data não definida';
  try {
    return new Date(dateString).toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Data inválida';
  }
};

// 🆕 Função para obter descrição do match
const getMatchDescription = (ride: Ride): string => {
  const matchType = ride.match_type || ride.matchType;
  const matchDescription = ride.match_description || ride.matchDescription;

  if (matchDescription) return matchDescription;

  const descriptions: { [key: string]: string } = {
    'exact_match': 'Origem e destino exatos - melhor compatibilidade',
    'same_segment': 'Passageiro dentro do trajeto do motorista',
    'same_direction': 'Mesma direção geográfica - rota similar',
    'potential_match': 'Rota potencialmente compatível',
    'smart_match': 'Encontrado através de busca inteligente',
    'smart_final_direct': 'Rota similar encontrada por algoritmo inteligente',
    'covers_route': 'Motorista cobre toda a rota desejada',
    'first_leg': 'Primeira perna da viagem coberta'
  };

  return descriptions[matchType || ''] || 'Rota compatível encontrada';
};

export default function RideSearchModal({ 
  isOpen, 
  onClose, 
  initialParams,
  onShowAllResults 
}: RideSearchModalProps) {
  const { user } = useAuth();
  // ✅ CORREÇÃO: State atualizado para usar LocationOption
  const [searchParams, setSearchParams] = useState<SearchParams>({
    from: initialParams?.fromOption || { label: '', city: '', district: '' },
    to: initialParams?.toOption || { label: '', city: '', district: '' },
    date: initialParams?.date || '',
    passengers: initialParams?.passengers || 1
  });
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { toast } = useToast();
  const { createBooking } = useBookings();

  // ✅ CORREÇÃO: Handlers atualizados para LocationOption
  const handleLocationChange = (field: 'from' | 'to', value: LocationOption) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  };

  const handlePrimitiveChange = (field: 'date' | 'passengers', value: string | number) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  };

  // ✅ CORREÇÃO: Usar ApiService com parâmetros corretos para busca inteligente
  const { data: searchResult, isLoading, refetch, error } = useQuery({
    queryKey: ['search-rides', searchParams.from.label, searchParams.to.label, searchParams.date, searchParams.passengers],
    queryFn: async (): Promise<SearchResult> => {
      try {
        console.log('🧠 [FRONTEND] Iniciando busca inteligente:', {
          from: searchParams.from.label,
          to: searchParams.to.label,
          passengers: searchParams.passengers
        });

        // ✅ CORREÇÃO: Usar apiService em vez de fetch direto
        const response = await apiService.searchRides({
          from: searchParams.from.label,
          to: searchParams.to.label,
          date: searchParams.date,
          passengers: searchParams.passengers,
          smartSearch: true,
          maxDistance: 100 // ✅ Raio de 100km para busca abrangente
        });

        if (response.success) {
          console.log('✅ [FRONTEND] Busca inteligente bem-sucedida:', {
            rides: response.rides.length,
            smartSearch: response.smart_search,
            matchStats: response.matchStats
          });

          return {
            rides: response.rides,
            matchStats: response.matchStats || null,
            searchParams: response.searchParams || {},
            success: true,
            smart_search: response.smart_search // ✅ CORREÇÃO: Adicionar propriedade
          };
        }

        throw new Error('Busca inteligente retornou sucesso=false');
        
      } catch (error) {
        console.error('❌ [FRONTEND] Erro na busca inteligente:', error);
        
        // ✅ FALLBACK: Tentar busca tradicional
        try {
          console.log('🔄 [FRONTEND] Tentando busca tradicional como fallback...');
          
          const traditionalResponse = await apiService.searchRides({
            from: searchParams.from.label,
            to: searchParams.to.label,
            date: searchParams.date,
            passengers: searchParams.passengers,
            smartSearch: false
          });

          if (traditionalResponse.success) {
            console.log('✅ [FRONTEND] Busca tradicional bem-sucedida:', {
              rides: traditionalResponse.rides.length
            });

            return {
              rides: traditionalResponse.rides,
              matchStats: null,
              searchParams: searchParams,
              success: true,
              smart_search: false // ✅ CORREÇÃO: Adicionar propriedade
            };
          }
        } catch (fallbackError) {
          console.error('❌ [FRONTEND] Busca tradicional também falhou:', fallbackError);
        }

        throw error;
      }
    },
    enabled: false,
    retry: 1,
    staleTime: 30000 // ✅ Cache de 30 segundos
  });

  // ✅ EXTRAIR RIDES DO RESULTADO
  const rides: Ride[] = searchResult?.rides || [];

  const handleSearch = () => {
    // ✅ CORREÇÃO: Verificar label em vez de string direta
    if (!searchParams.from.label?.trim() || !searchParams.to.label?.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha origem e destino.",
        variant: "destructive"
      });
      return;
    }

    if (searchParams.from.label === searchParams.to.label) {
      toast({
        title: "Locais inválidos",
        description: "Origem e destino não podem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 [FRONTEND] Iniciando busca com parâmetros:', {
      from: searchParams.from.label,
      to: searchParams.to.label,
      date: searchParams.date,
      passengers: searchParams.passengers
    });

    refetch();
  };

  const handleShowAllResultsClick = () => {
    if (onShowAllResults && rides.length > 0) {
      onShowAllResults(rides, {
        ...searchParams,
        from: searchParams.from.label,
        to: searchParams.to.label,
        smartSearch: true
      });
      onClose();
    }
  };

  const handleBookRide = (ride: Ride) => {
    if (!user) {
      toast({
        title: '🔐 Login Necessário',
        description: 'Para reservar uma viagem, você precisa estar logado. Faça login para continuar.',
        variant: 'destructive'
      });
      return;
    }
    setSelectedRide(ride);
    setShowBookingModal(true);
  };

  // ✅ CORREÇÃO: Renderizar estatísticas de matching corretamente
  const renderMatchStats = () => {
    // ✅ CORREÇÃO: Verificar se searchResult existe
    if (!searchResult?.matchStats) return null;

    const stats = searchResult.matchStats;
    const totalSmartMatches = stats.smart_matches || 0;
    const totalExactMatches = stats.exact_match || 0;
    const totalSimilarMatches = (stats.same_segment || 0) + (stats.same_direction || 0);

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          Análise de Compatibilidade Inteligente
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">
              {totalExactMatches}
            </div>
            <div className="text-blue-600">🎯 Exatas</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">
              {totalSimilarMatches}
            </div>
            <div className="text-blue-600">📍 Similares</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">
              {totalSmartMatches}
            </div>
            <div className="text-blue-600">🧠 Inteligentes</div>
          </div>
          <div className="text-center">
            <div className="text-blue-700 font-bold text-lg">{rides.length}</div>
            <div className="text-blue-600">📊 Total</div>
          </div>
        </div>
        {searchResult.searchParams?.searchMethod && (
          <div className="mt-2 text-xs text-blue-700 text-center">
            Método: <strong>{searchResult.searchParams.searchMethod}</strong>
            {searchResult.searchParams.radiusKm && (
              <span> • Raio: {searchResult.searchParams.radiusKm}km</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Buscar Viagens Inteligente
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                🧠 SMART
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* ✅ CORREÇÃO: Formulário de Busca atualizado para LocationOption */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="from" className="flex items-center gap-1 mb-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Origem
              </Label>
              <LocationAutocomplete
                id="from-location"
                placeholder="De onde?"
                value={searchParams.from.label}
                onChange={(location) => handleLocationChange('from', location)}
                data-testid="input-origin"
              />
            </div>
            
            <div>
              <Label htmlFor="to" className="flex items-center gap-1 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Destino
              </Label>
              <LocationAutocomplete
                id="to-location"
                placeholder="Para onde?"
                value={searchParams.to.label}
                onChange={(location) => handleLocationChange('to', location)}
                data-testid="input-destination"
              />
            </div>
            
            <div>
              <Label htmlFor="date" className="flex items-center gap-1 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={searchParams.date}
                onChange={(e) => handlePrimitiveChange('date', e.target.value)}
                data-testid="input-date"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <Label htmlFor="passengers" className="flex items-center gap-1 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                Passageiros
              </Label>
              <Input
                id="passengers"
                type="number"
                min="1"
                max="8"
                value={searchParams.passengers}
                onChange={(e) => handlePrimitiveChange('passengers', Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
                data-testid="input-passengers"
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
            data-testid="button-search"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Buscando Rotas Inteligentes...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Buscar Viagens Inteligentes
              </>
            )}
          </Button>

          {/* ✅ CORREÇÃO: Estatísticas de Matching */}
          {renderMatchStats()}

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                ❌ Erro na busca. Verifique sua conexão e tente novamente.
              </p>
              <p className="text-red-700 text-xs mt-1">
                Detalhes: {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          )}

          {/* Resultados */}
          {rides.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-600" />
                  {rides.length} {rides.length === 1 ? 'viagem encontrada' : 'viagens encontradas'}
                  {/* ✅ CORREÇÃO: Verificar se searchResult existe antes de acessar smart_search */}
                  {searchResult?.smart_search && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                      🧠 Busca Inteligente
                    </Badge>
                  )}
                </h3>
                
                {onShowAllResults && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleShowAllResultsClick}
                    className="flex items-center gap-2"
                    data-testid="button-show-all-results"
                  >
                    Ver Todos na Página
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4">
                {rides.map((ride) => (
                  <Card key={ride.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      {/* 🆕 Badge de Compatibilidade */}
                      {getMatchBadge(ride)}
                      
                      <div className="flex justify-between items-start mt-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">{getDisplayLocation(ride, 'from')}</span>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{getDisplayLocation(ride, 'to')}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(ride.departureDate)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {ride.availableSeats || 0} lugares disponíveis
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              {getDriverRating(ride).toFixed(1)}
                            </div>
                            {ride.estimatedDuration && (
                              <div className="flex items-center gap-1">
                                <span>⏱️ {ride.estimatedDuration} min</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-gray-100">
                              {ride.vehicleType || ride.type || 'standard'}
                            </Badge>
                            <span className="text-sm text-gray-700 font-medium">{getDriverName(ride)}</span>
                            {(ride.driver?.isVerified || ride.isVerifiedDriver) && (
                              <Badge className="bg-green-100 text-green-800 text-xs border-0">
                                ✅ Verificado
                              </Badge>
                            )}
                          </div>
                          
                          {/* 🆕 Descrição do Matching */}
                          {(ride.match_type || ride.matchType) && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              {getMatchDescription(ride)}
                            </p>
                          )}
                          
                          {/* 🆕 Features do Veículo */}
                          {ride.vehicleFeatures && ride.vehicleFeatures.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {ride.vehicleFeatures.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {ride.description && (
                            <p className="text-sm text-gray-600 mt-2">{ride.description}</p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600 mb-3">
                            {formatPrice(ride.price || ride.pricePerSeat || 0)}
                            <span className="text-sm text-gray-500 block">por pessoa</span>
                          </div>
                          <Button 
                            onClick={() => handleBookRide(ride)}
                            disabled={(ride.availableSeats || 0) < searchParams.passengers}
                            data-testid={`button-book-${ride.id}`}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {(ride.availableSeats || 0) < searchParams.passengers 
                              ? "Sem lugares suficientes" 
                              : `Reservar ${searchParams.passengers} lugar${searchParams.passengers > 1 ? 'es' : ''}`
                            }
                          </Button>
                          {(ride.availableSeats || 0) < searchParams.passengers && (
                            <p className="text-xs text-red-600 mt-1">
                              Disponível: {ride.availableSeats} lugar{ride.availableSeats !== 1 ? 'es' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {rides.length === 0 && !isLoading && searchResult && (
            <div className="text-center py-8 text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma viagem encontrada</p>
              <p className="text-sm">Tente alterar as datas, locais ou número de passageiros.</p>
              <p className="text-xs text-gray-400 mt-2">
                Dica: A busca inteligente encontra rotas similares em até 100km de distância.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedRide && (
        <BookingModal 
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedRide(null);
          }}
          ride={selectedRide}
          passengers={searchParams.passengers}
          onBookingComplete={() => {
            setShowBookingModal(false);
            setSelectedRide(null);
            onClose();
            toast({
              title: "🎉 Reserva confirmada!",
              description: "Sua viagem foi reservada com sucesso. Verifique seu email para detalhes.",
              variant: "default"
            });
          }}
          createBooking={createBooking}
        />
      )}
    </>
  );
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  passengers: number;
  onBookingComplete: () => void;
  createBooking: ReturnType<typeof useBookings>['createBooking'];
}

function BookingModal({ isOpen, onClose, ride, passengers, onBookingComplete, createBooking }: BookingModalProps) {
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const totalAmount = (ride.price || ride.pricePerSeat || 0) * passengers;

  // ✅ CORREÇÃO: Corrigir a função handleBooking para usar createBooking corretamente
  const handleBooking = async () => {
    // ✅ Guard de autenticação: só utilizadores logados podem reservar
    if (!user) {
      toast({
        title: '🔐 Login Necessário',
        description: 'Para confirmar a reserva, você precisa estar logado. Faça login para continuar.',
        variant: 'destructive'
      });
      return;
    }

    if (!guestInfo.name.trim() || !guestInfo.email.trim() || !guestInfo.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    // ✅ Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestInfo.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    setIsBooking(true);
    try {
      const result = await createBooking('ride', {
        rideId: ride.id,
        passengers: passengers,
        totalAmount: totalAmount,
        guestInfo: guestInfo,
        rideDetails: {
          fromLocation: getDisplayLocation(ride, 'from'),
          toLocation: getDisplayLocation(ride, 'to'),
          departureDate: ride.departureDate,
          driverName: getDriverName(ride),
          price: ride.price || ride.pricePerSeat || 0,
          vehicleType: ride.vehicleType,
          estimatedDuration: ride.estimatedDuration
        }
      });
      
      if (result.success) {
        onBookingComplete();
      } else {
        throw new Error(result.error || "Erro ao fazer reserva");
      }
    } catch (error: any) {
      console.error('❌ Erro na reserva:', error);
      toast({
        title: "Erro na reserva",
        description: error.message || "Não foi possível completar a reserva. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-green-600" />
            Confirmar Reserva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Detalhes da Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <strong>Rota:</strong>
                <span className="text-right">
                  {getDisplayLocation(ride, 'from')} → {getDisplayLocation(ride, 'to')}
                </span>
              </div>
              <div className="flex justify-between">
                <strong>Data:</strong>
                <span>{formatDate(ride.departureDate)}</span>
              </div>
              <div className="flex justify-between">
                <strong>Motorista:</strong>
                <span>{getDriverName(ride)}</span>
              </div>
              <div className="flex justify-between">
                <strong>Passageiros:</strong>
                <span>{passengers}</span>
              </div>
              <div className="flex justify-between">
                <strong>Veículo:</strong>
                <span>{ride.vehicleType || 'Standard'}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <strong className="text-base">Valor total:</strong>
                <span className="text-green-600 font-bold text-lg">{formatPrice(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Informações do Passageiro
            </h4>
            <div>
              <Label htmlFor="guest-name">Nome completo *</Label>
              <Input
                id="guest-name"
                value={guestInfo.name}
                onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Seu nome completo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guest-email">Email *</Label>
              <Input
                id="guest-email"
                type="email"
                value={guestInfo.email}
                onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guest-phone">Telefone *</Label>
              <Input
                id="guest-phone"
                value={guestInfo.phone}
                onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+258 XX XXX XXXX"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isBooking}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBooking} 
              disabled={isBooking} 
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                `Confirmar Reserva - ${formatPrice(totalAmount)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}