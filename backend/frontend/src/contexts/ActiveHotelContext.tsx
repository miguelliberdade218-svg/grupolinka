// src/contexts/ActiveHotelContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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
  const [activeHotel, setActiveHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar hotel ativo inicial do localStorage ou API
  useEffect(() => {
    const loadInitialHotel = async () => {
      setIsLoading(true);
      try {
        const hotel = await hotelService.getActiveHotel();  // Retorna o tipo do serviço
        if (hotel) {
          const converted = convertServiceHotelToSharedHotel(hotel);  // Converte para tipo compartilhado
          setActiveHotel(converted);
        } else {
          setActiveHotel(null);
        }
      } catch (error) {
        console.error('Erro ao carregar hotel ativo inicial:', error);
        setActiveHotel(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialHotel();
  }, []);

  // Função para recarregar (usada quando muda no selector ou localStorage)
  const refreshActiveHotel = async () => {
    setIsLoading(true);
    try {
      const hotel = await hotelService.getActiveHotel();
      if (hotel) {
        const converted = convertServiceHotelToSharedHotel(hotel);
        setActiveHotel(converted);
      } else {
        setActiveHotel(null);
      }
    } catch (error) {
      console.error('Erro ao recarregar hotel ativo:', error);
      setActiveHotel(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActiveHotelContext.Provider value={{ activeHotel, setActiveHotel, refreshActiveHotel, isLoading }}>
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