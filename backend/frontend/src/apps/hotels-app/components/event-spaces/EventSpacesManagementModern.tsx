/**
 * src/apps/hotels-app/components/event-spaces/EventSpacesManagementModern.tsx
 * Gerenciamento moderno de espaços de eventos - VERSÃO FINAL CORRIGIDA 27/01/2026
 * Alinhado com eventSpaceService e shared/types/event-spaces.ts
 * CORRIGIDO: Implementa delete real, edição real, debounce, fallback imagem, acessibilidade
 * ✅ CORREÇÃO FINAL: Modal de disponibilidade SEM Dialog wrapper
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
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
  MapPin,
  Search,
  Image as ImageIcon,
  Building,
  Star,
  Eye,
} from 'lucide-react';
import { eventSpaceService } from '@/services/eventSpaceService';
import { useToast } from '@/shared/hooks/use-toast';
import type { EventSpace, EventBooking } from '@/shared/types/event-spaces';
import CreateEventSpaceFormModern from './CreateEventSpaceFormModern';
import EditEventSpaceFormModern from './EditEventSpaceFormModern';
import EventSpaceAvailabilityCalendar from './EventSpaceAvailabilityCalendar';
import EventSpaceBookingsList from './EventSpaceBookingsList';
import EventSpaceReviewsList from './EventSpaceReviewsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

interface EventSpacesManagementProps {
  hotelId: string;
}

export const EventSpacesManagementModern: React.FC<EventSpacesManagementProps> = ({ hotelId }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [spaces, setSpaces] = useState<EventSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState<EventSpace | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { toast } = useToast();

  // ✅ Estados para modais
  const [selectedSpaceForAvailability, setSelectedSpaceForAvailability] = useState<EventSpace | null>(null);
  const [selectedSpaceForBookings, setSelectedSpaceForBookings] = useState<EventSpace | null>(null);
  const [selectedSpaceForReviews, setSelectedSpaceForReviews] = useState<EventSpace | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  // ✅ 4. DEBOUNCE NA BUSCA
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!hotelId) {
      setError('Nenhum hotel selecionado');
      setLoading(false);
      return;
    }
    loadSpaces();
  }, [hotelId]);

  const loadSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventSpaceService.getEventSpacesByHotel(hotelId, false);
      if (res.success && res.data) {
        setSpaces(res.data);
      } else {
        setError(res.error || 'Falha ao carregar espaços');
      }
    } catch (err: any) {
      setError('Erro de conexão');
      console.error('Erro load spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    toast({
      title: "✅ Espaço criado",
      description: "Novo espaço adicionado com sucesso",
      variant: "success",
      duration: 4000,
    });
    loadSpaces();
  };

  // ✅ 1. IMPLEMENTAR DELETE REAL
  const handleDelete = async (spaceId: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${name}"?\nEsta ação não pode ser desfeita.`)) return;

    try {
      const res = await eventSpaceService.deleteEventSpace(spaceId);
      if (!res.success) throw new Error(res.error || 'Falha ao deletar espaço');

      setSpaces(prev => prev.filter(s => s.id !== spaceId));
      toast({
        title: "✅ Espaço removido",
        description: `"${name}" foi deletado com sucesso`,
        variant: "success",
        duration: 4000,
      });
    } catch (err: any) {
      toast({
        title: "❌ Erro ao remover",
        description: err.message || "Não foi possível deletar o espaço",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // ✅ 2. IMPLEMENTAR EDIÇÃO REAL
  const handleEdit = (space: EventSpace) => {
    setEditingSpace(space);
  };

  const handleEditSuccess = () => {
    setEditingSpace(null);
    loadSpaces();
    toast({
      title: "✅ Espaço atualizado",
      description: "As alterações foram salvas com sucesso",
      variant: "success",
      duration: 4000,
    });
  };

  // ✅ HANDLERS PARA AS TABS HABILITADAS
  const handleAvailabilityClick = (space: EventSpace) => {
    setSelectedSpaceForAvailability(space);
    setActiveTab('availability');
    setShowAvailabilityModal(true);
  };

  const handleBookingsClick = (space: EventSpace) => {
    setSelectedSpaceForBookings(space);
    setActiveTab('bookings');
    setShowBookingsModal(true);
  };

  const handleReviewsClick = (space: EventSpace) => {
    setSelectedSpaceForReviews(space);
    setActiveTab('reviews');
    setShowReviewsModal(true);
  };

  const formatPrice = (price?: string | number) => {
    if (!price) return '—';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '—' : num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const filtered = useMemo(() => {
    if (!debouncedSearch) return spaces;
    
    return spaces.filter(s =>
      s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (s.spaceType || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [spaces, debouncedSearch]);

  // ✅ 3. MELHORAR FALLBACK DE IMAGEM
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2094&auto=format&fit=crop';
    target.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60';
  };

  if (showCreateForm) {
    return (
      <CreateEventSpaceFormModern
        hotelId={hotelId}
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (editingSpace) {
    return (
      <EditEventSpaceFormModern
        hotelId={hotelId}
        spaceId={editingSpace.id}
        initialData={editingSpace}
        onSuccess={handleEditSuccess}
        onCancel={() => setEditingSpace(null)}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building className="h-6 w-6 text-violet-600" />
            <h2 className="text-3xl font-bold text-gray-900">Espaços de Eventos</h2>
          </div>
          <p className="text-gray-600 mt-1">
            {loading ? (
              'Carregando...'
            ) : (
              <>
                <span className="font-medium text-violet-700">{spaces.length}</span> espaço(s) no hotel
                {searchTerm && filtered.length !== spaces.length && (
                  <span className="ml-2 text-violet-600">
                    ({filtered.length} filtrado(s))
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por nome, tipo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 w-64 bg-white focus-visible:ring-violet-500"
              aria-label="Pesquisar espaços"
            />
          </div>

          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-md focus-visible:ring-2 focus-visible:ring-violet-500"
            disabled={loading}
            aria-label="Criar novo espaço de eventos"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Espaço
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 p-1 rounded-xl">
          <TabsTrigger value="list" className="data-[state=active]:bg-white">
            Lista
          </TabsTrigger>
          <TabsTrigger value="availability" className="data-[state=active]:bg-white">
            Disponibilidade
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-white">
            Reservas
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-white">
            Avaliações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 animate-in fade-in-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-violet-600 mb-4" />
              <p className="text-lg text-gray-600">Carregando espaços...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-violet-300 bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-2xl shadow-sm">
              <Sparkles className="h-16 w-16 text-violet-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm ? "Nenhum Resultado" : "Nenhum Espaço Cadastrado"}
              </h3>
              {/* ✅ 5. MELHORAR MENSAGEM "SEM RESULTADOS" */}
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? `Não encontramos espaços correspondentes a "${searchTerm}".`
                  : "Crie seu primeiro espaço de eventos para começar a receber reservas."}
              </p>

              {!searchTerm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8 focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Espaço
                </Button>
              )}
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  size="lg"
                  className="border-violet-300 text-violet-700 hover:bg-violet-50"
                >
                  Limpar busca
                </Button>
              )}
            </Card>
          ) : (
            <>
              {searchTerm && (
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  {filtered.length} resultado(s) para "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-violet-700 hover:text-violet-800 text-xs underline ml-2"
                    aria-label="Limpar busca"
                  >
                    Limpar
                  </button>
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(space => (
                  <Card
                    key={space.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl group hover:border-violet-200"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {space.images?.[0] ? (
                        <img
                          src={space.images[0]}
                          alt={space.name}
                          onError={handleImageError}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
                          <ImageIcon className="h-16 w-16 text-violet-300" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex gap-2">
                        {!space.isActive && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5">
                            Inativo
                          </Badge>
                        )}
                        {space.isActive && space.isFeatured && (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-0.5">
                            Destaque
                          </Badge>
                        )}
                        {space.isActive && !space.isFeatured && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-0.5">
                            Ativo
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">
                          {space.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 min-h-[2.5rem]">
                          {space.description || 'Sem descrição'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1" title="Capacidade">
                          <Users className="h-4 w-4 text-violet-600 flex-shrink-0" />
                          <span>{space.capacityMin}–{space.capacityMax} pessoas</span>
                        </div>
                        <div className="flex items-center gap-1" title="Tipo de espaço">
                          <MapPin className="h-4 w-4 text-violet-600 flex-shrink-0" />
                          <span className="truncate">{space.spaceType || '—'}</span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-3 border border-violet-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 font-medium">Preço base/dia</span>
                          <span className="font-bold text-violet-700">
                            {formatPrice(space.basePricePerDay)}
                          </span>
                        </div>
                        {space.weekendSurchargePercent > 0 && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                            <span>Sobretaxa fim de semana:</span>
                            <span className="font-medium text-amber-600">+{space.weekendSurchargePercent}%</span>
                          </div>
                        )}
                      </div>

                      {(space.equipment?.amenities?.length || 0) > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">Amenidades:</p>
                          <div className="flex flex-wrap gap-1">
                            {(space.equipment.amenities || []).slice(0, 4).map((amenity: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-white border-gray-300 hover:bg-gray-50"
                              >
                                {amenity}
                              </Badge>
                            ))}
                            {(space.equipment.amenities?.length || 0) > 4 && (
                              <Badge variant="outline" className="text-xs bg-white border-gray-300">
                                +{(space.equipment.amenities?.length || 0) - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ✅ Botões de ação completos */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800 focus-visible:ring-violet-500"
                          onClick={() => handleEdit(space)}
                          aria-label={`Editar espaço ${space.name}`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 focus-visible:ring-blue-500"
                          onClick={() => handleAvailabilityClick(space)}
                          aria-label={`Gerenciar disponibilidade de ${space.name}`}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Disponibilidade
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 focus-visible:ring-red-500"
                          onClick={() => handleDelete(space.id, space.name)}
                          aria-label={`Remover espaço ${space.name}`}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ✅ TAB DE DISPONIBILIDADE HABILITADA */}
        <TabsContent value="availability" className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-violet-600 mb-4" />
              <p className="text-lg text-gray-600">Carregando espaços...</p>
            </div>
          ) : spaces.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Calendário de Disponibilidade
              </h3>
              <p className="text-gray-500 mb-4">
                Crie um espaço de eventos primeiro para gerenciar disponibilidade.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Espaço
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-8 w-8 text-violet-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Gestão de Disponibilidade</h3>
                    <p className="text-gray-600">
                      Configure dias disponíveis, preços especiais e bloqueios de calendário para cada espaço
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map(space => (
                  <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{space.name}</h4>
                          <p className="text-sm text-gray-600">
                            {space.spaceType || 'Espaço para eventos'}
                          </p>
                        </div>
                        <Badge 
                          variant={space.isActive ? "default" : "destructive"}
                          className={space.isActive 
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-red-500 hover:bg-red-600"
                          }
                        >
                          {space.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Preço base:</span>
                          <span className="font-semibold text-violet-700">
                            {formatPrice(space.basePricePerDay)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Capacidade:</span>
                          <span className="font-semibold">
                            {space.capacityMin}–{space.capacityMax} pessoas
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleAvailabilityClick(space)}
                        className="w-full bg-violet-600 hover:bg-violet-700"
                        size="sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Gerenciar Calendário
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ✅ TAB DE RESERVAS HABILITADA */}
        <TabsContent value="bookings" className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-violet-600 mb-4" />
              <p className="text-lg text-gray-600">Carregando espaços...</p>
            </div>
          ) : spaces.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Reservas de Espaços
              </h3>
              <p className="text-gray-500 mb-4">
                Crie um espaço de eventos primeiro para ver reservas.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Espaço
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Gestão de Reservas</h3>
                    <p className="text-gray-600">
                      Veja e gerencie todas as reservas dos seus espaços de eventos
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map(space => (
                  <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{space.name}</h4>
                          <p className="text-sm text-gray-600">
                            {space.spaceType || 'Espaço para eventos'}
                          </p>
                        </div>
                        <Badge 
                          variant="outline"
                          className="border-blue-300 text-blue-700"
                        >
                          {space.isActive ? 'Aceita reservas' : 'Não ativo'}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Última reserva:</span>
                          <span className="font-semibold text-gray-900">—</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reservas confirmadas:</span>
                          <span className="font-semibold text-green-600">0</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Aguardando aprovação:</span>
                          <span className="font-semibold text-amber-600">0</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBookingsClick(space)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Reservas
                        </Button>
                        <Button
                          onClick={() => handleAvailabilityClick(space)}
                          variant="outline"
                          className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          size="sm"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Calendário
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ✅ TAB DE AVALIAÇÕES HABILITADA */}
        <TabsContent value="reviews" className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-violet-600 mb-4" />
              <p className="text-lg text-gray-600">Carregando espaços...</p>
            </div>
          ) : spaces.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Avaliações dos Clientes
              </h3>
              <p className="text-gray-500 mb-4">
                Crie um espaço de eventos primeiro para receber avaliações.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Espaço
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="h-8 w-8 text-amber-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Avaliações dos Clientes</h3>
                    <p className="text-gray-600">
                      Veja o feedback dos organizadores sobre seus espaços de eventos
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map(space => (
                  <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{space.name}</h4>
                          <p className="text-sm text-gray-600">
                            {space.spaceType || 'Espaço para eventos'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-gray-900">4.5</span>
                          <span className="text-sm text-gray-500">(0)</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avaliações totais:</span>
                          <span className="font-semibold">0</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Média de rating:</span>
                          <span className="font-semibold">—</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Última avaliação:</span>
                          <span className="font-semibold text-gray-900">—</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReviewsClick(space)}
                          className="flex-1 bg-amber-600 hover:bg-amber-700"
                          size="sm"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Ver Avaliações
                        </Button>
                        <Button
                          onClick={() => handleEdit(space)}
                          variant="outline"
                          className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ */}
      {/* MODAL DE DISPONIBILIDADE - CORRIGIDO (SEM DIALOG WRAPPER) */}
      {/* ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ */}
      {showAvailabilityModal && selectedSpaceForAvailability && (
        <EventSpaceAvailabilityCalendar 
          hotelId={hotelId}
          spaceId={selectedSpaceForAvailability.id}
          spaceData={selectedSpaceForAvailability}
          onClose={() => setShowAvailabilityModal(false)}
        />
      )}

      {/* ✅ MODAL DE RESERVAS - também corrigir */}
      {showBookingsModal && selectedSpaceForBookings && (
        <EventSpaceBookingsList 
          spaceId={selectedSpaceForBookings.id}
          spaceName={selectedSpaceForBookings.name}
          onClose={() => setShowBookingsModal(false)}
        />
      )}

      {/* ✅ MODAL DE AVALIAÇÕES - também corrigir */}
      {showReviewsModal && selectedSpaceForReviews && (
        <EventSpaceReviewsList 
          spaceId={selectedSpaceForReviews.id}
          spaceName={selectedSpaceForReviews.name}
          onClose={() => setShowReviewsModal(false)}
        />
      )}
    </div>
  );
};

export default EventSpacesManagementModern;