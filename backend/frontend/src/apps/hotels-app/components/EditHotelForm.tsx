// src/apps/hotels-app/components/EditHotelForm.tsx
import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { hotelService, convertServiceHotelToSharedHotel } from '@/services/hotelService';
import { Hotel } from '@/shared/types/hotels';
import { useToast } from '@/shared/hooks/use-toast';

interface EditHotelFormProps {
  hotel: Hotel;
  onSuccess?: (updatedHotel: Hotel) => void;
  onCancel?: () => void;
}

type FormData = {
  name: string;
  description?: string;
  address: string;
  locality: string;
  province: string;
  country?: string;
  contact_email: string;
  contact_phone?: string;
  check_in_time?: string;
  check_out_time?: string;
  policies?: string;
  images?: string[];
  amenities?: string[];
};

// Função para converter horário de 12h para 24h
const formatTo24h = (time12h: string): string => {
  if (!time12h) return '';
  
  // Se já estiver no formato 24h (ex: "14:00"), retorna como está
  const time24hRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (time24hRegex.test(time12h)) {
    return time12h;
  }
  
  // Remove espaços extras e converte para maiúsculas
  const cleanTime = time12h.trim().toUpperCase();
  
  // Verifica se tem AM/PM
  if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
    const [time, period] = cleanTime.split(/(AM|PM)/);
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
    
    // Converte para 24h
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Se não tem AM/PM, assume que já está em 24h
  return cleanTime;
};

// Função para converter horário de 24h para display no input type="time"
const formatForTimeInput = (time: string): string => {
  if (!time) return '14:00';
  
  // Remove AM/PM se existir
  const cleanTime = time.replace(/\s*(AM|PM)/i, '').trim();
  
  // Se já está no formato HH:MM, retorna como está
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (timeRegex.test(cleanTime)) {
    return cleanTime;
  }
  
  // Tenta converter diferentes formatos
  const [hoursStr, minutesStr] = cleanTime.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
  
  // Garante formato HH:MM
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const EditHotelForm: React.FC<EditHotelFormProps> = ({ hotel: rawHotel, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Converter UMA VEZ só (fora do render loop)
  const convertedHotel = convertServiceHotelToSharedHotel(rawHotel);

  // Formatar horários para exibição no input type="time"
  const displayCheckInTime = formatForTimeInput(convertedHotel.check_in_time || '14:00');
  const displayCheckOutTime = formatForTimeInput(convertedHotel.check_out_time || '12:00');

  const [formData, setFormData] = useState<FormData>({
    name: convertedHotel.name,
    description: convertedHotel.description || '',
    address: convertedHotel.address,
    locality: convertedHotel.locality,
    province: convertedHotel.province,
    country: convertedHotel.country || 'Moçambique',
    contact_email: convertedHotel.contact_email,
    contact_phone: convertedHotel.contact_phone || '',
    check_in_time: displayCheckInTime,
    check_out_time: displayCheckOutTime,
    policies: convertedHotel.policies || '',
    images: convertedHotel.images || [],
    amenities: convertedHotel.amenities || [],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: 'images' | 'amenities', value: string) => {
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item);
    setFormData((prev) => ({ ...prev, [field]: items }));
  };

  const validateForm = (): boolean => {
    if (!formData.name?.trim()) {
      setError('O nome do hotel é obrigatório');
      return false;
    }
    if (!formData.address?.trim()) {
      setError('O endereço é obrigatório');
      return false;
    }
    if (!formData.locality?.trim()) {
      setError('A localidade (cidade) é obrigatória');
      return false;
    }
    if (!formData.contact_email?.trim()) {
      setError('O email de contato é obrigatório');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contact_email && !emailRegex.test(formData.contact_email)) {
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
      console.log(`📤 Atualizando hotel ID: ${convertedHotel.id}`, formData);

      // CORREÇÃO: Converter horários para formato 24h antes de enviar
      const payload = {
        ...formData,
        check_in_time: formatTo24h(formData.check_in_time || '14:00'),
        check_out_time: formatTo24h(formData.check_out_time || '12:00'),
      };

      console.log('📤 Payload formatado para envio:', payload);

      const response = await hotelService.updateHotel(convertedHotel.id, payload);

      if (response.success && response.data) {
        const updatedHotel = convertServiceHotelToSharedHotel(response.data);
        toast({
          title: 'Sucesso!',
          description: `Hotel "${formData.name}" atualizado com sucesso!`,
        });
        console.log('✅ Hotel atualizado:', updatedHotel);

        if (onSuccess) {
          onSuccess(updatedHotel);
        }
      } else {
        throw new Error(response.error || 'Erro desconhecido ao atualizar');
      }
    } catch (err: any) {
      const msg = err.message || 'Falha ao atualizar hotel. Tente novamente.';
      setError(msg);
      console.error('❌ Erro ao atualizar hotel:', err);
      toast({
        title: 'Erro ao atualizar hotel',
        description: msg,
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Editar Hotel</h2>
              <p className="text-muted-foreground">
                Atualize as informações do {convertedHotel.name || 'hotel selecionado'}
              </p>
            </div>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCancel}
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

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
                  value={formData.name || ''}
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
                  value={formData.contact_email || ''}
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
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Conte um pouco sobre o seu hotel..."
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Endereço e Localidade */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Avenida Marginal, 123, Bairro do Farol"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="locality">Localidade / Cidade *</Label>
                <Input
                  id="locality"
                  name="locality"
                  value={formData.locality || ''}
                  onChange={handleInputChange}
                  placeholder="Tofo / Maputo / Beira"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Província e Telefone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="province">Província</Label>
                <Input
                  id="province"
                  name="province"
                  value={formData.province || ''}
                  onChange={handleInputChange}
                  placeholder="Inhambane / Maputo / Sofala"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Telefone de Contato</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleInputChange}
                  placeholder="+258 84 123 4567"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Check-in e Check-out */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="check_in_time">Horário de Check-in</Label>
                <Input
                  id="check_in_time"
                  name="check_in_time"
                  type="time"
                  value={formData.check_in_time || '14:00'}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato 24h (ex: 14:00 para 2:00 PM)
                </p>
              </div>

              <div>
                <Label htmlFor="check_out_time">Horário de Check-out</Label>
                <Input
                  id="check_out_time"
                  name="check_out_time"
                  type="time"
                  value={formData.check_out_time || '12:00'}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formato 24h (ex: 12:00 para meio-dia)
                </p>
              </div>
            </div>

            {/* Políticas */}
            <div>
              <Label htmlFor="policies">Políticas do Hotel</Label>
              <Textarea
                id="policies"
                name="policies"
                value={formData.policies || ''}
                onChange={handleInputChange}
                placeholder="Políticas de cancelamento, regras da casa, etc..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Imagens e Amenidades */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="images">Imagens (URLs separadas por vírgula)</Label>
                <Input
                  id="images"
                  value={(formData.images || []).join(', ')}
                  onChange={(e) => handleArrayChange('images', e.target.value)}
                  placeholder="https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.images?.length || 0} imagem(s)
                </p>
              </div>

              <div>
                <Label htmlFor="amenities">Amenidades (separadas por vírgula)</Label>
                <Input
                  id="amenities"
                  value={(formData.amenities || []).join(', ')}
                  onChange={(e) => handleArrayChange('amenities', e.target.value)}
                  placeholder="WiFi, Piscina, Ar Condicionado, Estacionamento"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.amenities?.length || 0} amenidade(s)
                </p>
              </div>
            </div>

            {/* Botões */}
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
                    Atualizando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditHotelForm;