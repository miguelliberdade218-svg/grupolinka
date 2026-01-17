import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  BarChart3Icon,
  PlusIcon,
  DoorOpenIcon,
  CalendarIcon,
  BarChart2Icon,
  MessageSquareIcon,
  SettingsIcon,
  LogOutIcon,
} from 'lucide-react';
import { RoomTypesManagement } from '../../components/hotel-management/RoomTypesManagement';
import { EventSpacesManagement } from '../../components/hotel-management/EventSpacesManagement';
import { BookingsManagement } from '../../components/hotel-management/BookingsManagement';

interface HotelManagerDashboardProps {
  hotelId?: string;
  hotelName?: string;
}

/**
 * Dashboard principal para gerentes de hotéis
 * Integra gestão de quartos, espaços de eventos, reservas, pagamentos, reviews
 */
export const HotelManagerDashboard: React.FC<HotelManagerDashboardProps> = ({
  hotelId = 'demo-hotel',
  hotelName = 'Seu Hotel',
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Dados mockados - substituir com API real
  const stats = {
    todayBookings: 3,
    pendingPayments: 2,
    occupancyRate: 78,
    revenue: 85500,
    revenueChange: 12,
    avgRating: 4.6,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark">Gestão do Hotel</h1>
            <p className="text-muted-foreground">{hotelName}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <LogOutIcon className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Tabs Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3Icon className="w-4 h-4" />
              <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>

            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <DoorOpenIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Quartos</span>
            </TabsTrigger>

            <TabsTrigger value="spaces" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>

            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <BarChart2Icon className="w-4 h-4" />
              <span className="hidden sm:inline">Reservas</span>
            </TabsTrigger>

            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>

            <TabsTrigger value="payments" className="flex items-center gap-2">
              <BarChart2Icon className="w-4 h-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB: RESUMO */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card: Ocupação */}
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-dark mb-1">{stats.occupancyRate}%</p>
                <p className="text-xs text-green-600">+5% vs semana anterior</p>
              </Card>

              {/* Card: Receita */}
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Receita Mensal</p>
                <p className="text-3xl font-bold text-primary mb-1">
                  {stats.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600">+{stats.revenueChange}% vs mês anterior</p>
              </Card>

              {/* Card: Reservas Hoje */}
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Reservas Hoje</p>
                <p className="text-3xl font-bold text-secondary mb-1">{stats.todayBookings}</p>
                <p className="text-xs">3 check-ins pendentes</p>
              </Card>

              {/* Card: Pagamentos Pendentes */}
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Pagamentos Pendentes</p>
                <p className="text-3xl font-bold text-alert mb-1">{stats.pendingPayments}</p>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  Processar
                </Button>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Ocupação por Semana</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-muted-foreground">
                  Gráfico: Taxa de ocupação (integrar com Chart.js)
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-dark mb-4">Receita Rooms vs Spaces</h3>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-muted-foreground">
                  Gráfico: Comparação de receita (integrar com Chart.js)
                </div>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <h3 className="text-lg font-semibold text-dark mb-4">Próximas ações</h3>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-primary hover:bg-primary/90 text-dark">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar Quarto
                </Button>
                <Button className="bg-secondary hover:bg-secondary/90 text-dark">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Adicionar Espaço de Evento
                </Button>
                <Button variant="outline">Gerenciar Disponibilidade</Button>
                <Button variant="outline">Criar Promoção</Button>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: QUARTOS */}
          <TabsContent value="rooms">
            <RoomTypesManagement hotelId={hotelId} />
          </TabsContent>

          {/* TAB: ESPAÇOS DE EVENTOS */}
          <TabsContent value="spaces">
            <EventSpacesManagement hotelId={hotelId} />
          </TabsContent>

          {/* TAB: RESERVAS */}
          <TabsContent value="bookings">
            <BookingsManagement hotelId={hotelId} />
          </TabsContent>

          {/* TAB: REVIEWS */}
          <TabsContent value="reviews">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-dark mb-4">Avaliações</h3>
              <p className="text-muted-foreground mb-4">Rating médio: {stats.avgRating}/5.0</p>

              <div className="space-y-4">
                <Card className="p-4 border-l-4 border-primary">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-dark">João Silva</p>
                      <p className="text-sm text-muted-foreground">Há 2 dias</p>
                    </div>
                    <div className="text-primary font-bold">5.0 ⭐</div>
                  </div>
                  <p className="text-sm mb-3">Excelente experiência, hotel muito limpo e staff atencioso!</p>
                  <Button variant="outline" size="sm">Responder</Button>
                </Card>

                <Card className="p-4 border-l-4 border-yellow-400">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-dark">Maria Santos</p>
                      <p className="text-sm text-muted-foreground">Há 5 dias</p>
                    </div>
                    <div className="text-yellow-400 font-bold">3.5 ⭐</div>
                  </div>
                  <p className="text-sm mb-3">Bom custo-benefício, mas poderia melhorar o Wi-Fi</p>
                  <Button variant="outline" size="sm">Responder</Button>
                </Card>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: PAGAMENTOS */}
          <TabsContent value="payments">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-dark mb-4">Gestão de Pagamentos</h3>
              <p className="text-muted-foreground mb-4">Total pendente: 12.500 MZN</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-dark">Booking #12345 - João Silva</p>
                    <p className="text-sm text-muted-foreground">Check-out: 15 Jan 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark">7.500 MZN</p>
                    <Button size="sm" className="mt-2 bg-secondary hover:bg-secondary/90 text-dark">
                      Processar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-dark">Booking #12346 - Maria Santos</p>
                    <p className="text-sm text-muted-foreground">Pago em: 14 Jan 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-secondary">5.000 MZN</p>
                    <Badge className="mt-2 bg-secondary text-dark">Pago</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HotelManagerDashboard;
