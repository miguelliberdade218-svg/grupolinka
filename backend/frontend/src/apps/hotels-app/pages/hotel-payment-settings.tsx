import { useEffect, useState } from 'react';
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';
import { PaymentPolicyEditor } from '@/components/PaymentPolicyEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

export default function HotelPaymentSettingsPage() {
  const [hotelId, setHotelId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || '';
    setHotelId(userId);
  }, []);

  if (!hotelId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando informações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Configurações de Pagamento</h2>
        <p className="text-gray-600 mt-2">Gerencie as políticas de pagamento da sua propriedade</p>
      </div>

      <Tabs defaultValue="policy" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policy">Política Atual</TabsTrigger>
          <TabsTrigger value="preview">Visualização</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="policy">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Editar Política de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentPolicyEditor
                  providerId={hotelId}
                  providerType="hotel"
                  providerName="Meu Hotel"
                  onSuccess={() => {
                    setIsEditing(false);
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Política Atual</CardTitle>
                  <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                    ✏️ Editar Política
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PaymentPolicyDisplay
                  providerId={hotelId}
                  providerType="hotel"
                  providerName="Sua Propriedade"
                  compact={false}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Como os Hóspedes Verão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Resumo de Pagamento</h4>
                <PaymentPolicyDisplay
                  providerId={hotelId}
                  providerType="hotel"
                  providerName="Sua Propriedade"
                  compact={true}
                />
              </div>
              <p className="text-sm text-gray-600">Esta é a visualização em modo compacto que aparece nas listagens de propriedades.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sobre Depósito</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  O depósito é um valor cobrado no momento da reserva e deduzido da conta final.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Padrão: 30%</li>
                  <li>• Recomendado: 20-50%</li>
                  <li>• Mitiga o risco de cancelamentos</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sobre Pagamento Antecipado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  Permite que hóspedes paguem uma parte antes da hospedagem.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Padrão: 0% (desativado)</li>
                  <li>• Opcional: 10-50%</li>
                  <li>• Aumenta confirmações</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sobre Pagamento no Local</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  Permite que o hóspede pague parte do valor ao fazer check-in.
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Padrão: Ativado</li>
                  <li>• Requer confirma reserva antecipadamente</li>
                  <li>• Aumenta flexibilidade</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">💡 Recomendações</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-900 space-y-2">
                <p>✅ Defina um depósito razoável (20-30%) para reduzir cancelamentos</p>
                <p>✅ Mantenha pagamento no local ativado para oferecer flexibilidade</p>
                <p>✅ Use pagamento antecipado para reservas de longa duração</p>
                <p>✅ Revise sua política regularmente com base em seus padrões</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
