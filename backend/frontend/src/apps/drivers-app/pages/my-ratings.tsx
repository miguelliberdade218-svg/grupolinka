import { useEffect, useState } from 'react';
import { DriverRatingsDisplay } from '@/components/DriverRatingsDisplay';
import { ReviewsList } from '@/components/ReviewsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

export default function MyRatingsPage() {
  const [driverId, setDriverId] = useState<string>('');

  useEffect(() => {
    // Get driver ID from auth/context
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
        <h2 className="text-3xl font-bold text-gray-900">Meus Ratings</h2>
        <p className="text-gray-600 mt-2">Veja como os passageiros avaliam seus serviços</p>
      </div>

      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral de Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <DriverRatingsDisplay
            driverId={driverId}
            driverName="Você"
            compact={false}
          />
        </CardContent>
      </Card>

      {/* Reviews Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Todas as Avaliações</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Minhas Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList
                filterType="passenger"
                userId={driverId}
                maxResults={30}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList
                filterType="passenger"
                userId={driverId}
                maxResults={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Dicas para Melhorar seu Rating</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 space-y-2">
          <p>✅ Mantenha o veículo limpo e bem conservado</p>
          <p>✅ Seja educado e profissional com os passageiros</p>
          <p>✅ Respeite as rotas e horários combinados</p>
          <p>✅ Mantenha as comunicações claras</p>
          <p>✅ Cumpra as políticas de segurança</p>
        </CardContent>
      </Card>
    </div>
  );
}
