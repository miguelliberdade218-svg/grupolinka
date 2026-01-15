import React from 'react';
import { formatForInput, parseMetical, isValidMoney, formatMetical } from '@/shared/utils/currency';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  error?: string;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = "0,00",
  className = "",
  disabled = false,
  label,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permite apenas números, vírgula e ponto
    if (inputValue === '' || isValidMoney(inputValue)) {
      const numericValue = parseMetical(inputValue);
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    // Garante que sempre tenha 2 casas decimais ao sair do campo
    if (value !== undefined && value !== null) {
      const formattedValue = Math.max(0, Number(value.toFixed(2)));
      onChange(formattedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Impede a entrada de caracteres inválidos
    if (!/[\d.,]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value ? formatForInput(value) : ''}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            pr-10
            ${error 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300'
            }
            ${className}
          `}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-500 text-sm">MT</span>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {!error && value > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          Valor: {formatMetical(value)}
        </p>
      )}
    </div>
  );
};

// Componente para exibição de preço formatado
interface PriceDisplayProps {
  value: number;
  className?: string;
  showSymbol?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  value,
  className = "",
  showSymbol = true
}) => {
  const formattedValue = formatMetical(value);
  
  return (
    <span className={`font-medium ${className}`}>
      {showSymbol ? formattedValue : formattedValue.replace('MT', '').trim()}
    </span>
  );
};