/**
 * Utilitários para formatação em Metical (Moçambique)
 */

// Formatar valor para exibição em Metical
export const formatMetical = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return 'MT 0,00';
  }

  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};

// Remover formatação e converter para número
export const parseMetical = (value: string): number => {
  if (!value) return 0;
  
  // Remove tudo exceto números, vírgula e ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto para parseFloat
  const numericValue = cleanValue.replace(',', '.');
  
  const result = parseFloat(numericValue);
  return isNaN(result) ? 0 : result;
};

// Formatar para input (sem símbolo MT)
export const formatForInput = (value: number): string => {
  if (!value) return '';
  
  return value.toFixed(2).replace('.', ',');
};

// Validar se é um valor monetário válido
export const isValidMoney = (value: string): boolean => {
  const regex = /^\d*([,.]\d{0,2})?$/;
  return regex.test(value);
};