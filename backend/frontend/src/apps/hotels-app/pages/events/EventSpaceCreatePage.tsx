// src/apps/hotels-app/pages/events/EventSpaceCreatePage.tsx
import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CreateEventSpaceFormModern from '../../components/event-spaces/CreateEventSpaceFormModern';

interface EventSpaceCreatePageProps {
  hotelId: string;
}

export default function EventSpaceCreatePage({ hotelId }: EventSpaceCreatePageProps) {
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setLocation('/hotels/events/spaces');
  };

  const handleCancel = () => {
    setLocation('/hotels/events/spaces');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation('/hotels/events/spaces')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Espaços
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Criar Novo Espaço de Eventos</h1>
        <p className="text-gray-600 mt-2">
          Preencha os detalhes do novo espaço de eventos para o seu hotel.
        </p>
      </div>

      <CreateEventSpaceFormModern
        hotelId={hotelId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}