import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface SignupProgressProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function SignupProgress({ steps, currentStep, className = '' }: SignupProgressProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between relative mb-8">
        {/* Linha de progresso */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Círculo do passo */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 border-blue-600'
                    : isCurrent
                    ? 'bg-white border-blue-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Texto do passo */}
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-gray-500 mt-1 max-w-[120px]">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente de card de capacidade
interface CapacityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  required?: boolean;
  disabled?: boolean;
}

export function CapacityCard({ 
  icon, 
  title, 
  description, 
  selected, 
  onSelect, 
  required = false,
  disabled = false 
}: CapacityCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
        selected 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !required && !disabled && onSelect(!selected)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${selected ? 'bg-blue-100' : 'bg-gray-100'}`}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            {required && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Obrigatório
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          
          {!required && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {selected ? 'Selecionado' : 'Não selecionado'}
              </span>
              <div 
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                }`}
              >
                {selected && <Check className="h-3 w-3 text-white" />}
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// Componente de passo do wizard
interface WizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function WizardStep({ title, description, children }: WizardStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-gray-600 mt-2">{description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}