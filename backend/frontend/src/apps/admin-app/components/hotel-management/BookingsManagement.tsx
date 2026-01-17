import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { 
  CheckCircle2Icon, 
  AlertTriangle, 
  Clock,
  CheckIcon,
  XIcon,
  UserCheckIcon,
  LogOutIcon,
  CreditCardIcon
} from 'lucide-react';
import { apiService } from '@/shared/lib/api';
import { useToast } from '@/shared/hooks/use-toast';

interface Booking {
  id: string;
  type: 'room' | 'event';
  guestName: string;
  email: string;
  room?: string;
  space?: string;
  checkIn: string;
  checkOut: string;
  date?: string;
  duration?: string;
  guests?: number;
  nights?: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  payment: 'pending' | 'paid' | 'refunded' | 'failed';
  total: number;
}

interface BookingsManagementProps {
  hotelId: string;
}

/**
 * Componente para gerenciar todas as reservas (rooms + spaces)
 * Permite atualização manual de estados de pagamento e check-in/check-out
 */
export const BookingsManagement: React.FC<BookingsManagementProps> = ({ hotelId }) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      type: 'room',
      guestName: 'João Silva',
      email: 'joao@email.com',
      room: 'Quarto Duplo Deluxe',
      checkIn: '15 Jan 2026',
      checkOut: '18 Jan 2026',
      nights: 3,
      status: 'confirmed',
      payment: 'paid',
      total: 13500,
    },
    {
      id: '2',
      type: 'event',
      guestName: 'Tech Summit Ltd',
      email: 'contact@techsummit.com',
      space: 'Sala de Conferência A',
      date: '20 Jan 2026',
      duration: '8 horas',
      guests: 75,
      status: 'pending',
      payment: 'pending',
      total: 5000,
    },
    {
      id: '3',
      type: 'room',
      guestName: 'Maria Santos',
      email: 'maria@email.com',
      room: 'Suite Executiva',
      checkIn: '22 Jan 2026',
      checkOut: '25 Jan 2026',
      nights: 3,
      status: 'confirmed',
      payment: 'paid',
      total: 19500,
        },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-600 text-white">Confirmada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white">Pendente</Badge>;
      case 'checked-in':
        return <Badge className="bg-blue-600 text-white">Check-in</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (payment: string) => {
    switch (payment) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>;
      default:
        return <Badge>{payment}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-dark">Gestão de Reservas</h3>
        <div className="text-sm text-muted-foreground">
          Total: {bookings.length} reservas
        </div>
      </div>

      <div className="space-y-3">
        {bookings.map((booking) => (
          <Card key={booking.id} className="p-4">
            <div className="grid md:grid-cols-12 gap-4">
              {/* Tipo e Hóspede */}
              <div className="md:col-span-3">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-semibold text-dark capitalize mb-2">
                  {booking.type === 'room' ? '🛏️ Quarto' : '📅 Evento'}
                </p>
                <p className="text-sm text-dark font-medium">{booking.guestName}</p>
                <p className="text-xs text-muted-foreground">{booking.email}</p>
              </div>

              {/* Detalhes */}
              <div className="md:col-span-3">
                <p className="text-xs text-muted-foreground">
                  {booking.type === 'room' ? 'Quarto / Datas' : 'Espaço / Data'}
                </p>
                {booking.type === 'room' ? (
                  <>
                    <p className="font-medium text-dark text-sm mb-1">{booking.room}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.checkIn} → {booking.checkOut}
                    </p>
                    <p className="text-xs text-muted-foreground">({booking.nights} noites)</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-dark text-sm mb-1">{booking.space}</p>
                    <p className="text-xs text-muted-foreground">{booking.date} ({booking.duration})</p>
                    <p className="text-xs text-muted-foreground">{booking.guests} pessoas</p>
                  </>
                )}
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(booking.status)}
                  {getPaymentBadge(booking.payment)}
                </div>
              </div>

              {/* Valor */}
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-xl font-bold text-primary">
                  {booking.total.toLocaleString()} MZN
                </p>
              </div>

              {/* Ações */}
              <div className="md:col-span-2 flex gap-2 items-end">
                <Button size="sm" variant="outline" className="flex-1">
                  Detalhes
                </Button>
                {booking.payment === 'pending' && (
                  <Button
                    size="sm"
                    className="bg-secondary hover:bg-secondary/90 text-dark flex-1"
                  >
                    Processar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats Quick */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2Icon className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Confirmadas</p>
              <p className="text-2xl font-bold text-dark">2</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-dark">1</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Pagamentos Pendentes</p>
              <p className="text-2xl font-bold text-dark">1</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingsManagement;
