import { useEffect, useState } from 'react';
import { PaymentPolicyDisplay } from '@/components/PaymentPolicyDisplay';
import { PaymentPolicyEditor } from '@/components/PaymentPolicyEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export default function PaymentSettingsPage() {
  const [driverId, setDriverId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || '';
    setDriverId(userId);
  }, []);

  if (!driverId) {
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
        <p className="text-gray-600 mt-2">Gerencie as suas políticas de pagamento de corridas</p>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar Política de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentPolicyEditor
              providerId={driverId}
              providerType="driver"
              providerName="Minha Política"
              onSuccess={() => {
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Policy */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Política Atual</CardTitle>
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                  ✏️ Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <PaymentPolicyDisplay
                providerId={driverId}
                providerType="driver"
                providerName="Sua Política"
                compact={false}
              />
            </CardContent>
          </Card>

          {/* Information */}
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-amber-900">ℹ️ Informações sobre Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-900 space-y-3">
              <div>
                <p className="font-semibold">Pagamento no Local</p>
                <p className="text-sm">Permite que os passageiros paguem diretamente no final da corrida. Ativado por padrão.</p>
              </div>
              <div>
                <p className="font-semibold">Pagamento Antecipado</p>
                <p className="text-sm">Permite que os passageiros paguem uma porcentagem antes da corrida. Útil para longas distâncias.</p>
              </div>
              <div className="pt-3 border-t border-amber-200">
                <p className="text-sm font-semibold">💡 Dica:</p>
                <p className="text-sm">Configure a política que melhor se adequa ao seu estilo de trabalho para atrair mais passageiros.</p>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900">Como faço para alterar minha política?</p>
                <p className="text-gray-600 text-sm">Clique no botão "Editar" acima para modificar suas configurações de pagamento.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Os passageiros verão minha política?</p>
                <p className="text-gray-600 text-sm">Sim, a política é exibida no aplicativo do passageiro ao fazer uma reserva.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Posso mudar a política a qualquer momento?</p>
                <p className="text-gray-600 text-sm">Sim, você pode atualizar suas configurações de pagamento a qualquer momento.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
