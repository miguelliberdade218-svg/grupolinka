import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { formatMzn } from "@/shared/lib/currency";
import type { Ride, PriceNegotiation } from "@shared/schema";

interface PriceNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  existingNegotiation?: PriceNegotiation;
  onSubmit: (negotiationData: any) => void;
}

export default function PriceNegotiationModal({ 
  isOpen, 
  onClose, 
  ride, 
  existingNegotiation,
  onSubmit 
}: PriceNegotiationModalProps) {
  const [proposedPrice, setProposedPrice] = useState(
    existingNegotiation?.proposedPrice || ""
  );
  const [message, setMessage] = useState("");
  const [isCounterOffer, setIsCounterOffer] = useState(false);
  const { toast } = useToast();

  const originalPrice = parseFloat(ride.price || "0");
  const minPrice = parseFloat(ride.minPrice || "0");
  const maxPrice = parseFloat(ride.maxPrice || "0");
  const proposedAmount = parseFloat(proposedPrice);

  const handleSubmit = () => {
    if (!proposedPrice) {
      toast({
        title: "Preço Obrigatório",
        description: "Por favor, insira um preço para a negociação",
        variant: "destructive"
      });
      return;
    }

    if (proposedAmount < minPrice || proposedAmount > maxPrice) {
      toast({
        title: "Preço Fora do Intervalo",
        description: `O preço deve estar entre ${formatMzn(minPrice)} e ${formatMzn(maxPrice)}`,
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      rideId: ride.id,
      proposedPrice: proposedAmount,
      message: message.trim(),
      originalPrice,
      isCounterOffer
    });

    onClose();
    
    toast({
      title: "Negociação Enviada",
      description: "Sua proposta foi enviada ao motorista",
    });
  };

  const handleAcceptCounter = (counterPrice: number) => {
    onSubmit({
      rideId: ride.id,
      proposedPrice: counterPrice,
      message: "Aceito a contraproposta",
      originalPrice,
      isAccepting: true
    });

    onClose();
    
    toast({
      title: "Contraproposta Aceita",
      description: "Você aceitou a contraproposta do motorista",
    });
  };

  const savingAmount = originalPrice - proposedAmount;
  const savingPercentage = originalPrice > 0 ? ((savingAmount / originalPrice) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-dark">
            Negociar Preço da Viagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Information */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Rota:</span>
                  <span className="font-semibold">{ride.fromAddress} → {ride.toAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Motorista:</span>
                  <span>{ride.driverName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Preço Original:</span>
                  <span className="text-lg font-bold text-primary">{formatMzn(originalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Intervalo de Negociação:</span>
                  <span className="text-sm">{formatMzn(minPrice)} - {formatMzn(maxPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Negotiation Status */}
          {existingNegotiation && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Status da Negociação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Sua Proposta:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{formatMzn(parseFloat(existingNegotiation.proposedPrice || "0"))}</span>
                      <Badge variant={
                        existingNegotiation.status === "accepted" ? "default" :
                        existingNegotiation.status === "rejected" ? "destructive" :
                        existingNegotiation.status === "countered" ? "secondary" : "outline"
                      }>
                        {existingNegotiation.status === "accepted" ? "Aceita" :
                         existingNegotiation.status === "rejected" ? "Rejeitada" :
                         existingNegotiation.status === "countered" ? "Contraproposta" : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  {existingNegotiation.counterPrice && existingNegotiation.status === "countered" && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Contraproposta do Motorista:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatMzn(parseFloat(existingNegotiation.counterPrice))}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptCounter(parseFloat(existingNegotiation.counterPrice || "0"))}
                          data-testid="button-accept-counter"
                        >
                          Aceitar Contraproposta
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsCounterOffer(true)}
                          data-testid="button-make-counter"
                        >
                          Fazer Nova Proposta
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Negotiation Form */}
          {(!existingNegotiation || existingNegotiation.status === "rejected" || isCounterOffer) && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="proposedPrice">Seu Preço Proposto</Label>
                <Input
                  id="proposedPrice"
                  type="number"
                  step="0.01"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-proposed-price"
                  className="text-lg"
                />
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-medium">Intervalo válido:</span>
                    <span>{formatMzn(minPrice)} - {formatMzn(maxPrice)}</span>
                  </div>
                  {proposedAmount > 0 && proposedAmount >= minPrice && proposedAmount <= maxPrice && (
                    <div className="flex justify-between text-green-600">
                      <span>Economia:</span>
                      <span>
                        {formatMzn(savingAmount)} ({savingPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                  {proposedAmount > 0 && (proposedAmount < minPrice || proposedAmount > maxPrice) && (
                    <p className="text-red-500">
                      Preço fora do intervalo permitido
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="message">Mensagem (opcional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explique sua proposta ou adicione comentários..."
                  rows={3}
                  data-testid="textarea-negotiation-message"
                />
              </div>

              {/* Price Comparison */}
              {proposedAmount > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Comparação de Preços</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Preço Original:</span>
                        <span className="line-through text-gray-500">{formatMzn(originalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seu Preço:</span>
                        <span className="font-bold text-primary">{formatMzn(proposedAmount)}</span>
                      </div>
                      {savingAmount > 0 && (
                        <div className="flex justify-between text-green-600 font-semibold">
                          <span>Economia:</span>
                          <span>{formatMzn(savingAmount)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-negotiation">
            Cancelar
          </Button>
          {(!existingNegotiation || existingNegotiation.status === "rejected" || isCounterOffer) && (
            <Button onClick={handleSubmit} data-testid="button-submit-negotiation">
              Enviar Proposta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}