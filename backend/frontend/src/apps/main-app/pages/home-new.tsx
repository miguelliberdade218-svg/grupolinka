import React, { useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { Link } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Search, Car, Hotel, Calendar, Users, MapPin, Star, TrendingUp } from 'lucide-react';
import FeaturedOffers from '../components/FeaturedOffers';
import RideSearchModal from '../components/RideSearchModal';

export default function HomeNew() {
  const { user } = useAuth();
  const [searchType, setSearchType] = useState<'rides' | 'stays' | 'events'>('rides');
  const [showRideSearch, setShowRideSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState({ from: '', to: '', date: '' });

  const handleSearch = () => {
    if (searchType === 'rides') {
      setShowRideSearch(true);
    }
    // TODO: Implementar busca para acomodações e eventos
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplificado */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Link-A Moçambique
            </h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              App Cliente
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/bookings" data-testid="link-bookings">
                  <Button variant="ghost">📋 Minhas Reservas</Button>
                </Link>
                <Button variant="ghost" data-testid="button-user-menu">
                  👤 {user.email?.split('@')[0]}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login" data-testid="link-login">
                  <Button variant="outline">Entrar</Button>
                </Link>
                <Link href="/signup" data-testid="link-signup">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500">
                    Registar Grátis
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Seção de busca */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Encontrar Ofertas
              {!user && <span className="text-sm text-orange-600 font-normal">(Registe-se para reservar)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={searchType === 'rides' ? 'default' : 'outline'}
                onClick={() => setSearchType('rides')}
                data-testid="button-search-rides"
              >
                <Car className="w-4 h-4 mr-2" />
                Boleias
              </Button>
              <Button
                variant={searchType === 'stays' ? 'default' : 'outline'}
                onClick={() => setSearchType('stays')}
                data-testid="button-search-stays"
              >
                <Hotel className="w-4 h-4 mr-2" />
                Alojamentos
              </Button>
              <Button
                variant={searchType === 'events' ? 'default' : 'outline'}
                onClick={() => setSearchType('events')}
                data-testid="button-search-events"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Eventos
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {searchType === 'rides' ? 'De onde' : 'Localização'}
                </label>
                <Input
                  placeholder="Cidade de origem"
                  value={searchQuery.from}
                  onChange={(e) => setSearchQuery({...searchQuery, from: e.target.value})}
                  data-testid="input-from"
                />
              </div>
              {searchType === 'rides' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Para onde</label>
                  <Input
                    placeholder="Cidade de destino"
                    value={searchQuery.to}
                    onChange={(e) => setSearchQuery({...searchQuery, to: e.target.value})}
                    data-testid="input-to"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <Input
                  type="date"
                  value={searchQuery.date}
                  onChange={(e) => setSearchQuery({...searchQuery, date: e.target.value})}
                  data-testid="input-date"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full" data-testid="button-search">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ofertas em destaque */}
        <FeaturedOffers />

        {/* Destaques da semana */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Destaques da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Exemplo de viagem em destaque */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span>Maputo → Beira</span>
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Motorista: João M.
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-green-600">1500 MT</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    2024-09-15
                  </p>
                  {user ? (
                    <Button className="w-full" size="sm" data-testid="button-book-ride-sample">
                      Reservar Boleia
                    </Button>
                  ) : (
                    <Link href="/signup" className="block w-full">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm">
                        Registar para Reservar
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de busca de rides */}
      <RideSearchModal 
        isOpen={showRideSearch}
        onClose={() => setShowRideSearch(false)}
      />
    </div>
  );
}