import { useState } from 'react';
import { ReviewsList } from '@/components/ReviewsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { formatDateTimeFriendly } from '@/utils/dateFormatter';

export default function ReviewsManagement() {
  const [selectedReview, setSelectedReview] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestão de Avaliações</h2>
        <p className="text-gray-600 mt-2">Monitore e gerencie as avaliações de motoristas e passageiros</p>
      </div>

      {/* Statísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total de Avaliações</p>
            <p className="text-3xl font-bold text-gray-900">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Avaliações de Motoristas</p>
            <p className="text-3xl font-bold text-blue-600">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Avaliações de Passageiros</p>
            <p className="text-3xl font-bold text-green-600">--</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Rating Médio do Sistema</p>
            <p className="text-3xl font-bold text-yellow-600">--</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes tipos de reviews */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="driver">De Motoristas</TabsTrigger>
          <TabsTrigger value="passenger">De Passageiros</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList
                filterType="all"
                maxResults={20}
                onReviewSelect={setSelectedReview}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações de Motoristas para Passageiros</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList
                filterType="driver"
                maxResults={20}
                onReviewSelect={setSelectedReview}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passenger">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações de Passageiros para Motoristas</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList
                filterType="passenger"
                maxResults={20}
                onReviewSelect={setSelectedReview}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail View */}
      {selectedReview && (
        <Card className="border-blue-500 border-2">
          <CardHeader>
            <CardTitle>Detalhes da Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">Tipo</p>
                <p className="text-gray-900">{selectedReview.type === 'passenger' ? 'De Passageiro para Motorista' : 'De Motorista para Passageiro'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Rating</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {selectedReview.driver_rating || selectedReview.passenger_behavior_rating || 0}/5
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Comentário</p>
              <p className="text-gray-900 p-3 bg-gray-50 rounded">{selectedReview.comment}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Data</p>
              <p className="text-gray-900">{formatDateTimeFriendly(selectedReview.created_at)}</p>
            </div>
            <button
              onClick={() => setSelectedReview(null)}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Fechar
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}