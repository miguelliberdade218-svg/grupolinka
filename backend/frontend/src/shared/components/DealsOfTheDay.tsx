import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

interface Deal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  type: "combo" | "ride" | "stay";
  validUntil: string;
  image: string;
  features: string[];
  partnersInvolved: string[];
}

export default function DealsOfTheDay() {
  // Mock deals data - in real app this would come from API
  const deals: Deal[] = [
    {
      id: "deal-1",
      title: "Pacote Aeroporto + Hotel Centro",
      description: "Transfer do aeroporto + 2 noites no Hotel Grand Plaza com desconto especial",
      originalPrice: 15500,
      discountedPrice: 11000,
      discount: 30,
      type: "combo",
      validUntil: "2024-08-25",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      features: ["Transfer VIP", "Check-in prioritário", "Café da manhã incluído"],
      partnersInvolved: ["Motorista João Silva", "Hotel Grand Plaza"]
    },
    {
      id: "deal-2", 
      title: "Viagem UberX com 50% OFF",
      description: "Primeira viagem com desconto especial para novos usuários",
      originalPrice: 800,
      discountedPrice: 400,
      discount: 50,
      type: "ride",
      validUntil: "2024-08-22",
      image: "https://images.unsplash.com/photo-1524661135-423995f22d0b",
      features: ["Válido até 20km", "Motorista 5 estrelas", "Carro climatizado"],
      partnersInvolved: ["Motorista Maria Santos"]
    },
    {
      id: "deal-3",
      title: "Fim de Semana em Apartamento",
      description: "2 noites em apartamento moderno no centro com desconto especial",
      originalPrice: 9500,
      discountedPrice: 7600,
      discount: 20,
      type: "stay", 
      validUntil: "2024-08-24",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
      features: ["WiFi grátis", "Cozinha completa", "Vista para cidade"],
      partnersInvolved: ["Anfitrião Carlos Mendes"]
    }
  ];

  const formatPrice = (price: number) => {
    return `${(price / 100).toLocaleString('pt-MZ')} MT`;
  };

  const calculateSavings = (original: number, discounted: number) => {
    return formatPrice(original - discounted);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Ofertas do Dia</h2>
        <Badge variant="secondary" className="bg-primary text-primary-foreground">
          <i className="fas fa-clock mr-1"></i>
          Tempo limitado
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={deal.image}
                alt={deal.title}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-destructive text-white">
                  -{deal.discount}%
                </Badge>
              </div>
              {deal.type === "combo" && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <i className="fas fa-star mr-1"></i>
                    COMBO
                  </Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-dark mb-2">{deal.title}</h3>
              <p className="text-sm text-gray-medium mb-3">{deal.description}</p>
              
              <div className="space-y-2 mb-4">
                {deal.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <i className="fas fa-check-circle text-success mr-2"></i>
                    {feature}
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm text-gray-medium line-through">
                      {formatPrice(deal.originalPrice)}
                    </span>
                    <span className="text-lg font-bold text-dark ml-2">
                      {formatPrice(deal.discountedPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-success">
                      Poupa {calculateSavings(deal.originalPrice, deal.discountedPrice)}
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-medium mb-3">
                  <i className="fas fa-users mr-1"></i>
                  Parceiros: {deal.partnersInvolved.join(", ")}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-medium">
                    <i className="fas fa-clock mr-1"></i>
                    Válido até {new Date(deal.validUntil).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <Button 
                  data-testid={`book-deal-${deal.id}`}
                  className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <i className="fas fa-shopping-cart mr-2"></i>
                  Reservar Oferta
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Button 
          variant="outline" 
          data-testid="view-all-deals"
          className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
        >
          Ver Todas as Ofertas
          <i className="fas fa-arrow-right ml-2"></i>
        </Button>
      </div>
    </div>
  );
}