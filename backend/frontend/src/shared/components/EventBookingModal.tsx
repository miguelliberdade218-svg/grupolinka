import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Calendar, MapPin, Users, Clock, Star, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { formatMzn } from "@/shared/lib/currency";
import PaymentModal from "./PaymentModal";
import type { Event, EventPartnership } from "@shared/schema";

interface EventBookingModalProps {
  event: Event;
  partnerships: EventPartnership[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EventBookingModal({ event, partnerships, open, onOpenChange }: EventBookingModalProps) {
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedPartnership, setSelectedPartnership] = useState<EventPartnership | null>(null);
  const [specialRequests, setSpecialRequests] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const basePrice = parseFloat(event.ticketPrice || "0");
  const subtotal = basePrice * ticketQuantity;
  const discountAmount = selectedPartnership 
    ? (subtotal * parseFloat(selectedPartnership.discountPercentage)) / 100 
    : 0;
  const platformFee = (subtotal - discountAmount) * 0.1; // 10% platform fee
  const totalPrice = subtotal - discountAmount + platformFee;

  const handleBooking = () => {
    const bookingData = {
      eventId: event.id,
      ticketQuantity,
      totalPrice: totalPrice.toFixed(2),
      partnershipUsed: selectedPartnership?.id || null,
      discountApplied: discountAmount.toFixed(2),
      specialRequests,
    };
    
    console.log("Event booking:", bookingData);
    setShowPayment(true);
  };

  const availablePartnerships = partnerships.filter(p => p.isActive && ticketQuantity >= p.minEventTickets);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">🎟️</span>
              <span>Reservar Bilhetes - {event.title}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">
                      {format(new Date(event.startDate), "EEEE, dd 'de' MMMM 'de' yyyy")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{event.venue}</p>
                    <p className="text-sm text-gray-600">{event.address}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm">
                      {event.currentAttendees}/{event.maxAttendees} participantes
                    </span>
                  </div>
                  
                  {event.isFeatured && (
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Evento Destaque
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quantidade de Bilhetes</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="10"
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(parseInt(e.target.value) || 1)}
                    data-testid="ticket-quantity"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Preço por Bilhete</Label>
                  <div className="text-lg font-bold text-purple-600">
                    {formatMzn(basePrice)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Subtotal</Label>
                  <div className="text-lg font-bold">
                    {formatMzn(subtotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* Partnership Offers */}
            {availablePartnerships.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <i className="fas fa-handshake mr-2 text-green-600"></i>
                  Ofertas Especiais Disponíveis
                </h3>
                
                <div className="space-y-3">
                  {availablePartnerships.map((partnership) => (
                    <Card 
                      key={partnership.id}
                      className={`cursor-pointer transition-all ${
                        selectedPartnership?.id === partnership.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => setSelectedPartnership(
                        selectedPartnership?.id === partnership.id ? null : partnership
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              selectedPartnership?.id === partnership.id
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300'
                            }`} />
                            
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{partnership.partnerName}</span>
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  {partnership.partnerType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{partnership.specialOffer}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              -{partnership.discountPercentage}%
                            </div>
                            <div className="text-sm text-gray-500">
                              Poupe {formatMzn((subtotal * parseFloat(partnership.discountPercentage)) / 100)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div className="space-y-2">
              <Label htmlFor="requests">Pedidos Especiais (Opcional)</Label>
              <Textarea
                id="requests"
                placeholder="Necessidades especiais, alergias alimentares, etc."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
                data-testid="special-requests"
              />
            </div>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Resumo do Pagamento</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{ticketQuantity}x Bilhetes</span>
                  <span>{formatMzn(subtotal)}</span>
                </div>
                
                {selectedPartnership && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto ({selectedPartnership.partnerName})</span>
                    <span>-{formatMzn(discountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxa da plataforma (10%)</span>
                  <span>{formatMzn(platformFee)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-purple-600">{formatMzn(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              <Button
                onClick={handleBooking}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                data-testid="confirm-booking"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Confirmar e Pagar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          bookingDetails={{
            type: "event",
            title: event.title,
            details: `${ticketQuantity} bilhetes para ${event.title}`,
            date: format(new Date(event.startDate), "dd/MM/yyyy"),
            location: event.venue,
            amount: totalPrice,
            fees: platformFee,
            discount: discountAmount,
            total: totalPrice
          }}
          onPaymentSuccess={() => {
            setShowPayment(false);
            onOpenChange(false);
            // TODO: Add success notification
          }}
        />
      )}
    </>
  );
}