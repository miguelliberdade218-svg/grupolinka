// src/apps/hotels-app/components/event-spaces/EventSpaceBookingsList.tsx
// Componente para listar reservas de um espaço de eventos - VERSÃO COMPLETA

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  Loader2,
  Calendar,
  Users,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { apiService } from '@/services/api';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface EventSpaceBookingsListProps {
  spaceId: string;
  spaceName: string;
  onClose: () => void;
}

interface Booking {
  id: string;
  event_title: string;
  organizer_name: string;
  organizer_email: string;
  start_date: string;
  end_date: string;
  expected_attendees: number;
  status: string;
  total_price: string;
  created_at: string;
}

export const EventSpaceBookingsList: React.FC<EventSpaceBookingsListProps> = ({
  spaceId,
  spaceName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, [spaceId]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, dateFilter, searchTerm]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getEventSpaceBookings(spaceId, {
        limit: 100,
        offset: 0,
      });
      
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setError(res.error || 'Falha ao carregar reservas');
      }
    } catch (err: any) {
      setError('Erro de conexão');
      console.error('Erro ao carregar reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filtrar por data
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'upcoming') {
        filtered = filtered.filter(booking => new Date(booking.start_date) >= today);
      } else if (dateFilter === 'past') {
        filtered = filtered.filter(booking => new Date(booking.start_date) < today);
      } else if (dateFilter === 'today') {
        filtered = filtered.filter(booking => {
          const bookingDate = new Date(booking.start_date);
          return bookingDate.toDateString() === today.toDateString();
        });
      }
    }

    // Filtrar por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.event_title.toLowerCase().includes(term) ||
        booking.organizer_name.toLowerCase().includes(term) ||
        booking.organizer_email.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: string; label: string; icon: React.ReactNode }> = {
      'pending_approval': {
        variant: 'warning',
        label: 'Aguardando aprovação',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      'confirmed': {
        variant: 'success',
        label: 'Confirmado',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      'cancelled': {
        variant: 'destructive',
        label: 'Cancelado',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      'rejected': {
        variant: 'destructive',
        label: 'Rejeitado',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      'completed': {
        variant: 'default',
        label: 'Concluído',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
    };

    const statusInfo = statusMap[status] || { variant: 'default', label: status, icon: null };

    return (
      <Badge variant={statusInfo.variant as any} className="text-xs">
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '—' : num.toLocaleString('pt-MZ', {
      style: 'currency',
      currency: 'MZN',
      minimumFractionDigits: 0,
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
    } catch {
      return dateString;
    }
  };

  // Paginação
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const res = await apiService.confirmEventBooking(bookingId);
      if (res.success) {
        toast({
          title: '✅ Reserva confirmada',
          description: 'A reserva foi confirmada com sucesso',
          variant: 'success',
        });
        loadBookings();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({
        title: '❌ Erro ao confirmar',
        description: err.message || 'Falha ao confirmar reserva',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Reservas do Espaço</h3>
          <p className="text-sm text-gray-600">{spaceName}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadBookings}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending_approval">Aguardando aprovação</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Data</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as datas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="upcoming">Próximas</SelectItem>
                <SelectItem value="past">Passadas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Buscar</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por título, organizador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
          <div className="text-sm text-gray-600">Total de reservas</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-sm text-gray-600">Confirmadas</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {bookings.filter(b => b.status === 'pending_approval').length}
          </div>
          <div className="text-sm text-gray-600">Pendentes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Canceladas/Rejeitadas</div>
        </Card>
      </div>

      {/* Lista de reservas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <Button onClick={loadBookings} variant="outline">
            Tentar novamente
          </Button>
        </Card>
      ) : currentBookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-700 mb-2">
            Nenhuma reserva encontrada
          </h4>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Tente ajustar os filtros'
              : 'Este espaço ainda não tem reservas'}
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{booking.event_title}</h4>
                        <p className="text-sm text-gray-600">
                          {booking.organizer_name} • {booking.organizer_email}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium ml-2">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Participantes:</span>
                        <span className="font-medium ml-2">
                          {booking.expected_attendees}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium ml-2 text-green-600">
                          {formatCurrency(booking.total_price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Criada em:</span>
                        <span className="font-medium ml-2">
                          {formatDate(booking.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Abrir detalhes */}}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                    {booking.status === 'pending_approval' && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmBooking(booking.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} de {filteredBookings.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventSpaceBookingsList;