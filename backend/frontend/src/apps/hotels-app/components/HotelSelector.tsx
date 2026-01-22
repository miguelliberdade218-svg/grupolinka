// src/apps/hotels-app/components/HotelSelector.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Building2, Loader2, Plus, AlertCircle } from "lucide-react";
import { hotelService } from "@/services/hotelService";
import { toast } from "sonner";
import { Hotel } from "@/shared/types/hotels";
import { Button } from "@/shared/components/ui/button";
import { useLocation } from "wouter";  // ← Correção: usa wouter em vez de react-router-dom

// Função para converter Hotel do serviço para Hotel do tipo compartilhado
function convertServiceHotelToSharedHotel(serviceHotel: any): Hotel {
  return {
    id: serviceHotel.id,
    name: serviceHotel.name,
    slug: serviceHotel.slug || '',
    description: serviceHotel.description || '',
    address: serviceHotel.address,
    locality: serviceHotel.locality,
    province: serviceHotel.province,
    country: serviceHotel.country || '',
    lat: serviceHotel.lat || null,
    lng: serviceHotel.lng || null,
    contact_email: serviceHotel.contact_email,
    contact_phone: serviceHotel.contact_phone || null,
    policies: serviceHotel.policies || null,
    images: serviceHotel.images || [],
    amenities: serviceHotel.amenities || [],
    check_in_time: serviceHotel.check_in_time || null,
    check_out_time: serviceHotel.check_out_time || null,
    rating: serviceHotel.rating || 0,
    total_reviews: serviceHotel.total_reviews || 0,
    is_active: serviceHotel.is_active,
    is_featured: serviceHotel.is_featured || false,
    host_id: serviceHotel.host_id,
    created_at: serviceHotel.created_at,
    updated_at: serviceHotel.updated_at,
  };
}

interface HotelSelectorProps {
  onChange: (hotel: Hotel | null) => void;
  showCreateButton?: boolean;
}

export function HotelSelector({ onChange, showCreateButton = true }: HotelSelectorProps) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();  // ← Correção: usa setLocation do wouter para navegação

  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await hotelService.getMyHotels();

      if (result.success) {
        // Converte os hotéis recebidos do serviço para o tipo compartilhado
        const convertedHotels = result.data.map(convertServiceHotelToSharedHotel);
        setHotels(convertedHotels);

        // Usa o getActiveHotel que já tem toda a lógica de fallback
        const activeHotel = await hotelService.getActiveHotel();
        
        if (activeHotel) {
          const convertedActiveHotel = convertServiceHotelToSharedHotel(activeHotel);
          setSelectedId(convertedActiveHotel.id);
          onChange(convertedActiveHotel);
        } else if (convertedHotels.length > 0) {
          // Se getActiveHotel retornou null mas temos hotéis, usa o primeiro
          const firstHotel = convertedHotels[0];
          setSelectedId(firstHotel.id);
          localStorage.setItem('activeHotelId', firstHotel.id);
          onChange(firstHotel);
        } else {
          // Nenhum hotel - notifica o callback
          onChange(null);
        }
      } else {
        setError(result.error || "Erro ao carregar hotéis");
        toast.error(result.error || "Não foi possível carregar seus hotéis");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error("Falha na conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  const handleHotelChange = useCallback((hotelId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    if (hotel) {
      setSelectedId(hotelId);
      localStorage.setItem('activeHotelId', hotelId);
      onChange(hotel);
      
      // Feedback visual
      toast.success(`Hotel ${hotel.name} selecionado`);
    }
  }, [hotels, onChange]);

  const handleCreateHotel = useCallback(() => {
    setLocation('/hotels/create');  // ← Correção: usa setLocation do wouter
  }, [setLocation]);

  // Carrega hotéis no início e se o callback onChange mudar
  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  // Estado de loading
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando hotéis...</span>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="flex flex-col gap-2 p-3 border rounded-md bg-red-50 border-red-200">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Erro ao carregar</span>
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadHotels}
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Estado sem hotéis
  if (hotels.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 border rounded-md bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Nenhum hotel cadastrado
          </span>
        </div>
        <p className="text-xs text-blue-700">
          Você ainda não tem hotéis cadastrados. Crie seu primeiro hotel para começar.
        </p>
        {showCreateButton && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleCreateHotel}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            Criar Primeiro Hotel
          </Button>
        )}
      </div>
    );
  }

  // Estado normal - com hotéis
  return (
    <div className="flex flex-col gap-2">
      <Select
        value={selectedId ?? undefined}
        onValueChange={handleHotelChange}
      >
        <SelectTrigger className="w-full sm:w-[280px] h-10 bg-white hover:bg-gray-50 transition-colors">
          <SelectValue placeholder="Selecione um hotel">
            {selectedId && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {hotels.find(h => h.id === selectedId)?.name}
                </span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {hotels.map(hotel => (
            <SelectItem 
              key={hotel.id} 
              value={hotel.id}
              className="flex items-center gap-2 py-2"
            >
              <Building2 className="h-4 w-4 text-gray-400" />
              <div className="flex flex-col">
                <span className="font-medium">{hotel.name}</span>
                <span className="text-xs text-muted-foreground">
                  {hotel.locality}, {hotel.province}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Contador e ações */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {hotels.length} {hotels.length === 1 ? 'hotel' : 'hotéis'} disponível{hotels.length === 1 ? '' : 's'}
        </span>
        {showCreateButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateHotel}
            className="h-6 px-2 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Novo Hotel
          </Button>
        )}
      </div>
    </div>
  );
}