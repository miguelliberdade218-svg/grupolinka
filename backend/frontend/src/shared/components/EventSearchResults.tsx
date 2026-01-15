import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { Calendar, MapPin, Users, Clock, Star, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface EventSearchResultsProps {
  city: string;
  month: string;
  year: string;
  category?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  address: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isPaid: boolean;
  ticketPrice: number;
  maxTickets: number;
  ticketsSold: number;
  enablePartnerships: boolean;
  accommodationDiscount: number;
  transportDiscount: number;
  organizerName: string;
  images: string[];
  isFeatured: boolean;
  status: string;
}

export default function EventSearchResults({ city, month, year, category }: EventSearchResultsProps) {
  const monthNames = [
    "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Mock data for development - replace with actual API call
  const mockEvents: Event[] = [
    {
      id: "1",
      title: "Festival de Música Tradicional de Maputo",
      description: "Celebração da rica herança musical moçambicana com artistas locais",
      category: "cultura",
      venue: "Centro Cultural Franco-Moçambicano",
      address: "Avenida Eduardo Mondlane, Maputo",
      startDate: "2025-08-15",
      endDate: "2025-08-17",
      startTime: "18:00",
      endTime: "23:00",
      isPaid: true,
      ticketPrice: 500,
      maxTickets: 500,
      ticketsSold: 156,
      enablePartnerships: true,
      accommodationDiscount: 15,
      transportDiscount: 10,
      organizerName: "Associação Cultural Maputo",
      images: ["/api/placeholder/400/250"],
      isFeatured: true,
      status: "approved"
    },
    {
      id: "2", 
      title: "Feira de Artesanato e Gastronomia",
      description: "Produtos artesanais locais e pratos tradicionais moçambicanos",
      category: "gastronomia",
      venue: "Mercado Central",
      address: "Praça 25 de Junho, Maputo",
      startDate: "2025-08-22",
      endDate: "2025-08-24",
      startTime: "09:00", 
      endTime: "18:00",
      isPaid: false,
      ticketPrice: 0,
      maxTickets: 1000,
      ticketsSold: 0,
      enablePartnerships: true,
      accommodationDiscount: 10,
      transportDiscount: 15,
      organizerName: "Câmara Municipal de Maputo",
      images: ["/api/placeholder/400/250"],
      isFeatured: false,
      status: "approved"
    },
    {
      id: "3",
      title: "Conferência de Tecnologia e Inovação",
      description: "Explorando o futuro da tecnologia em Moçambique",
      category: "negocios", 
      venue: "Hotel Polana Serena",
      address: "Avenida Julius Nyerere, Maputo",
      startDate: "2025-08-28",
      endDate: "2025-08-29",
      startTime: "08:00",
      endTime: "17:00",
      isPaid: true,
      ticketPrice: 1200,
      maxTickets: 200,
      ticketsSold: 87,
      enablePartnerships: true,
      accommodationDiscount: 20,
      transportDiscount: 15,
      organizerName: "TechHub Maputo",
      images: ["/api/placeholder/400/250"],
      isFeatured: true,
      status: "approved"
    }
  ];

  const filteredEvents = mockEvents.filter(event => {
    const eventMonth = new Date(event.startDate).getMonth() + 1;
    const eventYear = new Date(event.startDate).getFullYear();
    
    const matchesMonth = eventMonth.toString().padStart(2, '0') === month;
    const matchesYear = eventYear.toString() === year;
    const matchesCategory = !category || category === "" || event.category === category;
    
    return matchesMonth && matchesYear && matchesCategory;
  });

  const getCategoryLabel = (cat: string) => {
    const categories: { [key: string]: string } = {
      cultura: "Cultura",
      negocios: "Negócios", 
      entretenimento: "Entretenimento",
      gastronomia: "Gastronomia",
      educacao: "Educação"
    };
    return categories[cat] || cat;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-MZ', { 
      style: 'currency', 
      currency: 'MZN' 
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Eventos em {city}
            </h2>
            <p className="text-gray-600 mt-1">
              {monthNames[parseInt(month)]} {year} • {filteredEvents.length} eventos encontrados
              {category && ` • Categoria: ${getCategoryLabel(category)}`}
            </p>
          </div>
          
          {filteredEvents.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {filteredEvents.filter(e => e.enablePartnerships).length} eventos com parcerias
              </p>
              <p className="text-xs text-purple-600 font-medium">
                Descontos até 30% em alojamentos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum evento encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Não encontrámos eventos em {city} para {monthNames[parseInt(month)]} {year}
              {category && ` na categoria ${getCategoryLabel(category)}`}.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/"}
              data-testid="button-back-home"
            >
              Voltar à Página Inicial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="md:flex">
                {/* Event Image */}
                <div className="md:w-1/3">
                  <img
                    src={event.images[0]}
                    alt={event.title}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                
                {/* Event Details */}
                <div className="md:w-2/3 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="secondary">
                          {getCategoryLabel(event.category)}
                        </Badge>
                        {event.isFeatured && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        {event.enablePartnerships && (
                          <Badge className="bg-green-100 text-green-800">
                            Parcerias Disponíveis
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                    </div>
                    
                    <div className="text-right">
                      {event.isPaid ? (
                        <div>
                          <p className="text-2xl font-bold text-purple-600">
                            {formatPrice(event.ticketPrice)}
                          </p>
                          <p className="text-xs text-gray-500">por bilhete</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            GRÁTIS
                          </p>
                          <p className="text-xs text-gray-500">entrada livre</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                        {formatDate(event.startDate)} - {formatDate(event.endDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-purple-500" />
                        {event.startTime} - {event.endTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-purple-500" />
                        {event.venue}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {event.isPaid && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Ticket className="w-4 h-4 mr-2 text-purple-500" />
                          {event.ticketsSold}/{event.maxTickets} bilhetes vendidos
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-purple-500" />
                        Organizador: {event.organizerName}
                      </div>
                      
                      {event.enablePartnerships && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-green-700 mb-1">
                            Descontos com Parcerias:
                          </p>
                          <div className="flex space-x-2">
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                              {event.accommodationDiscount}% Alojamentos
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                              {event.transportDiscount}% Transporte
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    
                    {event.isPaid && event.ticketsSold < event.maxTickets ? (
                      <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                        Comprar Bilhete
                      </Button>
                    ) : !event.isPaid ? (
                      <Button className="bg-green-600 hover:bg-green-700" size="sm">
                        Registar Presença
                      </Button>
                    ) : (
                      <Button disabled size="sm">
                        Esgotado
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}