import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Star, Users, Ruler } from 'lucide-react';
import type { RoomType } from '@/shared/types/hotels';

interface RoomTypeCardProps {
  room: RoomType;
  pricePerNight?: number;
  available?: boolean;
  onSelect?: (roomId: string) => void;
  isSelected?: boolean;
}

/**
 * Card de tipo de quarto para página de detalhes do hotel
 */
export const RoomTypeCard: React.FC<RoomTypeCardProps> = ({
  room,
  pricePerNight,
  available = true,
  onSelect,
  isSelected = false,
}) => {
  return (
    <Card
      className={`overflow-hidden transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      } ${!available ? 'opacity-60 pointer-events-none' : ''}`}
      onClick={() => onSelect?.(room.id)}
    >
      <div className="md:flex">
        {/* Imagem */}
        <div className="md:w-48 flex-shrink-0">
          <img
            src={room.images?.[0] || 'https://via.placeholder.com/300x200'}
            alt={room.name}
            className="w-full h-48 object-cover"
          />
        </div>

        {/* Informações */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-dark">{room.name}</h3>
              {!available && <Badge className="bg-red-500 text-white">Indisponível</Badge>}
            </div>

            <p className="text-sm text-muted-foreground mb-3">{room.description}</p>

            {/* Características */}
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>Até {room.capacity} hóspedes</span>
              </div>

              
            </div>

            {/* Comodidades */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {room.amenities.slice(0, 3).map((amenity: string) => (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {room.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{room.amenities.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Preço e Botão */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            {pricePerNight && (
              <div>
                <p className="text-xs text-muted-foreground">Por noite</p>
                <p className="text-2xl font-bold text-primary">
                  {pricePerNight.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground"> MZN</span>
                </p>
              </div>
            )}

            <Button
              onClick={() => onSelect?.(room.id)}
              disabled={!available}
              className={`${
                isSelected
                  ? 'bg-secondary hover:bg-secondary/90'
                  : 'bg-primary hover:bg-primary/90'
              } text-dark`}
            >
              {isSelected ? 'Selecionado' : 'Selecionar'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RoomTypeCard;
