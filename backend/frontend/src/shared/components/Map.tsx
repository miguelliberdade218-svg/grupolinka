import { useEffect, useRef } from "react";

interface MapProps {
  type: "ride" | "accommodation";
  from?: string;
  to?: string;
  location?: string;
  markers?: Array<{
    lat: number;
    lng: number;
    popup: string;
  }>;
}

export default function Map({ type, from, to, location, markers = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real implementation, this would initialize Leaflet map
    // For now, we'll show a placeholder with relevant information
    if (mapRef.current) {
      const mapContainer = mapRef.current;
      mapContainer.innerHTML = `
        <div class="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div class="bg-white rounded-lg p-4 shadow-lg text-center">
            <p class="text-gray-600 text-sm mb-2">Mapa interativo de ${type === "ride" ? "rota" : "localização"} - Moçambique</p>
            ${type === "ride" && from && to 
              ? `<p class="text-xs text-gray-500">${from} → ${to}</p>`
              : `<p class="text-xs text-gray-500">${location || "Área de pesquisa"}</p>`
            }
            ${markers.length > 0 
              ? `<p class="text-xs text-gray-500 mt-1">${markers.length} localizações mostradas</p>`
              : ""
            }
          </div>
        </div>
      `;
    }
  }, [type, from, to, location, markers]);

  const backgroundImage = type === "ride" 
    ? "https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=600"
    : "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=400";

  return (
    <div 
      ref={mapRef}
      className="bg-gray-200 rounded-xl h-96 lg:h-64 relative overflow-hidden"
      data-testid={`map-${type}`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    />
  );
}