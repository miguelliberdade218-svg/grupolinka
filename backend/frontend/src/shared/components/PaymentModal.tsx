import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { formatMzn } from "@/shared/lib/currency";
import { useToast } from "@/shared/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    serviceType: 'ride' | 'accommodation' | 'restaurant';
    serviceName: string;
    subtotal: number;
    details: string;
  };
  onPaymentSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, booking, onPaymentSuccess }: PaymentModalProps) {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [bankAccount, setBankAccount] = useState("");

  const platformFee = Math.round(booking.subtotal * 0.1);
  const total = booking.subtotal + platformFee;

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      // TODO: Endpoint /api/payments/process não implementado ainda
      // Simulando processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Simulating payment:', {
        bookingId: booking.id,
        serviceType: booking.serviceType,
        subtotal: booking.subtotal,
        platformFee,
        total,
        paymentMethod,
        ...paymentData,
      });
      
      return { success: true, transactionId: 'sim-' + Date.now() };
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Processado",
        description: "O seu pagamento foi processado com sucesso!",
      });
      onPaymentSuccess();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro no Pagamento",
        description: "Falha ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (paymentMethod === "card") {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        toast({
          title: "Dados Incompletos",
          description: "Por favor preencha todos os dados do cartão.",
          variant: "destructive",
        });
        return;
      }
      paymentMutation.mutate({ cardDetails });
    } else if (paymentMethod === "mpesa") {
      if (!mpesaNumber) {
        toast({
          title: "Dados Incompletos",
          description: "Por favor insira o número M-Pesa.",
          variant: "destructive",
        });
        return;
      }
      paymentMutation.mutate({ mpesaNumber });
    } else if (paymentMethod === "bank") {
      if (!bankAccount) {
        toast({
          title: "Dados Incompletos",
          description: "Por favor insira os dados bancários.",
          variant: "destructive",
        });
        return;
      }
      paymentMutation.mutate({ bankAccount });
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'ride': return 'fas fa-car';
      case 'accommodation': return 'fas fa-bed';
      case 'restaurant': return 'fas fa-utensils';
      default: return 'fas fa-receipt';
    }
  };

  const getServiceName = (serviceType: string) => {
    switch (serviceType) {
      case 'ride': return 'Viagem';
      case 'accommodation': return 'Hospedagem';
      case 'restaurant': return 'Restaurante';
      default: return 'Serviço';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <i className={`${getServiceIcon(booking.serviceType)} text-primary`}></i>
            Finalizar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{getServiceName(booking.serviceType)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{booking.serviceName}</p>
                <p className="text-sm text-gray-medium">{booking.details}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatMzn(booking.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-medium">
                  <span>Taxa da Plataforma (10%)</span>
                  <span>{formatMzn(platformFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatMzn(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <Label className="text-base font-medium mb-3 block">Método de Pagamento</Label>
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card" className="text-xs">
                  <i className="fas fa-credit-card mr-1"></i>
                  Cartão
                </TabsTrigger>
                <TabsTrigger value="mpesa" className="text-xs">
                  <i className="fas fa-mobile-alt mr-1"></i>
                  M-Pesa
                </TabsTrigger>
                <TabsTrigger value="bank" className="text-xs">
                  <i className="fas fa-university mr-1"></i>
                  Banco
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Nome no Cartão</Label>
                    <Input
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      placeholder="João Silva"
                      data-testid="card-name"
                    />
                  </div>
                  <div>
                    <Label>Número do Cartão</Label>
                    <Input
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                      placeholder="1234 5678 9012 3456"
                      data-testid="card-number"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Validade</Label>
                      <Input
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        placeholder="MM/AA"
                        data-testid="card-expiry"
                      />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        placeholder="123"
                        data-testid="card-cvv"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mpesa" className="space-y-4 mt-4">
                <div>
                  <Label>Número M-Pesa</Label>
                  <Input
                    value={mpesaNumber}
                    onChange={(e) => setMpesaNumber(e.target.value)}
                    placeholder="+258 84 123 4567"
                    data-testid="mpesa-number"
                  />
                </div>
                <Alert>
                  <i className="fas fa-info-circle"></i>
                  <AlertDescription>
                    Receberá um SMS com instruções para completar o pagamento via M-Pesa.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="bank" className="space-y-4 mt-4">
                <div>
                  <Label>Dados Bancários</Label>
                  <Input
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Número da conta ou IBAN"
                    data-testid="bank-account"
                  />
                </div>
                <Alert>
                  <i className="fas fa-info-circle"></i>
                  <AlertDescription>
                    O pagamento será processado através de transferência bancária. Pode demorar 1-3 dias úteis.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={paymentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={paymentMutation.isPending}
              className="flex-1"
              data-testid="confirm-payment"
            >
              {paymentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                `Pagar ${formatMzn(total)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}