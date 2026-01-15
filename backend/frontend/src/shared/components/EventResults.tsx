import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Calendar, MapPin, Users, Clock, Star } from "lucide-react";
import { formatMzn } from "@/shared/lib/currency";
import { format } from "date-fns";
import EventBookingModal from "./EventBookingModal";
import type { Event, EventPartnership } from "@shared/schema";

interface EventResultsProps {
  searchParams: {
    location: string;
    category: string;
    eventType: string;
    startDate: string;
    endDate: string;
  };
}

// Mock data for development - replace with real API calls
const mockEvents: (Event & { partnerships: EventPartnership[] })[] = [
  {
    id: "1",
    managerId: "mgr-1",
    title: "Festival de Música de Maputo 2024",
    description: "O maior festival de música do país com artistas nacionais e internacionais. Uma celebração da rica cultura musical moçambicana.",
    eventType: "festival",
    category: "cultura",
    venue: "Estádio Nacional do Zimpeto",
    address: "Zimpeto, Maputo",
    lat: "-25.9324",
    lng: "32.4532",
    startDate: new Date("2024-09-15T18:00:00"),
    endDate: new Date("2024-09-17T23:00:00"),
    startTime: "18:00",
    endTime: "23:00",
    images: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819"],
    ticketPrice: "1500.00",
    maxAttendees: 15000,
    currentAttendees: 8500,
    status: "upcoming",
    isPublic: true,
    isFeatured: true,
    hasPartnerships: true,
    websiteUrl: "https://festivalmaputo.mz",
    socialMediaLinks: ["@festivalmaputo"],
    tags: ["musica", "festival", "cultura"],
    createdAt: new Date(),
    updatedAt: new Date(),
    partnerships: [
      {
        id: "p1",
        eventId: "1",
        partnerType: "hotel",
        partnerId: "hotel-1",
        partnerName: "Hotel Polana Serena",
        discountPercentage: "20.00",
        specialOffer: "20% desconto + pequeno-almoço incluído",
        minEventTickets: 1,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date("2024-09-17"),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]
  },
  {
    id: "2", 
    managerId: "mgr-2",
    title: "Feira de Artesanato e Design",
    description: "Exposição e venda de artesanato tradicional moçambicano e design contemporâneo.",
    eventType: "feira",
    category: "cultura",
    venue: "Centro de Conferências Joaquim Chissano",
    address: "Maputo, Centro",
    lat: "-25.9692",
    lng: "32.5731",
    startDate: new Date("2024-08-25T09:00:00"),
    endDate: new Date("2024-08-27T18:00:00"),
    startTime: "09:00",
    endTime: "18:00",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96"],
    ticketPrice: "200.00",
    maxAttendees: 2000,
    currentAttendees: 450,
    status: "upcoming",
    isPublic: true,
    isFeatured: false,
    hasPartnerships: true,
    websiteUrl: null,
    socialMediaLinks: null,
    tags: ["artesanato", "design", "cultura"],
    createdAt: new Date(),
    updatedAt: new Date(),
    partnerships: []
  }
];

export default function EventResults({ searchParams }: EventResultsProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const { data: events = [], isLoading } = useQuery<(Event & { partnerships: EventPartnership[] })[]>({
    queryKey: ["/api/events/search", searchParams],
    initialData: mockEvents,
  });

  const filteredEvents = events.filter((event) => {
    const matchesLocation = !searchParams.location || 
      event.address.toLowerCase().includes(searchParams.location.toLowerCase());
    const matchesCategory = !searchParams.category || event.category === searchParams.category;
    const matchesType = !searchParams.eventType || event.eventType === searchParams.eventType;
    return matchesLocation && matchesCategory && matchesType;
  });

  const handleBookEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowBookingModal(true);
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      feira: "🏪",
      festival: "🎪",
      concerto: "🎵",
      conferencia: "🎤",
      workshop: "🔧",
      exposicao: "🖼️"
    };
    return icons[type] || "📅";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cultura: "bg-purple-100 text-purple-800",
      negocios: "bg-blue-100 text-blue-800",
      entretenimento: "bg-pink-100 text-pink-800",
      gastronomia: "bg-orange-100 text-orange-800",
      educacao: "bg-green-100 text-green-800",
      desporto: "bg-red-100 text-red-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredEvents.length} {filteredEvents.length === 1 ? "evento encontrado" : "eventos encontrados"}
          </h2>
          {searchParams.location && (
            <Badge variant="outline" className="text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {searchParams.location}
            </Badge>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros de pesquisa</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                data-testid={`event-card-${event.id}`}
              >
                <div className="relative">
                  <img
                    src={event.images?.[0] || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"}
                    alt={event.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Featured badge */}
                  {event.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                  )}

                  {/* Partnerships badge */}
                  {event.hasPartnerships && event.partnerships?.length > 0 && (
                    <Badge className="absolute top-2 right-2 bg-green-600 text-white">
                      <i className="fas fa-handshake mr-1"></i>
                      Parcerias
                    </Badge>
                  )}
                  
                  <div className="absolute bottom-2 left-2">
                    <span className="text-2xl">{getEventTypeIcon(event.eventType)}</span>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 line-clamp-2">{event.title}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(event.category)} variant="secondary">
                          {event.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {event.eventType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {format(new Date(event.startDate), "dd/MM/yyyy")} às {event.startTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="line-clamp-1">{event.venue}, {event.address}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{event.currentAttendees}/{event.maxAttendees}</span>
                      </div>
                      
                      {event.ticketPrice && (
                        <div className="text-right">
                          <span className="text-lg font-bold text-purple-600">
                            {formatMzn(parseFloat(event.ticketPrice))}
                          </span>
                          <p className="text-xs text-gray-500">por bilhete</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Partnership offers preview */}
                  {event.partnerships && event.partnerships.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <h4 className="text-sm font-medium text-green-800 mb-1">Ofertas Especiais:</h4>
                      <div className="space-y-1">
                        {event.partnerships.slice(0, 2).map((partnership) => (
                          <div key={partnership.id} className="text-xs text-green-700">
                            • {partnership.partnerName}: {partnership.discountPercentage}% desconto
                          </div>
                        ))}
                        {event.partnerships.length > 2 && (
                          <div className="text-xs text-green-600 font-medium">
                            +{event.partnerships.length - 2} mais parcerias
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <i className="fas fa-info-circle mr-1"></i>
                          Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{event.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <img 
                            src={event.images?.[0] || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30"} 
                            alt={event.title}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <p className="text-gray-700">{event.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Data:</strong> {format(new Date(event.startDate), "dd/MM/yyyy")}
                            </div>
                            <div>
                              <strong>Horário:</strong> {event.startTime} - {event.endTime}
                            </div>
                            <div>
                              <strong>Local:</strong> {event.venue}
                            </div>
                            <div>
                              <strong>Preço:</strong> {formatMzn(parseFloat(event.ticketPrice || "0"))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      onClick={() => handleBookEvent(event)}
                      size="sm" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      data-testid={`book-event-${event.id}`}
                    >
                      <i className="fas fa-ticket-alt mr-1"></i>
                      Reservar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventBookingModal
          event={selectedEvent}
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          partnerships={events.find(e => e.id === selectedEvent.id)?.partnerships || []}
        />
      )}
    </>
  );
}