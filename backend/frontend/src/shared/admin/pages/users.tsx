import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { 
  Users, Search, Filter, UserCheck, UserX, AlertTriangle, 
  Eye, Ban, CheckCircle, X, Mail, Phone, Calendar,
  Car, Hotel, Shield
} from "lucide-react";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data para usuários da plataforma
  const users = [
    {
      id: 1,
      name: "Ana Silva",
      email: "ana.silva@email.com",
      phone: "+258 84 123 4567",
      type: "client",
      status: "active",
      joinDate: "2023-11-15",
      totalBookings: 12,
      rating: 4.8,
      verified: true,
      lastActive: "há 2 horas"
    },
    {
      id: 2,
      name: "João M.",
      email: "joao.motorista@email.com", 
      phone: "+258 87 234 5678",
      type: "driver",
      status: "active",
      joinDate: "2023-10-20",
      totalTrips: 45,
      totalEarnings: 34500,
      rating: 4.9,
      verified: true,
      lastActive: "há 30 min"
    },
    {
      id: 3,
      name: "Hotel Marisol",
      email: "admin@hotelmarisol.co.mz",
      phone: "+258 23 123 456",
      type: "hotel",
      status: "pending_verification",
      joinDate: "2024-01-10",
      totalBookings: 0,
      rating: null,
      verified: false,
      lastActive: "há 1 dia"
    },
    {
      id: 4,
      name: "Carlos A.",
      email: "carlos.problemas@email.com",
      phone: "+258 84 987 6543",
      type: "driver",
      status: "suspended",
      joinDate: "2023-09-05",
      totalTrips: 23,
      totalEarnings: 15600,
      rating: 3.2,
      verified: true,
      lastActive: "há 5 dias",
      suspensionReason: "Múltiplos cancelamentos"
    }
  ];

  const handleUserAction = (userId: number, action: string) => {
    console.log(`Ação ${action} para usuário ${userId}`);
    // TODO: Implementar ações administrativas
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case "driver": return <Car className="w-4 h-4 text-blue-600" />;
      case "hotel": return <Hotel className="w-4 h-4 text-green-600" />;
      case "client": return <Users className="w-4 h-4 text-purple-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case "driver": return "Motorista";
      case "hotel": return "Hotel";
      case "client": return "Cliente";
      default: return "Usuário";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending_verification": return "bg-yellow-100 text-yellow-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "banned": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "pending_verification": return "Pendente Verificação";
      case "suspended": return "Suspenso";
      case "banned": return "Banido";
      default: return "Desconhecido";
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = userFilter === "all" || user.type === userFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    pending: users.filter(u => u.status === "pending_verification").length,
    suspended: users.filter(u => u.status === "suspended").length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão de Usuários</h1>
          <p className="text-gray-600">Verificar, aprovar e gerir usuários da plataforma</p>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{userStats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
              <p className="text-sm text-gray-600">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{userStats.pending}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{userStats.suspended}</p>
              <p className="text-sm text-gray-600">Suspensos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger data-testid="select-user-type">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="driver">Motoristas</SelectItem>
                  <SelectItem value="hotel">Hotéis</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pending_verification">Pendente</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getUserTypeIcon(user.type)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{user.name}</h3>
                            {user.verified && <Shield className="w-4 h-4 text-blue-600" />}
                            <Badge variant="outline">
                              {getUserTypeLabel(user.type)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </p>
                            <p className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              Membro desde {user.joinDate}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={getStatusColor(user.status)}>
                          {getStatusLabel(user.status)}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Último acesso: {user.lastActive}
                        </p>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded">
                      {user.type === "client" && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Reservas</p>
                            <p className="font-medium">{user.totalBookings}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avaliação</p>
                            <p className="font-medium">⭐ {user.rating}</p>
                          </div>
                        </>
                      )}
                      
                      {user.type === "driver" && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Viagens</p>
                            <p className="font-medium">{user.totalTrips}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Ganhos</p>
                            <p className="font-medium">{user.totalEarnings?.toLocaleString()} MZN</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Avaliação</p>
                            <p className="font-medium">⭐ {user.rating}</p>
                          </div>
                        </>
                      )}
                      
                      {user.type === "hotel" && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Reservas</p>
                            <p className="font-medium">{user.totalBookings}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <p className="font-medium">
                              {user.verified ? "Verificado" : "Não verificado"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Suspension Info */}
                    {user.status === "suspended" && user.suspensionReason && (
                      <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800">
                          <AlertTriangle className="w-4 h-4 inline mr-2" />
                          Motivo da suspensão: {user.suspensionReason}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUserAction(user.id, "view")}
                        data-testid={`button-view-${user.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      {user.status === "pending_verification" && (
                        <Button 
                          size="sm"
                          onClick={() => handleUserAction(user.id, "approve")}
                          data-testid={`button-approve-${user.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                      )}
                      
                      {user.status === "active" && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleUserAction(user.id, "suspend")}
                          data-testid={`button-suspend-${user.id}`}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          Suspender
                        </Button>
                      )}
                      
                      {user.status === "suspended" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUserAction(user.id, "reactivate")}
                          data-testid={`button-reactivate-${user.id}`}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Reativar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum usuário encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros de busca.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}