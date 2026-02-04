// src/apps/hotels-app/components/CreateHotelForm.tsx
import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { hotelService, HotelCreateRequest } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';

// ✅ NOVO: Importar LocationAutocomplete
import LocationAutocomplete, { LocationOption } from '@/shared/components/LocationAutocomplete';
import { locationsService } from '@/services/locationsService';

interface CreateHotelFormProps {
  onSuccess?: (hotelId: string) => void;
  onCancel?: () => void;
}

const CreateHotelForm: React.FC<CreateHotelFormProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ NOVO: Estado para localização selecionada
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);

  // ✅ ATUALIZADO: Estado do formulário com novos campos de localização
  const [formData, setFormData] = useState<HotelCreateRequest>({
    name: '',
    description: '',
    address: '',
    locality: '',      // Mantido
    province: '',      // Mantido
    country: 'Moçambique',
    contact_email: '',
    contact_phone: '',
    check_in_time: '14:00',
    check_out_time: '12:00',
    // ✅ NOVO: Campos de localização
    lat: '',
    lng: '',
    location_id: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ NOVO: Função para lidar com seleção de localização
  const handleLocationSelect = (locationOption: LocationOption) => {
    console.log('📍 Localização selecionada:', locationOption);
    setSelectedLocation(locationOption);
    
    // Preencher automaticamente os campos do formulário
    setFormData(prev => ({
      ...prev,
      locality: locationOption.city || locationOption.label.split(',')[0] || '',
      province: locationOption.province || '',
      lat: locationOption.lat?.toString() || '',
      lng: locationOption.lng?.toString() || '',
      location_id: locationOption.id || '',
    }));
  };

  // ✅ NOVO: Função para lidar com digitação livre
  const handleLocationInputChange = (locationOption: LocationOption) => {
    // Se o usuário está digitando (não selecionou da lista)
    if (!locationOption.id) {
      setSelectedLocation(null);
      setFormData(prev => ({
        ...prev,
        locality: locationOption.label, // Usar o que foi digitado
        province: '', // Limpar província
        lat: '', // Limpar coordenadas
        lng: '',
        location_id: '', // Limpar ID
      }));
    }
  };

  const validateForm = (): boolean => {
    setError(null);
    
    // Validação básica
    if (!formData.name.trim()) {
      setError('O nome do hotel é obrigatório');
      return false;
    }
    
    if (!formData.address.trim()) {
      setError('O endereço é obrigatório');
      return false;
    }
    
    // ✅ NOVA VALIDAÇÃO: Localização
    if (!formData.locality.trim()) {
      setError('A localização é obrigatória');
      return false;
    }
    
    // Validação de email
    if (!formData.contact_email.trim()) {
      setError('O email de contato é obrigatório');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      setError('Email inválido');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      toast({
        title: 'Campos obrigatórios',
        description: error || 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Enviando dados para criar hotel:', formData);

      const response = await hotelService.createHotel(formData);

      if (response.success && response.data?.id) {
        const hotelId = response.data.id;

        toast({
          title: 'Sucesso!',
          description: `Hotel "${formData.name}" criado com sucesso!`,
        });

        console.log('✅ Hotel criado com ID:', hotelId);

        // Chama o callback passando apenas o hotelId
        // Quem chama decide se quer setar como ativo ou não
        if (onSuccess) {
          onSuccess(hotelId);
        }
      } else {
        const errorMsg = response.error || 'Erro desconhecido ao criar hotel';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Falha ao criar hotel. Tente novamente.';
      setError(errorMsg);
      console.error('❌ Erro ao criar hotel:', err);
      toast({
        title: 'Erro ao criar hotel',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6 md:p-8 shadow-lg border-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Novo Hotel</h2>
          <p className="text-muted-foreground mb-8">
            Preencha os dados do seu hotel para começar a gerenciar reservas e promoções
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erro</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome e Email */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nome do Hotel *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Hotel Paraíso do Tofo"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="contact_email">Email de Contato *</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  placeholder="contato@hotelparadiso.co.mz"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição do Hotel</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre o seu hotel, localização, serviços oferecidos..."
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Endereço */}
            <div>
              <Label htmlFor="address">Endereço Completo *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Avenida Marginal, 123, Bairro do Farol"
                required
                disabled={loading}
              />
            </div>

            {/* ✅ NOVO: Localização com Autocomplete (substitui locality e province) */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="hotel-location">Localização do Hotel *</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Selecione uma localização real de Moçambique para permitir buscas por proximidade
                </p>
                <LocationAutocomplete
                  id="hotel-location"
                  placeholder="Busque por cidade, distrito ou província..."
                  value={selectedLocation?.label || formData.locality || ''}
                  onChange={handleLocationInputChange}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
              
              {/* Campos ocultos para armazenar dados da localização */}
              <input type="hidden" name="location_id" value={formData.location_id || ''} />
              <input type="hidden" name="lat" value={formData.lat || ''} />
              <input type="hidden" name="lng" value={formData.lng || ''} />
              
              {/* Feedback visual */}
              {selectedLocation && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-green-600">✅</div>
                    <div>
                      <p className="font-medium text-green-800">Localização válida selecionada</p>
                      <p className="text-sm text-green-700">
                        {selectedLocation.label}
                        {selectedLocation.lat && selectedLocation.lng && (
                          <span className="ml-2 text-xs">
                            (Coordenadas: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!selectedLocation && formData.locality && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-yellow-600">⚠️</div>
                    <div>
                      <p className="font-medium text-yellow-800">Localização não validada</p>
                      <p className="text-sm text-yellow-700">
                        Para melhores resultados de busca, selecione uma localização da lista
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="contact_phone">Telefone de Contato</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="+258 84 123 4567"
                disabled={loading}
              />
            </div>

            {/* Check-in e Check-out */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="check_in_time">Horário de Check-in</Label>
                <Input
                  id="check_in_time"
                  name="check_in_time"
                  type="time"
                  value={formData.check_in_time}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="check_out_time">Horário de Check-out</Label>
                <Input
                  id="check_out_time"
                  name="check_out_time"
                  type="time"
                  value={formData.check_out_time}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full sm:w-auto flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando hotel...
                  </>
                ) : (
                  'Criar Hotel'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateHotelForm;