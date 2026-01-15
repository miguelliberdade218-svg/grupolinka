import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { chatMessages, chatRooms, users } from '../../shared/schema';
import { 
  MessageType 
} from '../../src/shared/types';
import type { 
  ChatRoom, 
  Message, 
  MessageData, 
  SupportTicket,
  User 
} from '../types';

// Simplified ChatRoom interface (since we don't have chat_rooms table)
export interface SimpleChatRoom {
  id: string;
  fromUserId: string;
  toUserId: string;
  bookingId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
}

export interface IChatStorage {
  // Message operations
  sendMessage(fromUserId: string, toUserId: string, messageData: MessageData, bookingId?: string): Promise<Message>;
  getMessages(fromUserId: string, toUserId: string, bookingId?: string, limit?: number): Promise<Message[]>;
  markMessagesAsRead(fromUserId: string, toUserId: string): Promise<void>;
  
  // Chat room simulation
  getChatRoomsByUser(userId: string): Promise<SimpleChatRoom[]>;
  getOrCreateChatRoom(fromUserId: string, toUserId: string, bookingId?: string): Promise<SimpleChatRoom>;
  
  // Message management
  getMessage(messageId: string): Promise<Message | undefined>;
  deleteMessage(messageId: string): Promise<void>;
  
  // Support chat
  createSupportTicket(userId: string, issue: string): Promise<SupportTicket>;
  assignSupportAgent(ticketId: string, agentId: string): Promise<SupportTicket>;
}

export class DatabaseChatStorage implements IChatStorage {
  
  // ===== MESSAGE OPERATIONS =====
  
  async sendMessage(fromUserId: string, toUserId: string, messageData: MessageData, bookingId?: string): Promise<Message> {
    try {
      // Primeiro, precisamos obter ou criar um chatRoomId
      const chatRoom = await this.getOrCreateChatRoom(fromUserId, toUserId, bookingId);
      
      const [message] = await db
        .insert(chatMessages)
        .values({
          chatRoomId: chatRoom.id, // ✅ AGORA OBRIGATÓRIO
          fromUserId: fromUserId,
          toUserId: toUserId,
          message: messageData.message,
          messageType: messageData.messageType || 'text',
          bookingId: bookingId || null,
          isRead: false,
        })
        .returning();
      
      return {
        id: message.id,
        chatRoomId: message.chatRoomId!,
        senderId: message.fromUserId!,
        message: message.message,
        messageType: (message.messageType as MessageType) || 'text',
        isRead: message.isRead!,
        createdAt: message.createdAt!,
        updatedAt: message.createdAt!,
      } as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async getMessages(fromUserId: string, toUserId: string, bookingId?: string, limit: number = 50): Promise<Message[]> {
    try {
      let conditions = or(
        and(eq(chatMessages.fromUserId, fromUserId), eq(chatMessages.toUserId, toUserId)),
        and(eq(chatMessages.fromUserId, toUserId), eq(chatMessages.toUserId, fromUserId))
      );

      if (bookingId) {
        conditions = and(conditions, eq(chatMessages.bookingId, bookingId));
      }

      const messageList = await db
        .select({
          id: chatMessages.id,
          fromUserId: chatMessages.fromUserId,
          toUserId: chatMessages.toUserId,
          message: chatMessages.message,
          messageType: chatMessages.messageType,
          bookingId: chatMessages.bookingId,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
          // Sender info
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.fromUserId, users.id))
        .where(conditions)
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

      return messageList.map(msg => ({
        id: msg.id,
        chatRoomId: `${fromUserId}-${toUserId}`,
        senderId: msg.fromUserId!,
        message: msg.message,
        messageType: (msg.messageType as MessageType) || 'text',
        isRead: msg.isRead!,
        createdAt: msg.createdAt!,
        updatedAt: msg.createdAt!,
        sender: msg.sender as User,
      })) as Message[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async markMessagesAsRead(fromUserId: string, toUserId: string): Promise<void> {
    try {
      await db
        .update(chatMessages)
        .set({ isRead: true })
        .where(and(
          eq(chatMessages.fromUserId, fromUserId),
          eq(chatMessages.toUserId, toUserId),
          eq(chatMessages.isRead, false)
        ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // ===== CHAT ROOM SIMULATION =====
  
  async getChatRoomsByUser(userId: string): Promise<SimpleChatRoom[]> {
    try {
      // Get unique conversations for the user
      const conversations = await db
        .select({
          otherUserId: sql`CASE 
            WHEN ${chatMessages.fromUserId} = ${userId} THEN ${chatMessages.toUserId}
            ELSE ${chatMessages.fromUserId}
          END`,
          bookingId: chatMessages.bookingId,
          lastMessage: chatMessages.message,
          lastMessageAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(or(
          eq(chatMessages.fromUserId, userId),
          eq(chatMessages.toUserId, userId)
        ))
        .orderBy(desc(chatMessages.createdAt));

      // Group by other user and booking to create unique chat rooms
      const uniqueChats = new Map<string, SimpleChatRoom>();

      conversations.forEach(conv => {
        const otherUserId = conv.otherUserId as string;
        const key = `${otherUserId}-${conv.bookingId || 'general'}`;
        
        if (!uniqueChats.has(key)) {
          uniqueChats.set(key, {
            id: key,
            fromUserId: userId,
            toUserId: otherUserId,
            bookingId: conv.bookingId || undefined,
            lastMessage: conv.lastMessage,
            lastMessageAt: conv.lastMessageAt || undefined,
            isActive: true,
          });
        }
      });

      return Array.from(uniqueChats.values());
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      return [];
    }
  }

  async getOrCreateChatRoom(fromUserId: string, toUserId: string, bookingId?: string): Promise<SimpleChatRoom> {
    try {
      // Verificar se já existe um chat room
      const existingRoom = await db
        .select()
        .from(chatRooms)
        .where(and(
          or(
            and(
              eq(chatRooms.participantOneId, fromUserId),
              eq(chatRooms.participantTwoId, toUserId)
            ),
            and(
              eq(chatRooms.participantOneId, toUserId),
              eq(chatRooms.participantTwoId, fromUserId)
            )
          ),
          bookingId ? eq(chatRooms.bookingId, bookingId) : sql`1=1`
        ))
        .limit(1);

      if (existingRoom[0]) {
        return {
          id: existingRoom[0].id,
          fromUserId: existingRoom[0].participantOneId,
          toUserId: existingRoom[0].participantTwoId,
          bookingId: existingRoom[0].bookingId || undefined,
          lastMessage: existingRoom[0].lastMessage || undefined,
          lastMessageAt: existingRoom[0].lastMessageAt || undefined,
          isActive: existingRoom[0].isActive ?? false, // ✅ CORRIGIDO: usando operador ??
        };
      }

      // Criar novo chat room
      const [newRoom] = await db
        .insert(chatRooms)
        .values({
          participantOneId: fromUserId,
          participantTwoId: toUserId,
          bookingId: bookingId || null,
          serviceType: bookingId ? 'booking' : 'general',
          isActive: true,
        })
        .returning();

      return {
        id: newRoom.id,
        fromUserId: newRoom.participantOneId,
        toUserId: newRoom.participantTwoId,
        bookingId: newRoom.bookingId || undefined,
        isActive: newRoom.isActive ?? false, // ✅ CORRIGIDO: usando operador ??
      };
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw new Error('Failed to create chat room');
    }
  }

  // ===== MESSAGE MANAGEMENT =====
  
  async getMessage(messageId: string): Promise<Message | undefined> {
    try {
      const [message] = await db
        .select({
          id: chatMessages.id,
          fromUserId: chatMessages.fromUserId,
          toUserId: chatMessages.toUserId,
          message: chatMessages.message,
          messageType: chatMessages.messageType,
          bookingId: chatMessages.bookingId,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
          // Sender info
          sender: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(chatMessages)
        .leftJoin(users, eq(chatMessages.fromUserId, users.id))
        .where(eq(chatMessages.id, messageId));

      if (!message) return undefined;

      return {
        id: message.id,
        chatRoomId: `${message.fromUserId}-${message.toUserId}`,
        senderId: message.fromUserId!,
        message: message.message,
        messageType: (message.messageType as MessageType) || 'text',
        isRead: message.isRead!,
        createdAt: message.createdAt!,
        updatedAt: message.createdAt!,
        sender: message.sender as User,
      } as Message;
    } catch (error) {
      console.error('Error fetching message:', error);
      return undefined;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  // ===== SUPPORT CHAT =====
  
  async createSupportTicket(userId: string, issue: string): Promise<SupportTicket> {
    try {
      // TODO: Implement when support_tickets table is added to schema
      const ticket: SupportTicket = {
        id: `ticket_${Date.now()}`,
        userId,
        issue,
        status: 'open',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Support ticket created:', ticket);
      return ticket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  async assignSupportAgent(ticketId: string, agentId: string): Promise<SupportTicket> {
    try {
      // TODO: Implement when support_tickets table is added to schema
      console.log(`Assigning agent ${agentId} to ticket ${ticketId}`);
      
      return {
        id: ticketId,
        userId: 'user123',
        issue: 'Support issue',
        status: 'in_progress',
        priority: 'medium',
        assignedAgentId: agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error assigning support agent:', error);
      throw new Error('Failed to assign support agent');
    }
  }

  // ===== UTILITY METHODS =====
  
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const [result] = await db
        .select({ count: sql`count(*)` })
        .from(chatMessages)
        .where(and(
          eq(chatMessages.toUserId, userId),
          eq(chatMessages.isRead, false)
        ));

      return Number(result.count);
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  async getConversationPreview(userId: string, otherUserId: string): Promise<Message | undefined> {
    try {
      const [lastMessage] = await db
        .select({
          id: chatMessages.id,
          fromUserId: chatMessages.fromUserId,
          toUserId: chatMessages.toUserId,
          message: chatMessages.message,
          messageType: chatMessages.messageType,
          isRead: chatMessages.isRead,
          createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(or(
          and(eq(chatMessages.fromUserId, userId), eq(chatMessages.toUserId, otherUserId)),
          and(eq(chatMessages.fromUserId, otherUserId), eq(chatMessages.toUserId, userId))
        ))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      if (!lastMessage) return undefined;

      return {
        id: lastMessage.id,
        chatRoomId: `${userId}-${otherUserId}`,
        senderId: lastMessage.fromUserId!,
        message: lastMessage.message,
        messageType: (lastMessage.messageType as MessageType) || 'text',
        isRead: lastMessage.isRead!,
        createdAt: lastMessage.createdAt!,
        updatedAt: lastMessage.createdAt!,
      } as Message;
    } catch (error) {
      console.error('Error getting conversation preview:', error);
      return undefined;
    }
  }
}

export const chatStorage = new DatabaseChatStorage();