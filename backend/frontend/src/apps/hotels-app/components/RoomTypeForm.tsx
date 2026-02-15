/**
 * src/apps/hotels-app/components/RoomTypeForm.tsx (ENHANCED)
 * Formulário de criação/edição de room types com galeria de fotos
 * Versão: 14/02/2026 - CORRIGIDO
 * 
 * Integra:
 * - Edição de informações do room type
 * - Gerenciamento de galeria de fotos (incluído neste arquivo)
 * - Preview de fotos com setas
 * - Seleção de fotos destacadas
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { PhotoGalleryEditor } from './PhotoGalleryEditor';
import { roomTypeService } from '@/services/roomTypeService';
import type { RoomType } from '@/services/roomTypeService';
import type { RoomTypePhoto } from '@/shared/types/hotel-photos';

interface RoomTypeFormProps {
  hotelId: string;
  roomTypeId?: string;
  onSuccess?: (roomType: RoomType) => void;
  onCancel?: () => void;
}

export const RoomTypeForm: React.FC<RoomTypeFormProps> = ({
  hotelId,
  roomTypeId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 2,
    base_price: '',
    total_units: 1,
    base_occupancy: 1,
    min_nights: undefined as number | undefined,
    extra_adult_price: '',
    extra_child_price: '',
    amenities: [] as string[],
    is_active: true,
  });

  const [photos, setPhotos] = useState<RoomTypePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amenityInput, setAmenityInput] = useState('');
  const [success, setSuccess] = useState(false);

  // Carregar dados do room type se estiver editando
  useEffect(() => {
    if (roomTypeId) {
      loadRoomType();
    }
  }, [roomTypeId]);

  const loadRoomType = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORREÇÃO: getRoomTypeById retorna ApiResponse<RoomType>
      const response = await roomTypeService.getRoomTypeById(roomTypeId!);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao carregar room type');
      }

      const roomType = response.data;
      
      setFormData({
        name: roomType.name,
        description: roomType.description || '',
        capacity: roomType.capacity,
        base_price: roomType.base_price,
        total_units: roomType.total_units,
        base_occupancy: roomType.base_occupancy,
        min_nights: roomType.min_nights,
        extra_adult_price: roomType.extra_adult_price || '',
        extra_child_price: roomType.extra_child_price || '',
        amenities: roomType.amenities || [],
        is_active: roomType.is_active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar room type');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_active: e.target.checked,
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      if (!formData.name.trim()) {
        setError('Nome do room type é obrigatório');
        return;
      }

      if (!formData.base_price) {
        setError('Preço base é obrigatório');
        return;
      }

      let roomType: RoomType;

      if (roomTypeId) {
        // ✅ CORREÇÃO: updateRoomType espera (roomTypeId, data) - apenas 2 argumentos!
        const response = await roomTypeService.updateRoomType(roomTypeId, {
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          base_price: formData.base_price,
          total_units: formData.total_units,
          base_occupancy: formData.base_occupancy,
          min_nights: formData.min_nights,
          extra_adult_price: formData.extra_adult_price,
          extra_child_price: formData.extra_child_price,
          amenities: formData.amenities,
          is_active: formData.is_active,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Erro ao atualizar room type');
        }

        roomType = response.data;
      } else {
        // ✅ CORREÇÃO: createRoomType espera (hotelId, data)
        const response = await roomTypeService.createRoomType(hotelId, {
          hotel_id: hotelId,
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          base_price: formData.base_price,
          total_units: formData.total_units,
          base_occupancy: formData.base_occupancy,
          min_nights: formData.min_nights,
          extra_adult_price: formData.extra_adult_price,
          extra_child_price: formData.extra_child_price,
          amenities: formData.amenities,
          is_active: formData.is_active,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Erro ao criar room type');
        }

        roomType = response.data;
      }

      setSuccess(true);
      onSuccess?.(roomType);

      // Resetar após sucesso
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar room type');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-orange-600 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-lg border border-gray-200 p-8">
      {/* Mensagens de Erro/Sucesso */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-red-900">Erro</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">
            Room type salvo com sucesso! ✓
          </p>
        </div>
      )}

      {/* Informações Básicas */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Informações Básicas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Quarto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Quarto Executivo, Suite Presidencial"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Base (por noite) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                name="base_price"
                value={formData.base_price}
                onChange={handleInputChange}
                placeholder="150"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Descreva as características e atmosfera deste tipo de quarto..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidade
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total de Unidades
            </label>
            <input
              type="number"
              name="total_units"
              value={formData.total_units}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ocupação Base
            </label>
            <input
              type="number"
              name="base_occupancy"
              value={formData.base_occupancy}
              onChange={handleInputChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mín. Noites
            </label>
            <input
              type="number"
              name="min_nights"
              value={formData.min_nights || ''}
              onChange={handleInputChange}
              min="1"
              placeholder="Opcional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Preços Adicionais */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preços Adicionais</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Extra Adulto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                name="extra_adult_price"
                value={formData.extra_adult_price}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Extra Criança
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                name="extra_child_price"
                value={formData.extra_child_price}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Amenidades */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comodidades/Amenidades</h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddAmenity();
              }
            }}
            placeholder="Ex: WiFi, Ar Condicionado, Mini Bar..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="button"
            onClick={handleAddAmenity}
            className="px-6 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg font-medium transition"
          >
            Adicionar
          </button>
        </div>

        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity, index) => (
              <div
                key={index}
                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(index)}
                  className="text-orange-600 hover:text-orange-900 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="pt-6 border-t border-gray-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={handleCheckboxChange}
            className="w-5 h-5 rounded border-gray-300 text-orange-600 cursor-pointer"
          />
          <span className="text-gray-700 font-medium">Ativo/Disponível</span>
        </label>
      </div>

      {/* Galeria de Fotos */}
      {roomTypeId && (
        <div className="pt-6 border-t border-gray-200">
          <PhotoGalleryEditor
            roomTypeId={roomTypeId}
            onPhotosUpdated={(photos) => setPhotos(photos)}
          />
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={20} className="animate-spin" />}
          {roomTypeId ? 'Atualizar' : 'Criar'} Room Type
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Nota sobre fotos */}
      {!roomTypeId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          💡 Dica: Salve o room type primeiro para poder adicionar fotos
        </div>
      )}
    </form>
  );
};