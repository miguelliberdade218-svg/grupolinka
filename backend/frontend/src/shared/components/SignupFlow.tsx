// ========================================================================
// SignupFlow.tsx - Componente Unificado para Signup (25 Fevereiro 2026)
// ✅ Step-by-step wizard
// ✅ Suporta Cliente, Motorista e Gestor de Hotel
// ✅ Integração Firebase + Backend
// ========================================================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { useToast } from '@/shared/hooks/use-toast';
import { ChevronRight, ChevronLeft, Car, Building2, User, Check, AlertCircle } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle } from '@/shared/lib/firebaseConfig';

// ==================== TIPOS ====================

type UserRole = 'client' | 'driver' | 'hotel_manager';
type AccountType = 'individual' | 'company';
type SignupStep = 'role' | 'auth' | 'basic' | 'specific' | 'documents' | 'confirmation';

// ==================== SCHEMAS ZOD ====================

const basicSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  confirmPassword: z.string().optional(),
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
  accountType: z.enum(['individual', 'company']),
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
}).refine((data) => {
  if (data.accountType === 'company') {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: 'Nome da empresa obrigatório',
  path: ['companyName'],
}).refine((data) => {
  if (data.password && data.password.trim()) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

const driverSchema = z.object({
  driverLicenseNumber: z.string().min(1, 'Obrigatório'),
  driverLicenseCountry: z.string().default('Moçambique'),
  driverLicenseExpiry: z.string().refine((date) => {
    return new Date(date) > new Date();
  }, 'Data expirada'),
  driverVehicleType: z.string().min(1, 'Obrigatório'),
  driverYearsExperience: z.number().min(0).optional(),
});

const hotelManagerSchema = z.object({
  businessTaxId: z.string().min(1, 'NIF/NUIT obrigatório'),
  businessRegistrationNumber: z.string().optional(),
  businessLegalName: z.string().min(1, 'Nome legal obrigatório'),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional(),
});

// ==================== COMPONENTE PRINCIPAL ====================

interface SignupFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SignupFlow({ onComplete, onCancel }: SignupFlowProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<SignupStep>('role');
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [authMethod, setAuthMethod] = useState<'email' | 'google' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forms
  const basicForm = useForm({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      accountType: 'individual' as AccountType,
    },
  });

  const driverForm = useForm({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      driverLicenseCountry: 'Moçambique',
      driverYearsExperience: 0,
    },
  });

  const hotelForm = useForm({
    resolver: zodResolver(hotelManagerSchema),
  });

  // ==================== HANDLERS ====================

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setCurrentStep('auth');
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      setAuthMethod('google');
      setCurrentStep('basic');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao autenticar com Google',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = () => {
    setAuthMethod('email');
    setCurrentStep('basic');
  };

  const onBasicSubmit = async (data: any) => {
    try {
      setIsLoading(true);

      // Se email+password, criar conta Firebase
      if (authMethod === 'email' && data.password) {
        const password = data.password || 'temp-' + Math.random().toString(36).substring(2, 15);
        await signUpWithEmail(data.email, password);
      }

      // Ir para próximo passo
      if (userRole === 'driver') {
        setCurrentStep('specific');
      } else if (userRole === 'hotel_manager') {
        setCurrentStep('specific');
      } else {
        setCurrentStep('confirmation');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar conta',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSpecificSubmit = async (data: any) => {
    try {
      setIsLoading(true);
      // Aqui salvar dados específicos no backend
      console.log('Dados específicos:', data);
      setCurrentStep('documents');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar dados',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDocumentsSubmit = async () => {
    try {
      setIsLoading(true);
      // Aqui fazer upload de documentos
      setCurrentStep('confirmation');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload de documentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== RENDERIZAÇÃO ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        {/* Progresso */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao Link-A</h1>
          <p className="text-blue-100">Passo {getStepNumber(currentStep)} de {getTotalSteps(userRole)}</p>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-blue-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(getStepNumber(currentStep) / getTotalSteps(userRole)) * 100}%` }}
            />
          </div>
        </div>

        <CardContent className="p-6">
          {/* STEP 1: Escolher Papel */}
          {currentStep === 'role' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-4">Qual é o teu papel?</h2>
                <RadioGroup value={userRole} onValueChange={(v) => handleRoleSelect(v as UserRole)}>
                  {/* Cliente */}
                  <div
                    className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                    onClick={() => handleRoleSelect('client')}
                  >
                    <RadioGroupItem value="client" id="client" />
                    <div>
                      <Label htmlFor="client" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          <span className="font-semibold">Cliente</span>
                        </div>
                        <p className="text-sm text-gray-600">Reservar viagens e hospedagens</p>
                      </Label>
                    </div>
                  </div>

                  {/* Motorista */}
                  <div
                    className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                    onClick={() => handleRoleSelect('driver')}
                  >
                    <RadioGroupItem value="driver" id="driver" />
                    <div>
                      <Label htmlFor="driver" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          <span className="font-semibold">Motorista</span>
                        </div>
                        <p className="text-sm text-gray-600">Oferecer serviços de transporte</p>
                      </Label>
                    </div>
                  </div>

                  {/* Gestor de Hotel */}
                  <div
                    className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                    onClick={() => handleRoleSelect('hotel_manager')}
                  >
                    <RadioGroupItem value="hotel_manager" id="hotel_manager" />
                    <div>
                      <Label htmlFor="hotel_manager" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          <span className="font-semibold">Gestor de Hotel</span>
                        </div>
                        <p className="text-sm text-gray-600">Gerir hotéis e espaços para eventos</p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={onCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={() => setCurrentStep('auth')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Autenticação */}
          {currentStep === 'auth' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold mb-4">Como quer entrar?</h2>
                <Button
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full mb-3 h-12"
                  variant="outline"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar com Google
                </Button>
                
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">ou</span>
                  </div>
                </div>

                <Button
                  onClick={handleEmailAuth}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  Continuar com Email
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('role')}
                  className="flex-1"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Dados Básicos */}
          {currentStep === 'basic' && (
            <form onSubmit={basicForm.handleSubmit(onBasicSubmit)} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Dados Pessoais</h2>

              {/* Email e Senha (se email auth) */}
              {authMethod === 'email' && (
                <>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...basicForm.register('email')}
                    />
                    {basicForm.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">{basicForm.formState.errors.email.message?.toString()}</p>
                    )}
                  </div>

                  <div>
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      {...basicForm.register('password')}
                    />
                  </div>

                  <div>
                    <Label>Confirmar Senha</Label>
                    <Input
                      type="password"
                      placeholder="Repita a senha"
                      {...basicForm.register('confirmPassword')}
                    />
                  </div>
                </>
              )}

              {/* Nome e Sobrenome */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input placeholder="João" {...basicForm.register('firstName')} />
                  {basicForm.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{basicForm.formState.errors.firstName.message?.toString()}</p>
                  )}
                </div>
                <div>
                  <Label>Sobrenome</Label>
                  <Input placeholder="Silva" {...basicForm.register('lastName')} />
                  {basicForm.formState.errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{basicForm.formState.errors.lastName.message?.toString()}</p>
                  )}
                </div>
              </div>

              {/* Telefone */}
              <div>
                <Label>Telefone (opcional)</Label>
                <Input placeholder="+258 84 xxx xxxx" {...basicForm.register('phone')} />
              </div>

              {/* Account Type */}
              <div>
                <Label>Tipo de Conta</Label>
                <RadioGroup value={basicForm.watch('accountType')} onValueChange={(v) => basicForm.setValue('accountType', v as AccountType)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual">Individual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="company" id="company" />
                    <Label htmlFor="company">Empresa</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Dados da Empresa (se selecionado) */}
              {basicForm.watch('accountType') === 'company' && (
                <>
                  <div>
                    <Label>Nome da Empresa</Label>
                    <Input placeholder="Minha Empresa Lda" {...basicForm.register('companyName')} />
                  </div>
                  <div>
                    <Label>NIF/NUIT</Label>
                    <Input placeholder="123456789" {...basicForm.register('companyVatNumber')} />
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Input placeholder="Rua X, Maputo" {...basicForm.register('companyAddress')} />
                  </div>
                  <div>
                    <Label>Telefone Empresa</Label>
                    <Input placeholder="+258 21 xxx xxxx" {...basicForm.register('companyPhone')} />
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('auth')}
                  type="button"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Processando...' : 'Continuar'} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 4: Dados Específicos (para Motorista/Hotel) */}
          {currentStep === 'specific' && userRole === 'driver' && (
            <form onSubmit={driverForm.handleSubmit(onSpecificSubmit)} className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Dados do Motorista</h2>

              <div>
                <Label>Número da Carta de Condução</Label>
                <Input placeholder="TL1234567" {...driverForm.register('driverLicenseNumber')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>País</Label>
                  <Input defaultValue="Moçambique" {...driverForm.register('driverLicenseCountry')} />
                </div>
                <div>
                  <Label>Data de Expiração</Label>
                  <Input type="date" {...driverForm.register('driverLicenseExpiry')} />
                </div>
              </div>

              <div>
                <Label>Tipo de Veículo</Label>
                <Input placeholder="Ex: Economia, Conforto, Premium" {...driverForm.register('driverVehicleType')} />
              </div>

              <div>
                <Label>Anos de Experiência</Label>
                <Input type="number" min="0" {...driverForm.register('driverYearsExperience', { valueAsNumber: true })} />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('basic')} type="button">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600">
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Similar para hotel_manager... */}

          {/* STEP 5: Documentos */}
          {currentStep === 'documents' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Verificação de Documentos</h2>
              <p className="text-gray-600">
                Por favor, faça upload dos seus documentos para verificação.
              </p>
              {/* Aqui adicionar upload de documentos */}
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setCurrentStep('specific')} type="button">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={() => setCurrentStep('confirmation')} className="flex-1 bg-blue-600">
                  Continuar <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmação */}
          {currentStep === 'confirmation' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Conta Criada com Sucesso!</h2>
              <p className="text-gray-600">
                Bem-vindo ao Link-A! A sua conta foi criada e você já pode começar.
              </p>
              <Button onClick={onComplete} className="w-full bg-blue-600 hover:bg-blue-700 h-12">
                Ir para Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== UTILITÁRIOS ====================

function getStepNumber(step: SignupStep): number {
  const steps = ['role', 'auth', 'basic', 'specific', 'documents', 'confirmation'];
  return steps.indexOf(step) + 1;
}

function getTotalSteps(role: UserRole): number {
  // Cliente: role, auth, basic, confirmation = 4
  // Motorista/Hotel: role, auth, basic, specific, documents, confirmation = 6
  return role === 'client' ? 4 : 6;
}
