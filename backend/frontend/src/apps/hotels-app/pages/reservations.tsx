import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  X,
  EditIcon,
  Eye,
  ChevronDown,
} from 'lucide-react';

interface Reservation {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  notes: string;
}

interface HotelReservationsPageProps {
  hotelId?: string;
}

export default function HotelReservationsPage({
  hotelId = 'hotel-123',
}: HotelReservationsPageProps) {
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: 'RES-001',
      guestName: 'João Silva',
      email: 'joao@example.com',
      phone: '11 99999-9999',
      roomNumber: '401',
      roomType: 'Deluxe',
      checkIn: '25/01/2025',
      checkOut: '28/01/2025',
      nights: 3,
      guests: 2,
      totalPrice: 1245.00,
      status: 'confirmed',
      notes: 'Hóspede VIP, solicitou cortesia de frutas',
    },
    {
      id: 'RES-002',
      guestName: 'Maria Santos',
      email: 'maria@example.com',
      phone: '11 98888-8888',
      roomNumber: '205',
      roomType: 'Standard',
      checkIn: '26/01/2025',
      checkOut: '29/01/2025',
      nights: 3,
      guests: 1,
      totalPrice: 750.00,
      status: 'pending',
      notes: 'Primeira vez no hotel',
    },
    {
      id: 'RES-003',
      guestName: 'Carlos Pereira',
      email: 'carlos@example.com',
      phone: '11 97777-7777',
      roomNumber: '501',
      roomType: 'Suite',
      checkIn: '27/01/2025',
      checkOut: '30/01/2025',
      nights: 3,
      guests: 3,
      totalPrice: 2100.00,
      status: 'pending',
      notes: 'Conferência de negócios',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);

  const filteredReservations = reservations.filter((res) => {
    const statusMatch = filterStatus === 'all' || res.status === filterStatus;
    const searchMatch =
      res.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.roomNumber.includes(searchTerm);
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'completed':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-900';
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    const labels = {
      confirmed: '✅ Confirmada',
      pending: '⏳ Pendente',
      completed: '✓ Concluída',
      cancelled: '✗ Cancelada',
    };
    return labels[status];
  };

  const handleUpdateStatus = (id: string, newStatus: Reservation['status']) => {
    setReservations(
      reservations.map((res) =>
        res.id === id ? { ...res, status: newStatus } : res
      )
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gerenciar Reservas</h2>
        <p className="text-gray-600 mt-2">Controle total de suas reservas e hóspedes</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 text-sm">Total de Reservas</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{reservations.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 text-sm">Confirmadas</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {reservations.filter((r) => r.status === 'confirmed').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 text-sm">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">
              {reservations.filter((r) => r.status === 'pending').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 text-sm">Receita Estimada</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              R$ {reservations.reduce((sum, r) => sum + r.totalPrice, 0).toFixed(2).split('.')[0]}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Procure por hóspede, email ou quarto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex gap-2 flex-wrap">
            {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all'
                    ? 'Todas'
                    : status === 'confirmed'
                      ? '✅ Confirmadas'
                      : status === 'pending'
                        ? '⏳ Pendentes'
                        : status === 'completed'
                          ? '✓ Concluídas'
                          : '✗ Canceladas'}
                </button>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.length > 0 ? (
          filteredReservations.map((reservation) => (
            <Card
              key={reservation.id}
              className={`cursor-pointer transition hover:shadow-lg border-2 ${getStatusColor(
                reservation.status
              )}`}
            >
              <CardContent className="pt-6">
                <div
                  onClick={() =>
                    setExpandedReservation(
                      expandedReservation === reservation.id ? null : reservation.id
                    )
                  }
                >
                  {/* Main Row */}
                  <div className="flex gap-4">
                    {/* Left: Guest Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900 truncate">
                          {reservation.guestName}
                        </h3>
                        <div className="text-sm font-bold text-green-600 flex-shrink-0">
                          R$ {reservation.totalPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="space-y-1 mb-2 text-sm">
                        <p className="text-gray-600 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Quarto {reservation.roomNumber} ({reservation.roomType})
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {reservation.checkIn} → {reservation.checkOut} ({reservation.nights}{' '}
                          noite{reservation.nights > 1 ? 's' : ''})
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {reservation.guests} {reservation.guests === 1 ? 'hóspede' : 'hóspedes'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-block text-xs font-bold px-2 py-1 rounded ${
                          reservation.status === 'confirmed'
                            ? 'bg-green-200 text-green-900'
                            : reservation.status === 'pending'
                              ? 'bg-yellow-200 text-yellow-900'
                              : reservation.status === 'completed'
                                ? 'bg-blue-200 text-blue-900'
                                : 'bg-red-200 text-red-900'
                        }`}
                      >
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>

                    {/* Right: Arrow */}
                    <div className="flex items-center flex-shrink-0">
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition ${
                          expandedReservation === reservation.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedReservation === reservation.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {reservation.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Telefone</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {reservation.phone}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Observações</p>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded text-sm">
                          {reservation.notes || 'Nenhuma nota adicionada'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        {reservation.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(reservation.id, 'confirmed');
                              }}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              ✓ Confirmar
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(reservation.id, 'cancelled');
                              }}
                              variant="outline"
                              className="flex-1 bg-red-50"
                            >
                              ✗ Rejeitar
                            </Button>
                          </div>
                        )}

                        {reservation.status === 'confirmed' && (
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            📞 Contactar Hóspede
                          </Button>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1">
                            <EditIcon className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Nenhuma reserva encontrada com os filtros aplicados</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Button className="bg-blue-600 hover:bg-blue-700">
            ➕ Nova Reserva
          </Button>
          <Button variant="outline">
            📊 Gerar Relatório
          </Button>
          <Button variant="outline">
            📧 Enviar Lembretes
          </Button>
          <Button variant="outline">
            📅 Ver Calendário
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
