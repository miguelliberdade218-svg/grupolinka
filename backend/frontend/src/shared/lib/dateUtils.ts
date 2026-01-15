// Date utility functions for dd/mm/yyyy format

/**
 * Format date to dd/mm/yyyy string
 */
export function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date to yyyy-mm-dd for HTML date inputs
 */
export function formatDateToHTML(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse dd/mm/yyyy string to Date object
 */
export function parseDDMMYYYYToDate(dateString: string): Date | null {
  const parts = dateString.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month, day);
  
  // Validate the date
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  
  return date;
}

/**
 * Convert HTML date input value (yyyy-mm-dd) to dd/mm/yyyy display format
 */
export function convertHTMLDateToDDMMYYYY(htmlDate: string): string {
  if (!htmlDate) return '';
  
  const date = new Date(htmlDate);
  if (isNaN(date.getTime())) return '';
  
  return formatDateToDDMMYYYY(date);
}

/**
 * Convert dd/mm/yyyy format to HTML date input format (yyyy-mm-dd)
 */
export function convertDDMMYYYYToHTMLDate(ddmmyyyyDate: string): string {
  const date = parseDDMMYYYYToDate(ddmmyyyyDate);
  if (!date) return '';
  
  return formatDateToHTML(date);
}

/**
 * Get today's date in dd/mm/yyyy format
 */
export function getTodayDDMMYYYY(): string {
  return formatDateToDDMMYYYY(new Date());
}

/**
 * Get today's date in HTML format (yyyy-mm-dd)
 */
export function getTodayHTML(): string {
  return formatDateToHTML(new Date());
}

/**
 * Validate if a string is in valid dd/mm/yyyy format
 */
export function isValidDDMMYYYY(dateString: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateString)) return false;
  
  const date = parseDDMMYYYYToDate(dateString);
  return date !== null;
}

/**
 * Format Portuguese month names
 */
export const PORTUGUESE_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Format date with Portuguese month name
 */
export function formatDatePortuguese(date: Date): string {
  const day = date.getDate();
  const month = PORTUGUESE_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Format departure time in Portuguese format
 */
export function formatDepartureTime(date: Date): string {
  const time = date.toLocaleTimeString('pt-PT', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  const formattedDate = formatDateToDDMMYYYY(date);
  return `${formattedDate} às ${time}`;
}