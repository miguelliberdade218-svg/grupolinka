/**
 * src/apps/hotels-app/components/event-spaces/CreateEventSpaceFormModern.tsx
 * VERSÃO FINAL CORRIGIDA - 04/02/2026
 * ✅ MODIFICAÇÃO: Espaços de eventos SEMPRE herdam localização do hotel
 * ✅ REMOVIDO: Opção para escolher localização diferente
 * ✅ CORREÇÃO: Removida validação de localização (não é mais necessária)
 * Replicando o comportamento dos RoomTypes: sem upload real, apenas preview + URLs manuais
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AlertCircle, Loader2, X, Upload, Image as ImageIcon, Users, DollarSign, Link as LinkIcon, Calendar, CheckCircle2, AlertTriangle, Hotel } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { eventSpaceService } from '@/services/eventSpaceService';
import type { CreateEventSpaceRequest } from '@/shared/types/event-spaces';

interface CreateEventSpaceFormModernProps {
  hotelId: string;
  // ✅ OBRIGATÓRIO: Receber localização do hotel
  hotelLocation?: {
    locality?: string;
    province?: string;
    lat?: string | null;
    lng?: string | null;
    location_id?: string | null;
  };
  onSuccess?: (spaceId: string) => void;
  onCancel?: () => void;
}

const SPACE_TYPES = [
  'Auditório',
  'Sala de Conferências',
  'Salão de Festas',
  'Espaço Externo',
  'Sala Multiúso',
  'Terraço',
  'Outro',
];

const EVENT_TYPES = [
  'Casamento',
  'Conferência',
  'Workshop',
  'Festa Corporativa',
  'Aniversário',
  'Exposição',
  'Show',
  'Lançamento',
  'Reunião',
  'Cerimônia',
  'Outro',
];

const SETUP_OPTIONS = [
  'Teatro',
  'Banquete',
  'Classe',
  'Cocktail',
  'U-shape',
  'Conferência',
  'Feira',
];

const NOISE_RESTRICTIONS = [
  'Até 22h',
  'Até 23h',
  'Até 24h',
  'Até 01h',
  'Sem restrição',
];

const CreateEventSpaceFormModern: React.FC<CreateEventSpaceFormModernProps> = ({
  hotelId,
  hotelLocation, // ✅ OBRIGATÓRIO: Receber localização do hotel
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [manualImageUrls, setManualImageUrls] = useState<string>(''); // NOVO: campo para URLs manuais
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // FormData corrigido - campos JSON como objetos/arrays vazios
  const [formData, setFormData] = useState<Partial<CreateEventSpaceRequest>>({
    hotelId,
    name: '',
    description: '',
    capacityMin: 10,
    capacityMax: 100,
    areaSqm: null,
    basePricePerDay: '',
    weekendSurchargePercent: 20,
    spaceType: '',
    naturalLight: true,
    hasStage: false,
    loadingAccess: false,
    dressingRooms: null,
    insuranceRequired: false,
    alcoholAllowed: false,
    approvalRequired: true,
    noiseRestriction: '',
    securityDeposit: null,
    offersCatering: false,
    cateringDiscountPercent: 0,
    cateringMenuUrls: [], // ✅ array vazio, não string
    allowedEventTypes: [], // ✅ array vazio
    prohibitedEventTypes: [], // ✅ array vazio
    equipment: {}, // ✅ objeto vazio (amenities será adicionado dentro)
    setupOptions: [], // ✅ array vazio
    images: [], // ✅ array vazio (será preenchido com URLs)
    floorPlanImage: null,
    virtualTourUrl: null,
    isActive: true,
    isFeatured: false,
    // ✅ CAMPOS DE LOCALIZAÇÃO (serão preenchidos com dados do hotel)
    locality: '',
    province: '',
    lat: null,
    lng: null,
    location_id: null,
    inherits_hotel_location: true, // ✅ SEMPRE true
  });

  // ✅ SIMPLIFICADO: useEffect para SEMPRE preencher com localização do hotel
  useEffect(() => {
    if (hotelLocation) {
      // ✅ SEMPRE preencher com localização do hotel
      setFormData(prev => ({
        ...prev,
        locality: hotelLocation.locality || '',
        province: hotelLocation.province || '',
        lat: hotelLocation.lat || '',
        lng: hotelLocation.lng || '',
        location_id: hotelLocation.location_id || '',
        inherits_hotel_location: true, // ✅ SEMPRE true
      }));
    }
  }, [hotelLocation]);

  // Estado separado para amenities (input do usuário)
  const [amenitiesInput, setAmenitiesInput] = useState<string>('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? null : Number(value);
      if (isNaN(processedValue)) processedValue = 0;
    }
    
    if (name === 'basePricePerDay' || name === 'securityDeposit') {
      processedValue = value;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  // Função separada para processar amenities
  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmenitiesInput(value);
    
    // Converter para array e atualizar equipment
    const amenities = value.split(',').map(a => a.trim()).filter(a => a);
    setFormData(prev => ({ 
      ...prev, 
      equipment: { amenities } // ✅ objeto com array de amenities
    }));
  };

  const handleToggleChange = (name: keyof CreateEventSpaceRequest) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMultiSelect = (name: 'allowedEventTypes' | 'prohibitedEventTypes' | 'setupOptions') => 
    (values: string[]) => {
      setFormData((prev) => ({ ...prev, [name]: values }));
    };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = 10;
    const availableSlots = maxFiles - uploadedFiles.length;
    
    const filesToAdd = files.slice(0, availableSlots);

    if (filesToAdd.length === 0) {
      toast({
        title: 'Limite atingido',
        description: `Máximo de ${maxFiles} imagens permitidas`,
        variant: 'destructive',
      });
      return;
    }

    const newFiles = [...uploadedFiles, ...filesToAdd];
    const newPreviews = [...previewImages];
    
    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPreviews.push(event.target.result as string);
          if (newPreviews.length === newFiles.length) {
            setPreviewImages(newPreviews);
          }
        }
      };
      reader.readAsDataURL(file);
    });

    setUploadedFiles(newFiles);
  };

  const removeImage = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateStep = (): boolean => {
    setError(null);

    if (currentStep === 1) {
      // Nome
      if (!formData.name?.trim()) {
        setError('O nome do espaço é obrigatório');
        return false;
      }
      if (formData.name.trim().length < 3) {
        setError('O nome deve ter pelo menos 3 caracteres');
        return false;
      }
      if (formData.name.trim().length > 100) {
        setError('O nome deve ter no máximo 100 caracteres');
        return false;
      }
      
      // Tipo
      if (!formData.spaceType) {
        setError('Selecione o tipo de espaço');
        return false;
      }
      
      // Capacidade
      if (formData.capacityMin! >= formData.capacityMax!) {
        setError('Capacidade mínima deve ser menor que a máxima');
        return false;
      }
      if (formData.capacityMin! < 1 || formData.capacityMax! < 1) {
        setError('As capacidades devem ser pelo menos 1');
        return false;
      }
      
      // Área
      if (formData.areaSqm !== null && formData.areaSqm !== undefined && formData.areaSqm <= 0) {
        setError('A área deve ser maior que 0');
        return false;
      }
      
      // Descrição
      if (formData.description && formData.description.length > 1000) {
        setError('A descrição deve ter no máximo 1000 caracteres');
        return false;
      }

      // ❌ REMOVIDO: Validação de localização (não é mais necessária)
      // A localização é sempre herdada do hotel, o backend fará a validação
    }

    if (currentStep === 2) {
      // Preço base
      if (!formData.basePricePerDay) {
        setError('O preço base por dia é obrigatório');
        return false;
      }
      
      const priceValue = Number(formData.basePricePerDay);
      if (isNaN(priceValue) || priceValue <= 0) {
        setError('O preço base deve ser um número válido maior que 0');
        return false;
      }
      
      // Não requer imagens no momento da criação (igual aos RoomTypes)
      // Apenas valida se houver URLs manuais inválidas
      if (manualImageUrls) {
        const urls = manualImageUrls.split('\n').map(url => url.trim()).filter(url => url);
        const invalidUrls = urls.filter(url => !url.startsWith('http'));
        if (invalidUrls.length > 0) {
          setError(`URLs inválidas encontradas. Todas devem começar com "http"`);
          return false;
        }
      }
      
      // Sobretaxa
      if (formData.weekendSurchargePercent !== null && formData.weekendSurchargePercent !== undefined) {
        if (isNaN(formData.weekendSurchargePercent) || formData.weekendSurchargePercent < 0 || formData.weekendSurchargePercent > 100) {
          setError('A sobretaxa deve estar entre 0% e 100%');
          return false;
        }
      }
      
      // Desconto catering
      if (formData.offersCatering && formData.cateringDiscountPercent) {
        if (isNaN(formData.cateringDiscountPercent) || formData.cateringDiscountPercent < 0 || formData.cateringDiscountPercent > 100) {
          setError('O desconto de catering deve estar entre 0% e 100%');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // NÃO faz upload real (igual aos RoomTypes)
      // Usa apenas URLs manuais que o utilizador colou
      const manualUrls = manualImageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.startsWith('http') && url.length > 10);

      // ✅ PAYLOAD CORRIGIDO: SEMPRE usa localização do hotel
      const payload: CreateEventSpaceRequest = {
        hotelId,
        name: formData.name!.trim(),
        description: formData.description?.trim() || null,
        capacityMin: formData.capacityMin!,
        capacityMax: formData.capacityMax!,
        areaSqm: formData.areaSqm || null,
        basePricePerDay: formData.basePricePerDay || '0',
        weekendSurchargePercent: formData.weekendSurchargePercent || 0,
        spaceType: formData.spaceType || null,
        naturalLight: formData.naturalLight ?? true,
        hasStage: formData.hasStage ?? false,
        loadingAccess: formData.loadingAccess ?? false,
        dressingRooms: formData.dressingRooms || null,
        insuranceRequired: formData.insuranceRequired ?? false,
        alcoholAllowed: formData.alcoholAllowed ?? false,
        approvalRequired: formData.approvalRequired ?? true,
        noiseRestriction: formData.noiseRestriction?.trim() || null,
        securityDeposit: formData.securityDeposit || null,
        offersCatering: formData.offersCatering ?? false,
        cateringDiscountPercent: formData.cateringDiscountPercent || 0,
        cateringMenuUrls: formData.cateringMenuUrls || [], // ✅ array vazio
        allowedEventTypes: formData.allowedEventTypes || [], // ✅ array vazio
        prohibitedEventTypes: formData.prohibitedEventTypes || [], // ✅ array vazio
        equipment: formData.equipment, // ✅ USAR DIRETAMENTE (não processar aqui)
        setupOptions: formData.setupOptions || [], // ✅ array vazio
        images: manualUrls, // ✅ array de URLs
        floorPlanImage: formData.floorPlanImage?.trim() || null,
        virtualTourUrl: formData.virtualTourUrl?.trim() || null,
        isActive: formData.isActive ?? true,
        isFeatured: formData.isFeatured ?? false,
        // ✅ LOCALIZAÇÃO: SEMPRE do hotel
        locality: hotelLocation?.locality || formData.locality || null,
        province: hotelLocation?.province || formData.province || null,
        lat: hotelLocation?.lat || formData.lat || null,
        lng: hotelLocation?.lng || formData.lng || null,
        location_id: hotelLocation?.location_id || formData.location_id || null,
        inherits_hotel_location: true, // ✅ SEMPRE true
      };

      // ✅ IMPORTANTE: Log para debug
      console.log('🔍 equipment antes de enviar (formulário):', {
        type: typeof payload.equipment,
        value: payload.equipment,
        isObject: typeof payload.equipment === 'object' && payload.equipment !== null,
        isString: typeof payload.equipment === 'string',
      });

      const res = await eventSpaceService.createEventSpace(payload);

      if (!res.success || !res.data?.id) {
        throw new Error(res.error || 'Falha ao criar espaço');
      }

      toast({
        title: '✅ Espaço criado com sucesso!',
        description: `"${formData.name}" está agora disponível para reservas.`,
        variant: 'success',
        duration: 5000,
      });

      onSuccess?.(res.data.id);
      onCancel?.();
    } catch (err: any) {
      const msg = err.message || 'Erro ao criar espaço de evento';
      setError(msg);
      toast({
        title: '❌ Erro ao criar espaço',
        description: msg,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const MultiSelectChip = ({
    options,
    selected,
    onChange,
    label,
    maxSelections,
  }: {
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
    label: string;
    maxSelections?: number;
  }) => (
    <div>
      <Label className="text-base font-medium mb-2 block">
        {label}
        {maxSelections && (
          <span className="text-sm text-gray-500 ml-2">
            (Máx. {maxSelections})
          </span>
        )}
      </Label>
      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const isDisabled = !isSelected && maxSelections 
            ? selected.length >= maxSelections 
            : false;
          
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                if (isDisabled) return;
                
                if (isSelected) {
                  onChange(selected.filter((item) => item !== option));
                } else {
                  onChange([...selected, option]);
                }
              }}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          Selecionados: {selected.length}
          {maxSelections && ` / ${maxSelections}`}
        </p>
      )}
    </div>
  );

  // Contadores de caracteres
  const nameCharCount = formData.name?.length || 0;
  const descriptionCharCount = formData.description?.length || 0;
  const maxNameChars = 100;
  const maxDescriptionChars = 1000;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <Card className="w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl border-0">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-700 text-white p-6 flex justify-between items-center z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">Criar Novo Espaço de Eventos</h2>
            <p className="text-violet-100 text-sm mt-1">Passo {currentStep} de 3</p>
          </div>
          <button
            onClick={onCancel}
            className="hover:bg-white/20 p-2 rounded-full transition-all disabled:opacity-50"
            aria-label="Fechar"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b">
          <div className="flex gap-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step <= currentStep ? 'bg-violet-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span className={currentStep >= 1 ? 'font-medium text-violet-700' : ''}>
              Informações Básicas
            </span>
            <span className={currentStep >= 2 ? 'font-medium text-violet-700' : ''}>
              Preços e Imagens
            </span>
            <span className={currentStep >= 3 ? 'font-medium text-violet-700' : ''}>
              Confirmação
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-base font-medium">
                      Nome do Espaço *
                    </Label>
                    <span className={`text-xs ${nameCharCount > maxNameChars ? 'text-red-600' : 'text-gray-500'}`}>
                      {nameCharCount}/{maxNameChars}
                    </span>
                  </div>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Auditório Principal"
                    className="h-12"
                    required
                    maxLength={maxNameChars}
                  />
                  {nameCharCount > maxNameChars * 0.8 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Atingindo limite de caracteres
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Tipo de Espaço *
                  </Label>
                  <Select
                    value={formData.spaceType || ''}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, spaceType: value }))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPACE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-base font-medium">Descrição</Label>
                  <span className={`text-xs ${descriptionCharCount > maxDescriptionChars ? 'text-red-600' : 'text-gray-500'}`}>
                    {descriptionCharCount}/{maxDescriptionChars}
                  </span>
                </div>
                <Textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Descreva o espaço: dimensões, estilo, o que o torna especial..."
                  rows={4}
                  className="resize-none"
                  maxLength={maxDescriptionChars}
                />
              </div>

              {/* ✅ MODIFICADO: Seção de Localização FIXA (sempre herda do hotel) */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Hotel className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Localização do Espaço</span>
                </div>
                
                <div className="text-sm text-blue-700">
                  <p>✅ Este espaço de eventos usará a mesma localização do hotel:</p>
                  <p className="font-medium mt-1">
                    {hotelLocation?.locality || formData.locality || 'Hotel'}, {hotelLocation?.province || formData.province || 'Província'}
                    {hotelLocation?.lat && hotelLocation?.lng && (
                      <span className="text-xs ml-2">
                        ({hotelLocation.lat}, {hotelLocation.lng})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Os espaços de eventos sempre herdam a localização do hotel para garantir consistência nas buscas.
                  </p>
                </div>
              </div>

              {/* ✅ REMOVIDO: Autocomplete próprio (não é mais permitido) */}
              {/* ✅ REMOVIDO: Switch de herança (sempre herda) */}

              {/* Campos ocultos para armazenar dados da localização */}
              <input type="hidden" name="location_id" value={formData.location_id || ''} />
              <input type="hidden" name="lat" value={formData.lat || ''} />
              <input type="hidden" name="lng" value={formData.lng || ''} />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Capacidade Mínima *
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      name="capacityMin"
                      value={formData.capacityMin || ''}
                      onChange={handleInputChange}
                      min={1}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Capacidade Máxima *
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="number"
                      name="capacityMax"
                      value={formData.capacityMax || ''}
                      onChange={handleInputChange}
                      min={formData.capacityMin || 1}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Área (m²)
                  </Label>
                  <Input
                    type="number"
                    name="areaSqm"
                    value={formData.areaSqm || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.1"
                    className="h-12"
                  />
                  {formData.areaSqm !== null && formData.areaSqm !== undefined && formData.areaSqm <= 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      A área deve ser maior que 0
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Cabines/Vestiários
                  </Label>
                  <Input
                    type="number"
                    name="dressingRooms"
                    value={formData.dressingRooms || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelectChip
                  options={EVENT_TYPES}
                  selected={formData.allowedEventTypes || []}
                  onChange={(values) => handleMultiSelect('allowedEventTypes')(values)}
                  label="Tipos de Evento Permitidos"
                  maxSelections={8}
                />

                <MultiSelectChip
                  options={SETUP_OPTIONS}
                  selected={formData.setupOptions || []}
                  onChange={(values) => handleMultiSelect('setupOptions')(values)}
                  label="Configurações Disponíveis"
                />
              </div>

              {/* Campo de Amenities separado */}
              <div>
                <Label className="text-base font-medium mb-2 block">
                  Amenities/Equipamentos
                </Label>
                <Input
                  name="amenitiesInput"
                  value={amenitiesInput}
                  onChange={handleAmenitiesChange}
                  placeholder="Ex: Wi-Fi, Projetor, Som, Ar Condicionado, Mesas..."
                  className="h-12"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe com vírgulas. Será salvo em equipment.amenities
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center justify-between space-x-3">
                  <Label className="text-base font-medium">Luz Natural</Label>
                  <Switch
                    checked={formData.naturalLight ?? true}
                    onCheckedChange={handleToggleChange('naturalLight')}
                  />
                </div>

                <div className="flex items-center justify-between space-x-3">
                  <Label className="text-base font-medium">Palco</Label>
                  <Switch
                    checked={formData.hasStage ?? false}
                    onCheckedChange={handleToggleChange('hasStage')}
                  />
                </div>

                <div className="flex items-center justify-between space-x-3">
                  <Label className="text-base font-medium">Acesso Carga</Label>
                  <Switch
                    checked={formData.loadingAccess ?? false}
                    onCheckedChange={handleToggleChange('loadingAccess')}
                  />
                </div>

                <div className="flex items-center justify-between space-x-3">
                  <Label className="text-base font-medium">Álcool Permitido</Label>
                  <Switch
                    checked={formData.alcoholAllowed ?? false}
                    onCheckedChange={handleToggleChange('alcoholAllowed')}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  Restrição de Ruído
                </Label>
                <Select
                  value={formData.noiseRestriction || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, noiseRestriction: value }))
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione a restrição" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOISE_RESTRICTIONS.map((restriction) => (
                      <SelectItem key={restriction} value={restriction}>
                        {restriction}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Preço Base por Dia (MZN) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      inputMode="decimal"
                      name="basePricePerDay"
                      value={formData.basePricePerDay}
                      onChange={handleInputChange}
                      placeholder="2500.00"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  {formData.basePricePerDay && isNaN(Number(formData.basePricePerDay)) && (
                    <p className="text-xs text-red-600 mt-1">
                      Digite um valor numérico válido
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Preço padrão por dia completo
                  </p>
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Sobretaxa Fim de Semana (%)
                  </Label>
                  <Input
                    type="number"
                    name="weekendSurchargePercent"
                    value={formData.weekendSurchargePercent || ''}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="h-12"
                  />
                  {formData.weekendSurchargePercent !== undefined && 
                   (formData.weekendSurchargePercent < 0 || formData.weekendSurchargePercent > 100) && (
                    <p className="text-xs text-red-600 mt-1">
                      Valor deve estar entre 0 e 100
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Depósito de Segurança (MZN)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      inputMode="decimal"
                      name="securityDeposit"
                      value={formData.securityDeposit || ''}
                      onChange={handleInputChange}
                      placeholder="5000.00"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-3">
                  <Label className="text-base font-medium">Oferece Catering</Label>
                  <Switch
                    checked={formData.offersCatering ?? false}
                    onCheckedChange={handleToggleChange('offersCatering')}
                  />
                </div>
              </div>

              {formData.offersCatering && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-2 block">
                      Desconto Catering (%)
                    </Label>
                    <Input
                      type="number"
                      name="cateringDiscountPercent"
                      value={formData.cateringDiscountPercent || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="h-12"
                    />
                    {formData.cateringDiscountPercent !== undefined && 
                     (formData.cateringDiscountPercent < 0 || formData.cateringDiscountPercent > 100) && (
                      <p className="text-xs text-red-600 mt-1">
                        Desconto deve estar entre 0% e 100%
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-2 block">
                      URLs do Menu de Catering (um por linha)
                    </Label>
                    <Textarea
                      name="cateringMenuUrls"
                      value={(formData.cateringMenuUrls || []).join('\n')}
                      onChange={(e) => {
                        const urls = e.target.value.split('\n').filter(url => url.trim());
                        setFormData(prev => ({ ...prev, cateringMenuUrls: urls }));
                      }}
                      placeholder="https://exemplo.com/menu1.pdf\nhttps://exemplo.com/menu2.pdf"
                      rows={3}
                      className="resize-none font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    URL do Tour Virtual
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="url"
                      name="virtualTourUrl"
                      value={formData.virtualTourUrl || ''}
                      onChange={handleInputChange}
                      placeholder="https://tourvirtual.exemplo.com"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    URL do Planta Baixa
                  </Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <Input
                      type="url"
                      name="floorPlanImage"
                      value={formData.floorPlanImage || ''}
                      onChange={handleInputChange}
                      placeholder="https://exemplo.com/planta.png"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">
                  Fotos do Espaço (máx. 10)
                </Label>

                {/* Preview local (só visual, não envia) */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-4"
                    disabled={uploadedFiles.length >= 10}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Selecionar Fotos (apenas preview)
                  </Button>
                  <p className="text-sm text-gray-500">
                    As fotos não serão enviadas agora. Use URLs externas ou adicione depois.
                  </p>
                </div>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                    {previewImages.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={src}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campo manual de URLs (igual ao cateringMenuUrls) */}
                <div>
                  <Label className="text-base font-medium mb-2 block">
                    URLs das Fotos (uma por linha)
                  </Label>
                  <Textarea
                    value={manualImageUrls}
                    onChange={e => setManualImageUrls(e.target.value)}
                    placeholder="https://exemplo.com/foto1.jpg
https://exemplo.com/foto2.jpg"
                    rows={4}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cole as URLs das imagens (ex: Cloudinary, ImgBB, Google Drive público). Elas serão salvas diretamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Confirmação simplificada */}
              {showConfirmation ? (
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <div className="p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                      Confirmar Criação do Espaço
                    </h3>
                    <p className="text-amber-700 mb-6">
                      Tem certeza que deseja criar o espaço <strong>"{formData.name}"</strong>?
                      Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowConfirmation(false)}
                        className="px-8"
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-10 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          '✅ Sim, Criar Espaço'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Resumo organizado */}
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-violet-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Resumo do Espaço
                      </h3>
                      
                      {/* Informações Básicas */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-3 text-lg">Informações Básicas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dl className="space-y-2">
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Nome:</dt>
                                <dd className="font-medium">{formData.name || '-'}</dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Tipo:</dt>
                                <dd className="font-medium">{formData.spaceType || '-'}</dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Capacidade:</dt>
                                <dd className="font-medium">
                                  {formData.capacityMin} - {formData.capacityMax} pessoas
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Amenities:</dt>
                                <dd className="font-medium">
                                  {((formData.equipment as any)?.amenities || []).length || 0} item(s)
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <dl className="space-y-2">
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Área:</dt>
                                <dd className="font-medium">
                                  {formData.areaSqm ? `${formData.areaSqm} m²` : '-'}
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Vestiários:</dt>
                                <dd className="font-medium">
                                  {formData.dressingRooms || '0'}
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Localização:</dt>
                                <dd className="font-medium">
                                  {formData.locality || hotelLocation?.locality || 'Hotel'}
                                  {formData.province && `, ${formData.province}`}
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-36">Herdada do Hotel:</dt>
                                <dd className="font-medium text-green-600">✅ Sim</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>

                      {/* Preços e Configurações */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-3 text-lg">Preços e Configurações</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dl className="space-y-2">
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Preço Base/Dia:</dt>
                                <dd className="font-medium">
                                  {formData.basePricePerDay ? `${formData.basePricePerDay} MZN` : '-'}
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Sobretaxa Fim Semana:</dt>
                                <dd className="font-medium">
                                  {formData.weekendSurchargePercent || 0}%
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Depósito Segurança:</dt>
                                <dd className="font-medium">
                                  {formData.securityDeposit ? `${formData.securityDeposit} MZN` : '-'}
                                </dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <dl className="space-y-2">
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Catering:</dt>
                                <dd className="font-medium">
                                  {formData.offersCatering ? 'Sim' : 'Não'}
                                  {formData.offersCatering && formData.cateringDiscountPercent
                                    ? ` (${formData.cateringDiscountPercent}% desconto)`
                                    : ''}
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Configurações:</dt>
                                <dd className="font-medium">
                                  {(formData.setupOptions || []).length} tipo(s)
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Eventos Permitidos:</dt>
                                <dd className="font-medium">
                                  {(formData.allowedEventTypes || []).length} tipo(s)
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>

                      {/* Restrições e Extras */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Restrições</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.naturalLight ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">Luz Natural</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.hasStage ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">Palco</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.alcoholAllowed ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">Álcool Permitido</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.insuranceRequired ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">Seguro Obrigatório</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.approvalRequired ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">Aprovação Necessária</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Extras</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Restrição de Ruído:</span>
                              <span className="font-medium ml-2">{formData.noiseRestriction || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Tour Virtual:</span>
                              <span className="font-medium ml-2">
                                {formData.virtualTourUrl ? 'Sim' : 'Não'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Planta Baixa:</span>
                              <span className="font-medium ml-2">
                                {formData.floorPlanImage ? 'Sim' : 'Não'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Imagens:</span>
                              <span className="font-medium ml-2">
                                {manualImageUrls ? manualImageUrls.split('\n').filter(url => url.trim()).length : 0} URL(s) fornecida(s)
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status Inicial:</span>
                              <span className="font-medium ml-2">Ativo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Pronto para criar!</p>
                        <ul className="mt-2 space-y-1">
                          <li>• Verifique todos os dados acima antes de continuar</li>
                          <li>• Após criação, poderá editar qualquer informação</li>
                          <li>• As imagens podem ser adicionadas depois usando URLs</li>
                          <li>• Todas as reservas necessitarão de aprovação manual</li>
                          <li>• ✅ Localização: Herdada do hotel ({formData.locality || hotelLocation?.locality || 'Hotel'})</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showConfirmation && (
          <div className="sticky bottom-0 bg-white border-t px-6 py-5 flex justify-between items-center">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevious} 
                  className="px-8"
                  disabled={loading}
                >
                  ← Voltar
                </Button>
              )}
              {currentStep < 3 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-8 bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Continuar →
                </Button>
              )}
            </div>

            {currentStep === 3 && (
              <Button
                type="button"
                onClick={() => setShowConfirmation(true)}
                disabled={loading}
                className="px-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  '📝 Criar Espaço de Eventos'
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreateEventSpaceFormModern;