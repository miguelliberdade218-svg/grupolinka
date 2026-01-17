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
  TagIcon,
  StarIcon,
} from 'lucide-react';

interface RoomTypesManagementProps {
  hotelId: string;
}

/**
 * Componente para gerenciar room types (quartos) do hotel
 * Inclui: lista, criar, editar, disponibilidade, promoções, reviews
 */
export const RoomTypesManagement: React.FC<RoomTypesManagementProps> = ({ hotelId }) => {
  const [activeSubTab, setActiveSubTab] = useState('list');

  // Dados mockados - substituir com API real
  const mockRooms = [
    {
      id: '1',
      name: 'Quarto Standard',
      capacity: '2 hóspedes',
      price: 2500,
      occupancy: '85%',
      reviews: 4.5,
      image: 'https://via.placeholder.com/400x300',
    },
    {
      id: '2',
      name: 'Quarto Duplo Deluxe',
      capacity: '2-3 hóspedes',
      price: 4500,
      occupancy: '95%',
      reviews: 4.8,
      image: 'https://via.placeholder.com/400x300',
    },
    {
      id: '3',
      name: 'Suite Executiva',
      capacity: '2-4 hóspedes',
      price: 6500,
      occupancy: '72%',
      reviews: 4.7,
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
            <h3 className="text-2xl font-bold text-dark">Tipos de Quartos</h3>
            <Button className="bg-primary hover:bg-primary/90 text-dark">
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar Quarto
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img src={room.image} alt={room.name} className="w-full h-48 object-cover" />

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-dark">{room.name}</h4>
                    <Badge className="bg-secondary text-dark">{room.occupancy} ocupado</Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{room.capacity}</p>

                  <div className="flex items-center gap-1 mb-4">
                    <StarIcon className="w-4 h-4 fill-primary text-primary" />
                    <span className="text-sm font-semibold">{room.reviews}</span>
                  </div>

                  <div className="mb-4 pb-4 border-t border-gray-200">
                    <p className="text-xs text-muted-foreground">Preço por noite</p>
                    <p className="text-2xl font-bold text-primary">
                      {room.price.toLocaleString()} MZN
                    </p>
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
            <h3 className="text-xl font-semibold text-dark mb-4">Calendário de Disponibilidade</h3>

            <div className="mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Gerencie datas bloqueadas e preços dinâmicos por quarto
              </p>
            </div>

            <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center text-muted-foreground">
              Calendário interativo (integrar react-big-calendar ou FullCalendar)
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="bg-secondary hover:bg-secondary/90 text-dark">
                Bloquear Datas
              </Button>
              <Button variant="outline">
                Atualizar Preços
              </Button>
              <Button variant="outline">
                Sincronizar com OTAs
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* SUB-TAB: PROMOÇÕES */}
        <TabsContent value="promotions">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-dark">Promoções Ativas</h3>
              <Button className="bg-primary hover:bg-primary/90 text-dark">
                <PlusIcon className="w-4 h-4 mr-2" />
                Criar Promoção
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-dark">Black Friday Special</h4>
                    <p className="text-sm text-muted-foreground">Desconto de 30% em todos os quartos</p>
                  </div>
                  <Badge className="bg-green-600 text-white">Ativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Válido até: 30 Jan 2026 | Código: BLACKFRI30
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

              <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-dark">Early Bird Booking</h4>
                    <p className="text-sm text-muted-foreground">10% de desconto ao reservar com 30 dias antes</p>
                  </div>
                  <Badge className="bg-gray-600 text-white">Inativo</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Válido até: 15 Feb 2026
                </p>
                <Button size="sm" variant="outline">
                  Ativar
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* SUB-TAB: REVIEWS */}
        <TabsContent value="reviews">
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-dark mb-4">Avaliações por Quarto</h3>

            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-dark">Quarto Standard - Muito bom!</p>
                    <p className="text-sm text-muted-foreground">Por: João Silva | 3 dias atrás</p>
                  </div>
                  <div className="text-primary font-bold">5.0 ⭐</div>
                </div>
                <p className="text-sm mb-3">
                  Quarto limpo, cama confortável, excelente atendimento. Voltarei com certeza!
                </p>
                <Button variant="outline" size="sm">
                  Responder
                </Button>
              </div>

              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-dark">Suite Executiva - Poderia melhorar</p>
                    <p className="text-sm text-muted-foreground">Por: Maria Santos | 5 dias atrás</p>
                  </div>
                  <div className="text-yellow-500 font-bold">3.5 ⭐</div>
                </div>
                <p className="text-sm mb-3">
                  Bom pelo preço, mas o ar-condicionado faz muito barulho à noite.
                </p>
                <Button variant="outline" size="sm">
                  Responder
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomTypesManagement;
