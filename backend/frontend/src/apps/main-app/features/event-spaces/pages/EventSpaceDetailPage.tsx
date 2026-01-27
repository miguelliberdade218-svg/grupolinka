import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { MapPin, CheckCircle2, Star, Users, Ruler } from 'lucide-react';
import { useEventSpacesComplete } from '../hooks/useEventSpacesComplete';
import { Skeleton } from '@/shared/components/ui/skeleton';

/**
 * Página de detalhes de espaço de evento
 * Mostra: fotos, capacidade, preços, equipamentos, disponibilidade, reviews
 */
export const EventSpaceDetailPage: React.FC = () => {
  const { id: spaceId } = useParams<{ id: string }>();
  const { data, isLoading, error } = useEventSpaceCompleteData(spaceId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-dark mb-2">Espaço não encontrado</h1>
          <p className="text-muted-foreground">O espaço que você procura não existe ou foi removido</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-7xl">
          <Skeleton className="h-96 mb-8 rounded-lg" />
          <Skeleton className="h-12 mb-4 w-1/3" />
          <Skeleton className="h-6 mb-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { space, reviews } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="relative h-96 bg-gray-200 overflow-hidden">
        <img
          src={space.images?.[0] || 'https://via.placeholder.com/1200x400'}
          alt={space.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Rating Badge */}
        {space.rating > 0 && (
          <div className="absolute top-6 right-6 bg-white/95 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Star className="w-5 h-5 fill-primary text-primary" />
            <span className="font-bold text-dark">{space.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Informações Principais */}
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            {/* Título */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold text-dark mb-2">{space.name}</h1>
                  <Badge className="bg-secondary text-dark capitalize">{space.spaceType}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground mb-4 py-4 border-y border-gray-200">
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span>Capacidade: {space.capacityMin}-{space.capacityMax} pessoas</span>
                </div>
                {space.areaSqm && (
                  <div className="flex items-center gap-1">
                    <Ruler className="w-5 h-5" />
                    <span>{space.areaSqm}m²</span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 py-4 border-y border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>Verificado pelo Link-A</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>Pagamento seguro</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-secondary" />
                  <span>Suporte 24h</span>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-dark mb-3">Sobre o espaço</h2>
              <p className="text-muted-foreground leading-relaxed">{space.description}</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="features" className="mb-8">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="features">Características</TabsTrigger>
                <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
                <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
              </TabsList>

              {/* Características */}
              <TabsContent value="features">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Características</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                                          {space.amenities && space.amenities.length > 0 ? (
                        space.amenities.map((amenity: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                            <span>{amenity}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Nenhuma característica listada</p>
                      )}
                  </div>
                </div>
              </TabsContent>

              {/* Equipamentos */}
              <TabsContent value="equipment">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Equipamentos Disponíveis</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                                        {space.equipment && space.equipment.length > 0 ? (
                      space.equipment.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                          <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Nenhum equipamento listado</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <div>
                  <h3 className="text-xl font-semibold text-dark mb-4">Avaliações de Clientes</h3>
                  {reviews && reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review: any) => (
                        <Card key={review.id} className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-dark">{review.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                Evento: {review.eventType} | {review.numberOfGuests} pessoas
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-primary text-primary"
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                          <p className="text-sm mb-3">{review.comment}</p>
                          {review.managerResponse && (
                            <div className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-secondary">
                              <p className="font-semibold text-dark mb-1">Resposta do gerenciador</p>
                              <p className="text-muted-foreground">{review.managerResponse.text}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma avaliação ainda</p>
                  )}
                </div>
              </TabsContent>

              {/* Informações */}
              <TabsContent value="info">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="font-semibold text-dark mb-3">Restrições e Políticas</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-dark">Álcool permitido:</strong>{' '}
                        {space.alcoholAllowed ? 'Sim' : 'Não'}
                      </p>
                      {space.maxDurationHours && (
                        <p>
                          <strong className="text-dark">Duração máxima:</strong> {space.maxDurationHours} horas
                        </p>
                      )}
                      <p>
                        <strong className="text-dark">Seguro obrigatório:</strong>{' '}
                        {space.insuranceRequired ? 'Sim' : 'Não'}
                      </p>
                      {space.noiseRestriction && (
                        <p>
                          <strong className="text-dark">Restrição de ruído:</strong> {space.noiseRestriction}
                        </p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold text-dark mb-3">Serviços Incluídos</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <span>Catering: {space.includesCatering ? 'Sim' : 'Não'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <span>Mobília: {space.includesFurniture ? 'Sim' : 'Não'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <span>Limpeza: {space.includesCleaning ? 'Sim' : 'Não'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                        <span>Segurança: {space.includesSecurity ? 'Sim' : 'Não'}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Widget */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 p-6 shadow-lg">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Preço a partir de</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-secondary">{space.pricePerHour}</span>
                  <span className="text-muted-foreground">MZN/hora</span>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4 p-3 bg-gray-50 rounded-lg">
                                    <p>Meio-dia: {space.basePriceHalfDay} MZN</p>
                  <p>Dia completo: {space.basePriceFullDay} MZN</p>
                  {space.weekendSurchargePercent > 0 && (
                    <p className="text-alert">
                      +{space.weekendSurchargePercent}% fim de semana
                    </p>
                  )}
                </div>
              </div>

              <Button className="w-full bg-secondary hover:bg-secondary/90 text-dark mb-3 h-12 text-lg font-semibold">
                Reservar Agora
              </Button>

              <Button variant="outline" className="w-full h-10">
                Enviar Orçamento
              </Button>

              {/* Info de contato após reserva */}
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-900">
                  <strong>Contacto disponível após reserva confirmada</strong>
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  Depois de confirmar sua reserva, você receberá o telefone e email do gerenciador
                </p>
              </div>

              {/* Depósito de Segurança */}
              {space.securityDeposit > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Depósito de Segurança:</strong> {space.securityDeposit} MZN
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    Reembolsável após o evento se não houver danos
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventSpaceDetailPage;
