// src/apps/hotels-app/pages/events/EventSpaceEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import EditEventSpaceFormModern from '../../components/event-spaces/EditEventSpaceFormModern';
import { eventSpaceService } from '@/services/eventSpaceService';
import { toast } from 'sonner';

interface EventSpaceEditPageProps {
  spaceId: string;
}

export default function EventSpaceEditPage({ spaceId }: EventSpaceEditPageProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [spaceData, setSpaceData] = useState<any>(null);

  useEffect(() => {
    loadSpaceData();
  }, [spaceId]);

  const loadSpaceData = async () => {
    try {
      const result = await eventSpaceService.getEventSpaceById(spaceId);
      if (result.success && result.data) {
        setSpaceData(result.data);
      } else {
        toast.error(result.error || 'Erro ao carregar espaço');
        setLocation('/hotels/events/spaces');
      }
    } catch (error) {
      toast.error('Falha ao carregar dados do espaço');
      setLocation('/hotels/events/spaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Espaço atualizado com sucesso');
    setLocation(`/hotels/events/spaces/${spaceId}`);
  };

  const handleCancel = () => {
    setLocation(`/hotels/events/spaces/${spaceId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!spaceData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center p-10 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Espaço não encontrado</h2>
          <Button onClick={() => setLocation('/hotels/events/spaces')}>
            Voltar para Espaços
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/hotels/events/spaces/${spaceId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Detalhes
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Espaço de Eventos</h1>
        <p className="text-gray-600 mt-2">
          Atualize os detalhes do espaço "{spaceData.name}".
        </p>
      </div>

      <EditEventSpaceFormModern
        hotelId={spaceData.hotelId}
        spaceId={spaceId}
        initialData={spaceData}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}