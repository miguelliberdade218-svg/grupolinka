import { db } from '../db';
import { users } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatRoom {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatService {
  
  // Armazenamento em memória (temporário)
  private messages: ChatMessage[] = [];
  private rooms: ChatRoom[] = [];

  /**
   * Obtém ou cria uma sala de chat entre dois usuários
   */
  async getOrCreateChatRoom(userId1: string, userId2: string): Promise<string> {
    // Ordena IDs para garantir unicidade
    const [id1, id2] = [userId1, userId2].sort();
    const roomId = `chat_${id1}_${id2}`;
    
    // Verifica se a sala já existe
    const existingRoom = this.rooms.find(room => 
      (room.participant1Id === id1 && room.participant2Id === id2) ||
      (room.participant1Id === id2 && room.participant2Id === id1)
    );

    if (existingRoom) {
      return existingRoom.id;
    }

    // Cria nova sala
    const newRoom: ChatRoom = {
      id: roomId,
      participant1Id: id1,
      participant2Id: id2,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rooms.push(newRoom);
    return roomId;
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(data: {
    senderId: string;
    recipientId: string;
    content: string;
    roomId?: string;
  }): Promise<ChatMessage> {
    const roomId = data.roomId || await this.getOrCreateChatRoom(data.senderId, data.recipientId);
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId: data.senderId,
      recipientId: data.recipientId,
      content: data.content,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.messages.push(message);

    // Atualiza último horário da sala
    const roomIndex = this.rooms.findIndex(room => room.id === roomId);
    if (roomIndex !== -1) {
      this.rooms[roomIndex].lastMessageAt = new Date();
      this.rooms[roomIndex].updatedAt = new Date();
    }

    return message;
  }

  /**
   * Obtém mensagens de uma sala
   */
  async getMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    return this.messages
      .filter(msg => msg.roomId === roomId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Obtém salas de chat de um usuário
   */
  async getUserChatRooms(userId: string): Promise<Array<ChatRoom & { 
    otherParticipant: any;
    lastMessage?: ChatMessage;
    unreadCount: number;
  }>> {
    const userRooms = this.rooms.filter(room => 
      room.participant1Id === userId || room.participant2Id === userId
    );

    const result = await Promise.all(
      userRooms.map(async (room) => {
        const otherUserId = room.participant1Id === userId ? room.participant2Id : room.participant1Id;
        
        // Busca informações do outro participante
        const [otherUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        // Última mensagem
        const roomMessages = this.messages.filter(msg => msg.roomId === room.id);
        const lastMessage = roomMessages.length > 0 
          ? roomMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
          : undefined;

        // Contagem de mensagens não lidas
        const unreadCount = roomMessages.filter(msg => 
          msg.recipientId === userId && !msg.isRead
        ).length;

        return {
          ...room,
          otherParticipant: otherUser || { id: otherUserId, firstName: 'Usuário', lastName: '' },
          lastMessage,
          unreadCount
        };
      })
    );

    return result.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  /**
   * Marca mensagens como lidas
   */
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    this.messages.forEach(msg => {
      if (msg.roomId === roomId && msg.recipientId === userId && !msg.isRead) {
        msg.isRead = true;
        msg.updatedAt = new Date();
      }
    });
  }

  /**
   * Obtém contagem de mensagens não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messages.filter(msg => 
      msg.recipientId === userId && !msg.isRead
    ).length;
  }

  /**
   * Limpa mensagens antigas (manutenção)
   */
  async cleanupOldMessages(days: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.messages = this.messages.filter(msg => msg.createdAt > cutoffDate);
  }

  /**
   * Verifica se usuários podem se comunicar (com base em reservas)
   */
  async canUsersChat(userId1: string, userId2: string): Promise<boolean> {
    // Implementação básica - permitir sempre por enquanto
    // Futuramente pode verificar se há reservas entre os usuários
    return true;
  }

  /**
   * Obtém histórico de chat entre usuários
   */
  async getChatHistory(userId1: string, userId2: string): Promise<{
    roomId: string;
    messages: ChatMessage[];
    participant1: any;
    participant2: any;
  }> {
    const roomId = await this.getOrCreateChatRoom(userId1, userId2);
    
    const [user1] = await db.select().from(users).where(eq(users.id, userId1)).limit(1);
    const [user2] = await db.select().from(users).where(eq(users.id, userId2)).limit(1);

    const messages = await this.getMessages(roomId, 100);

    // Marca como lidas ao abrir o chat
    await this.markMessagesAsRead(roomId, userId1);

    return {
      roomId,
      messages,
      participant1: user1 || { id: userId1, firstName: 'Usuário', lastName: '1' },
      participant2: user2 || { id: userId2, firstName: 'Usuário', lastName: '2' }
    };
  }
}

export const chatService = new ChatService();