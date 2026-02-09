/**
 * Utilitários de formatação
 */

/**
 * Formata preço em Meticais (MZN)
 */
export const formatPrice = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0,00 MZN';
  }

  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Formata data
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
};

/**
 * Formata número com separadores
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-PT').format(value);
};

/**
 * Formata rating (0-5)
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};