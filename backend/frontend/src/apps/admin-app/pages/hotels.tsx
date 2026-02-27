import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, Search, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

export default function AdminHotels() {
  const { hotels, hotelsPagination, loading, fetchHotels, suspendHotel, activateHotel, error, success, clearError, clearSuccess } = useAdminStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      clearSuccess();
      loadHotels();
    }
  }, [success, clearSuccess]);

  const loadHotels = async () => {
    try {
      await fetchHotels(page, 20, { search, status });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar hotéis');
    }
  };

  const handleToggleStatus = async (hotelId: string, currentStatus: boolean) => {
    setActioningId(hotelId);
    try {
      if (currentStatus) {
        await suspendHotel(hotelId, 'Suspenso pelo admin');
      } else {
        await activateHotel(hotelId, 'Ativado pelo admin');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHotels();
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando hotéis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Hotéis</h2>
        <p className="text-gray-600 mt-2">Gerencie e monitore todos os hotéis parceiros da plataforma</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar por nome ou endereço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="">Todos os Status</option>
                <option value="active">✅ Ativos</option>
                <option value="inactive">⏸️ Inativos</option>
              </select>

              <Button type="submit">Filtrar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      {hotels.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Avaliação
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Criado
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-600 uppercase text-xs">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((hotel: any) => (
                  <tr key={hotel.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">{hotel.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {hotel.locality}, {hotel.province}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span>⭐ {(hotel.rating || 0).toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">({hotel.total_reviews || 0})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {hotel.is_active ? (
                        <Badge className="bg-green-100 text-green-800">✅ Ativo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">⏸️ Inativo</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(hotel.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={hotel.is_active ? 'destructive' : 'default'}
                        onClick={() => handleToggleStatus(hotel.id, hotel.is_active)}
                        disabled={actioningId === hotel.id}
                        className="flex items-center gap-1 ml-auto"
                      >
                        <Power size={14} />
                        {actioningId === hotel.id ? 'Processando...' : hotel.is_active ? 'Suspender' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg">Nenhum hotel encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {hotelsPagination && hotelsPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => {
              setPage(Math.max(1, page - 1));
              loadHotels();
            }}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="text-gray-600 text-sm flex items-center">
            Página {page} de {hotelsPagination.totalPages}
          </span>
          <Button
            onClick={() => {
              setPage(Math.min(hotelsPagination.totalPages, page + 1));
              loadHotels();
            }}
            disabled={page === hotelsPagination.totalPages}
            variant="outline"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
