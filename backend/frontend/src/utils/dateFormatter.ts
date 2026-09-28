// Utilitário IDÊNTICO ao backend para consistência - VERSÃO CORRIGIDA
// ✅ FONTE DE VERDADE PARA DATAS/HORAS EM TODA A APP
//    - Data: DD/MM/AAAA  (ex: 20/12/2025)
//    - Hora: HH:mm 24h   (ex: 14:30)
//    - Data+hora: "20/12/2025 às 14:30"
//    - Sem data: "—"

export class MozambiqueDateFormatter {
  
  // ✅ FORMATO DATA COMPLETA: "DD/MM/AAAA HH:mm" (24h)
  static formatDateTime(date: Date | string | null): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // ✅ VALIDAÇÃO: Verificar se a data é válida
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    return dateObj.toLocaleString('pt-PT', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, // ✅ FORÇAR 24 HORAS
      timeZone: 'Africa/Maputo'
    });
  }
  
  // ✅ FORMATO DATA+HORA AMIGÁVEL: "20/12/2025 às 14:30"
  static formatDateTimeFriendly(date: Date | string | null): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '—';
    
    return `${this.formatDateOnly(dateObj)} às ${this.formatTimeOnly(dateObj)}`;
  }
  
  // ✅ FORMATO APENAS DATA: "DD/MM/AAAA"
  static formatDateOnly(date: Date | string | null): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    return dateObj.toLocaleDateString('pt-PT', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      timeZone: 'Africa/Maputo'
    });
  }
  
  // ✅ DATA COM FALLBACK: usa `date`; se vazio, usa `fallback` (ex: createdAt); senão "—"
  static formatDateOrFallback(
    date: Date | string | null | undefined,
    fallback?: Date | string | null | undefined
  ): string {
    const chosen = (date === null || date === undefined || date === '') ? fallback : date;
    return this.formatDateOnly(chosen ?? null);
  }
  
  // ✅ FORMATO APENAS HORA: "HH:mm" (24h)
  static formatTimeOnly(date: Date | string | null): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    return dateObj.toLocaleTimeString('pt-PT', {
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false, // ✅ FORÇAR 24 HORAS
      timeZone: 'Africa/Maputo'
    });
  }
  
  // ✅ FORMATO LONGO: "Sexta-feira, 20 de Dezembro de 2025"
  static formatLongDate(date: Date | string | null): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    return dateObj.toLocaleDateString('pt-PT', {
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      timeZone: 'Africa/Maputo'
    });
  }
  
  // ✅ FORMATO DIA DA SEMANA: "Sexta-feira"
  static formatWeekday(date: Date | string | null): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString('pt-PT', {
      weekday: 'long', 
      timeZone: 'Africa/Maputo'
    });
  }
  
  // ✅ FORMATO RELATIVO: "Hoje", "Amanhã", "20/12/2025"
  static formatRelativeDate(date: Date | string | null): string {
    if (!date) return '—';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset horas para comparar apenas datas
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    } else {
      return this.formatDateOnly(dateObj);
    }
  }
}

// ✅✅✅ EXPORTAÇÕES CORRETAS E COMPLETAS
export const formatDateTime = MozambiqueDateFormatter.formatDateTime;
export const formatDateTimeFriendly = MozambiqueDateFormatter.formatDateTimeFriendly;
export const formatDateOnly = MozambiqueDateFormatter.formatDateOnly;
export const formatDateOrFallback = MozambiqueDateFormatter.formatDateOrFallback;
export const formatTimeOnly = MozambiqueDateFormatter.formatTimeOnly;
export const formatLongDate = MozambiqueDateFormatter.formatLongDate;
export const formatWeekday = MozambiqueDateFormatter.formatWeekday;
export const formatRelativeDate = MozambiqueDateFormatter.formatRelativeDate;

// ✅ Reexport de helpers de conversão de input (fonte única de verdade)
export {
  formatDateToDDMMYYYY,
  formatDateToHTML,
  parseDDMMYYYYToDate,
  convertHTMLDateToDDMMYYYY,
  convertDDMMYYYYToHTMLDate,
  getTodayDDMMYYYY,
  getTodayHTML,
  isValidDDMMYYYY,
} from '@/shared/lib/dateUtils';

// ✅ EXPORTAÇÃO PADRÃO PARA FACILITAR IMPORTAÇÃO
export default MozambiqueDateFormatter;