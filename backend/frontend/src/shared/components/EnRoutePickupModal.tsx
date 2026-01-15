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
import type { Ride } from "@shared/schema";

interface EnRoutePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride;
  onSubmit: (pickupData: any) => void;
}

export default function EnRoutePickupModal({ 
  isOpen, 
  onClose, 
  ride,
  onSubmit 
}: EnRoutePickupModalProps) {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    destinationLocation: "",
    requestedSeats: 1,
    proposedPrice: "",
    message: ""
  });

  const { toast } = useToast();

  const basePrice = parseFloat(ride.price || "0");
  const proposedAmount = parseFloat(formData.proposedPrice || "0");

  const handleSubmit = () => {
    if (!formData.pickupLocation || !formData.destinationLocation) {
      toast({
        title: "Locais Obrigatórios",
        description: "Por favor, especifique o local de apanhar e destino",
        variant: "destructive"
      });
      return;
    }

    if (!formData.proposedPrice) {
      toast({
        title: "Preço Obrigatório",
        description: "Por favor, proponha um preço para este trajeto",
        variant: "destructive"
      });
      return;
    }

    onSubmit({
      rideId: ride.id,
      ...formData,
      proposedPrice: proposedAmount
    });

    onClose();
    
    toast({
      title: "Solicitação Enviada",
      description: "Sua solicitação de apanhar durante a rota foi enviada ao motorista",
    });
  };

  // Calculate estimated price based on route distance
  const estimatedPrice = basePrice * 0.7; // Assume 70% of original price for partial route

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-dark">
            Solicitar Apanhar Durante a Rota
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trip Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Informações da Viagem</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Rota Principal:</span>
                  <span className="font-semibold">{ride.fromAddress} → {ride.toAddress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Motorista:</span>
                  <span>{ride.driverName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-medium">Assentos Disponíveis:</span>
                  <Badge variant="secondary">{ride.availableSeats} disponíveis</Badge>
                </div>
                {ride.route && ride.route.length > 0 && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-gray-medium">Cidades na Rota:</span>
                    <div className="text-right">
                      {ride.route.map((stop, index) => (
                        <Badge key={index} variant="outline" className="ml-1 mb-1">
                          {stop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pickup Request Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="pickupLocation">Local de Apanhar *</Label>
              <Input
                id="pickupLocation"
                value={formData.pickupLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                placeholder="Ex: Centro de Maputo, Praça da Independência"
                data-testid="input-pickup-location"
              />
              <p className="text-sm text-gray-medium mt-1">
                Especifique onde gostaria de ser apanhado durante a rota
              </p>
            </div>

            <div>
              <Label htmlFor="destinationLocation">Seu Destino *</Label>
              <Input
                id="destinationLocation"
                value={formData.destinationLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, destinationLocation: e.target.value }))}
                placeholder="Ex: Aeroporto de Maputo, Hotel Polana"
                data-testid="input-destination-location"
              />
              <p className="text-sm text-gray-medium mt-1">
                Onde gostaria de ser deixado
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestedSeats">Número de Passageiros</Label>
                <Input
                  id="requestedSeats"
                  type="number"
                  min="1"
                  max={ride.availableSeats || 1}
                  value={formData.requestedSeats}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedSeats: parseInt(e.target.value) }))}
                  data-testid="input-requested-seats"
                />
              </div>

              <div>
                <Label htmlFor="proposedPrice">Preço Proposto *</Label>
                <Input
                  id="proposedPrice"
                  type="number"
                  step="0.01"
                  value={formData.proposedPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposedPrice: e.target.value }))}
                  placeholder="0.00"
                  data-testid="input-proposed-price"
                />
              </div>
            </div>

            {proposedAmount > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Resumo do Preço</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Preço da Rota Completa:</span>
                      <span className="text-gray-medium">{formatMzn(basePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preço Estimado (Trajeto Parcial):</span>
                      <span className="text-gray-medium">{formatMzn(estimatedPrice)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Seu Preço Proposto:</span>
                      <span className="font-bold text-primary">{formatMzn(proposedAmount)}</span>
                    </div>
                    {proposedAmount < estimatedPrice && (
                      <div className="flex justify-between text-green-600">
                        <span>Economia:</span>
                        <span>{formatMzn(estimatedPrice - proposedAmount)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="message">Mensagem para o Motorista</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Adicione informações extras como ponto de referência, horário preferido, etc."
                rows={3}
                data-testid="textarea-pickup-message"
              />
            </div>
          </div>

          {/* Important Notice */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-orange-500 mt-1"></i>
                <div>
                  <h3 className="font-semibold text-orange-800 mb-2">Importante</h3>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Esta solicitação será enviada ao motorista para aprovação</li>
                    <li>• O motorista pode aceitar, rejeitar ou propor um preço diferente</li>
                    <li>• O trajeto pode adicionar tempo extra à viagem</li>
                    <li>• Certifique-se de que seus locais estão na rota do motorista</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-pickup-request">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} data-testid="button-submit-pickup-request">
            Enviar Solicitação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}