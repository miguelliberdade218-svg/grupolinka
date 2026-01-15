import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { 
  Users, Car, Hotel, Calendar, DollarSign, AlertTriangle, 
  TrendingUp, Shield, MessageSquare, Settings, BarChart3,
  UserCheck, Ban, Eye, FileText
} from "lucide-react";

export default function AdminDashboard() {
  // Mock data para estatísticas gerais da plataforma
  const platformStats = {
    totalUsers: 1247,
    activeDrivers: 186,
    activeHotels: 94,
    totalBookings: 3456,
    monthlyRevenue: 245600,
    pendingReports: 8,
    activeDisputes: 3,
    systemHealth: 98.5
  };

  const recentActivity = [
    { id: 1, type: "user_registration", user: "Ana Silva", action: "Registrou-se como cliente", time: "há 2 horas", status: "normal" },
    { id: 2, type: "dispute", user: "João M.", action: "Disputou cobrança de comissão", time: "há 4 horas", status: "alert" },
    { id: 3, type: "hotel_registration", user: "Hotel Marisol", action: "Solicitou verificação", time: "há 6 horas", status: "normal" },
    { id: 4, type: "violation", user: "Carlos A.", action: "Relatado por cancelamentos excessivos", time: "há 1 dia", status: "warning" },
    { id: 5, type: "partnership", user: "Lodge Safari", action: "Criou nova parceria", time: "há 1 dia", status: "normal" }
  ];

  const pendingActions = [
    { id: 1, type: "verification", title: "Verificar documentos Hotel Beira", priority: "high", assignee: null },
    { id: 2, type: "dispute", title: "Resolver disputa de comissão #1247", priority: "high", assignee: "Admin 1" },
    { id: 3, type: "report", title: "Investigar relatório de comportamento", priority: "medium", assignee: null },
    { id: 4, type: "refund", title: "Processar reembolso #3456", priority: "low", assignee: "Admin 2" }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration": return <Users className="w-4 h-4 text-blue-600" />;
      case "dispute": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "hotel_registration": return <Hotel className="w-4 h-4 text-green-600" />;
      case "violation": return <Ban className="w-4 h-4 text-orange-600" />;
      case "partnership": return <Users className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "alert": return "bg-red-100 text-red-800";
      case "warning": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
          <p className="text-gray-600">Controle e regulação da plataforma Link-A</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Usuários</p>
                  <p className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Motoristas Ativos</p>
                  <p className="text-2xl font-bold">{platformStats.activeDrivers}</p>
                </div>
                <Car className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Hotéis Ativos</p>
                  <p className="text-2xl font-bold">{platformStats.activeHotels}</p>
                </div>
                <Hotel className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reservas Total</p>
                  <p className="text-2xl font-bold">{platformStats.totalBookings.toLocaleString()}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue and Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Mensal</p>
                  <p className="text-2xl font-bold text-green-600">
                    {platformStats.monthlyRevenue.toLocaleString()} MZN
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Relatórios Pendentes</p>
                  <p className="text-2xl font-bold text-red-600">{platformStats.pendingReports}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saúde do Sistema</p>
                  <p className="text-2xl font-bold text-blue-600">{platformStats.systemHealth}%</p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Atividade Recente
              </CardTitle>
              <Button size="sm" variant="outline" data-testid="button-view-all-activity">
                <Eye className="w-4 h-4 mr-2" />
                Ver Tudo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status === "alert" && "Alerta"}
                      {activity.status === "warning" && "Atenção"}
                      {activity.status === "normal" && "Normal"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Ações Pendentes
              </CardTitle>
              <Button size="sm" variant="outline" data-testid="button-view-all-pending">
                <FileText className="w-4 h-4 mr-2" />
                Ver Tudo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingActions.map((action) => (
                  <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(action.priority)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        {action.assignee ? `Atribuído a: ${action.assignee}` : "Não atribuído"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {action.type === "verification" && "Verificação"}
                          {action.type === "dispute" && "Disputa"}
                          {action.type === "report" && "Relatório"}
                          {action.type === "refund" && "Reembolso"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            action.priority === "high" ? "border-red-500 text-red-700" :
                            action.priority === "medium" ? "border-orange-500 text-orange-700" :
                            "border-green-500 text-green-700"
                          }`}
                        >
                          {action.priority === "high" && "Alta"}
                          {action.priority === "medium" && "Média"}
                          {action.priority === "low" && "Baixa"}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" data-testid={`button-handle-${action.id}`}>
                      Tratar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto py-4">
                <a href="/admin/users" data-testid="button-manage-users">
                  <div className="text-center">
                    <Users className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Gerir Usuários</p>
                    <p className="text-xs text-gray-600">Verificar, suspender, aprovar</p>
                  </div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto py-4">
                <a href="/admin/reports" data-testid="button-manage-reports">
                  <div className="text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Relatórios</p>
                    <p className="text-xs text-gray-600">Investigar denúncias</p>
                  </div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto py-4">
                <a href="/admin/analytics" data-testid="button-view-analytics">
                  <div className="text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Análises</p>
                    <p className="text-xs text-gray-600">Métricas e relatórios</p>
                  </div>
                </a>
              </Button>
              
              <Button asChild variant="outline" className="h-auto py-4">
                <a href="/admin/settings" data-testid="button-platform-settings">
                  <div className="text-center">
                    <Settings className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">Configurações</p>
                    <p className="text-xs text-gray-600">Sistema e políticas</p>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}