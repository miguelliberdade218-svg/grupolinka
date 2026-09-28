import { useState } from 'react';
import { PaymentPolicyEditor } from '@/components/PaymentPolicyEditor';
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Input } from '@/shared/components/ui/input';
import { Search } from 'lucide-react';

export default function PaymentPoliciesManagement() {
  const [selectedType, setSelectedType] = useState<'hotel' | 'driver' | 'event_space'>('hotel');
  const [selectedId, setSelectedId] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<{ id: string; type: 'hotel' | 'driver' | 'event_space' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleEditPolicy = (id: string, type: 'hotel' | 'driver' | 'event_space') => {
    setEditingPolicy({ id, type });
  };

  const handlePolicySaved = () => {
    setEditingPolicy(null);
    setSelectedId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Políticas de Pagamento</h2>
        <p className="text-gray-600 mt-2">Configure as políticas de pagamento para hotéis, motoristas e espaços para eventos</p>
      </div>

      {editingPolicy ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar Política de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentPolicyEditor
              providerId={editingPolicy.id}
              providerType={editingPolicy.type}
              providerName={`${editingPolicy.type === 'hotel' ? 'Hotel' : editingPolicy.type === 'driver' ? 'Motorista' : 'Espaço'} ${editingPolicy.id}`}
              onSuccess={handlePolicySaved}
              onCancel={() => setEditingPolicy(null)}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Type Selector */}
          <Tabs
            value={selectedType}
            onValueChange={(v) => {
              setSelectedType(v as 'hotel' | 'driver' | 'event_space');
              setSelectedId('');
            }}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="hotel">🏨 Hotéis</TabsTrigger>
              <TabsTrigger value="driver">🚗 Motoristas</TabsTrigger>
              <TabsTrigger value="event_space">🎪 Espaços para Eventos</TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder={`Buscar por ID de ${selectedType === 'hotel' ? 'hotel' : selectedType === 'driver' ? 'motorista' : 'espaço'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <TabsContent value="hotel">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Políticas de Hotéis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Hotel ID"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      />
                      <Button
                        onClick={() => handleEditPolicy(selectedId, 'hotel')}
                        disabled={!selectedId}
                      >
                        Editar Política
                      </Button>
                    </div>

                    {selectedId && (
                      <PaymentPolicyDisplay
                        providerId={selectedId}
                        providerType="hotel"
                        providerName={`Hotel ${selectedId}`}
                        compact={false}
                      />
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Padrões de Hotel</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>💰 Depósito: 30%</li>
                        <li>📅 Pagamento antecipado: 0%</li>
                        <li>⏳ Pagamento final: 7 dias</li>
                        <li>📍 No local: Ativado</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="driver">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Políticas de Motoristas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Motorista ID"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      />
                      <Button
                        onClick={() => handleEditPolicy(selectedId, 'driver')}
                        disabled={!selectedId}
                      >
                        Editar Política
                      </Button>
                    </div>

                    {selectedId && (
                      <PaymentPolicyDisplay
                        providerId={selectedId}
                        providerType="driver"
                        providerName={`Motorista ${selectedId}`}
                        compact={false}
                      />
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Padrões de Motorista</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>📍 No local: Ativado</li>
                        <li>📅 Pagamento antecipado: 0%</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="event_space">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Políticas de Espaços para Eventos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Espaço ID"
                        value={selectedId}
                        onChange={(e) => setSelectedId(e.target.value)}
                      />
                      <Button
                        onClick={() => handleEditPolicy(selectedId, 'event_space')}
                        disabled={!selectedId}
                      >
                        Editar Política
                      </Button>
                    </div>

                    {selectedId && (
                      <PaymentPolicyDisplay
                        providerId={selectedId}
                        providerType="event_space"
                        providerName={`Espaço ${selectedId}`}
                        compact={false}
                      />
                    )}

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Padrões de Espaço para Eventos</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>🔖 Antecipado: 50%</li>
                        <li>⏳ Pagamento final: 14 dias</li>
                        <li>↩️ Reembolso total: até 30 dias</li>
                        <li>↩️ Reembolso parcial: até 14 dias</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
