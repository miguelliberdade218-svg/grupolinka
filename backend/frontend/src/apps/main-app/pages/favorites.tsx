import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Heart,
  MapPin,
  Trash2,
  Edit,
  Share2,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';

interface Favorite {
  id: string;
  name: string;
  address: string;
  type: 'address' | 'hotel' | 'venue';
  icon: string;
  lastUsed?: string;
  frequency?: number;
}

interface MainFavoritesPageProps {
  userId?: string;
  onSelectFavorite?: (favorite: Favorite) => void;
}

export default function MainFavoritesPage({
  userId = 'user-123',
  onSelectFavorite,
}: MainFavoritesPageProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([
    {
      id: 'fav-001',
      name: 'Casa',
      address: 'Rua das Flores, 123 - Bela Vista, São Paulo',
      type: 'address',
      icon: '🏠',
      lastUsed: 'Hoje às 08:30',
      frequency: 45,
    },
    {
      id: 'fav-002',
      name: 'Trabalho',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo',
      type: 'address',
      icon: '💼',
      lastUsed: 'Ontem às 17:45',
      frequency: 89,
    },
    {
      id: 'fav-003',
      name: 'Estação de Trem',
      address: 'Estação Luz - Centro, São Paulo',
      type: 'address',
      icon: '🚂',
      lastUsed: '3 dias atrás',
      frequency: 12,
    },
    {
      id: 'fav-004',
      name: 'Hospital Albert Einstein',
      address: 'Avenida Albert Einstein, 627 - Morumbi, São Paulo',
      type: 'address',
      icon: '🏥',
      lastUsed: '1 semana atrás',
      frequency: 3,
    },
    {
      id: 'fav-005',
      name: 'Hotel Paulista',
      address: 'Av. Paulista, 500 - Bela Vista, São Paulo',
      type: 'hotel',
      icon: '🏨',
      lastUsed: '2 semanas atrás',
      frequency: 2,
    },
    {
      id: 'fav-006',
      name: 'Espaço para Eventos',
      address: 'Rua Bandeira, 1200 - Vila Mariana, São Paulo',
      type: 'venue',
      icon: '🎪',
      lastUsed: '1 mês atrás',
      frequency: 1,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'address' | 'hotel' | 'venue'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredFavorites = favorites.filter((fav) => {
    const typeMatch = filterType === 'all' || fav.type === filterType;
    const searchMatch =
      fav.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fav.address.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  const handleDeleteFavorite = (id: string) => {
    setFavorites(favorites.filter((fav) => fav.id !== id));
  };

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleEditSave = (id: string) => {
    setFavorites(
      favorites.map((fav) =>
        fav.id === id ? { ...fav, name: editName } : fav
      )
    );
    setEditingId(null);
  };

  const groupedByType = {
    address: filteredFavorites.filter((f) => f.type === 'address'),
    hotel: filteredFavorites.filter((f) => f.type === 'hotel'),
    venue: filteredFavorites.filter((f) => f.type === 'venue'),
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">❤️ Meus Favoritos</h2>
        <p className="text-gray-600 mt-2">Acesso rápido aos seus locais preferidos</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Procure por nome ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex gap-2 flex-wrap">
            {(['all', 'address', 'hotel', 'venue'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterType === type
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all'
                  ? 'Todos'
                  : type === 'address'
                    ? '📍 Endereços'
                    : type === 'hotel'
                      ? '🏨 Hotéis'
                      : '🎪 Eventos'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorites by Type */}
      {['address' as const, 'hotel' as const, 'venue' as const].map((type) => {
        const items = groupedByType[type];
        if (items.length === 0) return null;

        const headers = {
          address: '📍 Endereços',
          hotel: '🏨 Hotéis',
          venue: '🎪 Espaços para Eventos',
        };

        return (
          <div key={type}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{headers[type]}</h3>
            <div className="space-y-3">
              {items.map((favorite) => (
                <Card key={favorite.id} className="hover:shadow-lg transition">
                  <CardContent className="pt-6">
                    {editingId === favorite.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nome do favorito"
                          className="font-semibold"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditSave(favorite.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Salvar
                          </Button>
                          <Button
                            onClick={() => setEditingId(null)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        {/* Icon and Details */}
                        <div className="text-4xl flex-shrink-0">
                          {favorite.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-gray-900 truncate">
                              {favorite.name}
                            </h3>
                            <Heart className="w-5 h-5 fill-red-500 text-red-500 flex-shrink-0" />
                          </div>

                          <p className="text-sm text-gray-600 flex items-start gap-2 mb-2">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="truncate">{favorite.address}</span>
                          </p>

                          {favorite.lastUsed && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Usado: {favorite.lastUsed}
                              {favorite.frequency && ` • ${favorite.frequency}x total`}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 w-full"
                            onClick={() => onSelectFavorite?.(favorite)}
                          >
                            Usar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(favorite.id, favorite.name)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFavorite(favorite.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* No Results */}
      {filteredFavorites.length === 0 && favorites.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum favorito encontrado com os filtros aplicados</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {favorites.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <Heart className="w-16 h-16 text-gray-300 mx-auto" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Nenhum favorito adicionado</h3>
                <p className="text-gray-600">
                  Adicione seus locais preferidos para acesso rápido
                </p>
              </div>
              <Button className="bg-red-600 hover:bg-red-700 mx-auto">
                ➕ Adicionar Favorito
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Favorite */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">➕ Adicionar Novo Favorito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-blue-900">
            Para adicionar um novo favorito:
          </p>
          <ul className="text-sm text-blue-900 space-y-1 list-disc list-inside">
            <li>Faça uma busca normalmente</li>
            <li>Clique no coração ❤️ no resultado</li>
            <li>Nomeie o favorito</li>
            <li>Pronto! Ele aparecerá aqui</li>
          </ul>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">💡 Dicas</CardTitle>
        </CardHeader>
        <CardContent className="text-green-900 space-y-2 text-sm">
          <p>• Você pode ter até 10 favoritos salvos</p>
          <p>• Use nomes descritivos para encontrar facilmente</p>
          <p>• Seus favoritos estão sincronizados em todos seus dispositivos</p>
          <p>• Compartilhe um favorito com amigos usando o botão de compartilhamento</p>
        </CardContent>
      </Card>
    </div>
  );
}
