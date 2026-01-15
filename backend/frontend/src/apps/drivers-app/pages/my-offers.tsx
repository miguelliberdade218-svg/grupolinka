import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { MapPin, Calendar, Users, DollarSign, MessageCircle, Settings, CheckCircle, Clock, X, AlertCircle } from "lucide-react";

export default function MyOffers() {
  const { user } = useAuth();
  
  const mockOffers = {
    active: [
      {
        id: 1,
        from: "Maputo",
        to: "Beira", 
        date: "2024-01-20",
        time: "08:00",
        price: 1500,
        totalSeats: 4,
        bookedSeats: 2,
        requests: 3,
        status: "active",
        earnings: 3000
      },
      {
        id: 2,
        from: "Nampula", 
        to: "Nacala",
        date: "2024-01-22",
        time: "14:00",
        price: 800,
        totalSeats: 3,
        bookedSeats: 1,
        requests: 1,
        status: "active",
        earnings: 800
      }
    ],
    completed: [
      {
        id: 3,
        from: "Maputo",
        to: "Xai-Xai",
        date: "2024-01-10",
        time: "09:00",
        price: 600,
        totalSeats: 4,
        bookedSeats: 4,
        status: "completed",
        earnings: 2400,
        rating: 4.8
      },
      {
        id: 4,
        from: "Beira",
        to: "Chimoio", 
        date: "2024-01-08",
        time: "15:30",
        price: 1200,
        totalSeats: 3,
        bookedSeats: 2,
        status: "completed",
        earnings: 2400,
        rating: 4.9
      }
    ],
    pending: [
      {
        id: 5,
        from: "Tete",
        to: "Chimoio",
        date: "2024-01-25",
        time: "07:00",
        price: 1300,
        totalSeats: 4,
        bookedSeats: 0,
        requests: 0,
        status: "pending",
        earnings: 0
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "cancelled": return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleManageOffer = (offerId: number) => {
    console.log("Gerir oferta:", offerId);
    // TODO: Navegar para página de gestão da oferta
  };

  const handleCancelOffer = (offerId: number) => {
    if (window.confirm("Tem certeza que deseja cancelar esta oferta?")) {
      console.log("Cancelar oferta:", offerId);
      // TODO: Implementar cancelamento
    }
  };

  const OfferCard = ({ offer, showActions = true }: { offer: any, showActions?: boolean }) => (
    <Card key={offer.id} className="border-l-4 border-l-orange-500">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {offer.from} → {offer.to}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              {offer.date} às {offer.time}
            </p>
          </div>
          <Badge className={getStatusColor(offer.status)}>
            {getStatusIcon(offer.status)}
            <span className="ml-1">
              {offer.status === "active" && "Ativa"}
              {offer.status === "completed" && "Concluída"}
              {offer.status === "pending" && "Pendente"}
              {offer.status === "cancelled" && "Cancelada"}
            </span>
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{offer.bookedSeats}/{offer.totalSeats} lugares</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span>{offer.price} MZN por pessoa</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {offer.earnings.toLocaleString()} MZN
            </p>
            <p className="text-xs text-gray-500">
              {offer.status === "completed" ? "Ganho total" : "Ganho atual"}
            </p>
            {offer.rating && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm">{offer.rating}</span>
              </div>
            )}
          </div>
        </div>

        {offer.requests > 0 && offer.status === "active" && (
          <div className="bg-orange-50 p-2 rounded mb-3">
            <p className="text-sm text-orange-800">
              📝 {offer.requests} nova{offer.requests > 1 ? "s" : ""} solicitaç{offer.requests > 1 ? "ões" : "ão"}
            </p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2">
            {offer.status === "active" && (
              <>
                <Button 
                  size="sm" 
                  onClick={() => handleManageOffer(offer.id)}
                  data-testid={`button-manage-${offer.id}`}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Gerir
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  data-testid={`button-chat-${offer.id}`}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleCancelOffer(offer.id)}
                  data-testid={`button-cancel-${offer.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </>
            )}
            
            {offer.status === "pending" && (
              <>
                <Button 
                  size="sm"
                  onClick={() => handleManageOffer(offer.id)}
                  data-testid={`button-edit-${offer.id}`}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleCancelOffer(offer.id)}
                  data-testid={`button-delete-${offer.id}`}
                >
                  <X className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const totalEarnings = [...mockOffers.active, ...mockOffers.completed].reduce((sum, offer) => sum + offer.earnings, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Ofertas</h1>
          <p className="text-gray-600">Gerir suas rotas e acompanhar ganhos</p>
        </div>

        {/* Stats Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {totalEarnings.toLocaleString()} MZN
                </p>
                <p className="text-sm text-gray-600">Total de Ganhos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {mockOffers.active.length}
                </p>
                <p className="text-sm text-gray-600">Ofertas Ativas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {mockOffers.completed.length}
                </p>
                <p className="text-sm text-gray-600">Viagens Concluídas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {mockOffers.active.reduce((sum, offer) => sum + offer.requests, 0)}
                </p>
                <p className="text-sm text-gray-600">Solicitações Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" data-testid="tab-active">
              Ativas ({mockOffers.active.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Concluídas ({mockOffers.completed.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pendentes ({mockOffers.pending.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="space-y-4">
              {mockOffers.active.map(offer => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
              
              {mockOffers.active.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma oferta ativa
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Publique uma nova rota para começar a receber passageiros
                    </p>
                    <Button asChild>
                      <a href="/drivers/publish">Publicar Nova Rota</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {mockOffers.completed.map(offer => (
                <OfferCard key={offer.id} offer={offer} showActions={false} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {mockOffers.pending.map(offer => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}