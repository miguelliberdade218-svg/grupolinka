import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { Send, MessageCircle, Phone, Video } from "lucide-react";
import io, { Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  messageType: string;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface ChatRoom {
  id: string;
  bookingId: string;
  otherUserId: string;
  lastMessage?: string;
  lastMessageAt?: Date;
}

interface ChatComponentProps {
  userId: string;
  bookingId?: string;
  otherUserId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatComponent({ 
  userId, 
  bookingId, 
  otherUserId, 
  isOpen, 
  onClose 
}: ChatComponentProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && userId) {
      initializeChat();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isOpen, userId, bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Conectar ao WebSocket
      const newSocket = io(window.location.origin, {
        path: '/ws',
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        newSocket.emit('authenticate', userId);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('new_message', (message: ChatMessage) => {
        setMessages(prev => [message, ...prev]);
      });

      newSocket.on('error', (error: any) => {
        toast({
          title: "Erro de Chat",
          description: error.message || "Erro na conexão do chat",
          variant: "destructive",
        });
      });

      setSocket(newSocket);

      // Se temos um bookingId, criar/obter sala de chat
      if (bookingId) {
        await createChatRoom(bookingId);
      }

    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar ao chat",
        variant: "destructive",
      });
    }
  };

  const createChatRoom = async (bookingId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chat/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sala de chat');
      }

      const room = await response.json();
      setChatRoom(room);

      // Carregar mensagens existentes
      await loadMessages(room.id);

    } catch (error) {
      console.error('Erro ao criar sala de chat:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar sala de chat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatRoomId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${chatRoomId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }

      const chatMessages = await response.json();
      setMessages(chatMessages.reverse()); // Mostrar mensagens mais antigas primeiro

    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = () => {
    if (!socket || !newMessage.trim() || !chatRoom) return;

    socket.emit('send_message', {
      chatRoomId: chatRoom.id,
      message: newMessage.trim(),
      messageType: 'text'
    });

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat da Reserva
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                data-testid="button-close-chat"
              >
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Área de mensagens */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.senderId === userId ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender?.profileImageUrl} />
                      <AvatarFallback>
                        {message.sender?.firstName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`max-w-[70%] ${
                      message.senderId === userId ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`rounded-lg p-3 ${
                        message.senderId === userId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Campo de envio de mensagem */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={!isConnected || !chatRoom}
                data-testid="input-message"
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected || !chatRoom}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}