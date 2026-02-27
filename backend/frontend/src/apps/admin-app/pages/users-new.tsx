import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';

export default function AdminUsers() {
  const { users, usersPagination, loading, fetchUsers, error, clearError } = useAdminStore();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const loadUsers = async () => {
    try {
      await fetchUsers(page, 20, { search, type, status });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar usuários');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'driver':
        return 'bg-blue-100 text-blue-800';
      case 'hotel_manager':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return '✅';
      case 'pending':
        return '⏳';
      case 'suspended':
        return '⏸️';
      case 'rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h2>
        <p className="text-gray-600 mt-2">Gerencie e monitore todos os usuários da plataforma</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar por nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="">Todos os Tipos</option>
                <option value="driver">🚗 Motoristas</option>
                <option value="hotel_manager">🏨 Gestores de Hotel</option>
                <option value="admin">🔐 Admins</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="">Todos os Status</option>
                <option value="verified">✅ Verificado</option>
                <option value="pending">⏳ Pendente</option>
                <option value="suspended">⏸️ Suspenso</option>
                <option value="rejected">❌ Rejeitado</option>
              </select>

              <Button type="submit" className="flex items-center gap-2">
                <Filter size={16} />
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      {users.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Verificado
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">
                    Criado
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {user.fullName || user.firstName} {user.lastName || ''}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.canDrive && (
                          <Badge className="bg-blue-100 text-blue-800">🚗 Motorista</Badge>
                        )}
                        {user.canManageHotels && (
                          <Badge className="bg-purple-100 text-purple-800">🏨 Hotel</Badge>
                        )}
                        {user.canBookServices && (
                          <Badge className="bg-green-100 text-green-800">📅 Cliente</Badge>
                        )}
                        {user.isAdmin && (
                          <Badge className="bg-red-100 text-red-800">🔐 Admin</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap text-xs">
                        {user.driverVerificationStatus && (
                          <span>
                            {getStatusIcon(user.driverVerificationStatus)} 🚗
                          </span>
                        )}
                        {user.hotelManagerVerificationStatus && (
                          <span>
                            {getStatusIcon(user.hotelManagerVerificationStatus)} 🏨
                          </span>
                        )}
                        {user.clientVerificationStatus && (
                          <span>
                            {getStatusIcon(user.clientVerificationStatus)} 📅
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">✅ Sim</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800">⏳ Não</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('pt-PT')}
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
            <p className="text-gray-600 text-lg">Nenhum usuário encontrado</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {usersPagination && usersPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => {
              setPage(Math.max(1, page - 1));
              loadUsers();
            }}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 text-sm">
              Página {page} de {usersPagination.totalPages}
            </span>
          </div>

          <Button
            onClick={() => {
              setPage(Math.min(usersPagination.totalPages, page + 1));
              loadUsers();
            }}
            disabled={page === usersPagination.totalPages}
            variant="outline"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}
