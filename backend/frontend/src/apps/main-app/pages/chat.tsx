import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Send, Phone, MoreVertical, ArrowLeft, MapPin } from "lucide-react";
import { Link, useRoute } from "wouter";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  type: 'text' | 'location' | 'image';
}

interface ActiveChat {
  id: string;
  providerId: string;
  providerName: string;
  providerType: 'driver' | 'hotel' | 'event';
  providerAvatar?: string;
  bookingId: string;
  bookingType: string;
  bookingDetails: string;
  status: 'active' | 'completed' | 'expired';
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [, params] = useRoute('/chat/:chatId');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderId: 'driver-123',
      senderName: 'João Motorista',
      message: 'Olá! Estou a caminho do local de partida. Chego em 10 minutos.',
      timestamp: '14:30',
      type: 'text'
    },
    {
      id: '2',
      senderId: user?.id || 'current-user',
      senderName: user?.firstName || 'Você',
      message: 'Perfeito! Estarei à espera. Obrigado!',
      timestamp: '14:32',
      type: 'text'
    },
    {
      id: '3',
      senderId: 'driver-123',
      senderName: 'João Motorista',
      message: 'Cheguei! Estou num Toyota Corolla branco, matrícula AAA-123MZ',
      timestamp: '14:40',
      type: 'text'
    }
  ]);

  const [activeChats] = useState<ActiveChat[]>([
    {
      id: 'chat-1',
      providerId: 'driver-123',
      providerName: 'João Motorista',
      providerType: 'driver',
      bookingId: 'booking-1',
      bookingType: 'Viagem',
      bookingDetails: 'Maputo → Beira',
      status: 'active',
      lastMessage: 'Cheguei! Estou num Toyota Corolla branco',
      lastMessageTime: '14:40'
    },
    {
      id: 'chat-2',
      providerId: 'hotel-456',
      providerName: 'Hotel Cardoso',
      providerType: 'hotel',
      bookingId: 'booking-2',
      bookingType: 'Hospedagem',
      bookingDetails: '2 noites - Suite Deluxe',
      status: 'active',
      lastMessage: 'Check-in disponível a partir das 15:00',
      lastMessageTime: '10:15'
    },
    {
      id: 'chat-3',
      providerId: 'event-789',
      providerName: 'Festival da Marrabenta',
      providerType: 'event',
      bookingId: 'booking-3',
      bookingType: 'Evento',
      bookingDetails: '2 bilhetes - VIP',
      status: 'completed',
      lastMessage: 'Obrigado por participar! Esperamos vê-lo novamente.',
      lastMessageTime: 'Ontem'
    }
  ]);

  const currentChatId = params?.chatId;
  const currentChat = activeChats.find(chat => chat.id === currentChatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !currentChat) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 'current-user',
      senderName: user?.firstName || 'Você',
      message: message.trim(),
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // TODO: Enviar mensagem via WebSocket ou API
    console.log('Sending message:', newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!currentChatId || !currentChat) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
            </div>
          </div>
        </header>

        {/* Chat List */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Suas Conversas Ativas</h2>
              <p className="text-gray-600">Chat apenas com fornecedores de serviços com reservas ativas</p>
            </div>

            {activeChats.filter(chat => chat.status === 'active').length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conversa ativa</h3>
                  <p className="text-gray-600 mb-4">
                    As conversas aparecem aqui quando você tem reservas confirmadas
                  </p>
                  <Link href="/dashboard">
                    <Button>Fazer uma Reserva</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeChats.map((chat) => (
                  <Link key={chat.id} href={`/chat/${chat.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={chat.providerAvatar} />
                            <AvatarFallback>
                              {chat.providerName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {chat.providerName}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>
                                  {chat.status === 'active' ? 'Ativo' : 
                                   chat.status === 'completed' ? 'Concluído' : 'Expirado'}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {chat.lastMessageTime}
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-1">
                              {chat.bookingType}: {chat.bookingDetails}
                            </p>
                            
                            {chat.lastMessage && (
                              <p className="text-sm text-gray-500 truncate">
                                {chat.lastMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/chat">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentChat.providerAvatar} />
                <AvatarFallback>
                  {currentChat.providerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentChat.providerName}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {currentChat.bookingType}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {currentChat.bookingDetails}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentChat.providerType === 'driver' && (
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Ligar
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-4xl mx-auto">
          {/* Booking Info Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-orange-900">
                  Reserva: {currentChat.bookingType}
                </h3>
                <p className="text-orange-700">{currentChat.bookingDetails}</p>
              </div>
              <Badge className="bg-orange-600">
                {currentChat.status === 'active' ? 'Em Andamento' : 'Concluído'}
              </Badge>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderId === (user?.id || 'current-user') ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.senderId === (user?.id || 'current-user')
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  {msg.type === 'location' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Localização partilhada</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderId === (user?.id || 'current-user')
                      ? 'text-orange-200'
                      : 'text-gray-500'
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="w-full"
              />
            </div>
            <Button 
              onClick={sendMessage}
              disabled={!message.trim()}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {currentChat.status !== 'active' && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Esta conversa foi {currentChat.status === 'completed' ? 'concluída' : 'expirada'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}