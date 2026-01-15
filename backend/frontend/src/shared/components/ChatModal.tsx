import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { 
  Send, 
  X, 
  Phone, 
  Video,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";

export type ChatType = 'ride_booking' | 'accommodation_booking' | 'driver_customer' | 'host_guest' | 'support';

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'driver' | 'customer' | 'host' | 'guest' | 'support';
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'location' | 'booking_update';
  metadata?: {
    bookingId?: string;
    location?: { lat: number; lng: number; name: string };
    bookingStatus?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  };
}

export interface BookingContext {
  id: string;
  type: 'ride' | 'accommodation';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  details: {
    from?: string;
    to?: string;
    date?: string;
    time?: string;
    price?: number;
    passengers?: number;
    // Accommodation specific
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    roomType?: string;
  };
}

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatType: ChatType;
  participants: ChatParticipant[];
  bookingContext?: BookingContext;
  onCancelBooking?: (bookingId: string) => void;
  onConfirmBooking?: (bookingId: string) => void;
}

export function ChatModal({
  open,
  onOpenChange,
  chatType,
  participants,
  bookingContext,
  onCancelBooking,
  onConfirmBooking
}: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulated message loading - in real app this would connect to WebSocket/Firebase
  useEffect(() => {
    if (open && bookingContext) {
      // Initialize with system message
      const systemMessage: ChatMessage = {
        id: 'system-1',
        senderId: 'system',
        content: `Chat iniciado para ${bookingContext.type === 'ride' ? 'viagem' : 'hospedagem'} #${bookingContext.id.slice(-6)}`,
        timestamp: new Date(),
        type: 'system'
      };
      setMessages([systemMessage]);

      // Add booking context message if exists
      if (bookingContext.status === 'pending') {
        const contextMessage: ChatMessage = {
          id: 'system-2',
          senderId: 'system',
          content: `Reserva pendente - aguardando confirmação do ${bookingContext.type === 'ride' ? 'motorista' : 'anfitrião'}`,
          timestamp: new Date(),
          type: 'booking_update',
          metadata: { bookingId: bookingContext.id, bookingStatus: 'pending' }
        };
        setMessages(prev => [...prev, contextMessage]);
      }
    }
  }, [open, bookingContext]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.uid || 'user',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setLoading(true);

    try {
      // Here you would send message to backend/WebSocket
      // await sendMessageToServer(message);
      
      // Simulate response after delay (remove in real implementation)
      setTimeout(() => {
        const otherParticipant = participants.find(p => p.id !== user?.uid);
        if (otherParticipant) {
          const responseMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            senderId: otherParticipant.id,
            content: getSimulatedResponse(newMessage, chatType),
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, responseMessage]);
        }
        setLoading(false);
      }, 1000 + Math.random() * 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingContext || !onCancelBooking) return;

    try {
      await onCancelBooking(bookingContext.id);
      
      const cancelMessage: ChatMessage = {
        id: `system-cancel-${Date.now()}`,
        senderId: 'system',
        content: 'Reserva cancelada pelo cliente',
        timestamp: new Date(),
        type: 'booking_update',
        metadata: { bookingId: bookingContext.id, bookingStatus: 'cancelled' }
      };
      
      setMessages(prev => [...prev, cancelMessage]);
      
      toast({
        title: "Reserva Cancelada",
        description: "A sua reserva foi cancelada com sucesso."
      });
      
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a reserva. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleConfirmBooking = async () => {
    if (!bookingContext || !onConfirmBooking) return;

    try {
      await onConfirmBooking(bookingContext.id);
      
      const confirmMessage: ChatMessage = {
        id: `system-confirm-${Date.now()}`,
        senderId: 'system',
        content: 'Reserva confirmada!',
        timestamp: new Date(),
        type: 'booking_update',
        metadata: { bookingId: bookingContext.id, bookingStatus: 'confirmed' }
      };
      
      setMessages(prev => [...prev, confirmMessage]);
      
      toast({
        title: "Reserva Confirmada",
        description: "A sua reserva foi confirmada com sucesso."
      });
      
    } catch (error) {
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar a reserva. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'cancelled': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const otherParticipant = participants.find(p => p.id !== user?.uid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-2 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                  {otherParticipant?.avatar ? (
                    <img 
                      src={otherParticipant.avatar} 
                      alt={otherParticipant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {otherParticipant?.name.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                {otherParticipant?.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {otherParticipant?.name || 'Chat'}
                </DialogTitle>
                <p className="text-xs text-gray-500">
                  {getParticipantRole(otherParticipant?.role)} 
                  {otherParticipant?.isOnline ? ' • Online' : ' • Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled>
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <Video className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenChange(false)}
                data-testid="button-close-chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Booking Context */}
        {bookingContext && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-xs ${getStatusColor(bookingContext.status)}`}>
                    {getStatusIcon(bookingContext.status)}
                    <span className="ml-1 capitalize">{bookingContext.status}</span>
                  </Badge>
                  <span className="text-xs text-gray-600">
                    #{bookingContext.id.slice(-6)}
                  </span>
                </div>
                <div className="text-sm">
                  {bookingContext.type === 'ride' ? (
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin className="w-3 h-3" />
                      <span>{bookingContext.details.from} → {bookingContext.details.to}</span>
                    </div>
                  ) : (
                    <div className="text-gray-700">
                      <span>{bookingContext.details.roomType} • {bookingContext.details.guests} hóspedes</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {bookingContext.details.date} • {bookingContext.details.time} • {bookingContext.details.price?.toFixed(2)} MZN
                  </div>
                </div>
              </div>
            </div>
            
            {/* Booking Actions */}
            {bookingContext.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleCancelBooking}
                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                  data-testid="button-cancel-booking"
                >
                  Cancelar Reserva
                </Button>
                <Button 
                  size="sm"
                  onClick={handleConfirmBooking}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="button-confirm-booking"
                >
                  Confirmar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'system' || message.type === 'booking_update' ? (
                <div className="flex justify-center">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full max-w-xs text-center">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === user?.uid
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === user?.uid ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={loading}
              className="flex-1"
              data-testid="input-chat-message"
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!newMessage.trim() || loading}
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function getParticipantRole(role?: ChatParticipant['role']): string {
  switch (role) {
    case 'driver': return 'Motorista';
    case 'customer': return 'Cliente';
    case 'host': return 'Anfitrião';
    case 'guest': return 'Hóspede';
    case 'support': return 'Suporte';
    default: return 'Utilizador';
  }
}

function getSimulatedResponse(message: string, chatType: ChatType): string {
  const responses = {
    ride_booking: [
      "Olá! Confirmo a sua viagem. Estarei lá na hora marcada.",
      "Muito bem, vamos combinar os detalhes da viagem.",
      "Perfeito! Vou buscá-lo no local combinado."
    ],
    accommodation_booking: [
      "Bem-vindo! O seu quarto está reservado e pronto.",
      "Olá! Obrigado pela reserva. Confirmo a disponibilidade.",
      "Perfeito! Aguardamos a sua chegada."
    ],
    driver_customer: [
      "Estou a caminho! Chego em 5 minutos.",
      "Obrigado pela mensagem. Confirmo todos os detalhes.",
      "Sim, tudo confirmado para a nossa viagem."
    ],
    host_guest: [
      "Bem-vindo ao alojamento! Se precisar de alguma coisa, me avise.",
      "Obrigado pela reserva! Confirmo tudo para a sua estadia.",
      "Perfeito! Qualquer dúvida, estou à disposição."
    ],
    support: [
      "Olá! Como posso ajudá-lo hoje?",
      "Obrigado por entrar em contato. Vou verificar isso para si.",
      "Entendi a sua questão. Vou resolver isso rapidamente."
    ]
  };

  const categoryResponses = responses[chatType] || responses.support;
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
}

export default ChatModal;