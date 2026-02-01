// src/contexts/ActiveEventSpaceContext.tsx
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { EventSpace } from '@/shared/types/event-spaces';

interface ActiveEventSpaceContextType {
  activeEventSpace: EventSpace | null;
  setActiveEventSpace: (space: EventSpace | null) => void;
}

const ActiveEventSpaceContext = createContext<ActiveEventSpaceContextType | undefined>(undefined);

export function ActiveEventSpaceProvider({ children }: { children: ReactNode }) {
  const [activeEventSpace, setActiveEventSpace] = useState<EventSpace | null>(() => {
    // Tentar restaurar do localStorage no inicial
    try {
      const saved = localStorage.getItem('activeEventSpace');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Erro ao restaurar activeEventSpace do localStorage:', error);
    }
    return null;
  });

  // Memoizar o valor do contexto
  const contextValue = useMemo(() => ({
    activeEventSpace,
    setActiveEventSpace: (space: EventSpace | null) => {
      setActiveEventSpace(space);
      // Persistir no localStorage
      if (space) {
        localStorage.setItem('activeEventSpace', JSON.stringify(space));
        localStorage.setItem('activeEventSpaceId', space.id);
      } else {
        localStorage.removeItem('activeEventSpace');
        localStorage.removeItem('activeEventSpaceId');
      }
    },
  }), [activeEventSpace]);

  return (
    <ActiveEventSpaceContext.Provider value={contextValue}>
      {children}
    </ActiveEventSpaceContext.Provider>
  );
}

export function useActiveEventSpace() {
  const context = useContext(ActiveEventSpaceContext);
  if (!context) {
    throw new Error('useActiveEventSpace must be used within ActiveEventSpaceProvider');
  }
  return context;
}