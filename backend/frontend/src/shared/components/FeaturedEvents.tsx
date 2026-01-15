import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar, MapPin, Users, Ticket, Star, Clock } from "lucide-react";

const mockEvents = [
  {
    id: "event-1",
    title: "Festival de Música Tradicional",
    description: "Venha celebrar a música tradicional moçambicana com artistas locais",
    category: "culture",
    location: "Maputo Centro Cultural",
    date: "2025-09-15",
    time: "19:00",
    price: 0, // Evento gratuito
    isPaid: false,
    ticketsAvailable: 500,
    attendees: 234,
    rating: 4.8,
    image: "/api/placeholder/300/200",
    organizer: "Ministério da Cultura",
    hasPartnership: true,
    partnershipDiscount: 15,
    tags: ["música", "cultura", "grátis"]
  },
  {
    id: "event-2", 
    title: "Feira de Negócios EXPO2025",
    description: "A maior feira de negócios do país com oportunidades de networking",
    category: "business",
    location: "Centro de Conferências Joaquim Chissano",
    date: "2025-09-20",
    time: "09:00",
    price: 2500,
    isPaid: true,
    ticketsAvailable: 200,
    attendees: 142,
    rating: 4.6,
    image: "/api/placeholder/300/200", 
    organizer: "CTA - Confederação das Associações Económicas",
    hasPartnership: true,
    partnershipDiscount: 20,
    tags: ["negócios", "networking", "professional"]
  },
  {
    id: "event-3",
    title: "Festival Gastronómico de Inhambane",
    description: "Descubra os sabores únicos da culinária de Inhambane",
    category: "gastronomy",
    location: "Praia do Tofo, Inhambane",
    date: "2025-10-05",
    time: "17:00",
    price: 1500,
    isPaid: true,
    ticketsAvailable: 300,
    attendees: 89,
    rating: 4.9,
    image: "/api/placeholder/300/200",
    organizer: "Associação de Restaurantes de Inhambane",
    hasPartnership: true,
    partnershipDiscount: 10,
    tags: ["gastronomia", "festival", "praia"]
  }
];

export default function FeaturedEvents() {
  const formatPrice = (price: number) => {
    if (price === 0) return "Gratuito";
    return `${price.toLocaleString('pt-MZ')} MZN`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "culture": return "bg-purple-100 text-purple-800";
      case "business": return "bg-blue-100 text-blue-800";
      case "entertainment": return "bg-green-100 text-green-800";
      case "gastronomy": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "culture": return "Cultura";
      case "business": return "Negócios";
      case "entertainment": return "Entretenimento";
      case "gastronomy": return "Gastronomia";
      default: return "Geral";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Eventos e Feiras em Destaque</h2>
          <p className="text-gray-600">Descubra os melhores eventos perto de si</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/events"}>
          Ver Todos os Eventos
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2">
                <Badge className={getCategoryColor(event.category)}>
                  {getCategoryName(event.category)}
                </Badge>
              </div>
              {!event.isPaid && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-500 text-white">
                    Grátis
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(event.date).toLocaleDateString('pt-MZ')}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{event.time}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{event.attendees} interessados</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">{event.rating}</span>
                </div>
              </div>
              
              {event.hasPartnership && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2 text-blue-700">
                    <i className="fas fa-handshake"></i>
                    <span className="font-medium">Parceria Link-A</span>
                  </div>
                  <p className="text-blue-600 text-xs mt-1">
                    {event.partnershipDiscount}% desconto em alojamentos e transporte
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="font-bold text-lg text-primary">
                    {formatPrice(event.price)}
                  </div>
                  {event.isPaid && (
                    <div className="text-xs text-gray-500">
                      <Ticket className="w-3 h-3 inline mr-1" />
                      {event.ticketsAvailable} bilhetes disponíveis
                    </div>
                  )}
                </div>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = `/events/${event.id}`}
                  data-testid={`button-view-event-${event.id}`}
                >
                  {event.isPaid ? "Comprar Bilhete" : "Participar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button 
          variant="ghost" 
          size="lg"
          onClick={() => window.location.href = "/events"}
          className="text-primary hover:text-primary-dark"
        >
          Explorar Mais Eventos →
        </Button>
      </div>
    </div>
  );
}