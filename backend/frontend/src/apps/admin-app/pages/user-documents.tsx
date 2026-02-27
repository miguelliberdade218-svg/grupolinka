// src/apps/admin-app/pages/user-documents.tsx - Gestão de Documentos de Usuários
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FileText, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';

export default function UserDocuments() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/users?page=1&limit=50&search=${search}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSelectUser = async (user: any) => {
    setSelectedUser(user);
    // Carrega documentos do usuário
    try {
      const res = await fetch(
        `/api/admin/users/${user.id}/documents`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">📄 Documentos de Usuários</h1>
        <p className="text-gray-600">Revise e valide documentos de motoristas e gerentes de hotéis</p>
      </div>

      {/* Search and List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                placeholder="Pesquisar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-gray-500 p-4">Carregando...</p>
                ) : users.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4">Nenhum usuário encontrado</p>
                ) : (
                  users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-sm">{user.fullName}</div>
                      <div className="text-xs text-gray-600 truncate">{user.email}</div>
                      <div className="text-xs mt-1 space-x-1">
                        {user.can_drive && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">🚗</span>}
                        {user.can_manage_hotels && <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded">🏨</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document Details */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Documentos de {selectedUser.fullName}</span>
                  <span className="text-sm font-normal text-gray-600">{documents.length} documento(s)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum documento enviado por este usuário</p>
                  </div>
                ) : (
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
