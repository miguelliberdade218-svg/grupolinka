import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Settings, Bell, CreditCard, Shield, Globe, Users, Save } from 'lucide-react';

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState({
    // Informações do Hotel
    hotelName: 'Hotel Tofo Beach Resort',
    description: 'Um resort à beira-mar com vista para o oceano Índico',
    contactEmail: 'info@tofobeach.com',
    contactPhone: '+258 84 123 4567',
    
    // Configurações de Reserva
    minBookingDays: 1,
    maxBookingDays: 30,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    requireDeposit: true,
    depositPercentage: 30,
    
    // Configurações de Pagamento
    acceptedPaymentMethods: ['cash', 'card', 'mobile_money'],
    currency: 'MZN',
    taxRate: 17,
    
    // Notificações
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmation: true,
    paymentReminders: true,
    
    // Segurança
    twoFactorAuth: false,
    sessionTimeout: 60, // minutos
  });

  const paymentMethods = [
    { id: 'cash', label: 'Dinheiro' },
    { id: 'card', label: 'Cartão de Crédito/Débito' },
    { id: 'mobile_money', label: 'Mobile Money (M-Pesa, e-Mola)' },
    { id: 'bank_transfer', label: 'Transferência Bancária' },
  ];

  const handlePaymentMethodToggle = (methodId: string) => {
    setSettings(prev => ({
      ...prev,
      acceptedPaymentMethods: prev.acceptedPaymentMethods.includes(methodId)
        ? prev.acceptedPaymentMethods.filter(m => m !== methodId)
        : [...prev.acceptedPaymentMethods, methodId]
    }));
  };

  const handleSave = () => {
    console.log('Salvando configurações:', settings);
    // TODO: Integrar com API
    alert('Configurações salvas com sucesso!');
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Configurações do Hotel
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do seu hotel, pagamentos, notificações e segurança
        </p>
      </div>

      <div className="space-y-6">
        {/* Informações do Hotel */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-dark mb-4">Informações do Hotel</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hotelName">Nome do Hotel</Label>
              <Input
                id="hotelName"
                value={settings.hotelName}
                onChange={(e) => setSettings({...settings, hotelName: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email de Contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Telefone</Label>
              <Input
                id="contactPhone"
                value={settings.contactPhone}
                onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Select 
                value={settings.currency} 
                onValueChange={(value) => setSettings({...settings, currency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MZN">MZN - Metical Moçambicano</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="ZAR">ZAR - Rand Sul-Africano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => setSettings({...settings, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Configurações de Reserva */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-dark mb-4">Configurações de Reserva</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minBookingDays">Mínimo de Noites</Label>
              <Input
                id="minBookingDays"
                type="number"
                min="1"
                value={settings.minBookingDays}
                onChange={(e) => setSettings({...settings, minBookingDays: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label htmlFor="maxBookingDays">Máximo de Noites</Label>
              <Input
                id="maxBookingDays"
                type="number"
                min="1"
                value={settings.maxBookingDays}
                onChange={(e) => setSettings({...settings, maxBookingDays: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label htmlFor="checkInTime">Check-in (Hora)</Label>
              <Input
                id="checkInTime"
                type="time"
                value={settings.checkInTime}
                onChange={(e) => setSettings({...settings, checkInTime: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="checkOutTime">Check-out (Hora)</Label>
              <Input
                id="checkOutTime"
                type="time"
                value={settings.checkOutTime}
                onChange={(e) => setSettings({...settings, checkOutTime: e.target.value})}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireDeposit">Exigir Depósito</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir pagamento de depósito para confirmar reserva
                  </p>
                </div>
                <Switch
                  id="requireDeposit"
                  checked={settings.requireDeposit}
                  onCheckedChange={(checked) => setSettings({...settings, requireDeposit: checked})}
                />
              </div>

              {settings.requireDeposit && (
                <div className="mt-4">
                  <Label htmlFor="depositPercentage">Percentagem do Depósito (%)</Label>
                  <Input
                    id="depositPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.depositPercentage}
                    onChange={(e) => setSettings({...settings, depositPercentage: parseInt(e.target.value)})}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Métodos de Pagamento */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Métodos de Pagamento Aceites
          </h2>
          
          <div className="space-y-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex items-center justify-between">
                <Label htmlFor={`payment-${method.id}`}>{method.label}</Label>
                <Switch
                  id={`payment-${method.id}`}
                  checked={settings.acceptedPaymentMethods.includes(method.id)}
                  onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                />
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Label htmlFor="taxRate">Taxa de IVA (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              value={settings.taxRate}
              onChange={(e) => setSettings({...settings, taxRate: parseInt(e.target.value)})}
            />
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notificações
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por email sobre novas reservas
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">Notificações por SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações por SMS (pode ter custos adicionais)
                </p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bookingConfirmation">Confirmação Automática de Reservas</Label>
                <p className="text-sm text-muted-foreground">
                  Confirmar automaticamente novas reservas
                </p>
              </div>
              <Switch
                id="bookingConfirmation"
                checked={settings.bookingConfirmation}
                onCheckedChange={(checked) => setSettings({...settings, bookingConfirmation: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paymentReminders">Lembretes de Pagamento</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar lembretes automáticos para pagamentos pendentes
                </p>
              </div>
              <Switch
                id="paymentReminders"
                checked={settings.paymentReminders}
                onCheckedChange={(checked) => setSettings({...settings, paymentReminders: checked})}
              />
            </div>
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-dark mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Segurança
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorAuth">Autenticação de Dois Fatores (2FA)</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir verificação adicional ao fazer login
                </p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
              />
            </div>

            <div>
              <Label htmlFor="sessionTimeout">Tempo de Sessão (minutos)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Tempo de inatividade antes do logout automático
              </p>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="480"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
              />
            </div>
          </div>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button 
            type="button" 
            className="bg-primary hover:bg-primary/90 text-dark"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
}