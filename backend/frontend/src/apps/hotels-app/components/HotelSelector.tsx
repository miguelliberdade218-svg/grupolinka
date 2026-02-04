// src/apps/hotels-app/components/HotelSelector.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Building2, Loader2, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { hotelService, convertServiceHotelToSharedHotel } from "@/services/hotelService";
import { toast } from "sonner";
import { Hotel } from "@/shared/types/hotels";
import { Button } from "@/shared/components/ui/button";
import { useLocation } from "wouter";
import { useActiveHotel } from '@/contexts/ActiveHotelContext';
import { auth } from '@/shared/lib/firebaseConfig';

interface HotelSelectorProps {
  onChange: (hotel: Hotel | null) => void;
  showCreateButton?: boolean;
}

export function HotelSelector({ onChange, showCreateButton = true }: HotelSelectorProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  // Contexto ActiveHotel
  const { setActiveHotel, refreshActiveHotel } = useActiveHotel();

  // 🔧 CORREÇÃO: Ref para evitar múltiplas chamadas simultâneas
  const loadHotelsCalledRef = useRef(false);

  const loadHotels = useCallback(async () => {
    // 🔧 CORREÇÃO: Evita múltiplas chamadas simultâneas
    if (loadHotelsCalledRef.current) {
      console.log('⏸️ [HotelSelector] loadHotels já foi chamado, ignorando...');
      return;
    }
    
    loadHotelsCalledRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // 🔍 LOG PARA DEBUG - CRÍTICO
      console.log('🔍 [HotelSelector] Carregando hotéis do usuário:', {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      });
      
      const result = await hotelService.getMyHotels();

      if (result.success) {
        // 🔍 DEBUG: Mostrar exatamente o que o backend retornou
        console.log('📊 [HotelSelector] Hotéis retornados pelo backend:', {
          count: result.data.length,
          hotels: result.data.map(h => ({ 
            id: h.id, 
            name: h.name, 
            host_id: h.host_id,
            locality: h.locality,
            province: h.province,
            slug: h.slug 
          })),
          currentUserId: auth.currentUser?.uid,
          hasHostId: result.data.every(h => h.host_id)
        });
        
        // Converte os hotéis recebidos do serviço para o tipo compartilhado
        const convertedHotels = result.data.map(convertServiceHotelToSharedHotel);
        setHotels(convertedHotels);

        // ✅ VERIFICA SE O HOTEL ATIVO SALVO AINDA É VÁLIDO
        const savedHotelId = localStorage.getItem('activeHotelId');
        let hotelToSelect: Hotel | null = null;
        
        if (savedHotelId) {
          const hotelExists = result.data.some(h => h.id === savedHotelId);
          if (hotelExists) {
            // Hotel válido - seleciona ele
            const foundHotel = convertedHotels.find(h => h.id === savedHotelId);
            if (foundHotel) {
              hotelToSelect = foundHotel;
            }
          } else {
            // Hotel inválido - limpa do localStorage
            console.warn('⚠️ [HotelSelector] Hotel salvo não encontrado na lista do usuário, limpando...');
            localStorage.removeItem('activeHotelId');
            toast.warning('Hotel anterior não encontrado, selecionando primeiro disponível');
          }
        }
        
        // 🔧 CORREÇÃO CRÍTICA: Se não encontrou hotel salvo válido E temos hotéis disponíveis, pega o primeiro
        if (!hotelToSelect && convertedHotels.length > 0) {
          hotelToSelect = convertedHotels[0];
          // ✅ CORREÇÃO: Verificar que hotelToSelect não é null antes de usar
          if (hotelToSelect) {
            localStorage.setItem('activeHotelId', hotelToSelect.id);
          }
        }
        
        // 🔧 CORREÇÃO CRÍTICA: Atualiza estado e notifica callbacks SOMENTE SE hotelToSelect NÃO FOR NULL
        if (hotelToSelect) {
          setSelectedId(hotelToSelect.id);
          onChange(hotelToSelect);
          setActiveHotel(hotelToSelect);
          
          console.log('✅ [HotelSelector] Hotel selecionado:', {
            id: hotelToSelect.id,
            name: hotelToSelect.name,
            host_id: hotelToSelect.host_id,
          });
        } else {
          // Nenhum hotel disponível
          setSelectedId(null);
          onChange(null);
          setActiveHotel(null);
          console.log('ℹ️ [HotelSelector] Nenhum hotel disponível para este usuário');
        }
      } else {
        const errorMsg = result.error || "Erro ao carregar hotéis";
        setError(errorMsg);
        
        // ✅ TRATAMENTO ESPECÍFICO PARA ERROS DE PERMISSÃO
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden') || errorMsg.includes('permissão')) {
          toast.error('Sem permissão para acessar estes hotéis. Faça login novamente.');
          
          // Limpa tokens inválidos
          localStorage.removeItem('firebaseToken');
          localStorage.removeItem('token');
        } else {
          toast.error(errorMsg);
        }
        
        // Atualiza contexto como null
        setActiveHotel(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      
      // ✅ TRATAMENTO DE ERROS DE REDE/API
      if (message.includes('403') || message.includes('Forbidden')) {
        toast.error('Acesso negado. Verifique suas permissões.');
      } else if (message.includes('401')) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else if (message.includes('Network') || message.includes('CORS')) {
        toast.error('Problema de conexão. Verifique sua internet.');
      } else {
        toast.error("Falha na conexão com o servidor");
      }
      
      console.error('❌ [HotelSelector] Erro ao carregar hotéis:', err);
      setActiveHotel(null);
    } finally {
      setLoading(false);
      // 🔧 CORREÇÃO: Reset após um tempo para permitir recargas manuais
      setTimeout(() => {
        loadHotelsCalledRef.current = false;
      }, 3000);
    }
  }, [onChange, setActiveHotel, refreshActiveHotel]);

  const handleHotelChange = useCallback((hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    if (hotel) {
      setSelectedId(hotelId);
      localStorage.setItem('activeHotelId', hotelId);
      onChange(hotel);
      
      // Atualiza o contexto ActiveHotel
      setActiveHotel(hotel);
      
      // 🔧 CORREÇÃO: Feedback visual simplificado
      console.log('🏨 [HotelSelector] Hotel alterado para:', {
        id: hotel.id,
        name: hotel.name,
        host_id: hotel.host_id,
      });
    } else {
      console.error('❌ [HotelSelector] Hotel não encontrado:', hotelId);
      toast.error('Erro ao selecionar hotel');
    }
  }, [hotels, onChange, setActiveHotel]);

  const handleCreateHotel = useCallback(() => {
    setLocation('/hotels/create');
  }, [setLocation]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 [HotelSelector] Recarregando hotéis manualmente...');
    // Limpa a flag para permitir recarga manual
    loadHotelsCalledRef.current = false;
    // Limpa o cache do hotelService para forçar recarga
    hotelService.clearMyHotelsCache();
    hotelService.clearActiveHotelCache();
    loadHotels();
  }, [loadHotels]);

  // 🔧 CORREÇÃO: Listener para mudanças no localStorage (com controle de origem)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeHotelId') {
        // 🔧 CORREÇÃO: Ignora eventos da mesma origem/aba
        const isSameOrigin = e.url === window.location.href;
        if (isSameOrigin) {
          console.log('🔄 [HotelSelector] Storage mudado por esta aba, ignorando...');
          return;
        }
        
        console.log('📱 [HotelSelector] Storage mudou (outra aba), recarregando...');
        
        // Pequeno delay para garantir que o localStorage foi atualizado
        setTimeout(() => {
          const newHotelId = localStorage.getItem('activeHotelId');
          
          if (newHotelId && newHotelId !== selectedId) {
            const hotel = hotels.find(h => h.id === newHotelId);
            if (hotel) {
              setSelectedId(newHotelId);
              onChange(hotel);
              setActiveHotel(hotel);
              console.log('🔄 Hotel sincronizado de outra aba:', hotel.name);
            }
          }
        }, 100);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [hotels, selectedId, onChange, setActiveHotel]);

  // Carrega hotéis no início - com proteção contra múltiplas chamadas
  useEffect(() => {
    const timer = setTimeout(() => {
      loadHotels();
    }, 100); // Pequeno delay para garantir que outros componentes se inicializem
    
    return () => clearTimeout(timer);
  }, [loadHotels]);

  // Estado de loading
  if (loading) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 border rounded-md bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-600">Carregando hotéis...</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="h-6 w-6 p-0"
          disabled
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="flex flex-col gap-2 p-3 border rounded-md bg-red-50 border-red-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Erro ao carregar hotéis</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="text-xs h-7"
          >
            Tentar novamente
          </Button>
          {showCreateButton && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleCreateHotel}
              className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Criar Hotel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Estado sem hotéis
  if (hotels.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 border rounded-md bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Nenhum hotel cadastrado
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-blue-700">
          Você ainda não tem hotéis cadastrados. Crie seu primeiro hotel para começar a gerenciar reservas, quartos e eventos.
        </p>
        {showCreateButton && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleCreateHotel}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            Criar Primeiro Hotel
          </Button>
        )}
      </div>
    );
  }

  // Estado normal - com hotéis
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Selecione um hotel
        </label>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
          title="Recarregar lista"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <Select
        value={selectedId ?? undefined}
        onValueChange={handleHotelChange}
      >
        <SelectTrigger className="w-full h-10 bg-white hover:bg-gray-50 border-gray-300">
          <SelectValue placeholder="Selecione um hotel">
            {selectedId && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <div className="flex flex-col text-left">
                  <span className="font-medium truncate max-w-[200px]">
                    {hotels.find(h => h.id === selectedId)?.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[180px]">
                    {hotels.find(h => h.id === selectedId)?.locality}, {hotels.find(h => h.id === selectedId)?.province}
                  </span>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] w-[280px]">
          {hotels.map(hotel => (
            <SelectItem 
              key={hotel.id} 
              value={hotel.id}
              className="py-2 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{hotel.name}</span>
                  <span className="text-xs text-gray-500 truncate">
                    {hotel.locality}, {hotel.province}
                  </span>
                  {hotel.host_id === auth.currentUser?.uid && (
                    <span className="text-xs text-green-600 mt-0.5">
                      • Seu hotel
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Contador e ações */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span>
            {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotéis'} disponível{hotels.length === 1 ? '' : 's'}
          </span>
          {selectedId && (
            <span className="text-green-600">
              • Selecionado
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {showCreateButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateHotel}
              className="h-6 px-2 text-xs gap-1"
            >
              <Plus className="h-3 w-3" />
              Novo Hotel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}