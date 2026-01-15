import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  Filter,
  MapPin,
  Car,
  Hotel,
  Calendar,
  Settings
} from "lucide-react";
import GoogleMap from "@/shared/components/GoogleMap";

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type: "ride" | "hotel" | "event";
  price?: string;
}

export default function MapPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);

  // Mock de dados de localizações em Moçambique
  const allLocations: MapLocation[] = [
    // Maputo
    {
      id: "maputo-hotel-1",
      lat: -25.966375,
      lng: 32.580611,
      title: "Hotel Polana Serena",
      description: "Hotel de luxo no coração de Maputo",
      type: "hotel",
      price: "4,500 MZN/noite"
    },
    {
      id: "maputo-ride-1",
      lat: -25.958574,
      lng: 32.588711,
      title: "Boleia para Xai-Xai",
      description: "Partida às 07:00, motorista João",
      type: "ride",
      price: "350 MZN"
    },
    // Beira
    {
      id: "beira-hotel-1",
      lat: -19.843277,
      lng: 34.838892,
      title: "Hotel Beira Mar",
      description: "Vista para o oceano Índico",
      type: "hotel",
      price: "2,800 MZN/noite"
    },
    {
      id: "beira-ride-1",
      lat: -19.840000,
      lng: 34.835000,
      title: "Boleia Beira → Chimoio",
      description: "Viagem confortável, ar condicionado",
      type: "ride",
      price: "800 MZN"
    },
    // Nampula
    {
      id: "nampula-event-1",
      lat: -15.116667,
      lng: 39.266667,
      title: "Festival Cultural Makua",
      description: "Celebração da cultura tradicional",
      type: "event",
      price: "250 MZN"
    },
    {
      id: "nampula-hotel-1",
      lat: -15.120000,
      lng: 39.270000,
      title: "Residencial Nampula",
      description: "Alojamento económico no centro",
      type: "hotel",
      price: "1,200 MZN/noite"
    },
    // Inhambane
    {
      id: "inhambane-event-1",
      lat: -23.865000,
      lng: 35.383333,
      title: "Festival de Dhow",
      description: "Regata tradicional de dhows",
      type: "event",
      price: "150 MZN"
    },
    {
      id: "tofo-hotel-1",
      lat: -23.850000,
      lng: 35.550000,
      title: "Tofo Beach Resort",
      description: "Resort na praia de Tofo",
      type: "hotel",
      price: "3,200 MZN/noite"
    }
  ];

  const filteredLocations = allLocations.filter(location => {
    const matchesType = selectedType === "all" || location.type === selectedType;
    const matchesSearch = searchQuery === "" || 
      location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const handleLocationSelect = (location: MapLocation) => {
    setSelectedLocation(location);
  };

  // Nota: Substituir pela sua chave real do Google Maps
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Mapa Interativo</h1>
            <Badge variant="outline">Explorar Moçambique</Badge>
          </div>
          <div className="flex items-center gap-2">
            {!user && (
              <Link href="/signup">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Registar para Reservar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel de Filtros */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar localizações..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-map"
                  />
                </div>

                {/* Tipos */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tipo</h4>
                  <div className="space-y-2">
                    {[
                      { id: "all", label: "Todos", icon: MapPin },
                      { id: "ride", label: "Boleias", icon: Car },
                      { id: "hotel", label: "Hotéis", icon: Hotel },
                      { id: "event", label: "Eventos", icon: Calendar }
                    ].map(({ id, label, icon: Icon }) => (
                      <Button
                        key={id}
                        variant={selectedType === id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedType(id)}
                        data-testid={`button-filter-${id}`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Resultados</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{filteredLocations.length} localizações encontradas</p>
                    <p>{filteredLocations.filter(l => l.type === "ride").length} boleias</p>
                    <p>{filteredLocations.filter(l => l.type === "hotel").length} hotéis</p>
                    <p>{filteredLocations.filter(l => l.type === "event").length} eventos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localização Selecionada */}
            {selectedLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selecionado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      {selectedLocation.type === "ride" && <Car className="w-5 h-5 text-blue-600 mt-0.5" />}
                      {selectedLocation.type === "hotel" && <Hotel className="w-5 h-5 text-green-600 mt-0.5" />}
                      {selectedLocation.type === "event" && <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />}
                      <div>
                        <h3 className="font-semibold">{selectedLocation.title}</h3>
                        {selectedLocation.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedLocation.description}
                          </p>
                        )}
                        {selectedLocation.price && (
                          <p className="text-lg font-bold text-green-600 mt-2">
                            {selectedLocation.price}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {user ? (
                      <Button className="w-full" size="sm">
                        {selectedLocation.type === "ride" ? "Reservar Boleia" :
                         selectedLocation.type === "hotel" ? "Reservar Quarto" :
                         "Comprar Ingresso"}
                      </Button>
                    ) : (
                      <Link href="/signup" className="block w-full">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm">
                          Registar para Reservar
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Mapa */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE" ? (
                  <div className="h-96 bg-gray-100 flex items-center justify-center">
                    <div className="text-center p-8">
                      <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Mapa Google não configurado
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Para visualizar o mapa interativo, é necessário configurar a chave da API do Google Maps.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                        <h4 className="font-medium text-yellow-800 mb-2">Como configurar:</h4>
                        <ol className="text-sm text-yellow-700 space-y-1">
                          <li>1. Obter chave API do Google Maps</li>
                          <li>2. Adicionar VITE_GOOGLE_MAPS_API_KEY ao .env</li>
                          <li>3. Reiniciar a aplicação</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                ) : (
                  <GoogleMap
                    apiKey={GOOGLE_MAPS_API_KEY}
                    locations={filteredLocations}
                    onLocationSelect={handleLocationSelect}
                    height="600px"
                    showCurrentLocation={true}
                    data-testid="interactive-map"
                  />
                )}
              </CardContent>
            </Card>

            {/* Lista de Localizações */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Lista de Localizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredLocations.map((location) => (
                    <div
                      key={location.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedLocation?.id === location.id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => handleLocationSelect(location)}
                      data-testid={`location-item-${location.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {location.type === "ride" && <Car className="w-5 h-5 text-blue-600" />}
                          {location.type === "hotel" && <Hotel className="w-5 h-5 text-green-600" />}
                          {location.type === "event" && <Calendar className="w-5 h-5 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{location.title}</h3>
                          {location.description && (
                            <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                          )}
                          {location.price && (
                            <p className="text-lg font-bold text-green-600 mt-2">{location.price}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {location.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}