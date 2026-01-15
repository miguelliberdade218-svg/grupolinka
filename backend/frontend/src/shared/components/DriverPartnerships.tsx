import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import DriverPartnershipCard from "./DriverPartnershipCard";
import { formatMzn } from "@/shared/lib/currency";

// Mock data for demonstration
const mockDriverStats = {
  id: "1",
  driverId: "driver-1",
  totalRides: 45,
  totalDistance: "1250.50",
  totalEarnings: "15000.00",
  averageRating: "4.6",
  completedRidesThisMonth: 8,
  completedRidesThisYear: 45,
  partnershipLevel: "gold",
  lastRideDate: new Date("2024-08-21T18:00:00"),
  joinedAt: new Date("2024-01-15T10:00:00"),
  updatedAt: new Date("2024-08-21T18:00:00"),
};

const mockPartnerships = [
  {
    id: "partnership-1",
    driverId: "driver-1",
    accommodationId: "acc-1",
    partnershipType: "gold",
    discountPercentage: "20.00",
    minimumRides: 50,
    isActive: true,
    validFrom: new Date("2024-01-01T00:00:00"),
    validUntil: new Date("2024-12-31T23:59:59"),
    createdAt: new Date("2024-01-01T00:00:00"),
    updatedAt: new Date("2024-08-01T00:00:00"),
  },
  {
    id: "partnership-2",
    driverId: "driver-1",
    accommodationId: "acc-2", 
    partnershipType: "gold",
    discountPercentage: "20.00",
    minimumRides: 50,
    isActive: true,
    validFrom: new Date("2024-01-01T00:00:00"),
    validUntil: new Date("2024-12-31T23:59:59"),
    createdAt: new Date("2024-01-01T00:00:00"),
    updatedAt: new Date("2024-08-01T00:00:00"),
  },
];

const mockAccommodations = [
  {
    id: "acc-1",
    name: "Hotel Polana Serena",
    type: "Hotel de Luxo",
    address: "Maputo • Centro da cidade",
    lat: "-25.9655",
    lng: "32.5792",
    pricePerNight: "3500.00",
    rating: "4.8",
    reviewCount: 245,
    images: ["/api/placeholder/300/200"],
    amenities: ["WiFi", "Piscina", "Spa", "Restaurante"],
    description: "Hotel de luxo no coração de Maputo",
    distanceFromCenter: "0.5",
    isAvailable: true,
  },
  {
    id: "acc-2",
    name: "VIP Grand Hotel",
    type: "Hotel",
    address: "Matola • Próximo ao aeroporto",
    lat: "-25.9628",
    lng: "32.4589",
    pricePerNight: "2200.00",
    rating: "4.5",
    reviewCount: 128,
    images: ["/api/placeholder/300/200"],
    amenities: ["WiFi", "Piscina", "Ginásio", "Transfer"],
    description: "Hotel moderno com serviços executivos",
    distanceFromCenter: "2.1",
    isAvailable: true,
  },
];

const mockBenefits = [
  {
    id: "1",
    level: "gold",
    benefitType: "accommodation_discount",
    benefitValue: "20.00",
    description: "Desconto de 20% em hotéis parceiros + check-in prioritário",
    minimumRidesRequired: 50,
    minimumRatingRequired: "4.5",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    level: "gold",
    benefitType: "free_meal",
    benefitValue: "100.00",
    description: "Refeições gratuitas + acesso ao spa (até 100 MZN)",
    minimumRidesRequired: 50,
    minimumRatingRequired: "4.5",
    isActive: true,
    createdAt: new Date(),
  },
];

export default function DriverPartnerships() {
  const [activeTab, setActiveTab] = useState("partnerships");

  const handleUseDiscount = (partnershipId: string) => {
    console.log("Using discount for partnership:", partnershipId);
    // TODO: Implement booking with discount
  };

  const getPartnershipLevelInfo = (level: string) => {
    switch (level) {
      case "bronze":
        return { color: "bg-amber-100 text-amber-800", icon: "🥉", next: "silver", required: 25 };
      case "silver":
        return { color: "bg-gray-100 text-gray-800", icon: "🥈", next: "gold", required: 50 };
      case "gold":
        return { color: "bg-yellow-100 text-yellow-800", icon: "🥇", next: "platinum", required: 100 };
      case "platinum":
        return { color: "bg-purple-100 text-purple-800", icon: "💎", next: null, required: 0 };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: "⭐", next: "bronze", required: 5 };
    }
  };

  const levelInfo = getPartnershipLevelInfo(mockDriverStats.partnershipLevel);
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Parcerias de Motorista</h1>
        <p className="text-gray-600">Descontos especiais em hotéis para motoristas ativos</p>
      </div>

      {/* Driver Status Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{levelInfo.icon}</span>
              <div>
                <h3 className="text-xl">Nível de Parceria</h3>
                <Badge className={levelInfo.color + " font-medium"}>
                  {mockDriverStats.partnershipLevel.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{mockDriverStats.totalRides}</p>
              <p className="text-sm text-gray-600">viagens realizadas</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">⭐ {mockDriverStats.averageRating}</p>
              <p className="text-sm text-gray-600">Avaliação Média</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatMzn(parseFloat(mockDriverStats.totalEarnings))}</p>
              <p className="text-sm text-gray-600">Ganhos Totais</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{mockDriverStats.totalDistance}km</p>
              <p className="text-sm text-gray-600">Distância Percorrida</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{mockDriverStats.completedRidesThisMonth}</p>
              <p className="text-sm text-gray-600">Este Mês</p>
            </div>
          </div>
          
          {levelInfo.next && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  Próximo Nível: {levelInfo.next.toUpperCase()}
                </span>
                <span className="text-sm text-blue-600">
                  {levelInfo.required - mockDriverStats.totalRides} viagens restantes
                </span>
              </div>
              <div className="mt-2 bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                  style={{ 
                    width: `${Math.min((mockDriverStats.totalRides / levelInfo.required) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="partnerships" data-testid="tab-partnerships">
            Minhas Parcerias ({mockPartnerships.length})
          </TabsTrigger>
          <TabsTrigger value="benefits" data-testid="tab-benefits">
            Benefícios Disponíveis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="partnerships" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockPartnerships.map((partnership) => {
              const accommodation = mockAccommodations.find(acc => acc.id === partnership.accommodationId);
              if (!accommodation) return null;
              
              return (
                <DriverPartnershipCard
                  key={partnership.id}
                  partnership={partnership}
                  accommodation={accommodation}
                  benefits={mockBenefits}
                  onUseDiscount={handleUseDiscount}
                />
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="benefits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["bronze", "silver", "gold", "platinum"].map((level) => {
              const info = getPartnershipLevelInfo(level);
              const levelBenefits = mockBenefits.filter(b => b.level === level);
              const isCurrent = level === mockDriverStats.partnershipLevel;
              
              return (
                <Card key={level} className={`border-2 ${isCurrent ? 'border-primary shadow-lg' : 'border-gray-200'}`}>
                  <CardHeader className="text-center pb-2">
                    <div className="text-3xl mb-2">{info.icon}</div>
                    <CardTitle className="text-lg">
                      <Badge className={info.color + " font-medium text-sm"}>
                        {level.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs">Nível Atual</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {levelBenefits.map((benefit, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-800">{benefit.description}</div>
                        {benefit.benefitValue && benefit.benefitValue !== "0.00" && (
                          <div className="text-primary font-bold">
                            {benefit.benefitType === 'accommodation_discount' 
                              ? `${benefit.benefitValue}%` 
                              : formatMzn(parseFloat(benefit.benefitValue))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
                      <p>Mínimo: {info.required} viagens</p>
                      <p>Avaliação: 4.0⭐+</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}