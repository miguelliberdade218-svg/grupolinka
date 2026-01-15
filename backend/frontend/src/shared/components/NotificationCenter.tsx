import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { Separator } from "@/shared/components/ui/separator";
import { Bell, Check, X, Star, CreditCard, MapPin, Calendar } from "lucide-react";
import { apiRequest } from "@/shared/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

import type { Notification } from "@shared/schema";

// Mock notifications for development
const mockNotifications: Notification[] = [
  {
    id: "1",
    userId: "user-1",
    title: "Nova Oferta Especial!",
    message: "Festival de Música de Maputo oferece 20% desconto em alojamentos parceiros",
    type: "event",
    priority: "high",
    isRead: false,
    actionUrl: "/events/1",
    relatedId: "event-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    readAt: null,
  },
  {
    id: "2",
    userId: "user-1",
    title: "Viagem Confirmada",
    message: "Sua viagem para o Hotel Polana foi confirmada para amanhã às 14:00",
    type: "ride",
    priority: "normal",
    isRead: false,
    actionUrl: "/dashboard",
    relatedId: "booking-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    readAt: null,
  },
  {
    id: "3",
    userId: "user-1",
    title: "Pontos de Fidelidade",
    message: "Parabéns! Ganhou 150 pontos pela sua última estadia. Nível: Prata 🥈",
    type: "loyalty",
    priority: "normal",
    isRead: true,
    actionUrl: "/loyalty",
    relatedId: "loyalty-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: "4",
    userId: "user-1",
    title: "Pagamento Processado",
    message: "Pagamento de 2.800 MZN processado com sucesso para reserva #R001234",
    type: "payment",
    priority: "normal",
    isRead: true,
    actionUrl: "/bookings",
    relatedId: "payment-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
  },
];

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    initialData: mockNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest("PUT", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("PUT", "/api/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      ride: <MapPin className="w-4 h-4" />,
      stay: <i className="fas fa-bed text-sm"></i>,
      event: <Calendar className="w-4 h-4" />,
      payment: <CreditCard className="w-4 h-4" />,
      partnership: <i className="fas fa-handshake text-sm"></i>,
      loyalty: <Star className="w-4 h-4" />,
      system: <Bell className="w-4 h-4" />,
    };
    return iconMap[type] || <Bell className="w-4 h-4" />;
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "urgent") return "bg-red-500";
    if (priority === "high") return "bg-orange-500";
    
    const colorMap: Record<string, string> = {
      ride: "bg-blue-500",
      stay: "bg-green-500",
      event: "bg-purple-500",
      payment: "bg-indigo-500",
      partnership: "bg-emerald-500",
      loyalty: "bg-yellow-500",
      system: "bg-gray-500",
    };
    return colorMap[type] || "bg-gray-500";
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          data-testid="notification-button"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
              data-testid="notification-count"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end" data-testid="notification-panel">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs"
                data-testid="mark-all-read"
              >
                <Check className="w-3 h-3 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="p-0">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          {notification.priority === "high" && (
                            <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
                              Importante
                            </Badge>
                          )}
                          {notification.priority === "urgent" && (
                            <Badge className="ml-2 bg-red-100 text-red-800 text-xs">
                              Urgente
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true 
                          })}
                        </p>
                      </div>
                      
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                  
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="outline" 
              size="sm"
              className="w-full"
              onClick={() => {
                window.location.href = '/notifications';
                setIsOpen(false);
              }}
            >
              Ver Todas as Notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}