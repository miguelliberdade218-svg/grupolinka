import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Upload, User, Car, Building, Shield, Check, ArrowRight, ArrowLeft, Loader2, File } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { DocumentUpload } from './DocumentUpload';
import { StepDetails } from './StepDetails';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface SignupWizardCompleteProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

type WizardStep = 'info' | 'capacities' | 'details' | 'documents' | 'review';

export function SignupWizardComplete({ onComplete, onCancel }: SignupWizardCompleteProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('info');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const steps = [
    { id: 'info', title: 'Informações Básicas', description: 'Seus dados pessoais' },
    { id: 'capacities', title: 'Capacidades', description: 'O que você quer fazer' },
    { id: 'details', title: 'Detalhes', description: 'Informações específicas' },
    { id: 'documents', title: 'Documentos', description: 'Upload de documentos' },
    { id: 'review', title: 'Revisão', description: 'Confirme seus dados' },
  ];
  
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };
  
  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Cadastro realizado!',
        description: 'Sua conta foi criada com sucesso.',
      });
      
      if (onComplete) {
        onComplete({});
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar sua conta.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Cadastro Unificado Link-A
        </CardTitle>
        <div className="mt-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`text-center ${index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${index <= currentStepIndex ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {index + 1}
                </div>
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs">{step.description}</div>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {currentStep === 'info' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input id="fullName" placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="seu.email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" placeholder="+258 84 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 'capacities' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Selecione suas capacidades</h3>
            <p className="text-gray-600">
              No Link-A, você pode ter múltiplas capacidades. Selecione todas que se aplicam a você:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CapacityCard 
                title="Cliente"
                description="Reservar viagens, hotéis e eventos"
                icon={<User className="h-8 w-8" />}
                color="blue"
                selected={true}
                required
              />
              
              <CapacityCard 
                title="Motorista"
                description="Oferecer serviços de transporte"
                icon={<Car className="h-8 w-8" />}
                color="green"
              />
              
              <CapacityCard 
                title="Gestor de Hotel"
                description="Gerenciar hotéis e acomodações"
                icon={<Building className="h-8 w-8" />}
                color="amber"
              />
            </div>
          </div>
        )}
        
        {currentStep === 'review' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Revisão Final</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">Informações Pessoais</h4>
                <p className="text-sm text-gray-600">Nome: João Silva</p>
                <p className="text-sm text-gray-600">Email: joao@exemplo.com</p>
                <p className="text-sm text-gray-600">Telefone: +258 84 123 4567</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Capacidades Selecionadas</h4>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <User className="h-3 w-3" /> Cliente
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Car className="h-3 w-3" /> Motorista
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700">Documentos</h4>
                <p className="text-sm text-gray-600">Carteira de Identidade: ✓ Carregada</p>
                <p className="text-sm text-gray-600">Carta de Condução: ✓ Carregada</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500" />
              <span>Todos os dados foram validados com sucesso</span>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentStepIndex === 0 ? onCancel : handleBack}
          disabled={isLoading}
        >
          {currentStepIndex === 0 ? 'Cancelar' : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </>
          )}
        </Button>
        
        <Button 
          onClick={currentStepIndex === steps.length - 1 ? handleSubmit : handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : currentStepIndex === steps.length - 1 ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Finalizar Cadastro
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface CapacityCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber';
  selected?: boolean;
  required?: boolean;
}

function CapacityCard({ title, description, icon, color, selected = false, required = false }: CapacityCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    amber: 'border-amber-200 bg-amber-50',
  };
  
  const selectedClasses = selected ? 'ring-2 ring-offset-2' : '';
  const ringColor = {
    blue: 'ring-blue-500',
    green: 'ring-green-500',
    amber: 'ring-amber-500',
  };
  
  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-all ${colorClasses[color]} ${selected ? selectedClasses + ' ' + ringColor[color] : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : 'bg-amber-100'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{title}</h4>
            {required && (
              <span className="text-xs text-gray-500">Obrigatório</span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}