import { useState, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Navigation, Search } from "lucide-react";

interface MapLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type: "ride" | "hotel" | "event";
  price?: string;
}

interface GoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  locations?: MapLocation[];
  onLocationSelect?: (location: MapLocation) => void;
  showCurrentLocation?: boolean;
  className?: string;
}

const MOZAMBIQUE_CENTER = { lat: -18.665695, lng: 35.529562 }; // Centro de Moçambique
const MAPUTO_CENTER = { lat: -25.966375, lng: 32.580611 }; // Maputo

export default function GoogleMap({
  apiKey,
  center = MAPUTO_CENTER,
  zoom = 10,
  height = "400px",
  locations = [],
  onLocationSelect,
  showCurrentLocation = true,
  className = ""
}: GoogleMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(center);

  const handleMarkerClick = useCallback((location: MapLocation) => {
    setSelectedLocation(location);
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(pos);
          setMapCenter(pos);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  }, []);

  const getMarkerColor = (type: string) => {
    switch (type) {
      case "ride": return "#3B82F6"; // Blue
      case "hotel": return "#10B981"; // Green  
      case "event": return "#8B5CF6"; // Purple
      default: return "#6B7280"; // Gray
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "ride": return "🚗";
      case "hotel": return "🏨";
      case "event": return "🎉";
      default: return "📍";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <APIProvider apiKey={apiKey}>
        <div className="relative">
          {/* Controles do mapa */}
          <div className="absolute top-4 right-4 z-10 space-y-2">
            {showCurrentLocation && (
              <Button
                onClick={getCurrentLocation}
                size="sm"
                className="bg-white text-gray-700 hover:bg-gray-50 shadow-md"
                data-testid="button-current-location"
              >
                <Navigation className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Mapa */}
          <Map
            center={mapCenter}
            zoom={zoom}
            style={{ width: "100%", height }}
            mapId="mozambique-travel-map"
            data-testid="google-map"
          >
            {/* Marcador da posição atual */}
            {currentPosition && (
              <AdvancedMarker position={currentPosition}>
                <div className="bg-blue-500 rounded-full p-2 border-2 border-white shadow-lg">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
              </AdvancedMarker>
            )}

            {/* Marcadores das localizações */}
            {locations.map((location) => (
              <AdvancedMarker
                key={location.id}
                position={{ lat: location.lat, lng: location.lng }}
                onClick={() => handleMarkerClick(location)}
                data-testid={`marker-${location.type}-${location.id}`}
              >
                <div 
                  className="cursor-pointer transform hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: getMarkerColor(location.type),
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                  }}
                >
                  <span className="text-white text-lg">
                    {getMarkerIcon(location.type)}
                  </span>
                </div>
              </AdvancedMarker>
            ))}

            {/* Info Window */}
            {selectedLocation && (
              <InfoWindow
                position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <Card className="min-w-[200px] border-0 shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">
                        {getMarkerIcon(selectedLocation.type)}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">
                          {selectedLocation.title}
                        </h3>
                        {selectedLocation.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {selectedLocation.description}
                          </p>
                        )}
                        {selectedLocation.price && (
                          <p className="text-sm font-bold text-green-600 mt-2">
                            {selectedLocation.price}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {selectedLocation.type === "ride" ? "Ponto de encontro" :
                             selectedLocation.type === "hotel" ? "Localização do hotel" :
                             "Local do evento"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </InfoWindow>
            )}
          </Map>

          {/* Legenda */}
          <div className="absolute bottom-4 left-4 z-10">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-3">
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Boleias</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Hotéis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Eventos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </APIProvider>
    </div>
  );
}

// Componente específico para Moçambique com localizações pré-definidas
export function MozambiqueMap({ apiKey, ...props }: Omit<GoogleMapProps, 'center'>) {
  const mozambiqueLocations: MapLocation[] = [
    {
      id: "maputo-hotel-1",
      lat: -25.966375,
      lng: 32.580611,
      title: "Hotel Polana Serena",
      description: "Hotel de luxo no centro de Maputo",
      type: "hotel",
      price: "4,500 MZN/noite"
    },
    {
      id: "beira-ride-1", 
      lat: -19.843277,
      lng: 34.838892,
      title: "Boleia Maputo → Beira",
      description: "Viagem confortável com motorista experiente",
      type: "ride",
      price: "1,800 MZN"
    },
    {
      id: "nampula-event-1",
      lat: -15.116667,
      lng: 39.266667,
      title: "Festival Cultural Nampula",
      description: "Celebração da cultura makua",
      type: "event",
      price: "350 MZN"
    }
  ];

  return (
    <GoogleMap
      {...props}
      apiKey={apiKey}
      center={MOZAMBIQUE_CENTER}
      zoom={6}
      locations={mozambiqueLocations}
    />
  );
}