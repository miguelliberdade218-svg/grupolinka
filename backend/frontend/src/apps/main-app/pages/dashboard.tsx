import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  MapPin,
  Search,
  Clock,
  TrendingUp,
  Star,
  AlertCircle,
  Settings,
  Users,
} from 'lucide-react';

interface MainAppDashboardPageProps {
  userId?: string;
  userName?: string;
}

export default function MainAppDashboardPage({
  userId = 'user-123',
  userName = 'Maria Silva',
}: MainAppDashboardPageProps) {
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Greeting Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Bem-vinda, {userName}! 👋
        </h2>
        <p className="text-gray-600 mt-2">Escolha o tipo de transporte que você precisa</p>
      </div>

      {/* Quick Search */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🔍 Busca Rápida</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                De
              </label>
              <Input
                placeholder="Seu local"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Para
              </label>
              <Input
                placeholder="Destino"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Serviço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: '🚗',
              name: 'Carona Compartilhada',
              description: 'Divida a corrida com outros passageiros',
              color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
              highlight: 'text-blue-900',
            },
            {
              icon: '🏨',
              name: 'Reservar Hotel',
              description: 'Encontre e reserve hotéis',
              color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
              highlight: 'text-purple-900',
            },
            {
              icon: '🎪',
              name: 'Espaços para Eventos',
              description: 'Alugar espaços para eventos',
              color: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
              highlight: 'text-pink-900',
            },
          ].map((service) => (
            <Card
              key={service.name}
              className={`border-2 cursor-pointer transition ${service.color}`}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="text-4xl">{service.icon}</div>
                  <h3 className={`font-bold ${service.highlight}`}>{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                  <Button className="w-full bg-gray-900 hover:bg-gray-800">
                    Explorar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Corridas</span>
            <Button variant="outline" size="sm">
              Ver Tudo
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              from: 'Av. Paulista',
              to: 'Estação Luz',
              time: '25 jan às 14:30',
              price: 'R$ 32,50',
              rating: 5,
            },
            {
              from: 'Shopping Pinheiros',
              to: 'Aeroporto Congonhas',
              time: '24 jan às 18:45',
              price: 'R$ 78,90',
              rating: 4,
            },
            {
              from: 'Estação Br.',
              to: 'Av. Brasil',
              time: '23 jan às 10:15',
              price: 'R$ 15,50',
              rating: 0,
            },
          ].map((ride, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {ride.from} → {ride.to}
                </p>
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ride.time}
                </p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-bold text-gray-900">{ride.price}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {ride.rating > 0 ? '⭐'.repeat(ride.rating) : 'Não avaliado'}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Favorites and Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Endereços Favoritos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <MapPin className="w-4 h-4 mr-2" />
            🏠 Casa - Rua das Flores, 123
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <MapPin className="w-4 h-4 mr-2" />
            💼 Trabalho - Av. Paulista, 1000
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <MapPin className="w-4 h-4 mr-2" />
            ➕ Adicionar Novo Endereço
          </Button>
        </CardContent>
      </Card>

      {/* Promotions */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-orange-900">🎉 Promoções Especiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-orange-900">
          <div className="p-3 bg-white rounded-lg">
            <p className="font-semibold">Seu Cupom de Boas-vindas</p>
            <p className="text-sm text-gray-600 mt-1">15% OFF em sua próxima corrida</p>
            <p className="font-mono text-sm font-bold mt-2 text-blue-600">WELLCOME15</p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="font-semibold">Indique e Ganhe</p>
            <p className="text-sm text-gray-600 mt-1">R$ 20 para você e seu amigo</p>
            <Button size="sm" className="mt-2 w-full bg-orange-600 hover:bg-orange-700">
              Compartilhar Código
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900 flex items-center gap-2">
            👑 Upgrade para Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-purple-900">
          <ul className="space-y-2 text-sm">
            <li>✓ Prioridade em reservas</li>
            <li>✓ Descontos exclusivos até 20%</li>
            <li>✓ Suporte prioritário 24/7</li>
            <li>✓ Pontuar pontos em todas corridas</li>
          </ul>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 mt-4">
            Conheça o Premium - R$ 9,99/mês
          </Button>
        </CardContent>
      </Card>

      {/* Safety and Support */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900 flex items-center gap-2">
            🛡️ Segurança e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-900 space-y-2 text-sm">
          <p>✓ Verificação de motoristas em tempo real</p>
          <p>✓ Compartilhamento de localização com segurança</p>
          <p>✓ Seguro de proteção do passageiro incluído</p>
          <p>✓ Suporte 24/7 disponível</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              📞 Suporte
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              🆘 Emergência
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings and Account */}
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <Users className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" className="w-full justify-start">
            💳 Métodos de Pagamento
          </Button>
          <Button variant="outline" className="w-full justify-start">
            📋 Documentos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
