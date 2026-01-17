import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';
import { MapPinIcon, CalendarIcon, UsersIcon, SearchIcon } from 'lucide-react';
import type { HotelSearchParams } from '@/shared/types/hotels';

interface HotelSearchProps {
  onSearch: (params: HotelSearchParams) => void;
  isLoading?: boolean;
  sticky?: boolean;
}

/**
 * Formulário de busca de hotéis - sticky no topo
 * Inspirado em Booking.com
 */
export const HotelSearch: React.FC<HotelSearchProps> = ({
  onSearch,
  isLoading = false,
  sticky = true,
}) => {
  const [location, setLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState(2);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      location,
      checkInDate,
      checkOutDate,
      guests,
    });
  };

  const wrapperClass = sticky
    ? 'sticky top-16 z-40 bg-white shadow-md border-b border-gray-200'
    : '';

  return (
    <div className={wrapperClass}>
      <div className="container mx-auto px-4 max-w-7xl py-4">
        <Card className="p-6 shadow-lg">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Localização */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-dark mb-2">Localização</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Para onde vai?"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Data Check-in */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-dark mb-2">Check-in</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Data Check-out */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-dark mb-2">Check-out</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Hóspedes */}
              <div className="flex flex-col">
                <label className="text-sm font-medium text-dark mb-2">Hóspedes</label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Botão Buscar */}
              <div className="flex flex-col justify-end">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-dark h-10"
                >
                  <SearchIcon className="w-5 h-5 mr-2" />
                  {isLoading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default HotelSearch;
