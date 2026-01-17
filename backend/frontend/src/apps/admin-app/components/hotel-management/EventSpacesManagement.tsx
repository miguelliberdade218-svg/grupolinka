import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  UsersIcon,
  StarIcon,
} from 'lucide-react';

interface EventSpacesManagementProps {
  hotelId: string;
}

/**
 * Componente para gerenciar espaços de eventos do hotel
 * Inclui: lista, criar, editar, disponibilidade, promoções, reviews
 */
export const EventSpacesManagement: React.FC<EventSpacesManagementProps> = ({ hotelId }) => {
  const [activeSubTab, setActiveSubTab] = useState('list');

  // Dados mockados - substituir com API real
  const mockSpaces = [
    {
      id: '1',
      name: 'Sala de Conferência A',
      type: 'conference',
      capacity: '50-100 pessoas',
      price: '5.000 MZN/dia',
      availability: 'Disponível',
      reviews: 4.7,
      image: 'https://via.placeholder.com/400x300',
    },
    {
      id: '2',
      name: 'Salão Banquete Grand',
      type: 'banquet',
      capacity: '200-400 pessoas',
      price: '12.000 MZN/dia',
      availability: 'Bloqueado até 20 Jan',
      reviews: 4.9,
      image: 'https://via.placeholder.com/400x300',
    },
    {
      id: '3',
      name: 'Espaço Outdoor',
      type: 'outdoor',
      capacity: '100-200 pessoas',
      price: '8.000 MZN/dia',
      availability: 'Disponível',
      reviews: 4.5,
      image: 'https://via.placeholder.com/400x300',
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
          <TabsTrigger value="promotions">Promoções</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* SUB-TAB: LISTA */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-dark">Espaços de Eventos</h3>
            <Button className="bg-secondary hover:bg-secondary/90 text-dark">
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar Espaço
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockSpaces.map((space) => (
              <Card key={space.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img src={space.image} alt={space.name} className="w-full h-48 object-cover" />

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-dark">{space.name}</h4>
                    <Badge className="bg-secondary/20 text-secondary text-xs capitalize">
                      {space.type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 mb-3 text-sm text-muted-foreground">
                    <UsersIcon className="w-4 h-4" />
                    <span>{space.capacity}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-4">
                    <StarIcon className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-semibold">{space.reviews}</span>
                  </div>

                  <div className="mb-4 pb-4 border-t border-gray-200">
                    <p className="text-xs text-muted-foreground">Preço base</p>
                    <p className="text-lg font-bold text-secondary">{space.price}</p>
                    <p className="text-xs text-muted-foreground mt-2">{space.availability}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SUB-TAB: DISPONIBILIDADE */}
        <TabsContent value="availability">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">
              Calendário de Disponibilidade
            </h3>

            <div className="mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-secondary" />
              <p className="text-sm text-muted-foreground">
                Gerencie datas ocupadas e preços por hora/dia para cada espaço
              </p>
            </div>

            <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center text-muted-foreground">
              Calendário interativo (integrar FullCalendar com suporte a horários)
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="bg-secondary hover:bg-secondary/90 text-dark">
                Bloquear Datas/Horários
              </Button>
              <Button variant="outline">
                Atualizar Preços
              </Button>
              <Button variant="outline">
                Importar Calendário
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* SUB-TAB: PROMOÇÕES */}
        <TabsContent value="promotions">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark">Promoções Ativas</h3>
              <Button className="bg-secondary hover:bg-secondary/90 text-dark">
                <PlusIcon className="w-4 h-4 mr-2" />
                Criar Promoção
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-dark">Casamentos de Fim de Semana</h4>
                    <p className="text-sm text-muted-foreground">Desconto de 15% em sábados e domingos</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Válido até: 31 Dec 2026 | Aplicável a: Salão Banquete
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    Desativar
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-dark">Conferências Corporativas</h4>
                    <p className="text-sm text-muted-foreground">10% de desconto para bookings acima de 3 dias</p>
                  </div>
                  <Badge className="bg-blue-600 text-white">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Válido até: 30 Jun 2026 | Aplicável a: Salas de Conferência
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    Desativar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SUB-TAB: REVIEWS */}
        <TabsContent value="reviews">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">Avaliações por Espaço</h3>

            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-dark">Salão Banquete - Casamento perfeito!</p>
                    <p className="text-sm text-muted-foreground">
                      Por: Carlos Mendes | Evento: Casamento | Há 1 semana
                    </p>
                  </div>
                  <div className="text-primary font-bold">5.0 ⭐</div>
                </div>
                <p className="text-sm mb-3">
                  Espaço muito lindo, perfeito para nosso casamento! O staff foi atencioso do início ao fim.
                </p>
                <Button variant="outline" size="sm">
                  Responder
                </Button>
              </div>

              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-dark">Sala de Conferência - Excelente!</p>
                    <p className="text-sm text-muted-foreground">
                      Por: Tech Summit Ltd | Evento: Conferência | Há 2 semanas
                    </p>
                  </div>
                  <div className="text-green-600 font-bold">4.9 ⭐</div>
                </div>
                <p className="text-sm mb-3">
                  Equipamento de áudio/vídeo de qualidade, espaço amplo e equipe profissional. Voltaremos!
                </p>
                <div className="bg-white p-3 rounded-lg text-sm border-l-4 border-secondary mt-3">
                  <p className="font-semibold text-dark mb-1">Sua resposta:</p>
                  <p className="text-muted-foreground">
                    Muito obrigado! Ficamos felizes em receber sua conferência. Esperamos vê-los novamente!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventSpacesManagement;
