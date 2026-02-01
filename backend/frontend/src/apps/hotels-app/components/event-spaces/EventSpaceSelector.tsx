// src/apps/hotels-app/components/event-spaces/EventSpaceSelector.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Calendar, Loader2, Plus, AlertCircle, MapPin, Users, Building, DollarSign } from "lucide-react";
import { eventSpaceService } from "@/services/eventSpaceService";
import { toast } from "sonner";
import { EventSpace } from "@/shared/types/event-spaces";
import { Button } from "@/shared/components/ui/button";
import { useLocation } from "wouter";
import { useActiveEventSpace } from '@/contexts/ActiveEventSpaceContext';
import { useActiveHotel } from '@/contexts/ActiveHotelContext';
import { Badge } from "@/shared/components/ui/badge";

interface EventSpaceSelectorProps {
  onChange?: (space: EventSpace | null) => void;
  onSpaceSelected?: (space: EventSpace | null) => void; // ✅ ADICIONADO
  showCreateButton?: boolean;
  hotelId?: string; // Opcional: se não fornecido, usa hotel ativo do contexto
  className?: string;
  showHotelInfo?: boolean;
}

// Função auxiliar para formatar preço
const formatPrice = (price: string | number | undefined | null): string => {
  if (!price) return '—';
  
  try {
    // Converte para número se for string
    const numericPrice = typeof price === 'string' 
      ? parseFloat(price) 
      : Number(price);
    
    if (isNaN(numericPrice)) return '—';
    
    return numericPrice.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch {
    return '—';
  }
};

export function EventSpaceSelector({ 
  onChange, 
  onSpaceSelected, // ✅ ADICIONADO
  showCreateButton = true,
  hotelId: propHotelId,
  className = "",
  showHotelInfo = false
}: EventSpaceSelectorProps) {
  const [spaces, setSpaces] = useState<EventSpace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  const { activeHotel } = useActiveHotel();
  const { activeEventSpace, setActiveEventSpace } = useActiveEventSpace();

  // ✅ REFS para controlar loops
  const isMounted = useRef(true);
  const lastLoadTime = useRef(0);
  const isInitialLoad = useRef(true);

  // Determinar qual hotel usar
  const targetHotelId = propHotelId || activeHotel?.id;

  const loadSpaces = useCallback(async (force = false) => {
    // ✅ Evitar múltiplas chamadas rápidas (debounce)
    const now = Date.now();
    if (!force && now - lastLoadTime.current < 2000) {
      console.log('⏸️ EventSpaceSelector: Evitando chamada rápida');
      return;
    }
    lastLoadTime.current = now;

    if (!targetHotelId) {
      setError('Nenhum hotel selecionado');
      setLoading(false);
      return;
    }

    if (!isMounted.current) return;

    console.log('🔍 EventSpaceSelector: Carregando espaços...');
    setLoading(true);
    setError(null);
    
    try {
      const result = await eventSpaceService.getEventSpacesByHotel(targetHotelId, false);

      if (!isMounted.current) return;

      if (result.success && result.data) {
        setSpaces(result.data);

        // ✅ Só na primeira carga ou quando forçado, restaurar do localStorage
        if (isInitialLoad.current || force) {
          const savedSpaceId = localStorage.getItem('activeEventSpaceId');
          const savedSpace = result.data.find(s => s.id === savedSpaceId);

          if (savedSpace) {
            setSelectedId(savedSpace.id);
            if (onChange) onChange(savedSpace);
            if (onSpaceSelected) onSpaceSelected(savedSpace); // ✅ ADICIONADO
            // ✅ ATENÇÃO: Só atualizar o contexto se for diferente do atual
            if (activeEventSpace?.id !== savedSpace.id) {
              setActiveEventSpace(savedSpace);
            }
          } else if (result.data.length > 0) {
            // Usar o primeiro espaço
            const firstSpace = result.data[0];
            setSelectedId(firstSpace.id);
            localStorage.setItem('activeEventSpaceId', firstSpace.id);
            if (onChange) onChange(firstSpace);
            if (onSpaceSelected) onSpaceSelected(firstSpace); // ✅ ADICIONADO
            // ✅ ATENÇÃO: Só atualizar o contexto se for diferente do atual
            if (activeEventSpace?.id !== firstSpace.id) {
              setActiveEventSpace(firstSpace);
            }
          } else {
            // Nenhum espaço
            setSelectedId(null);
            if (onChange) onChange(null);
            if (onSpaceSelected) onSpaceSelected(null); // ✅ ADICIONADO
            // ✅ Só limpar se realmente não houver espaços
            if (activeEventSpace) {
              setActiveEventSpace(null);
            }
          }
          isInitialLoad.current = false;
        }
      } else {
        setError(result.error || "Erro ao carregar espaços");
        toast.error(result.error || "Não foi possível carregar espaços");
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error("Falha na conexão com o servidor");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [targetHotelId, onChange, onSpaceSelected, setActiveEventSpace, activeEventSpace]);

  const handleSpaceChange = useCallback((spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
      setSelectedId(spaceId);
      localStorage.setItem('activeEventSpaceId', spaceId);
      if (onChange) onChange(space);
      if (onSpaceSelected) onSpaceSelected(space); // ✅ ADICIONADO
      
      // ✅ Só atualizar o contexto se for diferente
      if (activeEventSpace?.id !== space.id) {
        setActiveEventSpace(space);
      }
      
      toast.success(`Espaço "${space.name}" selecionado`);
    }
  }, [spaces, onChange, onSpaceSelected, setActiveEventSpace, activeEventSpace]);

  const handleCreateSpace = useCallback(() => {
    if (targetHotelId) {
      setLocation(`/hotels/events/spaces/create?hotelId=${targetHotelId}`);
    } else {
      toast.error("Selecione um hotel primeiro");
    }
  }, [targetHotelId, setLocation]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 EventSpaceSelector: Refresh manual');
    loadSpaces(true);
    toast.info("Espaços atualizados");
  }, [loadSpaces]);

  // ✅ EFEITO PRINCIPAL - CORRIGIDO
  useEffect(() => {
    isMounted.current = true;
    
    // ✅ Carregar apenas quando o hotel mudar
    loadSpaces();
    
    return () => {
      isMounted.current = false;
    };
  }, [targetHotelId]); // ✅ Apenas targetHotelId como dependência

  // ✅ Efeito para sincronizar selectedId com activeEventSpace
  useEffect(() => {
    if (activeEventSpace && activeEventSpace.id !== selectedId) {
      setSelectedId(activeEventSpace.id);
    }
  }, [activeEventSpace, selectedId]);

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando espaços...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col gap-2 p-3 border rounded-md bg-red-50 border-red-200 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Erro ao carregar espaços</span>
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadSpaces(true)}
            className="flex-1"
          >
            Tentar novamente
          </Button>
          {targetHotelId && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleCreateSpace}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Criar Espaço
            </Button>
          )}
        </div>
      </div>
    );
  }

  // No hotel selected
  if (!targetHotelId) {
    return (
      <div className={`flex flex-col gap-3 p-4 border rounded-md bg-amber-50 border-amber-200 ${className}`}>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Selecione um hotel primeiro
          </span>
        </div>
        <p className="text-xs text-amber-700">
          Você precisa selecionar um hotel para ver e gerenciar os espaços de eventos.
        </p>
      </div>
    );
  }

  // Show hotel info if requested
  const renderHotelInfo = showHotelInfo && activeHotel && (
    <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200">
      <div className="flex items-center gap-2">
        <Building className="h-3 w-3 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">{activeHotel.name}</span>
        <span className="text-xs text-gray-500">•</span>
        <span className="text-xs text-gray-500">{activeHotel.locality}, {activeHotel.province}</span>
      </div>
    </div>
  );

  // No spaces
  if (spaces.length === 0) {
    return (
      <div className={`flex flex-col gap-3 p-4 border rounded-md bg-blue-50 border-blue-200 ${className}`}>
        {renderHotelInfo}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Nenhum espaço cadastrado
          </span>
        </div>
        <p className="text-xs text-blue-700">
          Este hotel ainda não tem espaços de eventos cadastrados. Crie o primeiro espaço para começar a receber reservas.
        </p>
        {showCreateButton && (
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleCreateSpace}
              className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1"
            >
              <Plus className="h-3 w-3" />
              Criar Primeiro Espaço
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex-1"
            >
              <Loader2 className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Normal state - with spaces
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {renderHotelInfo}
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Espaço de Eventos
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-6 px-2 text-xs gap-1"
          >
            <Loader2 className="h-3 w-3" />
            Atualizar
          </Button>
        </div>
        
        <Select
          value={selectedId ?? undefined}
          onValueChange={handleSpaceChange}
        >
          <SelectTrigger className="w-full h-10 bg-white hover:bg-gray-50 transition-colors border-gray-300">
            <SelectValue placeholder="Selecione um espaço">
              {selectedId && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">
                      {spaces.find(s => s.id === selectedId)?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {spaces.find(s => s.id === selectedId)?.spaceType || 'Espaço para eventos'}
                    </span>
                  </div>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[350px] w-[350px]">
            {spaces.map(space => (
              <SelectItem 
                key={space.id} 
                value={space.id}
                className="flex items-start gap-2 py-2 cursor-pointer hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-sm truncate">{space.name}</span>
                    <Badge 
                      variant={space.isActive ? "default" : "destructive"}
                      className="ml-2 text-xs"
                    >
                      {space.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{space.spaceType || 'Espaço para eventos'}</span>
                    <span className="text-gray-300">•</span>
                    <Users className="h-3 w-3 flex-shrink-0" />
                    <span>{space.capacityMin}-{space.capacityMax} pessoas</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatPrice(space.basePricePerDay)}/dia</span>
                    {space.weekendSurchargePercent && space.weekendSurchargePercent > 0 && (
                      <span className="text-amber-600 ml-1">
                        (+{space.weekendSurchargePercent}% fim de semana)
                      </span>
                    )}
                  </div>
                  {space.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {space.description}
                    </p>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Counter and actions */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            {spaces.length} {spaces.length === 1 ? 'espaço' : 'espaços'} disponível{spaces.length === 1 ? '' : 's'}
          </span>
          {activeEventSpace && (
            <Badge variant="outline" className="text-xs">
              {activeEventSpace.isFeatured ? '⭐ Destaque' : 'Padrão'}
            </Badge>
          )}
        </div>
        {showCreateButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateSpace}
            className="h-6 px-2 text-xs gap-1 text-violet-600 hover:text-violet-800 hover:bg-violet-50"
          >
            <Plus className="h-3 w-3" />
            Novo Espaço
          </Button>
        )}
      </div>

      {/* Active space details */}
      {activeEventSpace && (
        <div className="mt-2 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">Espaço Ativo</h4>
            <Badge 
              variant={activeEventSpace.isActive ? "default" : "destructive"}
              className="text-xs"
            >
              {activeEventSpace.isActive ? '✓ Aceita reservas' : '✗ Não ativo'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-gray-600">Capacidade:</div>
              <div className="font-medium flex items-center gap-1">
                <Users className="h-3 w-3" />
                {activeEventSpace.capacityMin}-{activeEventSpace.capacityMax} pessoas
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Preço base:</div>
              <div className="font-medium flex items-center gap-1 text-green-600">
                <DollarSign className="h-3 w-3" />
                {formatPrice(activeEventSpace.basePricePerDay)}/dia
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-gray-600">Área:</div>
              <div className="font-medium">
                {activeEventSpace.areaSqm ? `${activeEventSpace.areaSqm} m²` : '—'}
              </div>
            </div>
            <div className="col-span-2 md:col-span-3 space-y-1">
              <div className="text-gray-600">Tipo:</div>
              <div className="font-medium">{activeEventSpace.spaceType || 'Não especificado'}</div>
            </div>
            {activeEventSpace.securityDeposit && (
              <div className="col-span-2 md:col-span-3 space-y-1">
                <div className="text-gray-600">Caução:</div>
                <div className="font-medium text-amber-600">
                  {formatPrice(activeEventSpace.securityDeposit)}
                </div>
              </div>
            )}
          </div>
          
          {/* Ações rápidas */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-violet-200">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 flex-1"
              onClick={() => {
                setLocation(`/hotels/events/spaces/${activeEventSpace.id}/edit`);
              }}
            >
              Editar Espaço
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 flex-1"
              onClick={() => {
                setLocation(`/hotels/events/spaces/${activeEventSpace.id}/bookings`);
              }}
            >
              Ver Reservas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 flex-1"
              onClick={() => {
                setLocation(`/hotels/events/spaces/${activeEventSpace.id}/calendar`);
              }}
            >
              Calendário
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}