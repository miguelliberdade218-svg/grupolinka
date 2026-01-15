import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'driver' | 'host';
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface PreBookingChatProps {
  recipientId: string;
  recipientName: string;
  recipientType: 'driver' | 'host';
  recipientAvatar: string;
  recipientRating: number;
  isOnline: boolean;
  responseTime: string;
  serviceDetails?: {
    type: 'ride' | 'stay';
    from?: string;
    to?: string;
    location?: string;
    date: string;
    price: string;
  };
}

export default function PreBookingChat({ 
  recipientId, 
  recipientName, 
  recipientType, 
  recipientAvatar,
  recipientRating,
  isOnline,
  responseTime,
  serviceDetails 
}: PreBookingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      senderId: recipientId,
      senderName: recipientName,
      senderType: recipientType,
      message: "Olá! Vi que está interessado no meu serviço. Como posso ajudá-lo?",
      timestamp: "14:30",
      isRead: true
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: "current-user",
      senderName: "Você",
      senderType: 'user',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isRead: false
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
    setIsTyping(true);
    
    // Simulate recipient typing and response
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "Perfeito! Posso confirmar que estou disponível para essa data e horário.",
        "Sem problemas! Tenho experiência com esse tipo de viagem.",
        "Claro! Posso ajudar com isso. Tem alguma preferência específica?",
        "Obrigado pela pergunta! Sim, posso acomodar esse pedido.",
      ];
      
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: recipientId,
        senderName: recipientName,
        senderType: recipientType,
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isRead: true
      };
      
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const quickQuestions = recipientType === 'driver' 
    ? [
        "O carro tem ar condicionado?",
        "Pode fazer paragem para refeição?",
        "Aceita pagamento em dinheiro?",
        "Tem experiência com viagens longas?"
      ]
    : [
        "A propriedade tem WiFi?",
        "É permitido check-in tardio?",
        "Há estacionamento disponível?",
        "A localização é segura?"
      ];

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <i 
          key={star}
          className={`fas fa-star text-sm ${
            star <= rating ? "text-yellow-500" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="open-chat">
          <i className="fas fa-comments mr-2"></i>
          Chat antes da reserva
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-12 h-12 rounded-full object-cover"
              />
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">{recipientName}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(recipientRating)}
                <span className="text-sm text-gray-medium">
                  {recipientType === 'driver' ? 'Motorista' : 'Anfitrião'}
                </span>
              </div>
              <p className="text-xs text-gray-medium">
                {isOnline ? 'Online agora' : `Responde em ${responseTime}`}
              </p>
            </div>
          </div>
        </DialogHeader>
        
        {/* Service Details */}
        {serviceDetails && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {serviceDetails.type === 'ride' ? 'Detalhes da Viagem' : 'Detalhes da Hospedagem'}
                </p>
                {serviceDetails.type === 'ride' ? (
                  <p className="text-gray-600">
                    <i className="fas fa-route mr-1"></i>
                    {serviceDetails.from} → {serviceDetails.to}
                  </p>
                ) : (
                  <p className="text-gray-600">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {serviceDetails.location}
                  </p>
                )}
                <p className="text-gray-600">
                  <i className="fas fa-calendar mr-1"></i>
                  {serviceDetails.date}
                </p>
                <p className="font-medium text-primary">
                  {serviceDetails.price}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Chat Messages */}
        <ScrollArea className="h-64 border rounded p-3 mb-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-2 rounded-lg ${
                  message.senderType === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gray-100'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Quick Questions */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Perguntas frequentes:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setNewMessage(question)}
                className="text-xs"
                data-testid={`quick-question-${index}`}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            data-testid="chat-message-input"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            data-testid="send-chat-message"
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 mb-2">
            Continue a conversa após fazer a reserva
          </p>
          <Button className="w-full" data-testid="proceed-to-booking">
            <i className="fas fa-calendar-check mr-2"></i>
            Proceder com a Reserva
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}