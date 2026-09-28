import { useState } from 'react';
import { ReviewsList } from '@/components/ReviewsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

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
                  <div className="space-y-4">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(doc.status)}
                            <div>
                              <p className="font-semibold text-sm">{doc.document_type}</p>
                              <p className="text-xs text-gray-600">{doc.file_name}</p>
                              <p className="text-xs text-gray-500 mt-1">Enviado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Visualizar"
                            >
                              <Eye className="h-5 w-5 text-blue-600" />
                            </a>
                            <a
                              href={doc.file_url}
                              download
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Baixar"
                            >
                              <Download className="h-5 w-5 text-green-600" />
                            </a>
                          </div>
                        </div>

                        {doc.status === 'pending' && selectedUser?.can_drive && (
                          <div className="mt-4 flex gap-2 pt-4 border-t">
                            <button className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium">
                              ✅ Aprovar
                            </button>
                            <button className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm font-medium">
                              ❌ Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione um usuário para visualizar seus documentos</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* User Capabilities Summary */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Capacidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="font-semibold text-sm mb-2">🚗 Motorista</p>
                <p className="text-sm">
                  Status: <span className={`font-bold ${selectedUser.can_drive ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedUser.driver_verification_status || 'Não aplicável'}
                  </span>
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-semibold text-sm mb-2">🏨 Gestor de Hotel</p>
                <p className="text-sm">
                  Status: <span className={`font-bold ${selectedUser.can_manage_hotels ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedUser.hotel_manager_verification_status || 'Não aplicável'}
                  </span>
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="font-semibold text-sm mb-2">📅 Cliente</p>
                <p className="text-sm">
                  Status: <span className={`font-bold ${selectedUser.can_book_services ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedUser.client_verification_status || 'Ativo'}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
