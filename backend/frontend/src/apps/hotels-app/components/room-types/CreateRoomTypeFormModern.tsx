import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { AlertCircle, Loader2, X, Upload, Image as ImageIcon, Wifi, Users, Star, DoorOpen, Wind, Bed, Bath, Coffee, Utensils, Tv, Shield, Leaf, Dumbbell, Car, Baby, PawPrint, CigaretteOff, ArrowUpDown, Accessibility, ShowerHead, Key, Mountain, Sun, Umbrella, Coffee as CoffeeCup, Wine, Cake, Music, Gamepad, BookOpen, Laptop, Phone, Globe, MapPin, Heart, Sparkles, KeyRound, ChevronLeft, ChevronRight, Eye, Star as StarIcon } from 'lucide-react';
import { hotelService } from '@/services/hotelService';
import { photoGalleryService } from '@/services/photoGalleryService';
import { useToast } from '@/shared/hooks/use-toast';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

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
  images?: string[]; // Mantido para compatibilidade
}

interface CreateRoomTypeFormModernProps {
  hotelId: string;
  initialData?: RoomType;
  onSuccess: (roomTypeId: string) => void;
  onCancel: () => void;
}

// Componente de Galeria para o Formulário Moderno
const PhotoGallerySection: React.FC<{
  roomTypeId: string;
  onPhotosChange?: (photos: RoomTypePhoto[]) => void;
}> = ({ roomTypeId, onPhotosChange }) => {
  const [photos, setPhotos] = useState<RoomTypePhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPhotos();
  }, [roomTypeId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoGalleryService.getRoomTypePhotos(roomTypeId);
      setPhotos(data);
      setCurrentIndex(0);
      onPhotosChange?.(data);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;

    try {
      setUploading(true);
      
      const uploadPromises = Array.from(files).map((file, index) =>
        photoGalleryService.uploadRoomTypePhoto({
          room_type_id: roomTypeId,
          file,
          is_featured: photos.length === 0 && index === 0,
          is_primary: photos.length === 0 && index === 0,
        })
      );

      const uploadedPhotos = await Promise.all(uploadPromises);
      const updatedPhotos = [...photos, ...uploadedPhotos];
      
      setPhotos(updatedPhotos);
      onPhotosChange?.(updatedPhotos);
      
      toast({
        title: '✅ Fotos enviadas',
        description: `${uploadedPhotos.length} foto(s) adicionada(s) com sucesso`,
      });
    } catch (error) {
      toast({
        title: '❌ Erro no upload',
        description: error instanceof Error ? error.message : 'Falha ao enviar fotos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await photoGalleryService.deletePhoto(roomTypeId, photoId);
      const updated = photos.filter(p => p.id !== photoId);
      setPhotos(updated);
      setCurrentIndex(Math.min(currentIndex, updated.length - 1));
      onPhotosChange?.(updated);
      
      toast({
        title: '✅ Foto removida',
        description: 'Foto deletada com sucesso',
      });
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: error instanceof Error ? error.message : 'Falha ao deletar foto',
        variant: 'destructive',
      });
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      const updated = await photoGalleryService.setPrimaryPhoto(roomTypeId, photoId);
      const newPhotos = photos.map(p => ({
        ...p,
        is_primary: p.id === photoId,
      }));
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
      
      toast({
        title: '⭐ Foto principal',
        description: 'Foto definida como principal',
      });
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: error instanceof Error ? error.message : 'Falha ao definir foto principal',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId)!;
      const updated = await photoGalleryService.updatePhoto(roomTypeId, photoId, {
        is_featured: !photo.is_featured,
      });
      const newPhotos = photos.map(p => p.id === photoId ? updated : p);
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: error instanceof Error ? error.message : 'Falha ao alternar destaque',
        variant: 'destructive',
      });
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const currentPhoto = photos[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Viewer Principal */}
      {photos.length > 0 && (
        <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video group">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.alt_text || 'Foto do quarto'}
            className="w-full h-full object-cover"
          />

          {photos.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {photos.length}
          </div>

          {currentPhoto.is_primary && (
            <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <StarIcon size={12} fill="currentColor" /> Principal
            </div>
          )}
        </div>
      )}

      {/* Ações da Foto Atual */}
      {currentPhoto && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleSetPrimary(currentPhoto.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPhoto.is_primary
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <StarIcon size={18} fill={currentPhoto.is_primary ? 'currentColor' : 'none'} />
              Principal
            </button>

            <button
              onClick={() => handleToggleFeatured(currentPhoto.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentPhoto.is_featured
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              <Eye size={18} />
              Destacar
            </button>

            <button
              onClick={() => handleDeletePhoto(currentPhoto.id)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition border border-red-200"
            >
              <X size={18} />
              Remover
            </button>
          </div>
        </div>
      )}

      {/* Thumbnails */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 relative w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                index === currentIndex ? 'border-blue-600' : 'border-gray-300'
              }`}
            >
              <img
                src={photo.url}
                alt={photo.alt_text}
                className="w-full h-full object-cover"
              />
              {photo.is_primary && (
                <div className="absolute top-1 right-1 bg-yellow-500 text-white rounded-full p-1">
                  <StarIcon size={10} fill="currentColor" />
                </div>
              )}
              {photo.is_featured && (
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1">
                  <Eye size={10} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Área de Upload */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-blue-300 rounded-xl p-6 hover:border-blue-600 hover:bg-blue-50 transition-all text-center disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
              <p className="text-blue-600">Enviando fotos...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-blue-600">Adicionar mais fotos</p>
              <p className="text-sm text-gray-500 mt-1">Máx 5MB por foto • JPEG, PNG, WebP</p>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Estatísticas */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-gray-100 rounded-lg p-2">
            <div className="font-bold text-gray-900">{photos.length}</div>
            <div className="text-gray-600">Total</div>
          </div>
          <div className="bg-blue-100 rounded-lg p-2">
            <div className="font-bold text-blue-900">{photos.filter(p => p.is_featured).length}</div>
            <div className="text-blue-700">Destacadas</div>
          </div>
          <div className="bg-yellow-100 rounded-lg p-2">
            <div className="font-bold text-yellow-900">{photos.filter(p => p.is_primary).length}</div>
            <div className="text-yellow-700">Principal</div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateRoomTypeFormModern: React.FC<CreateRoomTypeFormModernProps> = ({
  hotelId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();

  // Estado para fotos (agora usando o novo sistema)
  const [photos, setPhotos] = useState<RoomTypePhoto[]>([]);
  const [createdRoomTypeId, setCreatedRoomTypeId] = useState<string | null>(initialData?.id || null);

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
      setCreatedRoomTypeId(initialData.id);
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

      // Payload no formato correto que o backend espera
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        capacity: parseInt(formData.capacity.toString()),
        base_occupancy: parseInt(formData.base_occupancy.toString()),
        base_price: formData.base_price.toString(),
        total_units: parseInt(formData.total_units.toString()),
        extra_adult_price: formData.extra_adult_price ? formData.extra_adult_price.toString() : undefined,
        extra_child_price: formData.extra_child_price ? formData.extra_child_price.toString() : undefined,
        amenities: formData.amenities,
        min_nights: parseInt(formData.min_nights.toString()),
      };

      console.log('🚀 Payload enviado:', payload);

      let response;
      if (initialData) {
        response = await hotelService.updateRoomType(hotelId, initialData.id, payload);
      } else {
        response = await hotelService.createRoomType(hotelId, payload);
      }

      if (response.success && response.data) {
        const roomTypeId = response.data.id;
        
        // Se for criação, guardar o ID para permitir upload de fotos depois
        if (!initialData) {
          setCreatedRoomTypeId(roomTypeId);
        }
        
        toast({
          title: initialData ? '✅ Quarto atualizado!' : '✨ Quarto criado!',
          description: `"${formData.name}" salvo com sucesso`,
        });
        
        // Se for criação e tivermos fotos para upload, podemos fazer o upload agora
        if (!initialData && photos.length > 0) {
          toast({
            title: '📸 Enviando fotos...',
            description: 'Aguarde enquanto as fotos são enviadas',
          });
          
          // Upload das fotos
          for (const photo of photos) {
            // As fotos já foram enviadas? Depende da implementação
            // Se as fotos foram adicionadas via PhotoGallerySection durante a criação,
            // elas já foram enviadas e estão com URL completa
          }
        }
        
        onSuccess(roomTypeId);
      } else {
        throw new Error(response.error || 'Falha na operação');
      }
    } catch (err: any) {
      console.error('❌ Erro:', err);
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
            <p className="text-blue-100 text-sm mt-1">Passo {currentStep} de 4</p>
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
            {[1, 2, 3, 4].map(step => (
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
                    min="0.01"
                    required
                    disabled={loading}
                    className="px-4 py-3"
                  />
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
                    min="0"
                    placeholder="0.00"
                    disabled={loading}
                    className="px-4 py-3"
                  />
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

          {/* Passo 2: Amenities */}
          {currentStep === 2 && (
            <div className="space-y-6">
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
              <p className="text-xs text-gray-500">
                {formData.amenities.length} amenidade(s) selecionada(s)
              </p>
            </div>
          )}

          {/* Passo 3: Fotos - FUNCIONA TANTO NA CRIAÇÃO QUANTO NA EDIÇÃO */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fotos do Quarto</h3>
              
              {createdRoomTypeId || initialData?.id ? (
                // Temos um ID (edição ou criação já finalizada)
                <PhotoGallerySection
                  roomTypeId={createdRoomTypeId || initialData!.id}
                  onPhotosChange={setPhotos}
                />
              ) : (
                // Modo criação: ainda não tem roomTypeId
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900">Fotos serão adicionadas após a criação</h4>
                    <p className="text-blue-700 max-w-md">
                      O quarto será criado primeiro. Depois você poderá adicionar as fotos na página de edição ou continuar aqui após a criação.
                    </p>
                    <div className="bg-white rounded-lg p-4 mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Fluxo:</strong>
                      </p>
                      <ol className="text-sm text-left text-gray-600 mt-2 space-y-1 list-decimal list-inside">
                        <li>Clique em "Criar Quarto" no próximo passo</li>
                        <li>Após a criação, você será redirecionado para editar o quarto</li>
                        <li>Lá você poderá adicionar todas as fotos</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Passo 4: Confirmação */}
          {currentStep === 4 && (
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
                    <p className="text-gray-600">Amenidades:</p>
                    <p className="font-semibold">{formData.amenities.length} selecionadas</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fotos:</p>
                    <p className="font-semibold">{photos.length} adicionadas</p>
                  </div>
                </div>
              </Card>
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

            {currentStep < 4 ? (
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