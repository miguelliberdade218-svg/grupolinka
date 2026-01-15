import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
// Note: Notifications table doesn't exist in current schema, this is a placeholder implementation
import { 
  NotificationType 
} from '../../src/shared/types';
import type { 
  Notification, 
  CreateNotificationData 
} from '../types';

// Simplified in-memory storage until notifications table is added to schema
class InMemoryNotificationStorage {
  private notifications: Map<string, Notification> = new Map();
  private userNotifications: Map<string, string[]> = new Map();

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const id = this.generateId();
    const notification: Notification = {
      id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      read: false,
      actionUrl: data.actionUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notifications.set(id, notification);
    
    // Add to user's notification list
    const userNotifs = this.userNotifications.get(data.userId) || [];
    userNotifs.unshift(id);
    this.userNotifications.set(data.userId, userNotifs);

    return notification;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const userNotifIds = this.userNotifications.get(userId) || [];
    const notifications: Notification[] = [];

    for (const id of userNotifIds.slice(0, limit)) {
      const notification = this.notifications.get(id);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = this.notifications.get(notificationId);
    if (!notification) throw new Error('Notification not found');

    notification.read = true;
    notification.updatedAt = new Date();
    this.notifications.set(notificationId, notification);

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userNotifIds = this.userNotifications.get(userId) || [];
    
    for (const id of userNotifIds) {
      const notification = this.notifications.get(id);
      if (notification && !notification.read) {
        notification.read = true;
        notification.updatedAt = new Date();
        this.notifications.set(id, notification);
      }
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    this.notifications.delete(notificationId);
    
    // Remove from user's notification list
    const userNotifs = this.userNotifications.get(notification.userId) || [];
    const index = userNotifs.indexOf(notificationId);
    if (index > -1) {
      userNotifs.splice(index, 1);
      this.userNotifications.set(notification.userId, userNotifs);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const userNotifIds = this.userNotifications.get(userId) || [];
    let count = 0;

    for (const id of userNotifIds) {
      const notification = this.notifications.get(id);
      if (notification && !notification.read) {
        count++;
      }
    }

    return count;
  }

  async getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]> {
    const userNotifIds = this.userNotifications.get(userId) || [];
    const notifications: Notification[] = [];

    for (const id of userNotifIds) {
      const notification = this.notifications.get(id);
      if (notification && notification.type === type) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  async clearOldNotifications(days: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [id, notification] of this.notifications) {
      if (notification.createdAt < cutoffDate) {
        await this.deleteNotification(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}

export interface INotificationStorage {
  // Basic notification operations
  createNotification(data: CreateNotificationData): Promise<Notification>;
  getNotification(id: string): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<void>;
  
  // User notifications
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  
  // Read status management
  markAsRead(notificationId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  
  // Filtering and search
  getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]>;
  
  // Bulk operations
  sendBulkNotification(userIds: string[], data: Omit<CreateNotificationData, 'userId'>): Promise<Notification[]>;
  
  // System maintenance
  clearOldNotifications(days?: number): Promise<number>;
}

export class DatabaseNotificationStorage implements INotificationStorage {
  private memoryStorage = new InMemoryNotificationStorage();

  // ===== BASIC NOTIFICATION OPERATIONS =====
  
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      // TODO: Replace with actual database operations when notifications table is added
      return this.memoryStorage.createNotification(data);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    try {
      return this.memoryStorage.getNotification(id);
    } catch (error) {
      console.error('Error fetching notification:', error);
      return undefined;
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      await this.memoryStorage.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  // ===== USER NOTIFICATIONS =====
  
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      return this.memoryStorage.getUserNotifications(userId, limit);
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return this.memoryStorage.getUnreadCount(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // ===== READ STATUS MANAGEMENT =====
  
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      return this.memoryStorage.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.memoryStorage.markAllAsRead(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // ===== FILTERING AND SEARCH =====
  
  async getNotificationsByType(userId: string, type: NotificationType): Promise<Notification[]> {
    try {
      return this.memoryStorage.getNotificationsByType(userId, type);
    } catch (error) {
      console.error('Error fetching notifications by type:', error);
      return [];
    }
  }

  // ===== BULK OPERATIONS =====
  
  async sendBulkNotification(userIds: string[], data: Omit<CreateNotificationData, 'userId'>): Promise<Notification[]> {
    try {
      const notifications: Notification[] = [];
      
      for (const userId of userIds) {
        const notification = await this.createNotification({
          ...data,
          userId,
        });
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw new Error('Failed to send bulk notification');
    }
  }

  // ===== SYSTEM MAINTENANCE =====
  
  async clearOldNotifications(days: number = 30): Promise<number> {
    try {
      return this.memoryStorage.clearOldNotifications(days);
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      return 0;
    }
  }

  // ===== UTILITY METHODS =====
  
  async createBookingNotification(userId: string, bookingId: string, type: 'confirmed' | 'cancelled' | 'completed'): Promise<Notification> {
    const titles = {
      confirmed: 'Reserva Confirmada',
      cancelled: 'Reserva Cancelada',
      completed: 'Viagem Concluída',
    };

    const messages = {
      confirmed: 'A sua reserva foi confirmada com sucesso.',
      cancelled: 'A sua reserva foi cancelada.',
      completed: 'A sua viagem foi concluída. Pode avaliar o serviço.',
    };

    return this.createNotification({
      userId,
      type: 'booking',
      title: titles[type],
      message: messages[type],
      data: { bookingId, type },
      actionUrl: `/bookings/${bookingId}`,
    });
  }

  async createPaymentNotification(userId: string, amount: number, status: 'success' | 'failed'): Promise<Notification> {
    const title = status === 'success' ? 'Pagamento Processado' : 'Falha no Pagamento';
    const message = status === 'success' 
      ? `Pagamento de ${amount} MZN processado com sucesso.`
      : `Falha no processamento do pagamento de ${amount} MZN.`;

    return this.createNotification({
      userId,
      type: 'payment',
      title,
      message,
      data: { amount, status },
    });
  }

  async createVerificationNotification(userId: string, status: 'approved' | 'rejected'): Promise<Notification> {
    const title = status === 'approved' ? 'Verificação Aprovada' : 'Verificação Rejeitada';
    const message = status === 'approved'
      ? 'A sua conta foi verificada com sucesso!'
      : 'A sua verificação foi rejeitada. Verifique os documentos.';

    return this.createNotification({
      userId,
      type: 'verification',
      title,
      message,
      data: { status },
      actionUrl: '/profile/verification',
    });
  }
}

export const notificationStorage = new DatabaseNotificationStorage();