// src/contexts/ActiveHotelContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef, useCallback } from 'react';
import { Hotel } from '@/shared/types/hotels';
import { hotelService, convertServiceHotelToSharedHotel } from '@/services/hotelService';
import { auth } from '@/shared/lib/firebaseConfig';
import { toast } from 'sonner';

interface ActiveHotelContextType {
  activeHotel: Hotel | null;
  setActiveHotel: (hotel: Hotel | null) => void;
  refreshActiveHotel: () => Promise<void>;
  forceRefreshActiveHotel: () => Promise<void>;
  isLoading: boolean;
  lastRefreshTime: Date | null;
  error: string | null;
}

const ActiveHotelContext = createContext<ActiveHotelContextType | undefined>(undefined);

export function ActiveHotelProvider({ children }: { children: ReactNode }) {
  // Armazenamos o hotel "cru" do serviço
  const [activeHotelRaw, setActiveHotelRaw] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Usamos useRef para controlar se já está carregando (evita loops)
  const isLoadingRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef(0);
  const MAX_CONSECUTIVE_ERRORS = 3;
  
  // 🔧 CORREÇÃO: Ref para evitar múltiplas chamadas simultâneas
  const loadActiveHotelCalledRef = useRef(false);

  // 🔧 CORREÇÃO: useMemo para converter apenas quando raw mudar
  const activeHotel = useMemo(() => {
    if (!activeHotelRaw) return null;
    return convertServiceHotelToSharedHotel(activeHotelRaw);
  }, [activeHotelRaw]);

  // 🔧 CORREÇÃO: Função para recarregar (normal - mantém cache)
  const refreshActiveHotel = useCallback(async () => {
    console.log('🔄 [Context] refreshActiveHotel chamado');
    // 🔧 CORREÇÃO: Chamar loadActiveHotel diretamente
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await loadActiveHotel();
    }, 100);
  }, []); // 🔧 ADICIONADO: Dependência vazia por enquanto

  // 🔧 CORREÇÃO: Função para recarregar forçadamente (ignora cache)
  const forceRefreshActiveHotel = useCallback(async () => {
    console.log('🔄 [Context] forceRefreshActiveHotel chamado');
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await loadActiveHotel(true);
    }, 100);
  }, []); // 🔧 ADICIONADO: Dependência vazia por enquanto

  // 🔧 CORREÇÃO REVISADA: Função interna de carregamento com validação robusta
  const loadActiveHotel = useCallback(async (forceClear: boolean = false) => {
    // 🔧 CORREÇÃO: Evita carregamentos simultâneos
    if (loadActiveHotelCalledRef.current && !forceClear) {
      console.log('⏸️ [Context] loadActiveHotel já em progresso, ignorando...');
      return null;
    }
    
    loadActiveHotelCalledRef.current = true;
    
    // Evita carregar múltiplas vezes simultaneamente (backup)
    if (isLoadingRef.current && !forceClear) {
      console.log('⚠️ [Context] Já está carregando, ignorando...');
      // Reset após um tempo
      setTimeout(() => {
        loadActiveHotelCalledRef.current = false;
      }, 2000);
      return null;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [Context] Carregando hotel ativo...', {
        forceClear,
        userId: auth.currentUser?.uid,
        hasLocalStorage: !!localStorage.getItem('activeHotelId')
      });
      
      // 🔧 CORREÇÃO: Se for forceClear, limpa primeiro
      if (forceClear) {
        setActiveHotelRaw(null);
        localStorage.removeItem('activeHotelId');
        consecutiveErrorsRef.current = 0;
      }
      
      const hotel = await hotelService.getActiveHotel();
      
      // 🔧 CORREÇÃO: Validação rigorosa do hotel retornado
      if (!hotel) {
        console.log('ℹ️ [Context] Nenhum hotel ativo retornado');
        setActiveHotelRaw(null);
        consecutiveErrorsRef.current = 0;
        return null;
      }
      
      // 🔧 CORREÇÃO CRÍTICA: Verificar se o hotel pertence ao usuário atual
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId && hotel.host_id !== currentUserId) {
        console.error('❌ [Context] Hotel não pertence ao usuário atual:', {
          hotelHostId: hotel.host_id,
          currentUserId,
          hotelId: hotel.id,
          hotelName: hotel.name
        });
        
        // Limpa hotel inválido
        setActiveHotelRaw(null);
        localStorage.removeItem('activeHotelId');
        
        setError('Este hotel não pertence à sua conta');
        consecutiveErrorsRef.current++;
        
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          toast.error('Múltiplos erros de permissão. Faça login novamente.');
        }
        
        return null;
      }
      
      // Hotel válido - atualiza estado
      setActiveHotelRaw(hotel);
      setLastRefreshTime(new Date());
      consecutiveErrorsRef.current = 0;
      
      console.log('✅ [Context] Hotel ativo carregado:', {
        id: hotel.id,
        name: hotel.name,
        host_id: hotel.host_id,
        belongsToUser: hotel.host_id === currentUserId
      });
      
      return hotel;
      
    } catch (error) {
      console.error('❌ [Context] Erro ao carregar hotel ativo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      consecutiveErrorsRef.current++;
      
      // 🔧 CORREÇÃO: Tratamento específico para erros de permissão
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('permissão')) {
        console.warn('⚠️ [Context] Erro 403 detectado, limpando hotel inválido');
        setActiveHotelRaw(null);
        localStorage.removeItem('activeHotelId');
        
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          toast.error('Problemas de permissão. Verifique seu login.');
        }
      }
      
      // 🔧 CORREÇÃO: Se for erro de rede, tenta novamente depois
      else if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
        if (consecutiveErrorsRef.current < MAX_CONSECUTIVE_ERRORS) {
          console.log(`🔄 [Context] Tentando novamente (${consecutiveErrorsRef.current}/${MAX_CONSECUTIVE_ERRORS})...`);
          
          // Retry com backoff
          const retryDelay = Math.min(1000 * Math.pow(2, consecutiveErrorsRef.current - 1), 5000);
          
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          refreshTimeoutRef.current = setTimeout(() => {
            loadActiveHotel();
          }, retryDelay);
        }
      }
      
      setActiveHotelRaw(null);
      return null;
      
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      // 🔧 CORREÇÃO: Reset após um tempo
      setTimeout(() => {
        loadActiveHotelCalledRef.current = false;
      }, 2000);
    }
  }, []);

  // 🔧 CORREÇÃO: Listener para mudanças no localStorage (com controle de origem)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeHotelId') {
        // 🔧 CORREÇÃO CRÍTICA: Ignora eventos da mesma origem/aba
        const isSameOrigin = e.url === window.location.href;
        if (isSameOrigin) {
          console.log('🔄 [Context] Storage mudado por esta aba, ignorando...');
          return;
        }
        
        console.log('🔄 [Context] Storage mudou (outra aba), recarregando hotel...');
        
        // Aguarda um pouco para garantir que o localStorage foi atualizado
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        refreshTimeoutRef.current = setTimeout(() => {
          refreshActiveHotel();
        }, 300);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshActiveHotel]); // 🔧 ADICIONADO: Dependência corrigida

  // 🔧 CORREÇÃO: Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // 🔧 CORREÇÃO: Carregar hotel ativo inicial APENAS uma vez (com proteção contra múltiplas chamadas)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadActiveHotelCalledRef.current) {
        loadActiveHotel();
      }
    }, 150); // Pequeno delay para evitar conflitos com outros componentes
    
    return () => clearTimeout(timer);
  }, []); // 🔧 CORREÇÃO: loadActiveHotel não deve estar nas dependências

  // 🔧 CORREÇÃO: Função para setar hotel manualmente (sem disparar eventos storage desnecessários)
  const setActiveHotel = useCallback((hotel: Hotel | null) => {
    console.log('🎯 [Context] setActiveHotel chamado:', {
      newHotelId: hotel?.id,
      currentHotelId: activeHotelRaw?.id,
      sameHotel: hotel?.id === activeHotelRaw?.id
    });
    
    // Se for null, seta null
    if (!hotel) {
      console.log('ℹ️ [Context] Definindo hotel como null');
      setActiveHotelRaw(null);
      localStorage.removeItem('activeHotelId');
      consecutiveErrorsRef.current = 0;
      setError(null);
      
      // 🔧 CORREÇÃO: Limpa o cache do hotelService
      hotelService.clearActiveHotelCache();
      hotelService.clearMyHotelsCache();
      return;
    }
    
    // 🔧 CORREÇÃO: Verificar se o hotel pertence ao usuário atual
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId && hotel.host_id !== currentUserId) {
      console.error('❌ [Context] Tentativa de setar hotel que não pertence ao usuário:', {
        hotelHostId: hotel.host_id,
        currentUserId,
        hotelName: hotel.name
      });
      
      toast.error('Você não pode selecionar um hotel que não é seu');
      setError('Hotel não pertence à sua conta');
      return;
    }
    
    // Se já temos um hotel, compara IDs antes de atualizar
    if (activeHotelRaw?.id === hotel.id) {
      console.log('⚠️ [Context] Tentativa de setar mesmo hotel, ignorando...');
      return;
    }
    
    // Validação básica do hotel
    if (!hotel.id || !hotel.name || !hotel.host_id) {
      console.error('❌ [Context] Hotel inválido recebido:', hotel);
      setError('Hotel inválido');
      return;
    }
    
    // Atualiza estado
    console.log('✅ [Context] Hotel definido com sucesso:', {
      id: hotel.id,
      name: hotel.name,
      host_id: hotel.host_id
    });
    
    setActiveHotelRaw(hotel);
    localStorage.setItem('activeHotelId', hotel.id);
    setLastRefreshTime(new Date());
    consecutiveErrorsRef.current = 0;
    setError(null);
    
    // 🔧 CORREÇÃO: Limpa caches relevantes
    hotelService.clearActiveHotelCache();
    hotelService.clearMyHotelsCache();
    
    // 🔧 CORREÇÃO CRÍTICA: NÃO disparar evento storage manualmente!
    // Isso causa loops. O evento é automaticamente disparado pelo browser
    // apenas para outras abas quando usamos localStorage.setItem()
    // REMOVEMOS o dispatchEvent manual
    
  }, [activeHotelRaw]);

  // 🔧 CORREÇÃO: Expor mais informações no contexto
  const contextValue = useMemo(() => ({
    activeHotel,
    setActiveHotel,
    refreshActiveHotel,
    forceRefreshActiveHotel,
    isLoading,
    lastRefreshTime,
    error
  }), [activeHotel, setActiveHotel, refreshActiveHotel, forceRefreshActiveHotel, isLoading, lastRefreshTime, error]);

  return (
    <ActiveHotelContext.Provider value={contextValue}>
      {children}
    </ActiveHotelContext.Provider>
  );
}

export function useActiveHotel() {
  const context = useContext(ActiveHotelContext);
  if (!context) {
    throw new Error('useActiveHotel must be used within ActiveHotelProvider');
  }
  return context;
}