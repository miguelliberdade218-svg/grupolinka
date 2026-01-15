import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, Calendar, Users, DollarSign, Plus, Car, MessageCircle, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Mock data para o dashboard
  const driverStats = {
    activeRoutes: 3,
    totalEarnings: 45600,
    monthlyEarnings: 12300,
    completedTrips: 84,
    rating: 4.8,
    totalPassengers: 256
  };

  const activeRoutes = [
    {
      id: 1,
      from: "Maputo",
      to: "Beira",
      date: "2024-01-20",
      time: "08:00",
      price: 1500,
      availableSeats: 2,
      totalSeats: 4,
      requests: 3,
      status: "active"
    },
    {
      id: 2,
      from: "Nampula",
      to: "Nacala",
      date: "2024-01-22",
      time: "14:00",
      price: 800,
      availableSeats: 1,
      totalSeats: 3,
      requests: 1,
      status: "active"
    }
  ];

  const partnershipOpportunities = [
    {
      id: 1,
      hotel: "Hotel Marisol",
      location: "Beira",
      offer: "10% comissão por cliente levado",
      type: "Comissão",
      posted: "2 dias",
      interested: 5
    },
    {
      id: 2,
      hotel: "Lodge Safari",
      location: "Gorongosa",
      offer: "Estadia grátis + 500 MZN por grupo",
      type: "Pacote",
      posted: "1 semana",
      interested: 12
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Motoristas</h1>
          <p className="text-gray-600">Gerir suas rotas e propostas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rotas Ativas</p>
                  <p className="text-2xl font-bold">{driverStats.activeRoutes}</p>
                </div>
                <Car className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold">{driverStats.monthlyEarnings.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">MZN</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ganho</p>
                  <p className="text-2xl font-bold">{driverStats.totalEarnings.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">MZN</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Viagens</p>
                  <p className="text-2xl font-bold">{driverStats.completedTrips}</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Passageiros</p>
                  <p className="text-2xl font-bold">{driverStats.totalPassengers}</p>
                </div>
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avaliação</p>
                  <p className="text-2xl font-bold">{driverStats.rating}</p>
                  <p className="text-xs text-gray-500">⭐ de 5</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">★</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rotas Ativas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Minhas Rotas Ativas</CardTitle>
              <Button asChild size="sm">
                <Link href="/drivers/publish" data-testid="button-add-route">
                  <Plus className="w-4 h-4 mr-2" />
                  Publicar Rota
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeRoutes.map((route) => (
                  <Card key={route.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{route.from} → {route.to}</h3>
                          <p className="text-sm text-gray-600">
                            📅 {route.date} às {route.time}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {route.price} MZN
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                        <span>💺 {route.availableSeats} de {route.totalSeats} lugares</span>
                        <span>📝 {route.requests} solicitações</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`button-manage-${route.id}`}>
                          Gerir
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`button-chat-${route.id}`}>
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {activeRoutes.length === 0 && (
                  <div className="text-center py-6">
                    <Car className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhuma rota ativa</p>
                    <Button asChild className="mt-2">
                      <Link href="/drivers/publish">Publicar primeira rota</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Oportunidades de Parceria */}
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades de Parceria</CardTitle>
              <p className="text-sm text-gray-600">
                Posts de alojamentos oferecendo parcerias
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {partnershipOpportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{opportunity.hotel}</h3>
                          <p className="text-sm text-gray-600">📍 {opportunity.location}</p>
                        </div>
                        <Badge variant="outline">{opportunity.type}</Badge>
                      </div>
                      
                      <p className="text-sm mb-3 p-2 bg-blue-50 rounded">
                        💡 {opportunity.offer}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>Publicado há {opportunity.posted}</span>
                        <span>{opportunity.interested} interessados</span>
                      </div>
                      
                      <Button size="sm" className="w-full" data-testid={`button-interest-${opportunity.id}`}>
                        Demonstrar Interesse
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/drivers/partnerships" data-testid="button-view-all-partnerships">
                      Ver Todas as Parcerias
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}