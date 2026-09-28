import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Users,
  Search,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'driver' | 'passenger' | 'hotel' | 'organizer';
  joinDate: string;
  status: 'active' | 'suspended' | 'verified' | 'pending';
  rating?: number;
  transactions: number;
  documentStatus: 'verified' | 'pending' | 'expired';
}

interface AdminUsersPageProps {
  adminId?: string;
}

export default function AdminUsersPage({
  adminId = 'admin-123',
}: AdminUsersPageProps) {
  const [users, setUsers] = useState<User[]>([
    {
      id: 'user-001',
      name: 'João Silva',
      email: 'joao@example.com',
      phone: '11 99999-9999',
      type: 'driver',
      joinDate: '10/01/2024',
      status: 'active',
      rating: 4.8,
      transactions: 245,
      documentStatus: 'verified',
    },
    {
      id: 'user-002',
      name: 'Maria Santos',
      email: 'maria@example.com',
      phone: '11 98888-8888',
      type: 'passenger',
      joinDate: '15/01/2025',
      status: 'active',
      transactions: 12,
      documentStatus: 'verified',
    },
    {
      id: 'user-003',
      name: 'Hotel Paulista',
      email: 'hotel@paulista.com',
      phone: '11 3333-3333',
      type: 'hotel',
      joinDate: '01/12/2024',
      status: 'verified',
      transactions: 89,
      documentStatus: 'verified',
    },
    {
      id: 'user-004',
      name: 'Carlos Pereira',
      email: 'carlos@example.com',
      phone: '11 97777-7777',
      type: 'driver',
      joinDate: '05/01/2025',
      status: 'suspended',
      rating: 2.1,
      transactions: 34,
      documentStatus: 'expired',
    },
    {
      id: 'user-005',
      name: 'Ana Costa',
      email: 'ana@example.com',
      phone: '11 96666-6666',
      type: 'passenger',
      joinDate: '20/01/2025',
      status: 'pending',
      transactions: 0,
      documentStatus: 'pending',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | User['type']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | User['status']>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const typeMatch = filterType === 'all' || user.type === filterType;
    const statusMatch = filterStatus === 'all' || user.status === filterStatus;
    const searchMatch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm);
    return typeMatch && statusMatch && searchMatch;
  });

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'verified':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'suspended':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    }
  };

  const getStatusLabel = (status: User['status']) => {
    const labels = {
      active: '✅ Ativo',
      verified: '✔️ Verificado',
      suspended: '❌ Suspenso',
      pending: '⏳ Pendente',
    };
    return labels[status];
  };

  const getTypeLabel = (type: User['type']) => {
    const labels = {
      driver: '🚗 Motorista',
      passenger: '👤 Passageiro',
      hotel: '🏨 Hotel',
      organizer: '🎪 Organizador',
    };
    return labels[type];
  };

  const handleSuspendUser = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u
      )
    );
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active' || u.status === 'verified').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    pending: users.filter((u) => u.status === 'pending').length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">👥 Gerenciar Usuários</h2>
        <p className="text-gray-600 mt-2">Controle e monitore todos os usuários da plataforma</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-6 text-center">
            <p className="text-green-900 text-sm">Ativos</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-900 text-sm">Suspensos</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{stats.suspended}</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <p className="text-yellow-900 text-sm">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Procure por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="driver">🚗 Motorista</option>
                <option value="passenger">👤 Passageiro</option>
                <option value="hotel">🏨 Hotel</option>
                <option value="organizer">🎪 Organizador</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todos</option>
                <option value="active">✅ Ativo</option>
                <option value="verified">✔️ Verificado</option>
                <option value="suspended">❌ Suspenso</option>
                <option value="pending">⏳ Pendente</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className={`cursor-pointer transition hover:shadow-lg border-2 ${getStatusColor(
                user.status
              )}`}
            >
              <CardContent className="pt-6">
                <div
                  onClick={() =>
                    setExpandedId(expandedId === user.id ? null : user.id)
                  }
                >
                  {/* Main Row */}
                  <div className="flex gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {user.type === 'driver'
                        ? '🚗'
                        : user.type === 'passenger'
                          ? '👤'
                          : user.type === 'hotel'
                            ? '🏨'
                            : '🎪'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 truncate">
                          {user.name}
                        </h3>
                        <span className="text-sm font-bold px-2 py-1 rounded bg-white bg-opacity-50">
                          {getStatusLabel(user.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700 mb-1">
                        <p className="flex items-center gap-1 truncate">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                        <p className="flex items-center gap-1">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          {user.phone}
                        </p>
                        <p>{getTypeLabel(user.type)}</p>
                        <p>Membro desde {user.joinDate}</p>
                      </div>

                      {user.rating && (
                        <p className="text-sm font-semibold">
                          ⭐ {user.rating.toFixed(1)} ({user.transactions} transações)
                        </p>
                      )}
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition flex-shrink-0 ${
                        expandedId === user.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {expandedId === user.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">ID do Usuário</p>
                          <p className="font-semibold font-mono">{user.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status de Documentos</p>
                          <p className="font-semibold">
                            {user.documentStatus === 'verified'
                              ? '✅ Verificado'
                              : user.documentStatus === 'pending'
                                ? '⏳ Pendente'
                                : '❌ Expirado'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Transações</p>
                          <p className="font-semibold">{user.transactions}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t flex-wrap">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                          className={
                            user.status === 'suspended'
                              ? 'bg-green-600 hover:bg-green-700 flex-1'
                              : 'bg-red-600 hover:bg-red-700 flex-1'
                          }
                        >
                          {user.status === 'suspended' ? (
                            <>
                              <Unlock className="w-4 h-4 mr-1" />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-1" />
                              Bloquear
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          variant="outline"
                          className="text-red-600 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Deletar
                        </Button>

                        <Button size="sm" variant="outline" className="flex-1">
                          📧 Enviar Email
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nenhum usuário encontrado</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Actions */}
      {filteredUsers.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">⚙️ Ações em Massa</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Button className="bg-blue-600 hover:bg-blue-700">
              📧 Enviar Email para Todos
            </Button>
            <Button variant="outline" className="text-blue-900 border-blue-300">
              🔒 Bloquear Selecionados
            </Button>
            <Button variant="outline" className="text-blue-900 border-blue-300">
              📊 Exportar Lista
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
