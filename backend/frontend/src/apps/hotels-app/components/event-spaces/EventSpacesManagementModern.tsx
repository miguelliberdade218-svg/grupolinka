// src/apps/hotels-app/components/event-spaces/EventSpacesManagementModern.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Loader2,
  Plus,
  Edit,
  Trash,
  AlertCircle,
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { eventSpaceService } from '@/services/eventSpaceService';
import { useToast } from '@/shared/hooks/use-toast';
import CreateEventSpaceFormModern from './CreateEventSpaceFormModern';

interface EventSpacesManagementProps {
  hotelId: string;
}

/**
 * Componente para gerenciar espaços de eventos do hotel
 * ✅ VERSÃO MODERNIZADA COM DESIGN PROFISSIONAL (BOOKING.COM STYLE)
 */
export const EventSpacesManagementModern: React.FC<EventSpacesManagementProps> = ({ hotelId }) => {
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Carregar espaços quando hotelId mudar
  useEffect(() => {
    if (!hotelId) {
      setError('Nenhum hotel selecionado');
      setLoading(false);
      return;
    }
    loadEventSpaces();
  }, [hotelId]);

  const loadEventSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventSpaceService.getEventSpacesByHotel(hotelId);
      if (response.success && response.data) {
        setEventSpaces(response.data);
        if (response.data.length > 0) {
          toast({
            title: "✅ Espaços carregados",
            description: `${response.data.length} espaço(s) encontrado(s)`,
          });
        }
      } else {
        setError(response.error || 'Erro ao carregar espaços de eventos');
      }
    } catch (err) {
      setError('Falha ao conectar com o servidor');
      console.error('❌ Erro ao carregar espaços:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpace = () => {
    setShowCreateForm(true);
  };

  const handleCreateSpaceSuccess = (spaceId: string) => {
    console.log('✅ Espaço criado com sucesso:', spaceId);
    setShowCreateForm(false);
    toast({
      title: "✅ Espaço criado",
      description: "Novo espaço de evento adicionado com sucesso",
    });
    loadEventSpaces();
  };

  const handleDeleteEventSpace = async (spaceId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este espaço de evento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await eventSpaceService.deleteEventSpace(spaceId);
      if (response.success) {
        setEventSpaces(eventSpaces.filter(es => es.id !== spaceId));
        toast({
          title: "✅ Espaço deletado",
          description: "Espaço de evento removido com sucesso",
        });
        console.log('✅ Espaço deletado:', spaceId);
      } else {
        toast({
          title: "❌ Erro ao deletar",
          description: response.error || 'Erro desconhecido',
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "❌ Erro",
        description: "Falha ao deletar espaço de evento",
        variant: "destructive",
      });
      console.error('Erro ao deletar espaço:', err);
    }
  };

  const handleEditSpace = (spaceId: string) => {
    toast({
      title: "Editar Espaço",
      description: `Editando espaço: ${spaceId} (funcionalidade em desenvolvimento)`,
    });
    console.log('✅ Clicou em Editar Espaço:', spaceId);
  };

  const formatPrice = (price: string | undefined) => {
    if (!price) return 'N/A';
    const num = parseFloat(price);
    return num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  // Estado: Mostrar formulário de criação
  if (showCreateForm) {
    return (
      <CreateEventSpaceFormModern
        hotelId={hotelId}
        onSuccess={handleCreateSpaceSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  // Estado principal
  return (
    <div className="space-y-6">
      {/* Header com título e botão criar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Espaços de Eventos</h2>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Carregando...' : `${eventSpaces.length} espaço(s) registrado(s)`}
          </p>
        </div>
        <Button
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold h-10 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
          onClick={handleAddSpace}
          disabled={loading}
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Espaço
        </Button>
      </div>

      {/* Mensagens de erro */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Erro ao carregar</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50 p-1 rounded-lg">
          <TabsTrigger value="list" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Lista</TabsTrigger>
          <TabsTrigger value="availability" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Disponibilidade</TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Reservas</TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Reviews</TabsTrigger>
        </TabsList>

        {/* TAB: LISTA */}
        <TabsContent value="list" className="space-y-6">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600 mr-3" />
              <p className="text-lg text-muted-foreground">Carregando espaços de eventos...</p>
            </div>
          )}

          {/* Sem espaços */}
          {!loading && eventSpaces.length === 0 && (
            <Card className="p-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-2xl shadow-sm">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Gestão de Espaços em Desenvolvimento</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                A funcionalidade de gerenciamento de espaços de eventos está sendo desenvolvida. Em breve você poderá:
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Criar Espaços</h4>
                  </div>
                  <p className="text-sm text-gray-600">Gerencie diferentes tipos de espaços com fotos e descrições</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Calendário</h4>
                  </div>
                  <p className="text-sm text-gray-600">Gerencie disponibilidade por data</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Preços</h4>
                  </div>
                  <p className="text-sm text-gray-600">Configure preços flexíveis (hora, dia, evento)</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Reservas</h4>
                  </div>
                  <p className="text-sm text-gray-600">Receba e gerencie reservas de clientes</p>
                </div>
              </div>

              <Button
                disabled
                className="bg-gray-400 cursor-not-allowed h-12 px-8 text-white font-semibold rounded-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Espaço (Em breve)
              </Button>

              <div className="mt-8 pt-8 border-t border-purple-200">
                <p className="text-xs text-gray-500">
                  🔄 Volte em breve para começar a gerenciar seus espaços de eventos!
                </p>
              </div>
            </Card>
          )}

          {/* Grid de espaços */}
          {!loading && eventSpaces.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {eventSpaces.map((space) => (
                <Card
                  key={space.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 border-0 group"
                >
                  {/* Imagem */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 h-48">
                    {space.images && space.images[0] ? (
                      <img
                        src={space.images[0]}
                        alt={space.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      {space.is_active && (
                        <Badge className="bg-green-500 text-white text-xs font-semibold">
                          ✓ Ativo
                        </Badge>
                      )}
                      {space.is_featured && (
                        <Badge className="bg-yellow-500 text-white text-xs font-semibold">
                          ⭐ Destaque
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">{space.name}</h3>

                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">
                        {space.capacity_min}-{space.capacity_max} pessoas
                      </span>
                    </div>

                    {space.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{space.description}</p>
                    )}

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                      <div className="grid grid-cols-3 gap-2">
                        {space.price_per_hour && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Por Hora</p>
                            <p className="text-lg font-bold text-purple-600">{formatPrice(space.price_per_hour)}</p>
                          </div>
                        )}
                        {space.price_per_day && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Por Dia</p>
                            <p className="text-lg font-bold text-purple-600">{formatPrice(space.price_per_day)}</p>
                          </div>
                        )}
                        {space.price_per_event && (
                          <div>
                            <p className="text-xs text-gray-600 font-medium">Por Evento</p>
                            <p className="text-lg font-bold text-purple-600">{formatPrice(space.price_per_event)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {space.amenities && space.amenities.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Amenidades:</p>
                        <div className="flex flex-wrap gap-2">
                          {space.amenities.slice(0, 3).map((amenity, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="bg-gray-50 border-gray-300 text-gray-700 text-xs"
                            >
                              {amenity}
                            </Badge>
                          ))}
                          {space.amenities.length > 3 && (
                            <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-700 text-xs font-semibold">
                              +{space.amenities.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                        onClick={() => handleEditSpace(space.id)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Reservas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja deletar "${space.name}"?`)) {
                            handleDeleteEventSpace(space.id);
                          }
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: DISPONIBILIDADE */}
        <TabsContent value="availability">
          <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
            <Calendar className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Calendário de Disponibilidade</h3>
            <p className="text-center text-gray-600">
              🔄 Integração com calendário interativo em breve
            </p>
          </Card>
        </TabsContent>

        {/* TAB: RESERVAS */}
        <TabsContent value="bookings">
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
            <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Reservas de Eventos</h3>
            <p className="text-center text-gray-600">
              Funcionalidade em desenvolvimento
            </p>
          </Card>
        </TabsContent>

        {/* TAB: REVIEWS */}
        <TabsContent value="reviews">
          <Card className="p-8 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Avaliações dos Espaços</h3>
            <p className="text-center text-gray-600">
              Você poderá ver e responder avaliações em breve
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventSpacesManagementModern;