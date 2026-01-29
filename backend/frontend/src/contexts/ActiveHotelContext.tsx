// src/contexts/ActiveHotelContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useRef } from 'react';
import { Hotel } from '@/shared/types/hotels';  // ← Tipo compartilhado (o "oficial")
import { hotelService, convertServiceHotelToSharedHotel } from '@/services/hotelService';  // ← Importa a função de conversão

interface ActiveHotelContextType {
  activeHotel: Hotel | null;
  setActiveHotel: (hotel: Hotel | null) => void;
  refreshActiveHotel: () => Promise<void>;
  isLoading: boolean;
}

const ActiveHotelContext = createContext<ActiveHotelContextType | undefined>(undefined);

export function ActiveHotelProvider({ children }: { children: ReactNode }) {
  // Armazenamos o hotel "cru" do serviço
  const [activeHotelRaw, setActiveHotelRaw] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usamos useRef para controlar se já está carregando (evita loops)
  const isLoadingRef = useRef(false);

  // useMemo para converter apenas quando raw mudar - MANTÉM REFERÊNCIA ESTÁVEL
  const activeHotel = useMemo(() => {
    if (!activeHotelRaw) return null;
    return convertServiceHotelToSharedHotel(activeHotelRaw);
  }, [activeHotelRaw]); // Só recalcula quando raw mudar

  // Carregar hotel ativo inicial do localStorage ou API
  useEffect(() => {
    const loadInitialHotel = async () => {
      // Evita carregar múltiplas vezes simultaneamente
      if (isLoadingRef.current) return;
      
      isLoadingRef.current = true;
      setIsLoading(true);
      
      try {
        const hotel = await hotelService.getActiveHotel();  // Retorna o tipo do serviço
        setActiveHotelRaw(hotel); // Armazena o raw
      } catch (error) {
        console.error('Erro ao carregar hotel ativo inicial:', error);
        setActiveHotelRaw(null);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadInitialHotel();
  }, []);

  // Função para recarregar (usada quando muda no selector ou localStorage)
  const refreshActiveHotel = async () => {
    // Evita múltiplas chamadas simultâneas
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    
    try {
      const hotel = await hotelService.getActiveHotel();
      setActiveHotelRaw(hotel); // Atualiza o raw
    } catch (error) {
      console.error('Erro ao recarregar hotel ativo:', error);
      setActiveHotelRaw(null);
    } finally {
      setIsLoading(false);
      // Pequeno delay para evitar loops rápidos
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
  };

  // Função para setar hotel manualmente (do selector)
  const setActiveHotel = (hotel: Hotel | null) => {
    // Se for null, seta null
    if (!hotel) {
      setActiveHotelRaw(null);
      return;
    }
    
    // Se já temos um hotel, compara IDs antes de atualizar
    if (activeHotelRaw?.id === hotel.id) {
      console.log('⚠️ Tentativa de setar mesmo hotel, ignorando...');
      return;
    }
    
    // Para evitar loops, convertemos de volta para o formato do serviço
    // (simplificação - assumindo que o hotel já está no formato certo)
    setActiveHotelRaw(hotel);
  };

  return (
    <ActiveHotelContext.Provider value={{ 
      activeHotel, // ← Este é o memoizado e convertido
      setActiveHotel, 
      refreshActiveHotel, 
      isLoading 
    }}>
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