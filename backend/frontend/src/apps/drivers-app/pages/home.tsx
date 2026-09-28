import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { Link } from 'wouter';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Car, Calendar, DollarSign, Handshake, Plus, Wallet, RefreshCw } from 'lucide-react';

interface AppUser { id?: string; uid?: string; email?: string; rating?: number; }

const formatPrice = (price: number): string => `${price.toFixed(2)} MT`;

export default function DriversHome() {
  const { user } = useAuth() as { user: AppUser | null };
  const userId = user?.id || user?.uid;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['driver-dashboard', userId],
    queryFn: async () => {
      const token = localStorage.getItem('firebaseToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/driver/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Erro ao carregar dashboard');
      return res.json();
    },
    enabled: !!userId,
  });

  const stats = data?.stats || {};
  const overall = stats.overall || {};
  const today = stats.today || {};

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Esta area e exclusiva para motoristas.</p>
            <Link href="/login"><Button>Fazer Login</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ola, {user.email?.split('@')[0]}</h1>
            <p className="text-gray-600">Painel do motorista</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6 flex items-center">
              <Car className="w-8 h-8 text-blue-600 mr-3" />
              <div><p className="text-sm text-blue-700">Viagens</p><p className="text-2xl font-bold text-blue-900">{overall.totalRides || 0}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6 flex items-center">
              <Calendar className="w-8 h-8 text-green-600 mr-3" />
              <div><p className="text-sm text-green-700">Reservas</p><p className="text-2xl font-bold text-green-900">{overall.totalBookings || 0}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="pt-6 flex items-center">
              <DollarSign className="w-8 h-8 text-yellow-600 mr-3" />
              <div><p className="text-sm text-yellow-700">Ganhos Hoje</p><p className="text-2xl font-bold text-yellow-900">{formatPrice(today.earnings || 0)}</p></div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6 flex items-center">
              <Handshake className="w-8 h-8 text-purple-600 mr-3" />
              <div><p className="text-sm text-purple-700">Avaliacao</p><p className="text-2xl font-bold text-purple-900">{overall.rating || user.rating || '-'}</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Acoes Rapidas</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/drivers/publish"><Button className="w-full h-24 flex-col bg-blue-600 hover:bg-blue-700"><Plus className="w-6 h-6 mb-2" />Publicar Viagem</Button></Link>
              <Link href="/drivers/rides"><Button variant="outline" className="w-full h-24 flex-col"><Car className="w-6 h-6 mb-2" />Gerir Viagens</Button></Link>
              <Link href="/drivers/commissions"><Button variant="outline" className="w-full h-24 flex-col"><Wallet className="w-6 h-6 mb-2" />Comissoes</Button></Link>
              <Link href="/drivers/partnerships"><Button variant="outline" className="w-full h-24 flex-col"><Handshake className="w-6 h-6 mb-2" />Parcerias</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
