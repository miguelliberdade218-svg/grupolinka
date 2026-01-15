// src/types/notifications.interfaces.ts

// ====================== NOTIFICATION ======================
export interface Notification {
  id: string;
  type: string;            // Tipo da notificação (ex: "booking", "message", "alert")
  title: string;           // Título resumido
  message: string;         // Mensagem completa
  created_at: string;      // Data de criação (ISO string)
  is_read: boolean;        // Indicador se a notificação foi lida
  link?: string;           // Link opcional para ação relacionada
  metadata?: Record<string, any>; // Dados adicionais opcionais
}

// ====================== RESPONSE ======================
export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unread_count?: number; // Opcional, caso queira exibir contagem de não lidas
}
