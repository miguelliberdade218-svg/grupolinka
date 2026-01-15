import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import { apiRequest } from "@/shared/lib/queryClient";
import type { Ride, Accommodation } from "@shared/schema";

interface BookingModalProps {
  type: "ride" | "stay";
  item: Ride | Accommodation;
  searchParams: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ type, item, searchParams, isOpen, onClose }: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethod] = useState("Visa ****4242");

  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: `Your ${type} has been successfully booked.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmBooking = () => {
    const bookingData = {
      userId: "mock-user-id", // In real app, this would come from auth
      type: type,
      status: "confirmed",
      totalPrice: type === "ride" 
        ? (item as Ride).price 
        : (item as Accommodation).pricePerNight,
      paymentMethod: "visa_4242",
      ...(type === "ride" 
        ? { 
            rideId: item.id,
            pickupTime: new Date(searchParams.when),
          }
        : { 
            accommodationId: item.id,
            checkInDate: new Date(searchParams.checkIn),
            checkOutDate: new Date(searchParams.checkOut),
            nights: Math.ceil(
              (new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) 
              / (1000 * 60 * 60 * 24)
            ),
            guests: 1,
          }
      ),
    };

    bookingMutation.mutate(bookingData);
  };

  const isRide = type === "ride";
  const ride = isRide ? item as Ride : null;
  const accommodation = !isRide ? item as Accommodation : null;

  const calculatePricing = () => {
    if (isRide && ride) {
      const basePrice = parseFloat(ride.price);
      return {
        baseFare: (basePrice * 0.6).toFixed(2),
        distance: (basePrice * 0.25).toFixed(2),
        time: (basePrice * 0.15).toFixed(2),
        total: ride.price,
      };
    } else if (accommodation) {
      const nights = Math.ceil(
        (new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) 
        / (1000 * 60 * 60 * 24)
      );
      const pricePerNight = parseFloat(accommodation.pricePerNight);
      const subtotal = pricePerNight * nights;
      const taxes = subtotal * 0.12;
      const fees = 15;
      
      return {
        nights,
        pricePerNight: accommodation.pricePerNight,
        subtotal: subtotal.toFixed(2),
        taxes: taxes.toFixed(2),
        fees: fees.toFixed(2),
        total: (subtotal + taxes + fees).toFixed(2),
      };
    }
    return null;
  };

  const pricing = calculatePricing();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark">
            Confirmar Reserva
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <div className="bg-gray-light rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <i className={`fas ${isRide ? "fa-car" : "fa-bed"} text-gray-600`}></i>
              </div>
              <div>
                <p className="font-medium text-dark">
                  {isRide ? ride?.type : accommodation?.name}
                </p>
                <p className="text-sm text-gray-medium">
                  {isRide 
                    ? `${ride?.availableIn} min away`
                    : accommodation?.address
                  }
                </p>
              </div>
            </div>
            
            {isRide && (
              <div className="text-sm text-gray-medium space-y-1">
                <p>De: <span className="text-dark">{searchParams.from}</span></p>
                <p>Para: <span className="text-dark">{searchParams.to}</span></p>
                <p>Quando: <span className="text-dark">
                  {new Date(searchParams.when).toLocaleString()}
                </span></p>
                {ride?.estimatedDistance && (
                  <p>Distância: <span className="text-dark">{ride.estimatedDistance} km</span></p>
                )}
              </div>
            )}

            {!isRide && (
              <div className="text-sm text-gray-medium space-y-1">
                <p>Check-in: <span className="text-dark">
                  {new Date(searchParams.checkIn).toLocaleDateString()}
                </span></p>
                <p>Check-out: <span className="text-dark">
                  {new Date(searchParams.checkOut).toLocaleDateString()}
                </span></p>
                <p>Hóspedes: <span className="text-dark">1 adulto</span></p>
                {pricing && (
                  <p>Duração: <span className="text-dark">{pricing.nights} noites</span></p>
                )}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          {pricing && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-dark mb-2">Detalhes do Preço</h4>
              <div className="space-y-2 text-sm">
                {isRide ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-medium">Tarifa base</span>
                      <span>{pricing.baseFare} MZN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-medium">Distância</span>
                      <span>{pricing.distance} MZN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-medium">Tempo</span>
                      <span>{pricing.time} MZN</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-medium">
                        {pricing.pricePerNight} MZN x {pricing.nights} noites
                      </span>
                      <span>{pricing.subtotal} MZN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-medium">Impostos</span>
                      <span>{pricing.taxes} MZN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-medium">Taxas de serviço</span>
                      <span>{pricing.fees} MZN</span>
                    </div>
                  </>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{pricing.total} MZN</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-dark mb-2">Método de Pagamento</h4>
            <div className="flex items-center space-x-3">
              <i className="fab fa-cc-visa text-2xl text-blue-600"></i>
              <div>
                <p className="text-sm text-dark">{paymentMethod}</p>
                <p className="text-xs text-gray-medium">Expira 12/25</p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            data-testid="button-confirm-booking"
            onClick={handleConfirmBooking}
            disabled={bookingMutation.isPending}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            {bookingMutation.isPending ? (
              <span className="flex items-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processando...
              </span>
            ) : (
              "Confirmar Reserva"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}