import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserRoles } from './useUserRoles';
import type { 
  ChatType, 
  ChatParticipant, 
  BookingContext 
} from '../components/ChatModal';

export interface ChatInstance {
  id: string;
  type: ChatType;
  participants: ChatParticipant[];
  bookingContext?: BookingContext;
  isOpen: boolean;
  unreadCount: number;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
}

interface UseChatSystemReturn {
  activeChats: ChatInstance[];
  openChat: (chatId: string) => void;
  closeChat: (chatId: string) => void;
  initiateChatFromBooking: (
    bookingId: string,
    bookingType: 'ride' | 'accommodation',
    otherParticipant: ChatParticipant,
    bookingContext: BookingContext
  ) => string;
  handleCancelBooking: (bookingId: string) => Promise<void>;
  handleConfirmBooking: (bookingId: string) => Promise<void>;
  markChatAsRead: (chatId: string) => void;
  getTotalUnreadCount: () => number;
}

export const useChatSystem = (): UseChatSystemReturn => {
  const { user } = useAuth();
  const { currentRole } = useUserRoles();
  const [chats, setChats] = useState<ChatInstance[]>([]);

  const openChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isOpen: true, unreadCount: 0 }
        : chat
    ));
  }, []);

  const closeChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isOpen: false }
        : chat
    ));
  }, []);

  const markChatAsRead = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, unreadCount: 0 }
        : chat
    ));
  }, []);

  const initiateChatFromBooking = useCallback((
    bookingId: string,
    bookingType: 'ride' | 'accommodation',
    otherParticipant: ChatParticipant,
    bookingContext: BookingContext
  ): string => {
    const chatId = `${bookingType}-${bookingId}`;
    
    // Check if chat already exists
    const existingChat = chats.find(chat => chat.id === chatId);
    if (existingChat) {
      openChat(chatId);
      return chatId;
    }

    // Create new chat instance
    const currentUserParticipant: ChatParticipant = {
      id: user?.uid || 'user',
      name: user?.displayName || user?.email || 'Você',
      role: getRoleFromUserRole(currentRole),
      isOnline: true
    };

    const chatType: ChatType = bookingType === 'ride' ? 'driver_customer' : 'host_guest';

    const newChat: ChatInstance = {
      id: chatId,
      type: chatType,
      participants: [currentUserParticipant, otherParticipant],
      bookingContext,
      isOpen: true,
      unreadCount: 0
    };

    setChats(prev => [...prev, newChat]);
    
    return chatId;
  }, [chats, currentRole, user, openChat]);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    try {
      // In a real app, this would make API call to cancel booking
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Update chat booking context
      setChats(prev => prev.map(chat => 
        chat.bookingContext?.id === bookingId
          ? {
              ...chat,
              bookingContext: {
                ...chat.bookingContext,
                status: 'cancelled'
              }
            }
          : chat
      ));

    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }, []);

  const handleConfirmBooking = useCallback(async (bookingId: string) => {
    try {
      // In a real app, this would make API call to confirm booking
      const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to confirm booking');
      }

      // Update chat booking context
      setChats(prev => prev.map(chat => 
        chat.bookingContext?.id === bookingId
          ? {
              ...chat,
              bookingContext: {
                ...chat.bookingContext,
                status: 'confirmed'
              }
            }
          : chat
      ));

    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }, []);

  const getTotalUnreadCount = useCallback(() => {
    return chats.reduce((total, chat) => total + chat.unreadCount, 0);
  }, [chats]);

  return {
    activeChats: chats,
    openChat,
    closeChat,
    initiateChatFromBooking,
    handleCancelBooking,
    handleConfirmBooking,
    markChatAsRead,
    getTotalUnreadCount
  };
};

// Helper function to convert UserRole to ChatParticipant role
function getRoleFromUserRole(userRole: string): ChatParticipant['role'] {
  switch (userRole) {
    case 'driver': return 'driver';
    case 'hotel_manager': return 'host';
    case 'client': return 'customer';
    default: return 'customer';
  }
}

export default useChatSystem;