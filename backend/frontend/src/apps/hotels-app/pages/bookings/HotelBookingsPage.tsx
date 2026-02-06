// src/apps/hotels-app/pages/bookings/HotelBookingsPage.tsx
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  Calendar,
  Users,
  CreditCard,
  Plus,
  FileText,
  BarChart3,
  CheckCircle,
  DoorOpen,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useActiveHotel } from '@/contexts/ActiveHotelContext';
import { HotelBooking } from '@/shared/types/bookings';

// Import dos componentes
import { BookingFilters } from './components/BookingFilters';
import { BookingStats } from './components/BookingStats';
import { BookingList } from './components/BookingList';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { PaymentRegistrationModal } from './components/PaymentRegistrationModal';
import { useHotelBookings } from './hooks/useHotelBookings';

// Import do modal de cancelamento
import { CancelBookingModal } from './components/CancelBookingModal';

const HotelBookingsPage: React.FC = () => {
  const [location, navigate] = useLocation();
  const { activeHotel } = useActiveHotel();
  const { toast } = useToast();
  
  // Estados para modais
  const [selectedBooking, setSelectedBooking] = useState<HotelBooking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Hook para gestão de reservas
  const {
    bookings,
    loading,
    refreshing,
    error,
    filters,
    pagination,
    updateFilters,
    refresh,
    performAction,
    registerPayment,
    hasMore,
    totalCount,
  } = useHotelBookings({
    hotelId: activeHotel?.id,
    initialFilters: {
      status: activeTab === 'all' ? undefined : activeTab,
    },
    autoLoad: !!activeHotel?.id,
  });

  // Filtra bookings por tab ativa
  const filteredBookings = React.useMemo(() => {
    if (activeTab === 'all') return bookings;
    
    if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return bookings.filter(booking => 
        booking.check_in === today || booking.check_out === today
      );
    }
    
    if (activeTab === 'pending_payment') {
      return bookings.filter(booking => booking.payment_status !== 'paid');
    }
    
    return bookings.filter(booking => booking.status === activeTab);
  }, [bookings, activeTab]);

  const handleCheckIn = async (booking: HotelBooking) => {
    const result = await performAction(booking.id, 'checkIn', {
      notes: 'Check-in realizado pelo sistema',
    });
    
    if (result.success) {
      toast({
        title: 'Check-in realizado',
        description: `Check-in realizado para ${booking.guest_name}`,
      });
    }
  };

  const handleCheckOut = async (booking: HotelBooking) => {
    const result = await performAction(booking.id, 'checkOut', {
      notes: 'Check-out realizado pelo sistema',
    });
    
    if (result.success) {
      toast({
        title: 'Check-out realizado',
        description: `Check-out realizado para ${booking.guest_name}`,
      });
    }
  };

  const handleCancel = async (booking: HotelBooking, reason: string) => {
    const result = await performAction(booking.id, 'cancel', { reason });
    
    if (result.success) {
      toast({
        title: 'Reserva cancelada',
        description: `Reserva de ${booking.guest_name} foi cancelada`,
      });
      setShowCancelModal(false);
    }
  };

  const handleRegisterPayment = async (paymentData: any) => {
    if (!selectedBooking) return { success: false, error: 'Nenhuma reserva selecionada' };
    
    const result = await registerPayment(selectedBooking.id, paymentData);
    
    if (result.success) {
      toast({
        title: 'Pagamento registrado',
        description: 'Pagamento registrado com sucesso',
      });
      setShowPaymentModal(false);
    }
    
    return result;
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há reservas para exportar',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'ID',
      'Hóspede',
      'Email',
      'Telefone',
      'Check-in',
      'Check-out',
      'Noites',
      'Adultos',
      'Crianças',
      'Status',
      'Pagamento',
      'Valor Total',
      'Criada em',
    ];

    const csvRows = filteredBookings.map(booking => [
      booking.id,
      `"${booking.guest_name}"`,
      booking.guest_email,
      booking.guest_phone || '',
      booking.check_in,
      booking.check_out,
      booking.nights || 1,
      booking.adults,
      booking.children || 0,
      booking.status,
      booking.payment_status,
      parseFloat(booking.total_price || '0').toFixed(2),
      booking.created_at,
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reservas-${activeHotel?.name || 'hotel'}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Exportação concluída',
      description: `Arquivo CSV com ${filteredBookings.length} reservas baixado`,
    });
  };

  const handleClearFilters = () => {
    updateFilters({
      status: undefined,
      payment_status: undefined,
      startDate: undefined,
      endDate: undefined,
      guest_name: undefined,
      guest_email: undefined,
    });
  };

  // Se não há hotel selecionado
  if (!activeHotel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum hotel selecionado</h2>
          <p className="text-gray-600 mb-6">
            Selecione um hotel no menu superior para gerenciar suas reservas.
          </p>
          <Button
            onClick={() => navigate('/hotels/dashboard')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/hotels/dashboard')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Gestão de Reservas
                </h1>
              </div>
              <p className="text-gray-600 flex items-center gap-2">
                <span className="font-medium">{activeHotel.name}</span>
                <span className="text-gray-400">•</span>
                <span>{totalCount} reservas</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={filteredBookings.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
              
              <Button
                onClick={() => navigate('/hotels/dashboard')}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Reserva
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Estatísticas */}
        <BookingStats bookings={bookings} loading={loading} />

        {/* Filtros */}
        <BookingFilters
          filters={filters}
          onFilterChange={updateFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Tabs e Lista */}
        <Card className="overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b">
              <div className="px-6 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <TabsList className="bg-gray-100 p-1 overflow-x-auto flex-nowrap w-full md:w-auto">
                  <TabsTrigger value="all" className="flex items-center gap-2 whitespace-nowrap">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Todas</span>
                    <span className="ml-1 bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                      {bookings.length}
                    </span>
                  </TabsTrigger>
                  
                  <TabsTrigger value="today" className="flex items-center gap-2 whitespace-nowrap">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Hoje</span>
                  </TabsTrigger>
                  
                  <TabsTrigger value="confirmed" className="flex items-center gap-2 whitespace-nowrap">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Confirmadas</span>
                  </TabsTrigger>
                  
                  <TabsTrigger value="checked_in" className="flex items-center gap-2 whitespace-nowrap">
                    <DoorOpen className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Check-in</span>
                  </TabsTrigger>
                  
                  <TabsTrigger value="pending_payment" className="flex items-center gap-2 whitespace-nowrap">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Pagamento Pendente</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  Mostrando {filteredBookings.length} de {totalCount} reservas
                </div>
              </div>
            </div>

            <div className="p-6">
              {error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar reservas</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <Button onClick={refresh} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <>
                  <BookingList
                    bookings={filteredBookings}
                    loading={loading}
                    onViewDetails={(booking) => {
                      setSelectedBooking(booking);
                      setShowDetailsModal(true);
                    }}
                    onCheckIn={(booking) => {
                      setSelectedBooking(booking);
                      handleCheckIn(booking);
                    }}
                    onCheckOut={(booking) => {
                      setSelectedBooking(booking);
                      handleCheckOut(booking);
                    }}
                    onCancel={(booking) => {
                      setSelectedBooking(booking);
                      setShowCancelModal(true);
                    }}
                    onRegisterPayment={(booking) => {
                      setSelectedBooking(booking);
                      setShowPaymentModal(true);
                    }}
                  />
                  
                  {/* Load more button */}
                  {hasMore && !loading && (
                    <div className="mt-6 text-center">
                      <Button
                        onClick={() => {
                          // Implementar loadMore se necessário
                          toast({
                            title: 'Funcionalidade em desenvolvimento',
                            description: 'A paginação será implementada em breve',
                          });
                        }}
                        variant="outline"
                        className="mx-auto"
                      >
                        Carregar mais reservas
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Tabs>
        </Card>
      </div>

      {/* Modais */}
      <BookingDetailsModal
        booking={selectedBooking}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onCancel={(booking) => {
          setSelectedBooking(booking);
          setShowCancelModal(true);
        }}
        onRegisterPayment={(booking) => {
          setSelectedBooking(booking);
          setShowPaymentModal(true);
        }}
      />

      <PaymentRegistrationModal
        booking={selectedBooking}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onSubmit={handleRegisterPayment}
      />

      <CancelBookingModal
        booking={selectedBooking}
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onSubmit={handleCancel}
      />
    </div>
  );
};

export default HotelBookingsPage;