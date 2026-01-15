import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { MessageCircle, Send, User, Clock, Car, Hotel } from "lucide-react";

export default function Chat() {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Mock data - chats com passageiros e hotéis
  const driverChats = [
    {
      id: 1,
      type: "passenger",
      name: "Ana Silva",
      subject: "Boleia Maputo → Beira (20/01)",
      lastMessage: "A que horas sai exactamente?",
      timestamp: "11:30",
      unread: 1,
      status: "active"
    },
    {
      id: 2,
      type: "passenger", 
      name: "Carlos Mendes",
      subject: "Boleia Nampula → Nacala (22/01)",
      lastMessage: "Confirmado o lugar!",
      timestamp: "Ontem",
      unread: 0,
      status: "confirmed"
    },
    {
      id: 3,
      type: "hotel",
      name: "Hotel Marisol",
      subject: "Parceria - Comissões",
      lastMessage: "Quando pode começar a trazer clientes?",
      timestamp: "2 dias",
      unread: 2,
      status: "partnership"
    }
  ];

  const chatMessages = {
    1: [
      { id: 1, sender: "Ana Silva", message: "Olá! Vi sua oferta para Beira", time: "10:00", isDriver: false },
      { id: 2, sender: "Eu", message: "Olá Ana! Sim, ainda tenho lugares disponíveis", time: "10:05", isDriver: true },
      { id: 3, sender: "Ana Silva", message: "Perfeito! A que horas sai exactamente?", time: "11:30", isDriver: false }
    ],
    2: [
      { id: 1, sender: "Carlos Mendes", message: "Boa tarde! Interesse na boleia para Nacala", time: "Ontem", isDriver: false },
      { id: 2, sender: "Eu", message: "Olá Carlos! Tenho 1 lugar livre", time: "Ontem", isDriver: true },
      { id: 3, sender: "Carlos Mendes", message: "Confirmado o lugar!", time: "Ontem", isDriver: false }
    ],
    3: [
      { id: 1, sender: "Hotel Marisol", message: "Olá! Vimos que demonstrou interesse na nossa parceria", time: "2 dias", isDriver: false },
      { id: 2, sender: "Eu", message: "Sim! Faço Maputo-Beira regularmente", time: "2 dias", isDriver: true },
      { id: 3, sender: "Hotel Marisol", message: "Quando pode começar a trazer clientes?", time: "2 dias", isDriver: false }
    ]
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    console.log("Enviar mensagem:", newMessage, "para chat:", selectedChat);
    setNewMessage("");
    // TODO: Implementar envio de mensagem
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case "passenger": return <User className="w-4 h-4 text-blue-600" />;
      case "hotel": return <Hotel className="w-4 h-4 text-green-600" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChatBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-orange-100 text-orange-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "partnership": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens</h1>
          <p className="text-gray-600">Conversas com passageiros e parceiros</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Lista de Chats */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {driverChats.length > 0 ? (
                <div className="space-y-1">
                  {driverChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-4 cursor-pointer border-b hover:bg-gray-50 ${
                        selectedChat === chat.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                      onClick={() => setSelectedChat(chat.id)}
                      data-testid={`chat-item-${chat.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getChatIcon(chat.type)}
                          <h3 className="font-medium text-sm">{chat.name}</h3>
                        </div>
                        {chat.unread > 0 && (
                          <Badge className="bg-orange-500">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{chat.subject}</p>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500 truncate flex-1 mr-2">
                          {chat.lastMessage}
                        </p>
                        <span className="text-xs text-gray-400">{chat.timestamp}</span>
                      </div>
                      
                      <div className="mt-2">
                        <Badge className={`${getChatBadgeColor(chat.status)} text-xs`}>
                          {chat.status === "active" && "Ativo"}
                          {chat.status === "confirmed" && "Confirmado"}
                          {chat.status === "partnership" && "Parceria"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Nenhuma conversa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Área de Chat */}
          <Card className="lg:col-span-2">
            {selectedChat ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    {getChatIcon(driverChats.find(c => c.id === selectedChat)?.type || "")}
                    <div>
                      <CardTitle className="text-lg">
                        {driverChats.find(c => c.id === selectedChat)?.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {driverChats.find(c => c.id === selectedChat)?.subject}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col h-[400px] p-0">
                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {(chatMessages[selectedChat as keyof typeof chatMessages] || []).map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isDriver ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.isDriver
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 opacity-60" />
                            <span className="text-xs opacity-60">{message.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input de Mensagem */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        data-testid="input-message"
                      />
                      <Button onClick={handleSendMessage} data-testid="button-send">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-2">
                      {driverChats.find(c => c.id === selectedChat)?.type === "passenger" && (
                        <p className="text-xs text-gray-500">
                          💬 Coordene detalhes da viagem com o passageiro
                        </p>
                      )}
                      {driverChats.find(c => c.id === selectedChat)?.type === "hotel" && (
                        <p className="text-xs text-gray-500">
                          🤝 Negocie os termos da parceria
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-gray-600">
                    Escolha uma conversa à esquerda para começar
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">💬 Chat com Passageiros</h3>
              <p className="text-sm text-blue-800">
                Use para coordenar pontos de encontro, horários e esclarecer dúvidas sobre a viagem.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-green-900 mb-2">🤝 Chat com Hotéis</h3>
              <p className="text-sm text-green-800">
                Negocie comissões, estadias gratuitas e outros benefícios das parcerias.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}