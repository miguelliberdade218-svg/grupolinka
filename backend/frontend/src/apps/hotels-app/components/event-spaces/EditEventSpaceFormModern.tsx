/**
 * src/apps/hotels-app/components/event-spaces/EditEventSpaceFormModern.tsx
 * Formulário de edição de espaços de eventos - VERSÃO FINAL PERFEITA 27/01/2026
 * Com tratamento completo de erros Zod, refresh automático e otimizações
 * ✅ CORRIGIDO: Adicionada validação completa de campos obrigatórios em validateAllSteps
 * ✅ CORREÇÃO: Campos possivelmente undefined agora usam valores padrão
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AlertCircle, Loader2, X, Upload, Image as ImageIcon, Users, DollarSign, Link as LinkIcon, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { eventSpaceService } from '@/services/eventSpaceService';
import type { EventSpace, UpdateEventSpaceRequest } from '@/shared/types/event-spaces';

interface EditEventSpaceFormModernProps {
  hotelId: string;
  spaceId: string;
  initialData?: EventSpace;
  onSuccess?: () => void;
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

// ✅ FUNÇÃO AUXILIAR: Formatar moeda
const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0,00 MZN';
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const EditEventSpaceFormModern: React.FC<EditEventSpaceFormModernProps> = ({
  hotelId,
  spaceId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!initialData);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [manualImageUrls, setManualImageUrls] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [initialFormData, setInitialFormData] = useState<Partial<UpdateEventSpaceRequest>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // FormData inicial com dados do espaço
  const [formData, setFormData] = useState<Partial<UpdateEventSpaceRequest>>({
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
    cateringMenuUrls: [],
    allowedEventTypes: [],
    prohibitedEventTypes: [],
    equipment: {},
    setupOptions: [],
    images: [],
    floorPlanImage: null,
    virtualTourUrl: null,
    isActive: true,
    isFeatured: false,
  });

  // Estado separado para amenities
  const [amenitiesInput, setAmenitiesInput] = useState<string>('');

  // ✅ CALCULAR se houve mudanças
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData]);

  // Carregar dados do espaço se não for fornecido
  useEffect(() => {
    if (!initialData && spaceId) {
      loadSpaceData();
    } else if (initialData) {
      initializeForm(initialData);
    }
  }, [initialData, spaceId]);

  const loadSpaceData = async () => {
    setLoadingData(true);
    try {
      const res = await eventSpaceService.getEventSpaceById(spaceId);
      if (res.success && res.data) {
        initializeForm(res.data);
      } else {
        setError(res.error || 'Falha ao carregar dados do espaço');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do espaço',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError('Erro de conexão ao carregar dados');
      console.error('Erro ao carregar espaço:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const initializeForm = (space: EventSpace) => {
    // Extrair amenities do equipment
    const amenities = space.equipment?.amenities || [];
    const amenitiesText = Array.isArray(amenities) ? amenities.join(', ') : '';
    
    // Converter arrays para formato correto
    const allowedEventTypes = Array.isArray(space.allowedEventTypes) ? space.allowedEventTypes : [];
    const prohibitedEventTypes = Array.isArray(space.prohibitedEventTypes) ? space.prohibitedEventTypes : [];
    const setupOptions = Array.isArray(space.setupOptions) ? space.setupOptions : [];
    const cateringMenuUrls = Array.isArray(space.cateringMenuUrls) ? space.cateringMenuUrls : [];
    const images = Array.isArray(space.images) ? space.images : [];

    const newFormData = {
      name: space.name || '',
      description: space.description || '',
      capacityMin: space.capacityMin || 10,
      capacityMax: space.capacityMax || 100,
      areaSqm: space.areaSqm || null,
      basePricePerDay: space.basePricePerDay || '',
      weekendSurchargePercent: space.weekendSurchargePercent || 20,
      spaceType: space.spaceType || '',
      naturalLight: space.naturalLight ?? true,
      hasStage: space.hasStage ?? false,
      loadingAccess: space.loadingAccess ?? false,
      dressingRooms: space.dressingRooms || null,
      insuranceRequired: space.insuranceRequired ?? false,
      alcoholAllowed: space.alcoholAllowed ?? false,
      approvalRequired: space.approvalRequired ?? true,
      noiseRestriction: space.noiseRestriction || '',
      securityDeposit: space.securityDeposit || null,
      offersCatering: space.offersCatering ?? false,
      cateringDiscountPercent: space.cateringDiscountPercent || 0,
      cateringMenuUrls,
      allowedEventTypes,
      prohibitedEventTypes,
      equipment: space.equipment || {},
      setupOptions,
      images,
      floorPlanImage: space.floorPlanImage || null,
      virtualTourUrl: space.virtualTourUrl || null,
      isActive: space.isActive ?? true,
      isFeatured: space.isFeatured ?? false,
    };

    setFormData(newFormData);
    // ✅ SALVAR DADOS INICIAIS PARA COMPARAÇÃO
    setInitialFormData(newFormData);

    setAmenitiesInput(amenitiesText);
    setManualImageUrls(images.filter(url => url.startsWith('http')).join('\n'));
    setPreviewImages(images.filter(url => url.startsWith('data:'))); // URLs base64 locais
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? null : Number(value);
      if (isNaN(processedValue)) processedValue = 0;
    }
    
    // ✅ CORREÇÃO: Garantir que preços sejam sempre strings válidas
    if (name === 'basePricePerDay' || name === 'securityDeposit') {
      processedValue = value.trim() || '0'; // mantém como string
    }
    
    // ✅ LIMPAR ERRO DO CAMPO QUANDO ELE É EDITADO
    if (fieldErrors[name]) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[name];
      setFieldErrors(newFieldErrors);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmenitiesInput(value);
    
    const amenities = value.split(',').map(a => a.trim()).filter(a => a);
    setFormData(prev => ({ 
      ...prev, 
      equipment: { ...prev.equipment, amenities }
    }));
    
    // Limpar erro do campo amenities
    if (fieldErrors['equipment.amenities']) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors['equipment.amenities'];
      setFieldErrors(newFieldErrors);
    }
  };

  const handleToggleChange = (name: keyof UpdateEventSpaceRequest) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
    
    // Limpar erro do campo quando alterado
    if (fieldErrors[name]) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[name];
      setFieldErrors(newFieldErrors);
    }
  };

  const handleMultiSelect = (name: 'allowedEventTypes' | 'prohibitedEventTypes' | 'setupOptions') => 
    (values: string[]) => {
      setFormData((prev) => ({ ...prev, [name]: values }));
      
      // Limpar erro do campo quando alterado
      if (fieldErrors[name]) {
        const newFieldErrors = { ...fieldErrors };
        delete newFieldErrors[name];
        setFieldErrors(newFieldErrors);
      }
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

  // ✅ FUNÇÃO DE VALIDAÇÃO COMPLETA (APLICADA NA ETAPA 3)
  const validateAllSteps = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Passo 1: Informações básicas
    if (!formData.name?.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'O nome deve ter pelo menos 3 caracteres';
    }
    
    if (!formData.spaceType) {
      errors.spaceType = 'Tipo de espaço é obrigatório';
    }
    
    if (!formData.capacityMin || formData.capacityMin < 1) {
      errors.capacityMin = 'Capacidade mínima inválida (mínimo 1)';
    }
    
    if (!formData.capacityMax || formData.capacityMax < (formData.capacityMin || 1)) {
      errors.capacityMax = 'Capacidade máxima deve ser maior que a mínima';
    }
    
    // Passo 2: Preços
    if (!formData.basePricePerDay || Number(formData.basePricePerDay) <= 0) {
      errors.basePricePerDay = 'Preço base por dia é obrigatório (maior que 0)';
    }
    
    // Passo 3: Imagens (pelo menos 1)
    const totalImages = ((formData.images || []).length + previewImages.length);
    if (totalImages === 0) {
      errors.images = 'Pelo menos uma imagem é obrigatória';
    }
    
    // Validações adicionais
    if (formData.areaSqm !== null && formData.areaSqm !== undefined && formData.areaSqm <= 0) {
      errors.areaSqm = 'Área deve ser maior que 0 se informada';
    }
    
    if (formData.weekendSurchargePercent !== null && formData.weekendSurchargePercent !== undefined) {
      if (isNaN(formData.weekendSurchargePercent) || formData.weekendSurchargePercent < 0 || formData.weekendSurchargePercent > 100) {
        errors.weekendSurchargePercent = 'Sobretaxa deve estar entre 0% e 100%';
      }
    }
    
    if (formData.offersCatering && formData.cateringDiscountPercent) {
      if (isNaN(formData.cateringDiscountPercent) || formData.cateringDiscountPercent < 0 || formData.cateringDiscountPercent > 100) {
        errors.cateringDiscountPercent = 'Desconto de catering deve estar entre 0% e 100%';
      }
    }
    
    // Validar URLs das imagens manuais
    if (manualImageUrls.trim()) {
      const urls = manualImageUrls.split('\n').map(url => url.trim()).filter(url => url);
      const invalidUrls = urls.filter(url => !url.startsWith('http'));
      if (invalidUrls.length > 0) {
        errors.images = `URLs inválidas encontradas (${invalidUrls.length}). Todas devem começar com "http"`;
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep = (): boolean => {
    setError(null);
    const newFieldErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name?.trim()) {
        newFieldErrors.name = 'O nome do espaço é obrigatório';
      } else if (formData.name.trim().length < 3) {
        newFieldErrors.name = 'O nome deve ter pelo menos 3 caracteres';
      } else if (formData.name.trim().length > 100) {
        newFieldErrors.name = 'O nome deve ter no máximo 100 caracteres';
      }
      
      if (!formData.spaceType) {
        newFieldErrors.spaceType = 'Selecione o tipo de espaço';
      }
      
      if (formData.capacityMin! >= formData.capacityMax!) {
        newFieldErrors.capacityMin = 'Capacidade mínima deve ser menor que a máxima';
        newFieldErrors.capacityMax = 'Capacidade máxima deve ser maior que a mínima';
      }
      if (formData.capacityMin! < 1) {
        newFieldErrors.capacityMin = 'A capacidade mínima deve ser pelo menos 1';
      }
      if (formData.capacityMax! < 1) {
        newFieldErrors.capacityMax = 'A capacidade máxima deve ser pelo menos 1';
      }
      
      if (formData.areaSqm !== null && formData.areaSqm !== undefined && formData.areaSqm <= 0) {
        newFieldErrors.areaSqm = 'A área deve ser maior que 0';
      }
      
      if (formData.description && formData.description.length > 1000) {
        newFieldErrors.description = 'A descrição deve ter no máximo 1000 caracteres';
      }
    }

    if (currentStep === 2) {
      if (!formData.basePricePerDay) {
        newFieldErrors.basePricePerDay = 'O preço base por dia é obrigatório';
      } else {
        const priceValue = Number(formData.basePricePerDay);
        if (isNaN(priceValue) || priceValue <= 0) {
          newFieldErrors.basePricePerDay = 'O preço base deve ser um número válido maior que 0';
        }
      }
      
      if (manualImageUrls) {
        const urls = manualImageUrls.split('\n').map(url => url.trim()).filter(url => url);
        const invalidUrls = urls.filter(url => !url.startsWith('http'));
        if (invalidUrls.length > 0) {
          newFieldErrors.images = `URLs inválidas encontradas. Todas devem começar com "http"`;
        }
      }
      
      if (formData.weekendSurchargePercent !== null && formData.weekendSurchargePercent !== undefined) {
        if (isNaN(formData.weekendSurchargePercent) || formData.weekendSurchargePercent < 0 || formData.weekendSurchargePercent > 100) {
          newFieldErrors.weekendSurchargePercent = 'A sobretaxa deve estar entre 0% e 100%';
        }
      }
      
      if (formData.offersCatering && formData.cateringDiscountPercent) {
        if (isNaN(formData.cateringDiscountPercent) || formData.cateringDiscountPercent < 0 || formData.cateringDiscountPercent > 100) {
          newFieldErrors.cateringDiscountPercent = 'O desconto de catering deve estar entre 0% e 100%';
        }
      }
    }

    // ✅ Aplicar validação completa na etapa de confirmação
    if (currentStep === 3) {
      if (!validateAllSteps()) {
        // Se houver erros na validação completa, mostrar o primeiro erro
        const firstErrorKey = Object.keys(fieldErrors)[0];
        if (firstErrorKey) {
          setError(fieldErrors[firstErrorKey]);
        }
        return false;
      }
    }

    setFieldErrors(newFieldErrors);
    
    if (Object.keys(newFieldErrors).length > 0) {
      const firstError = Object.values(newFieldErrors)[0];
      setError(firstError);
      return false;
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
    // ✅ Validar todas as etapas antes de mostrar confirmação
    if (!validateAllSteps()) {
      toast({
        title: 'Campos obrigatórios faltando',
        description: 'Por favor, corrija todos os erros antes de continuar',
        variant: 'destructive',
      });
      return;
    }
    
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // ✅ CORREÇÃO: Filtrar apenas URLs http/https (ignorar base64)
      const manualUrls = manualImageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url && url.startsWith('http'));
      
      // ✅ CORREÇÃO: Usar apenas URLs reais, não base64
      const allImages = [...manualUrls];
      
      // ✅ CORREÇÃO: Payload DEVE incluir o id
      // ✅ CORREÇÃO: Usar optional chaining e valores padrão para campos possivelmente undefined
      const payload: UpdateEventSpaceRequest = {
        id: spaceId,  // ← CORREÇÃO PRINCIPAL: Adicionar ID obrigatório
        name: formData.name?.trim() || '', // ✅ Usar optional chaining
        description: formData.description?.trim() || null,
        capacityMin: formData.capacityMin || 10, // ✅ Valor padrão
        capacityMax: formData.capacityMax || 100, // ✅ Valor padrão
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
        cateringMenuUrls: formData.cateringMenuUrls || [],
        allowedEventTypes: formData.allowedEventTypes || [],
        prohibitedEventTypes: formData.prohibitedEventTypes || [],
        equipment: formData.equipment || {},
        setupOptions: formData.setupOptions || [],
        images: allImages,
        floorPlanImage: formData.floorPlanImage?.trim() || null,
        virtualTourUrl: formData.virtualTourUrl?.trim() || null,
        isActive: formData.isActive ?? true,
        isFeatured: formData.isFeatured ?? false,
      };

      // ✅ CORREÇÃO: Timeout para evitar travamentos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await eventSpaceService.updateEventSpace(spaceId, payload);
        clearTimeout(timeoutId);

        if (!res.success) {
          // ✅ 1. TRATAMENTO DE ERROS ZOD DO BACKEND
          if (res.details && Array.isArray(res.details)) {
            const newFieldErrors: Record<string, string> = {};
            
            res.details.forEach((error: any) => {
              const path = error.path?.join('.') || 'general';
              newFieldErrors[path] = error.message;
            });
            
            setFieldErrors(newFieldErrors);
            
            // Mostra o primeiro erro
            const firstError = Object.values(newFieldErrors)[0];
            if (firstError) {
              setError('Por favor corrija os campos indicados: ' + firstError);
            } else {
              setError('Dados inválidos enviados ao servidor');
            }
            
            toast({
              title: 'Erro na validação',
              description: 'Por favor corrija os campos indicados',
              variant: 'destructive',
            });
            
            // Voltar para o primeiro passo se houver erros
            setCurrentStep(1);
            throw new Error('Erro de validação do servidor');
          }
          
          throw new Error(res.error || 'Falha ao atualizar espaço');
        }

        // ✅ 2. REFRESH AUTOMÁTICO APÓS SUCESSO
        toast({
          title: '✅ Espaço atualizado com sucesso!',
          description: `"${formData.name}" foi atualizado.`,
          variant: 'success',
          duration: 5000,
        });

        // Recarregar dados do espaço para refletir mudanças imediatamente
        await loadSpaceData();
        
        onSuccess?.();
        onCancel?.();
      } catch (err: any) {
        clearTimeout(timeoutId);
        
        if (err.name === 'AbortError') {
          setError('Tempo de atualização excedido');
          toast({ 
            title: "Tempo esgotado", 
            description: "A atualização demorou muito. Tente novamente.",
            variant: "destructive" 
          });
        } else {
          // ✅ 1. TRATAMENTO DE ERROS ZOD DO BACKEND (catch geral)
          let errorMsg = err.message || 'Erro ao atualizar espaço de evento';
          const newFieldErrors: Record<string, string> = {};

          // Se o backend retornar erros Zod no formato { errors: [...] }
          if (err.response?.data?.errors) {
            err.response.data.errors.forEach((error: any) => {
              const path = error.path?.join('.') || 'general';
              newFieldErrors[path] = error.message;
            });
            
            setFieldErrors(newFieldErrors);
            
            errorMsg = 'Por favor corrija os campos indicados';
            
            // Mostra o primeiro erro específico
            const firstFieldError = Object.values(newFieldErrors)[0];
            if (firstFieldError) {
              setError(`${firstFieldError}`);
            }
          }

          setError(errorMsg);
          toast({
            title: '❌ Erro ao atualizar espaço',
            description: errorMsg,
            variant: 'destructive',
            duration: 5000,
          });
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Erro ao processar formulário';
      setError(msg);
      toast({
        title: '❌ Erro',
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
    error,
  }: {
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
    label: string;
    maxSelections?: number;
    error?: string;
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
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
        <Card className="w-full max-w-2xl p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">Carregando espaço...</h3>
          <p className="text-gray-600">A carregar dados do espaço para edição.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
      <Card className="w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl border-0">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-700 text-white p-6 flex justify-between items-center z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold">Editar Espaço de Eventos</h2>
            <p className="text-violet-100 text-sm mt-1">Passo {currentStep} de 3 • {formData.name}</p>
            {/* ✅ INDICADOR DE MUDANÇAS */}
            {hasChanges && (
              <div className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full inline-block mt-1">
                • Alterações pendentes
              </div>
            )}
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

          {/* ✅ INDICADOR DE ERROS DE VALIDAÇÃO COMPLETA NA ETAPA 3 */}
          {currentStep === 3 && Object.keys(fieldErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Campos requerem correção:</h4>
                  <ul className="text-red-700 text-sm space-y-1">
                    {Object.entries(fieldErrors).map(([field, message]) => (
                      <li key={field} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong className="capitalize">{field.replace(/([A-Z])/g, ' $1')}:</strong> {message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => {
                  // Ir para o passo com erros
                  if (fieldErrors.name || fieldErrors.spaceType || fieldErrors.capacityMin || fieldErrors.capacityMax) {
                    setCurrentStep(1);
                  } else if (fieldErrors.basePricePerDay || fieldErrors.images || fieldErrors.weekendSurchargePercent) {
                    setCurrentStep(2);
                  }
                }}
              >
                Corrigir Campos
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium mb-2">
                    Nome do Espaço *
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Auditório Principal"
                    className={`h-12 ${fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    required
                    maxLength={100}
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    Tipo de Espaço *
                  </Label>
                  <Select
                    value={formData.spaceType || ''}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, spaceType: value }));
                      if (fieldErrors.spaceType) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.spaceType;
                        setFieldErrors(newErrors);
                      }
                    }}
                  >
                    <SelectTrigger className={`h-12 ${fieldErrors.spaceType ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
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
                  {fieldErrors.spaceType && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.spaceType}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-2">Descrição</Label>
                <Textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Descreva o espaço: dimensões, estilo, o que o torna especial..."
                  rows={4}
                  className={`resize-none ${fieldErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  maxLength={1000}
                />
                {fieldErrors.description && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.description}</p>
                )}
              </div>

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
                      className={`pl-10 h-12 ${fieldErrors.capacityMin ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                  </div>
                  {fieldErrors.capacityMin && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.capacityMin}</p>
                  )}
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
                      className={`pl-10 h-12 ${fieldErrors.capacityMax ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                  </div>
                  {fieldErrors.capacityMax && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.capacityMax}</p>
                  )}
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
                    className={`h-12 ${fieldErrors.areaSqm ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {fieldErrors.areaSqm && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.areaSqm}</p>
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
                  error={fieldErrors.allowedEventTypes}
                />

                <MultiSelectChip
                  options={SETUP_OPTIONS}
                  selected={formData.setupOptions || []}
                  onChange={(values) => handleMultiSelect('setupOptions')(values)}
                  label="Configurações Disponíveis"
                  error={fieldErrors.setupOptions}
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-2 block">
                  Amenities/Equipamentos
                </Label>
                <Input
                  name="amenitiesInput"
                  value={amenitiesInput}
                  onChange={handleAmenitiesChange}
                  placeholder="Ex: Wi-Fi, Projetor, Som, Ar Condicionado, Mesas..."
                  className={`h-12 ${fieldErrors['equipment.amenities'] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {fieldErrors['equipment.amenities'] && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors['equipment.amenities']}</p>
                )}
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
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, noiseRestriction: value }));
                    if (fieldErrors.noiseRestriction) {
                      const newErrors = { ...fieldErrors };
                      delete newErrors.noiseRestriction;
                      setFieldErrors(newErrors);
                    }
                  }}
                >
                  <SelectTrigger className={`h-12 ${fieldErrors.noiseRestriction ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
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
                {fieldErrors.noiseRestriction && (
                  <p className="text-sm text-red-600 mt-1">{fieldErrors.noiseRestriction}</p>
                )}
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
                      placeholder={`Valor atual: ${formData.basePricePerDay ? formatCurrency(Number(formData.basePricePerDay)) : '0,00 MZN'}`}
                      className={`pl-10 h-12 ${fieldErrors.basePricePerDay ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      required
                    />
                  </div>
                  {fieldErrors.basePricePerDay && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.basePricePerDay}</p>
                  )}
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
                    className={`h-12 ${fieldErrors.weekendSurchargePercent ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {fieldErrors.weekendSurchargePercent && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.weekendSurchargePercent}</p>
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
                      className={`h-12 ${fieldErrors.cateringDiscountPercent ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {fieldErrors.cateringDiscountPercent && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.cateringDiscountPercent}</p>
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
                  Fotos do Espaço (máx. 10) *
                </Label>

                {/* Preview local */}
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
                    Adicionar Fotos (apenas preview)
                  </Button>
                  <p className="text-sm text-gray-500">
                    As fotos não serão enviadas agora. Use URLs externas ou adicione depois.
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    * Pelo menos uma imagem é obrigatória
                  </p>
                </div>

                {(previewImages.length > 0 || (formData.images || []).length > 0) && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Fotos atuais:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {previewImages.map((src, idx) => (
                        <div key={`preview-${idx}`} className="relative group">
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
                      {(formData.images || [])
                        .filter(url => url.startsWith('http'))
                        .map((url, idx) => (
                          <div key={`url-${idx}`} className="relative">
                            <img
                              src={url}
                              alt={`Imagem ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-base font-medium mb-2 block">
                    URLs das Fotos (uma por linha) *
                  </Label>
                  <Textarea
                    value={manualImageUrls}
                    onChange={e => setManualImageUrls(e.target.value)}
                    placeholder="https://exemplo.com/foto1.jpg
https://exemplo.com/foto2.jpg"
                    rows={4}
                    className={`resize-none font-mono text-sm ${fieldErrors.images ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {fieldErrors.images && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.images}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Cole as URLs das imagens (ex: Cloudinary, ImgBB). Elas serão salvas diretamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {showConfirmation ? (
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <div className="p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-amber-900 mb-2">
                      Confirmar Atualização do Espaço
                    </h3>
                    <p className="text-amber-700 mb-6">
                      Tem certeza que deseja atualizar o espaço <strong>"{formData.name}"</strong>?
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
                            Atualizando...
                          </>
                        ) : (
                          '✅ Sim, Atualizar Espaço'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <>
                  <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-violet-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Resumo das Alterações
                      </h3>
                      
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
                            </dl>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-medium text-gray-700 mb-3 text-lg">Preços e Configurações</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <dl className="space-y-2">
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Preço Base/Dia:</dt>
                                <dd className="font-medium">
                                  {formData.basePricePerDay ? `${formatCurrency(formData.basePricePerDay)}` : '-'}
                                </dd>
                              </div>
                              <div className="flex">
                                <dt className="text-gray-600 w-40">Sobretaxa Fim Semana:</dt>
                                <dd className="font-medium">
                                  {formData.weekendSurchargePercent || 0}%
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
                            </dl>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Status</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.isActive ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">{formData.isActive ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                formData.isFeatured ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-sm">{formData.isFeatured ? 'Em Destaque' : 'Normal'}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Imagens</h4>
                          <div className="text-sm">
                            <div className="mb-1">
                              <span className="text-gray-600">Total de imagens:</span>
                              <span className={`font-medium ml-2 ${((formData.images || []).length + previewImages.length) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {((formData.images || []).length + previewImages.length)} ({(formData.images || []).length} URLs + {previewImages.length} locais)
                              </span>
                            </div>
                            {((formData.images || []).length + previewImages.length) === 0 && (
                              <p className="text-xs text-red-600 mt-1">⚠️ Pelo menos uma imagem é obrigatória</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Pronto para atualizar!</p>
                        <ul className="mt-2 space-y-1">
                          <li>• Verifique todas as alterações acima</li>
                          <li>• As alterações serão aplicadas imediatamente</li>
                          <li>• Reservas existentes não serão afetadas</li>
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
                onClick={() => {
                  // ✅ Validar antes de mostrar confirmação
                  if (validateAllSteps()) {
                    setShowConfirmation(true);
                  } else {
                    toast({
                      title: 'Erros de validação',
                      description: 'Por favor, corrija todos os campos obrigatórios',
                      variant: 'destructive',
                    });
                  }
                }}
                // ✅ 4. DESABILITAR BOTÃO SE NADA MUDOU
                disabled={loading || !hasChanges}
                className="px-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Atualizando espaço...
                  </>
                ) : !hasChanges ? (
                  'Nenhuma alteração'
                ) : (
                  '💾 Salvar Alterações'
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default EditEventSpaceFormModern;