import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Switch } from "@/shared/components/ui/switch";
import { Slider } from "@/shared/components/ui/slider";
import { formatMzn } from "@/lib/currency";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/shared/hooks/use-toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: 'user' | 'driver' | 'host' | 'restaurant';
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isBlocked: boolean;
  joinDate: string;
  lastActive: string;
  violations: number;
  status: 'active' | 'suspended' | 'banned';
  avatar: string;
}

interface PriceRegulation {
  id: string;
  rideType: string;
  minPricePerKm: number;
  maxPricePerKm: number;
  baseFare: number;
  isActive: boolean;
  lastUpdated: string;
}

interface PenaltyAction {
  userId: string;
  action: 'warning' | 'suspend' | 'ban' | 'remove';
  reason: string;
  duration?: number; // days for suspension
  notes?: string;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [penaltyAction, setPenaltyAction] = useState<PenaltyAction>({
    userId: '',
    action: 'warning',
    reason: '',
  });
  const [priceSettings, setPriceSettings] = useState<PriceRegulation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUserType, setFilterUserType] = useState<string>("all");

  // TODO: Endpoints de admin não implementados ainda - usando dados mock
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users', { search: searchTerm, status: filterStatus, userType: filterUserType }],
    queryFn: async () => {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mock para desenvolvimento
      return {
        users: [
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@example.com',
            userType: 'driver',
            rating: 4.8,
            totalReviews: 45,
            isVerified: true,
            isBlocked: false,
            joinDate: '2024-01-15',
            lastActive: '2024-08-28',
            violations: 0,
            status: 'active',
            avatar: '/avatars/01.png'
          }
        ]
      };
    },
  });

  const adminUsers = usersData?.users || [];

  // TODO: Endpoint de regulamentações de preços não implementado
  const { data: priceRegulations, isLoading: isLoadingPricing, refetch: refetchPricing } = useQuery({
    queryKey: ['/api/admin/price-regulations'],
    queryFn: async () => {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dados mock para desenvolvimento
      return [
        {
          id: '1',
          rideType: 'economy',
          minPricePerKm: 15,
          maxPricePerKm: 25,
          baseFare: 50,
          isActive: true,
          lastUpdated: '2024-08-20'
        }
      ];
    },
  });

  const penaltyMutation = useMutation({
    mutationFn: async (data: { userId: string; action: string; reason: string; duration?: number; notes?: string }) => {
      // TODO: Endpoint de ações de penalidade não implementado
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Simulating penalty action:', data);
      
      return { success: true, actionId: 'pen-' + Date.now() };
    },
    onSuccess: () => {
      toast({
        title: "Ação Aplicada",
        description: `${penaltyAction.action} aplicada com sucesso`,
      });
      refetchUsers();
      setPenaltyAction({ userId: '', action: 'warning', reason: '' });
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao aplicar ação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handlePenaltyAction = async () => {
    if (!selectedUser || !penaltyAction.reason.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um utilizador e forneça um motivo para a ação.",
        variant: "destructive",
      });
      return;
    }

    penaltyMutation.mutate({
      userId: selectedUser.id,
      action: penaltyAction.action,
      reason: penaltyAction.reason,
      duration: penaltyAction.duration,
      notes: penaltyAction.notes,
    });
  };

  const pricingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PriceRegulation> }) => {
      const response = await fetch(`/api/admin/price-regulations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update pricing');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preços Atualizados",
        description: "Regulamentos de preços foram atualizados com sucesso.",
      });
      refetchPricing();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar preços. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleUpdatePricing = async (priceId: string, updates: Partial<PriceRegulation>) => {
    pricingMutation.mutate({ id: priceId, updates });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-yellow-500';
      case 'banned': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'driver': return 'Motorista';
      case 'host': return 'Anfitrião';
      case 'restaurant': return 'Restaurante';
      default: return 'Utilizador';
    }
  };

  const filteredUsers = adminUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesType = filterUserType === 'all' || user.userType === filterUserType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <PageHeader title="Painel Administrativo" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-gray-medium dark:text-gray-400">Gerir utilizadores, preços e configurações da plataforma</p>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Utilizadores</CardTitle>
                <div className="flex flex-wrap gap-4 mt-4">
                  <Input
                    placeholder="Pesquisar utilizadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                    data-testid="search-users"
                  />
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="banned">Banido</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterUserType} onValueChange={setFilterUserType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="user">Utilizador</SelectItem>
                      <SelectItem value="driver">Motorista</SelectItem>
                      <SelectItem value="host">Anfitrião</SelectItem>
                      <SelectItem value="restaurant">Restaurante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{user.name}</h4>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                              {user.isVerified && (
                                <Badge variant="outline" className="text-green-600">
                                  <i className="fas fa-check-circle mr-1"></i>
                                  Verificado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-medium">{user.email}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-medium mt-1">
                              <span>{getUserTypeLabel(user.userType)}</span>
                              <span>⭐ {user.rating} ({user.totalReviews} avaliações)</span>
                              <span>{user.violations} violações</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                                data-testid={`manage-user-${user.id}`}
                              >
                                <i className="fas fa-cog mr-2"></i>
                                Gerir
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Gerir Utilizador: {user.name}</DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label>Ação</Label>
                                  <Select 
                                    value={penaltyAction.action} 
                                    onValueChange={(value) => 
                                      setPenaltyAction({...penaltyAction, action: value as any})
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="warning">Advertência</SelectItem>
                                      <SelectItem value="suspend">Suspender</SelectItem>
                                      <SelectItem value="ban">Banir</SelectItem>
                                      <SelectItem value="remove">Remover Conta</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {penaltyAction.action === 'suspend' && (
                                  <div>
                                    <Label>Duração (dias)</Label>
                                    <Input
                                      type="number"
                                      value={penaltyAction.duration || ''}
                                      onChange={(e) => 
                                        setPenaltyAction({
                                          ...penaltyAction, 
                                          duration: parseInt(e.target.value)
                                        })
                                      }
                                      placeholder="Ex: 7"
                                    />
                                  </div>
                                )}

                                <div>
                                  <Label>Motivo</Label>
                                  <Textarea
                                    value={penaltyAction.reason}
                                    onChange={(e) => 
                                      setPenaltyAction({...penaltyAction, reason: e.target.value})
                                    }
                                    placeholder="Descreva o motivo da ação..."
                                    data-testid="penalty-reason"
                                  />
                                </div>

                                <div>
                                  <Label>Notas Adicionais (opcional)</Label>
                                  <Textarea
                                    value={penaltyAction.notes || ''}
                                    onChange={(e) => 
                                      setPenaltyAction({...penaltyAction, notes: e.target.value})
                                    }
                                    placeholder="Notas internas..."
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handlePenaltyAction}
                                    className="flex-1"
                                    data-testid="apply-penalty"
                                  >
                                    Aplicar Ação
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Management */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regulamentação de Preços</CardTitle>
                <p className="text-sm text-gray-medium">
                  Definir limites mínimos e máximos de preços por quilómetro para diferentes tipos de viagem
                </p>
              </CardHeader>
              
              <CardContent>
                {isLoadingPricing ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(priceRegulations || []).map((priceRule) => (
                    <Card key={priceRule.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{priceRule.rideType}</h4>
                            <p className="text-sm text-gray-medium">
                              Última atualização: {new Date(priceRule.lastUpdated).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Switch
                            checked={priceRule.isActive}
                            onCheckedChange={(checked) => 
                              handleUpdatePricing(priceRule.id, { isActive: checked })
                            }
                            data-testid={`toggle-pricing-${priceRule.id}`}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-sm font-medium">Taxa Base</Label>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={parseFloat(priceRule.baseFare)}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    handleUpdatePricing(priceRule.id, { baseFare: newValue });
                                  }}
                                  className="w-32"
                                />
                                <span className="text-sm text-gray-medium">MZN</span>
                              </div>
                              <p className="text-xs text-gray-medium mt-1">
                                Atual: {formatMzn(parseFloat(priceRule.baseFare) * 100)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Preço Mínimo por KM</Label>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={parseFloat(priceRule.minPricePerKm)}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    handleUpdatePricing(priceRule.id, { minPricePerKm: newValue });
                                  }}
                                  className="w-32"
                                />
                                <span className="text-sm text-gray-medium">MZN</span>
                              </div>
                              <p className="text-xs text-gray-medium mt-1">
                                Atual: {formatMzn(parseFloat(priceRule.minPricePerKm) * 100)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Preço Máximo por KM</Label>
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={parseFloat(priceRule.maxPricePerKm)}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    handleUpdatePricing(priceRule.id, { maxPricePerKm: newValue });
                                  }}
                                  className="w-32"
                                />
                                <span className="text-sm text-gray-medium">MZN</span>
                              </div>
                              <p className="text-xs text-gray-medium mt-1">
                                Atual: {formatMzn(parseFloat(priceRule.maxPricePerKm) * 100)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Alert className="mt-4">
                          <i className="fas fa-info-circle"></i>
                          <AlertDescription>
                            Preço final = Taxa Base + (Distância × Preço por KM)
                            <br />
                            Exemplo para 10km: {formatMzn(parseFloat(priceRule.baseFare) * 100)} + (10 × {formatMzn(parseFloat(priceRule.minPricePerKm) * 100)}) = {formatMzn((parseFloat(priceRule.baseFare) + (10 * parseFloat(priceRule.minPricePerKm))) * 100)} - {formatMzn((parseFloat(priceRule.baseFare) + (10 * parseFloat(priceRule.maxPricePerKm))) * 100)}
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Utilizadores Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">1,247</div>
                  <p className="text-sm text-gray-medium">+12% este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utilizadores Suspensos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">23</div>
                  <p className="text-sm text-gray-medium">-5% este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utilizadores Banidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">8</div>
                  <p className="text-sm text-gray-medium">+2 este mês</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Violações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {[
                      { user: "Carlos Silva", violation: "Cancelamento excessivo", date: "2024-08-20", severity: "medium" },
                      { user: "Ana Costa", violation: "Avaliação falsa", date: "2024-08-19", severity: "high" },
                      { user: "Miguel Santos", violation: "Comportamento inadequado", date: "2024-08-18", severity: "high" }
                    ].map((violation, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{violation.user}</p>
                          <p className="text-sm text-gray-medium">{violation.violation}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={violation.severity === 'high' ? 'destructive' : 'secondary'}>
                            {violation.severity === 'high' ? 'Alta' : 'Média'}
                          </Badge>
                          <p className="text-xs text-gray-medium mt-1">{violation.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Aprovação Manual de Novos Motoristas</Label>
                    <p className="text-sm text-gray-medium">Requerer aprovação manual para novos registos de motoristas</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Verificação Automática de Documentos</Label>
                    <p className="text-sm text-gray-medium">Ativar verificação automática de documentos enviados</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Limite de Violações Antes de Suspensão</Label>
                    <p className="text-sm text-gray-medium">Número máximo de violações antes de suspensão automática</p>
                  </div>
                  <Input type="number" defaultValue={3} className="w-20" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Duração Padrão de Suspensão (dias)</Label>
                    <p className="text-sm text-gray-medium">Duração padrão para suspensões automáticas</p>
                  </div>
                  <Input type="number" defaultValue={7} className="w-20" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}