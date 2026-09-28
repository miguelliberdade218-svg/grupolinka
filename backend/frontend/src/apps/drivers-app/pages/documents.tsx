import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Eye,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface Document {
  id: string;
  type: 'cnh' | 'rg' | 'cpf' | 'address' | 'vehicle' | 'insurance';
  name: string;
  status: 'verified' | 'pending' | 'expired' | 'missing';
  expiryDate?: string;
  daysUntilExpiry?: number;
  uploadDate?: string;
  notes?: string;
}

interface DriverDocumentsPageProps {
  driverId?: string;
  driverName?: string;
}

export default function DriverDocumentsPage({
  driverId: _driverId = 'driver-123',
  driverName: _driverName = 'João Silva',
}: DriverDocumentsPageProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'doc-001',
      type: 'cnh',
      name: 'Carteira Nacional de Habilitação (CNH)',
      status: 'verified',
      expiryDate: '15/03/2026',
      daysUntilExpiry: 234,
      uploadDate: '10/01/2021',
      notes: 'Categoria B',
    },
    {
      id: 'doc-002',
      type: 'rg',
      name: 'Registro Geral (RG)',
      status: 'verified',
      expiryDate: '22/05/2030',
      daysUntilExpiry: 1890,
      uploadDate: '15/12/2023',
    },
    {
      id: 'doc-003',
      type: 'cpf',
      name: 'Cadastro de Pessoa Física (CPF)',
      status: 'verified',
      uploadDate: '15/12/2023',
      notes: 'Sem validade',
    },
    {
      id: 'doc-004',
      type: 'address',
      name: 'Comprovante de Residência',
      status: 'pending',
      uploadDate: '20/01/2025',
      notes: 'Em análise',
    },
    {
      id: 'doc-005',
      type: 'vehicle',
      name: 'Documento do Veículo (CRLV)',
      status: 'verified',
      expiryDate: '10/06/2025',
      daysUntilExpiry: 135,
      uploadDate: '10/01/2024',
    },
    {
      id: 'doc-006',
      type: 'insurance',
      name: 'Seguro Veicular',
      status: 'expired',
      expiryDate: '15/01/2025',
      daysUntilExpiry: -10,
      uploadDate: '15/01/2024',
      notes: '⚠️ Vencido - renovar urgentemente',
    },
  ]);

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'expired':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'missing':
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getStatusLabel = (status: Document['status']) => {
    const labels = {
      verified: '✅ Verificado',
      pending: '⏳ Pendente de Análise',
      expired: '❌ Vencido',
      missing: '📋 Faltando',
    };
    return labels[status];
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'missing':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const pendingCount = documents.filter((d) => d.status === 'pending').length;
  const expiredCount = documents.filter((d) => d.status === 'expired').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">📄 Meus Documentos</h2>
        <p className="text-gray-600 mt-2">Gerenciar documentos de verificação</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 text-sm">Total de Documentos</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{documents.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="pt-6 text-center">
            <p className="text-green-900 text-sm">Verificados</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{verifiedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <p className="text-yellow-900 text-sm">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-900 text-sm">Vencidos</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{expiredCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {expiredCount > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ⚠️ Documentos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-red-900 space-y-2 text-sm">
            <p>Você tem {expiredCount} documento(s) vencido(s). Renove para continuar ativo.</p>
            <Button className="bg-red-600 hover:bg-red-700 w-full mt-2">
              Renovar Documentos
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingCount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              ⏳ Análise em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-yellow-900 space-y-2 text-sm">
            <p>Você tem {pendingCount} documento(s) aguardando análise. Isso costuma levar 1-2 dias úteis.</p>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-3">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className={`border-2 cursor-pointer transition hover:shadow-lg ${getStatusColor(
              doc.status
            )}`}
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 text-3xl">
                  {doc.type === 'cnh'
                    ? '🎫'
                    : doc.type === 'rg'
                      ? '🆔'
                      : doc.type === 'cpf'
                        ? '🔢'
                        : doc.type === 'address'
                          ? '🏠'
                          : doc.type === 'vehicle'
                            ? '🚗'
                            : '🛡️'}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{doc.name}</h3>
                    {getStatusIcon(doc.status)}
                  </div>

                  <p className="text-sm font-semibold mb-2">
                    {getStatusLabel(doc.status)}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
                    {doc.uploadDate && (
                      <p>📅 Enviado: {doc.uploadDate}</p>
                    )}
                    {doc.expiryDate && (
                      <p
                        className={
                          doc.daysUntilExpiry && doc.daysUntilExpiry < 30
                            ? 'font-bold text-red-600'
                            : ''
                        }
                      >
                        ⏰ Expira: {doc.expiryDate}
                        {doc.daysUntilExpiry && ` (${doc.daysUntilExpiry} dias)`}
                      </p>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-xs text-gray-600 bg-white bg-opacity-50 p-1 rounded">
                      {doc.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {doc.status !== 'verified' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload New Document */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📤 Upload de Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-900 font-semibold mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-blue-800">
              Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              Selecionar Arquivo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>📋 Requisitos de Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-gray-900 mb-1">📸 Para Fotos:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Documento visível e legível</li>
              <li>Fundo branco ou neutro</li>
              <li>Iluminação adequada</li>
              <li>Sem reflexo de relógio ou câmera</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900 mb-1">📄 Para PDFs:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Arquivo legível em alta qualidade</li>
              <li>Tamanho máximo de 5MB</li>
              <li>Todas as páginas incluídas</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">❓ Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent className="text-green-900 space-y-3">
          <p className="text-sm">
            Se tiver dúvidas sobre o processo de verificação:
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-green-900 border-green-300">
              📚 Guias de Ajuda
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              💬 Contatar Suporte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
