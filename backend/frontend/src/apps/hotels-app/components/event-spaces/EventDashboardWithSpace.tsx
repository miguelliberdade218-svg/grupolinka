// src/apps/hotels-app/components/event-spaces/EventDashboardWithSpace.tsx
import React, { useEffect } from 'react';
import { useActiveEventSpace } from '@/contexts/ActiveEventSpaceContext';
import { eventSpaceService } from '@/services/eventSpaceService';
import EventDashboardPage from '../../pages/events/EventDashboardPage';

interface EventDashboardWithSpaceProps {
  hotelId?: string;
  spaceId: string;
}

const EventDashboardWithSpace: React.FC<EventDashboardWithSpaceProps> = ({ hotelId, spaceId }) => {
  const { setActiveEventSpace } = useActiveEventSpace();

  useEffect(() => {
    // ✅ Carregar espaço e atualizar contexto
    const loadAndSetSpace = async () => {
      try {
        const res = await eventSpaceService.getEventSpaceById(spaceId);
        if (res.success && res.data) {
          setActiveEventSpace(res.data);
        }
      } catch (error) {
        console.error('Erro ao carregar espaço para dashboard:', error);
      }
    };

    if (spaceId) {
      loadAndSetSpace();
    }
  }, [spaceId, setActiveEventSpace]);

  return <EventDashboardPage hotelId={hotelId} spaceId={spaceId} />;
};

export default EventDashboardWithSpace;