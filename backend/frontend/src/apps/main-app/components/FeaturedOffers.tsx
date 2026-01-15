import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, MapPin, Calendar, Percent, Car, Building } from 'lucide-react';
import apiService from '@/services/api';

interface FeaturedOffer {
  id: string;
  type: 'ride' | 'accommodation';
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  location: string;
  rating: number;
  image?: string;
  validUntil: string;
  provider: string;
}

export default function FeaturedOffers() {
  // Em produção, isso viria da API
  const { data: offers, isLoading } = useQuery({
    queryKey: ['featured-offers'],
    queryFn: () => apiService.getFeaturedOffers(),
    // Fallback com dados mock por agora
    initialData: [
      {
        id: '1',
        type: 'ride' as const,
        title: 'Maputo → Beira',
        description: 'Viagem confortável com ar condicionado',
        originalPrice: 800,
        discountedPrice: 600,
        discountPercentage: 25,
        location: 'Maputo',
        rating: 4.8,
        validUntil: '2025-09-15',
        provider: 'João Silva'
      },
      {
        id: '2',
        type: 'accommodation' as const,
        title: 'Hotel Costa do Sol',
        description: 'Vista para o mar, café da manhã incluído',
        originalPrice: 2500,
        discountedPrice: 1800,
        discountPercentage: 28,
        location: 'Costa do Sol',
        rating: 4.6,
        validUntil: '2025-09-20',
        provider: 'Costa Resort'
      },
      {
        id: '3',
        type: 'ride' as const,
        title: 'Maputo → Inhambane',
        description: 'Viagem direta, veículo novo',
        originalPrice: 450,
        discountedPrice: 350,
        discountPercentage: 22,
        location: 'Maputo',
        rating: 4.9,
        validUntil: '2025-09-18',
        provider: 'Maria Santos'
      },
      {
        id: '4',
        type: 'accommodation' as const,
        title: 'Pousada Tofo Beach',
        description: 'Localização privilegiada, piscina',
        originalPrice: 1200,
        discountedPrice: 900,
        discountPercentage: 25,
        location: 'Tofo',
        rating: 4.4,
        validUntil: '2025-09-25',
        provider: 'Tofo Lodge'
      }
    ]
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Ofertas em Destaque</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Percent className="h-6 w-6 text-orange-500" />
            Ofertas em Destaque
          </h2>
          <p className="text-gray-600">As melhores promoções da semana</p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          Oferta limitada
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {offers?.map((offer: FeaturedOffer) => (
          <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            <div className="relative">
              {/* Imagem placeholder */}
              <div className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                {offer.type === 'ride' ? (
                  <Car className="h-8 w-8 text-white" />
                ) : (
                  <Building className="h-8 w-8 text-white" />
                )}
              </div>
              
              {/* Badge de desconto */}
              <Badge 
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
                data-testid={`discount-badge-${offer.id}`}
              >
                -{offer.discountPercentage}%
              </Badge>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Título e localização */}
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                    {offer.title}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    {offer.location}
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {offer.description}
                </p>

                {/* Rating e provedor */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{offer.rating}</span>
                  </div>
                  <span className="text-gray-600">{offer.provider}</span>
                </div>

                {/* Preços */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-green-600">
                      {offer.discountedPrice} MT
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {offer.originalPrice} MT
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Válido até {new Date(offer.validUntil).toLocaleDateString('pt-MZ')}
                  </div>
                </div>

                {/* Botão de ação */}
                <Button 
                  className="w-full" 
                  variant="outline"
                  data-testid={`button-view-offer-${offer.id}`}
                >
                  {offer.type === 'ride' ? 'Ver Viagem' : 'Ver Acomodação'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to action para mais ofertas */}
      <div className="text-center py-6">
        <Button 
          variant="outline" 
          size="lg"
          data-testid="button-view-all-offers"
        >
          Ver Todas as Ofertas
        </Button>
      </div>
    </div>
  );
}