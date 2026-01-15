import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import LoyaltyProgram from "@/shared/components/LoyaltyProgram";
import PageHeader from "@/shared/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { formatMzn } from "@/shared/lib/currency";
import { formatDateToDDMMYYYY, formatDepartureTime } from "@/shared/lib/dateUtils";
// Logo is now served from public directory
import MobileNavigation from "@/shared/components/MobileNavigation";
import type { Booking, Payment } from "@shared/schema";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("bookings");
  const [transactionFilter, setTransactionFilter] = useState("all");

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/user/mock-user-id"],
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<{
    transactions: Payment[];
    total: number;
  }>({
    queryKey: ["/api/payments/transactions", transactionFilter],
    enabled: activeTab === "transactions",
  });

  const transactions = transactionsData?.transactions || [];

  if (bookingsLoading) {
    return (
      <div className="min-h-screen bg-gray-light p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const currentBookings = bookings.filter(
    booking => booking.status === "confirmed" || booking.status === "pending"
  );
  const pastBookings = bookings.filter(booking => booking.status === "completed");

  return (
    <div className="min-h-screen bg-gray-light dark:bg-gray-900">
      <PageHeader title="Minha Conta" />

      <div className="max-w-6xl mx-auto p-6">

        {/* Loyalty Program Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <LoyaltyProgram showFullView={false} />
          </div>
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <i className="fas fa-star mr-2"></i>
                  Dica de Fidelidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700 mb-3">
                  Complete mais uma viagem este mês para ganhar o bónus de 25 pontos!
                </p>
                <Link href="/loyalty">
                  <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-800 hover:bg-blue-100">
                    Ver Programa Completo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <i className="fas fa-calendar-alt"></i>
              Minhas Reservas
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <i className="fas fa-credit-card"></i>
              Transações & Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-calendar-alt text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-dark mb-2">Nenhuma reserva ainda</h3>
                  <p className="text-gray-medium mb-4">
                    Comece a planear a sua viagem procurando viagens ou hospedagens
                  </p>
                  <Link href="/">
                    <button className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                      Pesquisar Agora
                    </button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-dark">Reservas Actuais</h3>
                {currentBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-dark">{booking.type}</h4>
                          <p className="text-gray-medium">{booking.rideId || booking.accommodationId || 'Detalhes da reserva'}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                          <p className="text-sm text-gray-medium mt-1">{booking.pickupTime ? formatDateToDDMMYYYY(new Date(booking.pickupTime)) : formatDateToDDMMYYYY(new Date(booking.createdAt || ''))}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {pastBookings.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold text-dark mt-8">Reservas Anteriores</h3>
                    {pastBookings.map((booking) => (
                      <Card key={booking.id} className="opacity-75">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-dark">{booking.type}</h4>
                              <p className="text-gray-medium">{booking.rideId || booking.accommodationId || 'Detalhes da reserva'}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">Completo</Badge>
                              <p className="text-sm text-gray-medium mt-1">{booking.pickupTime ? formatDateToDDMMYYYY(new Date(booking.pickupTime)) : formatDateToDDMMYYYY(new Date(booking.createdAt || ''))}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-dark">Histórico de Transações</h3>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Serviços</SelectItem>
                  <SelectItem value="ride">Viagens</SelectItem>
                  <SelectItem value="accommodation">Hospedagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transactionsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-credit-card text-gray-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-dark mb-2">Nenhuma transação ainda</h3>
                  <p className="text-gray-medium">
                    As suas transações aparecerão aqui após fazer uma reserva
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction: any) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <i className={`fas ${
                              transaction.serviceType === 'ride' ? 'fa-car' :
                              transaction.serviceType === 'accommodation' ? 'fa-bed' :
                              transaction.serviceType === 'restaurant' ? 'fa-utensils' : 'fa-receipt'
                            } text-primary`}></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark">{transaction.serviceName}</h4>
                            <p className="text-sm text-gray-medium">
                              {formatDateToDDMMYYYY(new Date(transaction.createdAt))}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            transaction.paymentStatus === 'completed' ? 'default' :
                            transaction.paymentStatus === 'pending' ? 'secondary' :
                            transaction.paymentStatus === 'failed' ? 'destructive' : 'outline'
                          }>
                            {transaction.paymentStatus === 'completed' ? 'Pago' :
                             transaction.paymentStatus === 'pending' ? 'Pendente' :
                             transaction.paymentStatus === 'failed' ? 'Falhado' : 'Desconhecido'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-medium">Subtotal:</span>
                          <span>{formatMzn(transaction.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-medium">Taxa da Plataforma (10%):</span>
                          <span>{formatMzn(transaction.platformFee)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-semibold">Total:</span>
                          <span className="font-semibold">{formatMzn(transaction.total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-medium">Método:</span>
                          <span className="capitalize">
                            {transaction.paymentMethod === 'card' ? 'Cartão' :
                             transaction.paymentMethod === 'mpesa' ? 'M-Pesa' :
                             transaction.paymentMethod === 'bank' ? 'Transferência' : transaction.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  );
}