import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { AlertCircle, Loader2, X, Upload, Image as ImageIcon, Wifi, Users, Star, DoorOpen, Wind, Bed, Bath, Coffee, Utensils, Tv, Shield, Leaf, Dumbbell, Car, Baby, PawPrint, CigaretteOff, ArrowUpDown, Accessibility, ShowerHead, Key, Mountain, Sun, Umbrella, Coffee as CoffeeCup, Wine, Cake, Music, Gamepad, BookOpen, Laptop, Phone, Globe, MapPin, Heart, Sparkles, KeyRound } from 'lucide-react';
import { hotelService } from '@/services/hotelService';
import { useToast } from '@/shared/hooks/use-toast';

interface RoomType {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  base_occupancy: number;
  base_price: string;
  total_units: number;
  extra_adult_price?: string;
  extra_child_price?: string;
  amenities?: string[];
  min_nights?: number;
  images?: string[];
}

interface CreateRoomTypeFormModernProps {
  hotelId: string;
  initialData?: RoomType; // Para modo edição
  onSuccess: (roomTypeId: string) => void;
  onCancel: () => void;
}

const CreateRoomTypeFormModern: React.FC<CreateRoomTypeFormModernProps> = ({
  hotelId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [images, setImages] = useState<string[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 2,
    base_occupancy: 2,
    base_price: '',
    total_units: 1,
    extra_adult_price: '',
    extra_child_price: '',
    amenities: [] as string[],
    min_nights: 1,
  });

  // Lista completa de amenities (50+ opções profissionais)
  const AMENITIES_OPTIONS = [
    { id: 'wifi', label: 'Wi-Fi Gratuito', icon: Wifi },
    { id: 'ar-condicionado', label: 'Ar Condicionado', icon: Wind },
    { id: 'tv-cabo', label: 'TV por Cabo', icon: Tv },
    { id: 'secador', label: 'Secador de Cabelo', icon: Wind },
    { id: 'cofre', label: 'Cofre no Quarto', icon: Shield },
    { id: 'minibar', label: 'Minibar', icon: CoffeeCup },
    { id: 'banheira', label: 'Banheira', icon: Bath },
    { id: 'chuveiro', label: 'Chuveiro Quente', icon: ShowerHead },
    { id: 'varanda', label: 'Varanda', icon: Sun },
    { id: 'vista-mar', label: 'Vista para o Mar', icon: Mountain },
    { id: 'vista-piscina', label: 'Vista para Piscina', icon: Umbrella },
    { id: 'kitchenette', label: 'Kitchenette', icon: Utensils },
    { id: 'microondas', label: 'Micro-ondas', icon: CoffeeCup },
    { id: 'frigorifico', label: 'Frigorífico', icon: CoffeeCup },
    { id: 'cozinha-completa', label: 'Cozinha Completa', icon: Utensils },
    { id: 'lavandaria', label: 'Lavandaria no Quarto', icon: Wind },
    { id: 'ferro', label: 'Ferro e Tábua', icon: Wind },
    { id: 'servico-quarto', label: 'Serviço de Quarto', icon: DoorOpen },
    { id: 'acesso-deficientes', label: 'Acesso para Deficientes', icon: Accessibility },
    { id: 'quartos-familiares', label: 'Quartos Familiares', icon: Users },
    { id: 'quartos-nao-fumadores', label: 'Quartos Não Fumadores', icon: CigaretteOff },
    { id: 'animais-permitidos', label: 'Animais Permitidos', icon: PawPrint },
    { id: 'berco', label: 'Berço Disponível', icon: Baby },
    { id: 'cama-extra', label: 'Cama Extra', icon: Bed },
    { id: 'suite-nupcial', label: 'Suite Nupcial', icon: Heart },
    { id: 'jacuzzi', label: 'Jacuzzi', icon: Bath },
    { id: 'sauna', label: 'Sauna', icon: Wind },
    { id: 'massagem', label: 'Massagens no Quarto', icon: Heart },
    { id: 'ginasio', label: 'Ginásio', icon: Dumbbell },
    { id: 'piscina', label: 'Piscina Privativa', icon: Umbrella },
    { id: 'estacionamento', label: 'Estacionamento Privado', icon: Car },
    { id: 'transfer-aeroporto', label: 'Transfer Aeroporto', icon: Car },
    { id: 'cafe-da-manha', label: 'Café da Manhã Incluído', icon: Coffee },
    { id: 'meia-pensao', label: 'Meia Pensão', icon: Utensils },
    { id: 'pensao-completa', label: 'Pensão Completa', icon: Utensils },
    { id: 'bar', label: 'Bar no Quarto', icon: Wine },
    { id: 'sala-reunioes', label: 'Sala de Reuniões', icon: Users },
    { id: 'centro-negocios', label: 'Centro de Negócios', icon: Laptop },
    { id: 'elevador', label: 'Elevador', icon: ArrowUpDown },
    { id: 'recepcao-24h', label: 'Recepção 24h', icon: DoorOpen },
    { id: 'lavandaria-hotel', label: 'Lavandaria do Hotel', icon: Wind },
    { id: 'limpeza-diaria', label: 'Limpeza Diária', icon: Sparkles },
    { id: 'servico-quarto-24h', label: 'Serviço de Quarto 24h', icon: DoorOpen },
    { id: 'cofre-seguranca', label: 'Cofre de Segurança', icon: Shield },
    { id: 'tv-satelite', label: 'TV Satélite', icon: Tv },
    { id: 'netflix', label: 'Netflix/Streaming', icon: Tv },
    { id: 'aroma', label: 'Ambiente Aromatizado', icon: Leaf },
    { id: 'varanda-mobiliada', label: 'Varanda Mobiliada', icon: Sun },
    { id: 'vista-cidade', label: 'Vista para a Cidade', icon: Mountain },
    { id: 'isolamento-acustico', label: 'Isolamento Acústico', icon: KeyRound },
  ];

  // Modo edição: pré-preencher dados
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        capacity: initialData.capacity || 2,
        base_occupancy: initialData.base_occupancy || 2,
        base_price: initialData.base_price || '',
        total_units: initialData.total_units || 1,
        extra_adult_price: initialData.extra_adult_price || '',
        extra_child_price: initialData.extra_child_price || '',
        amenities: initialData.amenities || [],
        min_nights: initialData.min_nights || 1,
      });
      setPreviewImages(initialData.images || []);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('price') || name === 'capacity' || name === 'base_occupancy' || name === 'total_units' || name === 'min_nights'
        ? value
        : value
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => {
      const current = prev.amenities || [];
      const newAmenities = current.includes(amenityId)
        ? current.filter(id => id !== amenityId)
        : [...current, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 10;
    
    if (files.length + previewImages.length > maxFiles) {
      toast({
        title: 'Limite excedido',
        description: `Máximo de ${maxFiles} imagens permitido`,
        variant: 'destructive',
      });
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede 5MB`,
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewImages(prev => [...prev, result]);
        setImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast({
          title: 'Campo obrigatório',
          description: 'Nome do quarto é obrigatório',
          variant: 'destructive',
        });
        return false;
      }
      if (formData.name.trim().length < 3) {
        toast({
          title: 'Nome muito curto',
          description: 'Nome deve ter pelo menos 3 caracteres',
          variant: 'destructive',
        });
        return false;
      }
      if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
        toast({
          title: 'Preço inválido',
          description: 'Preço base deve ser maior que 0',
          variant: 'destructive',
        });
        return false;
      }
      if (formData.capacity < 1) {
        toast({
          title: 'Capacidade inválida',
          description: 'Capacidade deve ser pelo menos 1',
          variant: 'destructive',
        });
        return false;
      }
      if (formData.total_units < 1) {
        toast({
          title: 'Unidades inválidas',
          description: 'Unidades disponíveis deve ser pelo menos 1',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validação final
      if (!validateStep(1)) {
        setLoading(false);
        return;
      }

      // CORREÇÃO #1: Payload completo para o backend
      const payload = {
        // Campos obrigatórios para UPDATE
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        capacity: parseInt(formData.capacity.toString()),
        base_occupancy: parseInt(formData.base_occupancy.toString()),
        base_price: formData.base_price.toString(), // Manter como string para o backend
        total_units: parseInt(formData.total_units.toString()),
        
        // Campos opcionais
        extra_adult_price: formData.extra_adult_price ? formData.extra_adult_price.toString() : undefined,
        extra_child_price: formData.extra_child_price ? formData.extra_child_price.toString() : undefined,
        amenities: formData.amenities,
        min_nights: parseInt(formData.min_nights.toString()),
        images: images.length > 0 ? images : undefined,
      };

      // CORREÇÃO #2: Log para debug
      console.log('🚀 Payload enviado para', initialData ? 'updateRoomType' : 'createRoomType');
      console.log('📦 Payload completo:', payload);
      console.log('🔍 Campos específicos:', {
        name: payload.name,
        base_price: payload.base_price,
        total_units: payload.total_units,
        capacity: payload.capacity
      });

      let response;
      if (initialData) {
        // Modo edição - garantir que o ID está incluído
        const updatePayload = {
          ...payload,
          id: initialData.id // Garantir que o ID está presente para UPDATE
        };
        console.log('✏️ Modo edição - ID do quarto:', initialData.id);
        response = await hotelService.updateRoomType(hotelId, initialData.id, updatePayload);
      } else {
        // Modo criação
        response = await hotelService.createRoomType(hotelId, payload);
      }

      if (response.success && response.data) {
        toast({
          title: initialData ? '✅ Quarto atualizado!' : '✨ Quarto criado!',
          description: `"${formData.name}" salvo com sucesso`,
        });
        onSuccess(response.data.id);
      } else {
        throw new Error(response.error || 'Falha na operação');
      }
    } catch (err: any) {
      // Log detalhado do erro
      console.error('❌ Erro completo:', {
        message: err.message,
        stack: err.stack,
        payload: err.config?.data
      });
      
      setError(err.message || 'Erro ao salvar quarto');
      toast({
        title: '❌ Erro',
        description: err.message || 'Falha ao salvar quarto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 flex justify-between items-center rounded-t-2xl z-10">
          <div>
            <h2 className="text-2xl font-bold">
              {initialData ? '✏️ Editar Tipo de Quarto' : '✨ Criar Tipo de Quarto'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">Passo {currentStep} de 3</p>
          </div>
          <button
            onClick={onCancel}
            className="hover:bg-blue-800 p-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 px-6 py-3">
          <div className="flex gap-2">
            {[1, 2, 3].map(step => (
              <div
                key={step}
                className={`flex-1 h-1 rounded-full transition-all ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Erro</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Passo 1: Básico */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-gray-900 mb-2">
                  Nome do Quarto *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Quarto Deluxe com Vista para o Mar"
                  required
                  disabled={loading}
                  className="px-4 py-3"
                />
                <p className="text-xs text-gray-500 mt-1">Mínimo 3 caracteres</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="base_price" className="text-sm font-semibold text-gray-900 mb-2">
                    Preço Base (MZN) *
                  </Label>
                  <Input
                    id="base_price"
                    name="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    placeholder="ex: 2500"
                    step="0.01"
                    min="0.01" // CORREÇÃO #2: Não permitir zero
                    required
                    disabled={loading}
                    className="px-4 py-3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Preço por noite (mínimo: 0.01 MZN)</p>
                </div>

                <div>
                  <Label htmlFor="total_units" className="text-sm font-semibold text-gray-900 mb-2">
                    Unidades Disponíveis *
                  </Label>
                  <Input
                    id="total_units"
                    name="total_units"
                    type="number"
                    value={formData.total_units}
                    onChange={handleInputChange}
                    min="1"
                    disabled={loading}
                    className="px-4 py-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="capacity" className="text-sm font-semibold text-gray-900 mb-2">
                    Capacidade Máxima *
                  </Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    disabled={loading}
                    className="px-4 py-3"
                  />
                </div>

                <div>
                  <Label htmlFor="base_occupancy" className="text-sm font-semibold text-gray-900 mb-2">
                    Ocupação Base *
                  </Label>
                  <Input
                    id="base_occupancy"
                    name="base_occupancy"
                    type="number"
                    value={formData.base_occupancy}
                    onChange={handleInputChange}
                    min="1"
                    disabled={loading}
                    className="px-4 py-3"
                  />
                </div>

                <div>
                  <Label htmlFor="min_nights" className="text-sm font-semibold text-gray-900 mb-2">
                    Mínimo de Noites
                  </Label>
                  <Input
                    id="min_nights"
                    name="min_nights"
                    type="number"
                    value={formData.min_nights}
                    onChange={handleInputChange}
                    min="1"
                    disabled={loading}
                    className="px-4 py-3"
                  />
                </div>
              </div>

              {/* CORREÇÃO #2: Inputs para preços extras no passo 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="extra_adult_price" className="text-sm font-semibold text-gray-900 mb-2">
                    Preço Extra Adulto (MZN)
                  </Label>
                  <Input
                    id="extra_adult_price"
                    name="extra_adult_price"
                    type="number"
                    value={formData.extra_adult_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0" // Permite 0 mas backend pode rejeitar se check constraint for > 0
                    placeholder="0.00"
                    disabled={loading}
                    className="px-4 py-3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe 0.00 para gratuito</p>
                </div>

                <div>
                  <Label htmlFor="extra_child_price" className="text-sm font-semibold text-gray-900 mb-2">
                    Preço Extra Criança (MZN)
                  </Label>
                  <Input
                    id="extra_child_price"
                    name="extra_child_price"
                    type="number"
                    value={formData.extra_child_price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={loading}
                    className="px-4 py-3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe 0.00 para gratuito</p>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-gray-900 mb-2">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva as características principais do quarto..."
                  rows={4}
                  disabled={loading}
                  className="px-4 py-3"
                />
              </div>
            </div>
          )}

          {/* Passo 2: Detalhes, Amenities e Fotos */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenidades do Quarto</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {AMENITIES_OPTIONS.map((amenity) => {
                    const isSelected = formData.amenities.includes(amenity.id);
                    return (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleAmenity(amenity.id)}
                          disabled={loading}
                        />
                        <Label
                          htmlFor={`amenity-${amenity.id}`}
                          className="text-sm cursor-pointer flex items-center gap-2"
                        >
                          <amenity.icon className="w-4 h-4 text-gray-600" />
                          {amenity.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.amenities.length} amenidade(s) selecionada(s)
                </p>
              </div>

              {/* Fotos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos do Quarto (opcional)</h3>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-blue-300 rounded-xl p-8 hover:border-blue-600 hover:bg-blue-50 transition-all text-center"
                    disabled={loading}
                  >
                    <Upload className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <p className="font-semibold text-blue-600">Clique para fazer upload</p>
                    <p className="text-sm text-gray-500 mt-1">PNG, JPG até 5MB cada (máx 10)</p>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading}
                  />

                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {previewImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {previewImages.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      Nenhuma imagem selecionada (opcional)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Passo 3: Confirmação */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">📋 Resumo do Quarto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-gray-600">Nome:</p>
                    <p className="font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Preço Base:</p>
                    <p className="font-semibold">{formData.base_price} MZN/noite</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Capacidade:</p>
                    <p className="font-semibold">{formData.capacity} pessoas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ocupação Base:</p>
                    <p className="font-semibold">{formData.base_occupancy}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unidades:</p>
                    <p className="font-semibold">{formData.total_units}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Noites Mínimas:</p>
                    <p className="font-semibold">{formData.min_nights}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Preço Extra Adulto:</p>
                    <p className="font-semibold">{formData.extra_adult_price || '0.00'} MZN</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Preço Extra Criança:</p>
                    <p className="font-semibold">{formData.extra_child_price || '0.00'} MZN</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amenidades:</p>
                    <p className="font-semibold">{formData.amenities.length} selecionadas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fotos:</p>
                    <p className="font-semibold">{previewImages.length} enviada(s)</p>
                  </div>
                </div>
              </Card>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <p className="text-green-800 font-medium">
                  ✅ Tudo pronto! Clique em "{initialData ? 'Atualizar Quarto' : 'Criar Quarto'}" para confirmar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between gap-4 border-t rounded-b-2xl">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
                className="px-6"
              >
                ← Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="px-6"
            >
              Cancelar
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Próximo →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {initialData ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    {initialData ? '✏️ Atualizar Quarto' : '✨ Criar Quarto'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateRoomTypeFormModern;