import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface StepDetailsProps {
  capacities: {
    client: boolean;
    driver: boolean;
    hotelManager: boolean;
  };
  formData: {
    driverLicenseNumber?: string;
    driverVehicleType?: string;
    companyName?: string;
    companyVatNumber?: string;
    companyAddress?: string;
  };
  onFormDataChange: (data: any) => void;
}

export function StepDetails({ capacities, formData, onFormDataChange }: StepDetailsProps) {
  const handleChange = (field: string, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Detalhes Adicionais</h3>
      <p className="text-gray-600">
        Complete as informações específicas para as capacidades selecionadas:
      </p>
      
      <div className="space-y-6">
        {/* Dados do Motorista */}
        {capacities.driver && (
          <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Dados do Motorista
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverLicenseNumber">Número da Carta de Condução *</Label>
                <Input 
                  id="driverLicenseNumber" 
                  placeholder="Ex: 123456789"
                  value={formData.driverLicenseNumber || ''}
                  onChange={(e) => handleChange('driverLicenseNumber', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="driverVehicleType">Tipo de Veículo</Label>
                <Select 
                  value={formData.driverVehicleType || ''}
                  onValueChange={(value) => handleChange('driverVehicleType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Carro</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="minibus">Mini-bus</SelectItem>
                    <SelectItem value="bus">Ônibus</SelectItem>
                    <SelectItem value="motorcycle">Motocicleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="driverExperience">Experiência (anos)</Label>
              <Input 
                id="driverExperience" 
                type="number" 
                min="0" 
                max="50"
                placeholder="Ex: 5"
              />
            </div>
          </div>
        )}
        
        {/* Dados da Empresa */}
        {capacities.hotelManager && (
          <div className="space-y-4 p-4 border border-amber-200 rounded-lg bg-amber-50">
            <h4 className="font-medium text-amber-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Dados da Empresa
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input 
                  id="companyName" 
                  placeholder="Nome da sua empresa"
                  value={formData.companyName || ''}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyVatNumber">NIF/NUIT *</Label>
                <Input 
                  id="companyVatNumber" 
                  placeholder="Número de identificação fiscal"
                  value={formData.companyVatNumber || ''}
                  onChange={(e) => handleChange('companyVatNumber', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Endereço da Empresa</Label>
              <Textarea 
                id="companyAddress" 
                placeholder="Endereço completo da empresa"
                rows={3}
                value={formData.companyAddress || ''}
                onChange={(e) => handleChange('companyAddress', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Telefone da Empresa</Label>
                <Input 
                  id="companyPhone" 
                  placeholder="+258 84 123 4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email da Empresa</Label>
                <Input 
                  id="companyEmail" 
                  type="email" 
                  placeholder="empresa@exemplo.com"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Informações Gerais */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800">Informações Gerais</h4>
          
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Idioma Preferido</Label>
            <Select defaultValue="pt">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="referralCode">Código de Indicação (opcional)</Label>
            <Input 
              id="referralCode" 
              placeholder="Código de indicação"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newsletter">
              <input 
                type="checkbox" 
                id="newsletter" 
                className="mr-2" 
                defaultChecked
              />
              Receber novidades e ofertas especiais por email
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}