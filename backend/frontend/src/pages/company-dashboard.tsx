import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { 
  Building, 
  Phone, 
  MapPin, 
  Mail, 
  Edit2, 
  Save, 
  X,
  ShoppingCart,
  CreditCard,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { companyClientApi } from "@/api/companyClient";
import type { AuthenticatedRequest } from "@/shared/types";

interface CompanyProfile {
  id: string;
  email: string;
  contactName: string;
  phone?: string;
  companyName: string;
  companyVatNumber: string;
  companyAddress: string;
  companyPhone: string;
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'suspended';
  verificationNotes?: string;
  verifiedAt?: string;
  isSuspended: boolean;
  suspensionReason?: string;
  suspensionEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CompanyClientDashboard() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editData, setEditData] = useState<Partial<CompanyProfile>>({});

  // Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'payments' | 'invoices'>('profile');
  const [isRequestingSuspensionLifting, setIsRequestingSuspensionLifting] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await companyClientApi.getCompanyProfile();
      if (response && response.profile) {
        setProfile(response.profile);
        setEditData(response.profile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil da empresa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      const response = await companyClientApi.updateCompanyProfile(editData);
      if (response && response.profile) {
        setProfile(prev => prev ? { ...prev, ...editData } : null);
        setIsEditing(false);
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com êxito",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSuspensionLifting = async () => {
    if (!suspensionReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, forneça uma razão para o levantamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await companyClientApi.requestSuspensionLifting(suspensionReason);
      if (response && response.message) {
        toast({
          title: "Sucesso",
          description: "Pedido de levantamento enviado com êxito. Aguarde análise.",
        });
        setIsRequestingSuspensionLifting(false);
        setSuspensionReason('');
      }
    } catch (error) {
      console.error('Erro ao solicitar levantamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o pedido",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'suspended':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verificada';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitada';
      case 'suspended':
        return 'Suspensa';
      default:
        return status;
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-2 text-red-600">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>Erro ao carregar o perfil. Por favor, tente novamente.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {profile.companyName}
          </h1>
          <p className="text-gray-600 mt-1">Painel de Controlo - Cliente Empresa</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 ${getStatusColor(profile.verificationStatus)}`}>
          {profile.verificationStatus === 'verified' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {getStatusLabel(profile.verificationStatus)}
        </div>
      </div>

      {/* Suspension Warning */}
      {profile.isSuspended && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-600 flex-grow">
                <p className="font-semibold">Conta Suspensa</p>
                <p className="text-sm mt-1">{profile.suspensionReason}</p>
                {profile.suspensionEndDate && (
                  <p className="text-sm mt-2">Data de levantamento prevista: {new Date(profile.suspensionEndDate).toLocaleDateString('pt-PT')}</p>
                )}
              </div>
            </div>

            {isRequestingSuspensionLifting ? (
              <div className="mt-4 space-y-3 border-t border-red-200 pt-4">
                <Label className="text-red-700">Razão para Levantamento</Label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Explique por favor como pretende resolver a situação..."
                  className="w-full border border-red-300 rounded px-3 py-2 text-sm text-gray-700 min-h-24"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleRequestSuspensionLifting}
                    disabled={isLoading || !suspensionReason.trim()}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Enviar Pedido
                  </Button>
                  <Button
                    onClick={() => {
                      setIsRequestingSuspensionLifting(false);
                      setSuspensionReason('');
                    }}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={() => setIsRequestingSuspensionLifting(true)}
                variant="outline" 
                size="sm" 
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Solicitar Levantamento
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Reservas
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Pagamentos
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Faturas
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações da Empresa
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Empresa</Label>
                    <Input
                      value={editData.companyName || ''}
                      onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>NIF/NUIT</Label>
                    <Input
                      value={editData.companyVatNumber || ''}
                      onChange={(e) => setEditData({ ...editData, companyVatNumber: e.target.value })}
                      disabled
                    />
                  </div>

                  <div>
                    <Label>Telefone da Empresa</Label>
                    <Input
                      value={editData.companyPhone || ''}
                      onChange={(e) => setEditData({ ...editData, companyPhone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Endereço</Label>
                    <Input
                      value={editData.companyAddress || ''}
                      onChange={(e) => setEditData({ ...editData, companyAddress: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(profile);
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-medium">{profile.companyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">NIF/NUIT</p>
                      <p className="font-medium">{profile.companyVatNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-medium">{profile.companyPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-sm">{profile.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-sm text-gray-600">Endereço</p>
                      <p className="font-medium">{profile.companyAddress}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto Principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{profile.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telemóvel</p>
                  <p className="font-medium">{profile.phone || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center py-8">
              Sistema de reservas em desenvolvimento
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Métodos de Pagamento</CardTitle>
              <Button size="sm">+ Adicionar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center py-8">
              Nenhum método de pagamento configurado ainda
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-center py-8">
              Nenhuma fatura disponível
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
