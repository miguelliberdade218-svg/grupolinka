import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar, MapPin, Clock, MessageCircle, X, CheckCircle, AlertCircle } from "lucide-react";

export default function Bookings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"active" | "past">("active");

  // Mock data - em produção virá da API
  const mockBookings = {
    active: [
      {
        id: 1,
        type: "ride",
        from: "Maputo",
        to: "Beira",
        date: "2024-01-20",
        time: "08:00",
        price: 1500,
        status: "confirmed",
        provider: "João M.",
        canChat: true
      },
      {
        id: 2,
        type: "stay",
        name: "Hotel Marisol",
        location: "Beira",
        checkIn: "2024-01-21",
        checkOut: "2024-01-23",
        price: 3500,
        status: "pending",
        provider: "Hotel Marisol",
        canChat: true
      }
    ],
    past: [
      {
        id: 3,
        type: "ride",
        from: "Nampula",
        to: "Nacala",
        date: "2024-01-10",
        price: 800,
        status: "completed",
        provider: "Maria S.",
        canChat: false
      },
      {
        id: 4,
        type: "event",
        name: "Festival de Marrabenta",
        location: "Maputo",
        date: "2024-01-05",
        price: 500,
        status: "completed",
        provider: "Eventos MZ",
        canChat: false
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    if (window.confirm("Tem certeza que deseja cancelar esta reserva?")) {
      console.log("Cancelar reserva:", bookingId);
      // TODO: Implementar cancelamento
    }
  };

  const handleStartChat = (bookingId: number, provider: string) => {
    console.log("Iniciar chat com:", provider, "para reserva:", bookingId);
    // TODO: Implementar chat
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Precisa fazer login para ver suas reservas.</p>
            <Button asChild>
              <a href="/login">Fazer Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBookings = mockBookings[activeTab];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minhas Reservas</h1>
          <p className="text-gray-600">Gerir suas reservas de boleias, alojamentos e eventos</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            onClick={() => setActiveTab("active")}
            data-testid="button-active-bookings"
          >
            Ativas ({mockBookings.active.length})
          </Button>
          <Button
            variant={activeTab === "past" ? "default" : "outline"}
            onClick={() => setActiveTab("past")}
            data-testid="button-past-bookings"
          >
            Anteriores ({mockBookings.past.length})
          </Button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {currentBookings.length > 0 ? (
            currentBookings.map((booking: any) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {booking.type === "ride" && <MapPin className="w-5 h-5" />}
                        {booking.type === "stay" && <Calendar className="w-5 h-5" />}
                        {booking.type === "event" && <Calendar className="w-5 h-5" />}
                        
                        {booking.type === "ride" && `${booking.from} → ${booking.to}`}
                        {booking.type === "stay" && booking.name}
                        {booking.type === "event" && booking.name}
                      </CardTitle>
                      <p className="text-gray-600">Prestador: {booking.provider}</p>
                    </div>
                    
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusIcon(booking.status)}
                      <span className="ml-1">
                        {booking.status === "confirmed" && "Confirmado"}
                        {booking.status === "pending" && "Pendente"}
                        {booking.status === "completed" && "Concluído"}
                        {booking.status === "cancelled" && "Cancelado"}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {booking.type === "ride" && `Data: ${booking.date} às ${booking.time}`}
                        {booking.type === "stay" && `Check-in: ${booking.checkIn}`}
                        {booking.type === "event" && `Data: ${booking.date}`}
                      </p>
                      {booking.type === "stay" && (
                        <p className="text-sm text-gray-600">Check-out: {booking.checkOut}</p>
                      )}
                      {booking.location && (
                        <p className="text-sm text-gray-600">Local: {booking.location}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {booking.price} MZN
                      </p>
                      {booking.type === "stay" && (
                        <p className="text-sm text-gray-600">por noite</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {booking.canChat && booking.status !== "completed" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartChat(booking.id, booking.provider)}
                        data-testid={`button-chat-${booking.id}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                    )}
                    
                    {booking.status === "confirmed" || booking.status === "pending" ? (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        data-testid={`button-cancel-${booking.id}`}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma reserva {activeTab === "active" ? "ativa" : "anterior"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === "active" 
                    ? "Você não tem reservas ativas no momento."
                    : "Você ainda não fez nenhuma reserva."
                  }
                </p>
                <Button asChild>
                  <a href="/">Buscar Ofertas</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}