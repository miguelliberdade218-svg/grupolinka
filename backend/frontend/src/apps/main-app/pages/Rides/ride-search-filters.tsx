import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { MapPin, Calendar, Users, Clock, X } from 'lucide-react';

interface RideSearchFiltersProps {
  onSearch?: (filters: SearchFilters) => void;
  onClear?: () => void;
}

interface SearchFilters {
  from: string;
  to: string;
  date: string;
  time: string;
  passengers: number;
  maxPrice?: number;
}

export default function RideSearchFiltersPage({
  onSearch,
  onClear,
}: RideSearchFiltersProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [maxPrice, setMaxPrice] = useState('');
  const [hasFilters, setHasFilters] = useState(false);

  const handleSearch = () => {
    const filters: SearchFilters = {
      from,
      to,
      date,
      time,
      passengers,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };
    onSearch?.(filters);
    setHasFilters(true);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    setDate('');
    setTime('');
    setPassengers(1);
    setMaxPrice('');
    setHasFilters(false);
    onClear?.();
  };

  const handleSwapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Buscar Corridas</h2>
        <p className="text-gray-600 mt-2">Encontre a corrida perfeita para suas necessidades</p>
      </div>

      {/* Main Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Critérios de Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Onde você sai?
              </label>
              <Input
                placeholder="Endereço de saída"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-end justify-center md:pb-0 pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapLocations}
                className="w-full md:w-auto"
              >
                ⇅ Inverter
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Para onde você vai?
              </label>
              <Input
                placeholder="Endereço de destino"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário (opcional)
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Passengers and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Número de Passageiros
              </label>
              <select
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Passageiro' : 'Passageiros'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Preço Máximo (opcional)
              </label>
              <Input
                type="number"
                placeholder="R$ 100.00"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full"
                step="0.50"
                min="0"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSearch}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              🔍 Buscar Corridas
            </Button>
            {hasFilters && (
              <Button
                onClick={handleClear}
                variant="outline"
                className="bg-gray-100"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Dicas de Busca</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2 text-sm">
          <p>• Quanto mais específico você for, melhores resultados você terá</p>
          <p>• Use endereços completos (incluindo bairro) para melhor correspondência</p>
          <p>• Defina o número correto de passageiros antes de buscar</p>
          <p>• Você pode filtrar por preço máximo para economizar</p>
          <p>• Corridas partindo agora têm disponibilidade imediata</p>
        </CardContent>
      </Card>

      {/* Recent Searches Info */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-900">Buscas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <button
            onClick={() => {
              setFrom('Av. Paulista, São Paulo');
              setTo('Estação Luz, São Paulo');
              setPassengers(1);
            }}
            className="block w-full text-left p-2 hover:bg-gray-100 rounded text-gray-700"
          >
            Av. Paulista → Estação Luz
          </button>
          <button
            onClick={() => {
              setFrom('Aeroporto de Congonhas, São Paulo');
              setTo('Av. Paulista, São Paulo');
              setPassengers(1);
            }}
            className="block w-full text-left p-2 hover:bg-gray-100 rounded text-gray-700"
          >
            Aeroporto Congonhas → Av. Paulista
          </button>
          <button
            onClick={() => {
              setFrom('Shopping Pinheiros, São Paulo');
              setTo('Estação Luz, São Paulo');
              setPassengers(2);
            }}
            className="block w-full text-left p-2 hover:bg-gray-100 rounded text-gray-700"
          >
            Shopping Pinheiros → Estação Luz (2 pessoas)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
