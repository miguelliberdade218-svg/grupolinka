import { useEffect, useState } from 'react';
import { ReviewsList } from '@/components/ReviewsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GuestReviewsPage() {
  const [hotelId, setHotelId] = useState<string>('');

  useEffect(() => {
    const userId = localStorage.getItem('userId') || '';
    setHotelId(userId);
  }, []);

  const chartData = [
    { rating: '5★', count: 42 },
    { rating: '4★', count: 28 },
    { rating: '3★', count: 12 },
    { rating: '2★', count: 5 },
    { rating: '1★', count: 2 },
  ];

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
        <h2 className="text-3xl font-bold text-gray-900">Avaliações de Hóspedes</h2>
        <p className="text-gray-600 mt-2">Veja como os hóspedes avaliam sua propriedade</p>
      </div>

      {/* Rating Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Rating Médio</p>
            <p className="text-3xl font-bold text-yellow-600">4.6/5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total de Avaliações</p>
            <p className="text-3xl font-bold text-gray-900">89</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">5 Estrelas</p>
            <p className="text-3xl font-bold text-green-600">42</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">4 Estrelas</p>
            <p className="text-3xl font-bold text-blue-600">28</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Críticas</p>
            <p className="text-3xl font-bold text-red-600">7</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="positive">Positivas</TabsTrigger>
          <TabsTrigger value="neutral">Neutras</TabsTrigger>
          <TabsTrigger value="negative">Críticas</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                <p>Carregando avaliações de hóspedes...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positive">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Positivas (4-5 Estrelas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                <p>Mostrando 42 + 28 = 70 avaliações positivas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neutral">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Neutras (3 Estrelas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                <p>Mostrando 12 avaliações neutras</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negative">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações Críticas (1-2 Estrelas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                <p>Mostrando 5 + 2 = 7 avaliações críticas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">✨ Dicas para Melhorar seu Rating</CardTitle>
        </CardHeader>
        <CardContent className="text-green-900 space-y-2">
          <p>✅ Mantenha a propriedade limpa e bem organizada</p>
          <p>✅ Responda rapidamente às mensagens dos hóspedes</p>
          <p>✅ Ofereça serviços adicionais de qualidade</p>
          <p>✅ Atualize as fotos e descrição regularmente</p>
          <p>✅ Solucione problemas rapidamente</p>
        </CardContent>
      </Card>
    </div>
  );
}
