// src/apps/hotels-app/components/event-spaces/CreateEventSpaceFormModern.tsx
import React, { useState, useRef } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { AlertCircle, Loader2, X, Upload, Image as ImageIcon, Users, Clock, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface CreateEventSpaceFormModernProps {
  hotelId: string;
  onSuccess?: (spaceId: string) => void;
  onCancel?: () => void;
}

const CreateEventSpaceFormModern: React.FC<CreateEventSpaceFormModernProps> = ({ hotelId, onSuccess, onCancel }) => {
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
    capacity_min: 10,
    capacity_max: 500,
    price_per_hour: '',
    price_per_day: '',
    price_per_event: '',
    location: '',
    amenities: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity_min' || name === 'capacity_max'
        ? parseInt(value) || 0
        : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setImages(prev => [...prev, result]);
          setPreviewImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.name?.trim()) {
        setError('Nome do espaço é obrigatório');
        return;
      }
      if (formData.name.trim().length < 3) {
        setError('Nome deve ter no mínimo 3 caracteres');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setError(null);
    setLoading(true);

    try {
      // TODO: Integrar com API quando disponível
      toast({
        title: '🔄 Em Desenvolvimento',
        description: 'Espaços de eventos estão sendo implementados no backend',
        variant: 'default'
      });
      
      console.log('📤 Dados do espaço:', formData);
      onCancel?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar espaço';
      setError(errorMsg);
      console.error('❌ Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">Criar Espaço de Eventos</h2>
            <p className="text-purple-100 text-sm mt-1">Passo {currentStep} de 3</p>
          </div>
          <button
            onClick={onCancel}
            className="hover:bg-purple-800 p-2 rounded-lg transition-colors"
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
                  step <= currentStep ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
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

          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Nome do Espaço *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ex: Salão Principal, Sala de Conferências"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva o espaço, suas características, decoração, etc..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Capacidade Mínima
                  </label>
                  <input
                    type="number"
                    name="capacity_min"
                    value={formData.capacity_min}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Capacidade Máxima
                  </label>
                  <input
                    type="number"
                    name="capacity_max"
                    value={formData.capacity_max}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Localização
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="ex: Andar 2, Lado da recepção"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Opções de Preço</h3>
                <p className="text-xs text-gray-500 mb-4">Você pode configurar um ou mais tipos de preço</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Preço por Hora (MZN)
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="price_per_hour"
                        value={formData.price_per_hour}
                        onChange={handleInputChange}
                        placeholder="ex: 500"
                        step="0.01"
                        min="0"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Preço por Dia (MZN)
                    </label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="price_per_day"
                        value={formData.price_per_day}
                        onChange={handleInputChange}
                        placeholder="ex: 2500"
                        step="0.01"
                        min="0"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Preço por Evento (MZN)
                    </label>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        name="price_per_event"
                        value={formData.price_per_event}
                        onChange={handleInputChange}
                        placeholder="ex: 5000"
                        step="0.01"
                        min="0"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Amenidades (separadas por vírgula)
                </label>
                <input
                  type="text"
                  name="amenities"
                  value={formData.amenities}
                  onChange={handleInputChange}
                  placeholder="ex: Projetor, Sonorização, Catering, WiFi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-3">Resumo do Espaço</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome:</span>
                    <span className="font-semibold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidade:</span>
                    <span className="font-semibold">{formData.capacity_min} - {formData.capacity_max} pessoas</span>
                  </div>
                  {images.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fotos:</span>
                      <span className="font-semibold">{images.length}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                ⚠️ Espaços de eventos ainda estão em desenvolvimento no backend. O formulário foi salvo em memória.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between gap-3 rounded-b-2xl border-t">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="px-6"
              >
                ← Anterior
              </Button>
            )}
            {currentStep < 3 && (
              <Button
                onClick={handleNext}
                className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
              >
                Próximo →
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="px-6"
            >
              Cancelar
            </Button>
            {currentStep === 3 && (
              <Button
                onClick={() => handleSubmit()}
                disabled={loading}
                className="px-6 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  '✨ Criar Espaço'
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreateEventSpaceFormModern;
