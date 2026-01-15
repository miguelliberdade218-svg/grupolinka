import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useToast } from "@/shared/hooks/use-toast";
import { formatMzn } from "@/shared/lib/currency";
import DateInput from "@/components/DateInput";

interface RideOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offerData: any) => void;
}

export default function RideOfferModal({ isOpen, onClose, onSubmit }: RideOfferModalProps) {
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    route: [] as string[],
    departureDate: "",
    departureTime: "",
    price: "",
    availableSeats: 4,
    allowPickupEnRoute: false,
    allowNegotiation: false,
    minPrice: "",
    maxPrice: "",
    isRoundTrip: false,
    returnDate: "",
    returnTime: "",
    vehicleType: "",
    vehicleInfo: "",
    message: ""
  });

  const [currentStop, setCurrentStop] = useState("");
  const { toast } = useToast();

  const addStop = () => {
    if (currentStop.trim() && !formData.route.includes(currentStop.trim())) {
      setFormData(prev => ({
        ...prev,
        route: [...prev.route, currentStop.trim()]
      }));
      setCurrentStop("");
    }
  };

  const removeStop = (stop: string) => {
    setFormData(prev => ({
      ...prev,
      route: prev.route.filter(s => s !== stop)
    }));
  };

  const handleSubmit = () => {
    if (!formData.from || !formData.to || !formData.departureDate || !formData.price) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.allowNegotiation && (!formData.minPrice || !formData.maxPrice)) {
      toast({
        title: "Preços de Negociação",
        description: "Defina o preço mínimo e máximo para negociação",
        variant: "destructive"
      });
      return;
    }

    if (formData.isRoundTrip && !formData.returnDate) {
      toast({
        title: "Data de Retorno",
        description: "Defina a data de retorno para ida e volta",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
    onClose();
    
    toast({
      title: "Oferta Criada",
      description: "Sua oferta de viagem foi publicada com sucesso!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-dark">
            Oferecer Viagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Trip Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-dark">Informações da Viagem</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from">Saindo de *</Label>
                  <Input
                    id="from"
                    value={formData.from}
                    onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                    placeholder="Cidade de origem"
                    data-testid="input-ride-from"
                  />
                </div>
                
                <div>
                  <Label htmlFor="to">Indo para *</Label>
                  <Input
                    id="to"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="Cidade de destino"
                    data-testid="input-ride-to"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureDate">Data de Partida *</Label>
                  <DateInput
                    id="departureDate"
                    value={formData.departureDate}
                    onChange={(value) => setFormData(prev => ({ ...prev, departureDate: value }))}
                    data-testid="input-departure-date"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="departureTime">Hora de Partida</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    data-testid="input-departure-time"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route and Stops */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-dark">Rota e Paradas</h3>
              
              <div className="flex space-x-2">
                <Input
                  value={currentStop}
                  onChange={(e) => setCurrentStop(e.target.value)}
                  placeholder="Adicionar cidade na rota"
                  data-testid="input-route-stop"
                />
                <Button onClick={addStop} data-testid="button-add-stop">
                  Adicionar
                </Button>
              </div>

              {formData.route.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-medium">Cidades na rota:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.route.map((stop, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-lg px-3 py-1">
                        <span className="text-sm">{stop}</span>
                        <button
                          onClick={() => removeStop(stop)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          data-testid={`remove-stop-${index}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.allowPickupEnRoute}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowPickupEnRoute: checked }))}
                  data-testid="switch-allow-pickup"
                />
                <Label>Permitir apanhar passageiros durante a rota</Label>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-dark">Preços</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Preço por Assento *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    data-testid="input-price-per-seat"
                  />
                </div>
                
                <div>
                  <Label htmlFor="availableSeats">Assentos Disponíveis</Label>
                  <Select
                    value={String(formData.availableSeats)}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, availableSeats: parseInt(value) }))}
                  >
                    <SelectTrigger data-testid="select-available-seats">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num} {num === 1 ? 'assento' : 'assentos'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.allowNegotiation}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowNegotiation: checked }))}
                  data-testid="switch-allow-negotiation"
                />
                <Label>Permitir negociação de preço</Label>
              </div>

              {formData.allowNegotiation && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minPrice">Preço Mínimo</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      step="0.01"
                      value={formData.minPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, minPrice: e.target.value }))}
                      placeholder="0.00"
                      data-testid="input-min-price"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxPrice">Preço Máximo</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      step="0.01"
                      value={formData.maxPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxPrice: e.target.value }))}
                      placeholder="0.00"
                      data-testid="input-max-price"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Round Trip */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isRoundTrip}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRoundTrip: checked }))}
                  data-testid="switch-round-trip"
                />
                <Label>Oferecer ida e volta</Label>
              </div>

              {formData.isRoundTrip && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="returnDate">Data de Retorno</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                      data-testid="input-return-date"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="returnTime">Hora de Retorno</Label>
                    <Input
                      id="returnTime"
                      type="time"
                      value={formData.returnTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, returnTime: e.target.value }))}
                      data-testid="input-return-time"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-dark">Informações do Veículo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Tipo de Veículo</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
                  >
                    <SelectTrigger data-testid="select-vehicle-type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="hatchback">Hatchback</SelectItem>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="minibus">Minibus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="vehicleInfo">Informações do Veículo</Label>
                  <Input
                    id="vehicleInfo"
                    value={formData.vehicleInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                    placeholder="Ex: Toyota Corolla 2020, Branco"
                    data-testid="input-vehicle-info"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Message */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-dark">Mensagem Adicional</h3>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Adicione informações extras sobre a viagem..."
                rows={3}
                data-testid="textarea-additional-message"
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-offer">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} data-testid="button-submit-offer">
            Publicar Oferta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}