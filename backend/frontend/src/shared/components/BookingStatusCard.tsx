import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Calendar, MapPin, Users, Star } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/shared/lib/queryClient";

interface BookingStatusCardProps {
  booking: any;
  isProvider?: boolean;
  currentUserId: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending_approval":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "approved":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "confirmed":
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    case "rejected":
      return <XCircle className="w-4 h-4 text-red-500" />;
    case "completed":
      return <Star className="w-4 h-4 text-purple-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending_approval":
      return "Aguardando Aprovação";
    case "approved":
      return "Aprovado";
    case "confirmed":
      return "Confirmado";
    case "rejected":
      return "Rejeitado";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    default:
      return "Desconhecido";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending_approval":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "completed":
      return "bg-purple-100 text-purple-800";
    case "cancelled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

const getServiceIcon = (type: string) => {
  switch (type) {
    case "ride":
      return "fas fa-car";
    case "stay":
      return "fas fa-bed";
    case "event":
      return "fas fa-calendar-alt";
    default:
      return "fas fa-question";
  }
};

export default function BookingStatusCard({ booking, isProvider = false, currentUserId }: BookingStatusCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bookings/${booking.id}/approve`, {
        providerId: currentUserId
      });
    },
    onSuccess: () => {
      toast({
        title: "Reserva Aprovada",
        description: "A reserva foi aprovada com sucesso. O cliente será notificado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a reserva. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bookings/${booking.id}/reject`, {
        providerId: currentUserId,
        reason: rejectReason
      });
    },
    onSuccess: () => {
      toast({
        title: "Reserva Rejeitada",
        description: "A reserva foi rejeitada. O cliente será notificado.",
      });
      setShowRejectModal(false);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a reserva. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/bookings/${booking.id}/confirm`, {
        userId: currentUserId
      });
    },
    onSuccess: () => {
      toast({
        title: "Reserva Confirmada",
        description: "Sua reserva foi confirmada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a reserva. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Motivo Obrigatório",
        description: "Por favor, forneça um motivo para a rejeição.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate();
  };

  const handleConfirm = () => {
    confirmMutation.mutate();
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return `${day}/${month}/${year} às ${time}`;
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <i className={`${getServiceIcon(booking.type)} text-primary text-lg`}></i>
              <span className="text-lg font-semibold">
                {booking.type === "ride" && "Viagem"}
                {booking.type === "stay" && "Hospedagem"}
                {booking.type === "event" && "Evento"}
              </span>
            </CardTitle>
            <Badge className={getStatusColor(booking.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(booking.status)}
                {getStatusText(booking.status)}
              </div>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">ID da Reserva:</p>
              <p className="font-mono text-xs">{booking.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-gray-600">Data da Solicitação:</p>
              <p>{formatDate(booking.requestedAt || booking.createdAt)}</p>
            </div>
            {booking.type === "ride" && (
              <>
                <div>
                  <p className="text-gray-600">Horário de Recolha:</p>
                  <p>{booking.pickupTime ? formatDate(booking.pickupTime) : "A definir"}</p>
                </div>
              </>
            )}
            {booking.type === "stay" && (
              <>
                <div>
                  <p className="text-gray-600">Check-in:</p>
                  <p>{booking.checkInDate ? formatDate(booking.checkInDate) : "A definir"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Check-out:</p>
                  <p>{booking.checkOutDate ? formatDate(booking.checkOutDate) : "A definir"}</p>
                </div>
                <div>
                  <p className="text-gray-600">Hóspedes:</p>
                  <p>{booking.guests || 1} pessoa{(booking.guests || 1) > 1 ? 's' : ''}</p>
                </div>
              </>
            )}
            {booking.type === "event" && (
              <div>
                <p className="text-gray-600">Bilhetes:</p>
                <p>{booking.ticketQuantity || 1} bilhete{(booking.ticketQuantity || 1) > 1 ? 's' : ''}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">Preço Total:</p>
              <p className="font-semibold text-primary">{booking.totalPrice} MZN</p>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Status da Reserva</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Solicitação enviada - {formatDate(booking.requestedAt || booking.createdAt)}</span>
              </div>
              
              {booking.status === "approved" || booking.status === "confirmed" || booking.status === "completed" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Aprovado pelo prestador - {booking.approvedAt ? formatDate(booking.approvedAt) : "Aguardando"}</span>
                </div>
              ) : booking.status === "rejected" ? (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>Rejeitado - {booking.rejectedAt ? formatDate(booking.rejectedAt) : ""}</span>
                  {booking.rejectionReason && (
                    <span className="text-gray-600">({booking.rejectionReason})</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span>Aguardando aprovação do prestador...</span>
                </div>
              )}

              {booking.status === "confirmed" || booking.status === "completed" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Confirmado pelo cliente - {booking.confirmedAt ? formatDate(booking.confirmedAt) : ""}</span>
                </div>
              ) : booking.status === "approved" && !isProvider ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Aguardando sua confirmação...</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          {isProvider && booking.status === "pending_approval" && (
            <div className="flex gap-3">
              <Button 
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="button-approve-booking"
              >
                {approveMutation.isPending ? "Aprovando..." : "Aprovar"}
              </Button>
              <Button 
                onClick={() => setShowRejectModal(true)}
                disabled={rejectMutation.isPending}
                variant="destructive"
                className="flex-1"
                data-testid="button-reject-booking"
              >
                Rejeitar
              </Button>
            </div>
          )}

          {!isProvider && booking.status === "approved" && (
            <Button 
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-confirm-booking"
            >
              {confirmMutation.isPending ? "Confirmando..." : "Confirmar Reserva"}
            </Button>
          )}

          {booking.status === "rejected" && booking.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 font-medium">Motivo da Rejeição:</p>
              <p className="text-red-700 text-sm">{booking.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Rejeitar Reserva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Por favor, forneça um motivo para a rejeição desta reserva:
            </p>
            <Textarea
              placeholder="Ex: Não tenho disponibilidade nesta data, veículo em manutenção, etc."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-rejection-reason"
            />
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowRejectModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                variant="destructive"
                className="flex-1"
                data-testid="button-confirm-rejection"
              >
                {rejectMutation.isPending ? "Rejeitando..." : "Confirmar Rejeição"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}