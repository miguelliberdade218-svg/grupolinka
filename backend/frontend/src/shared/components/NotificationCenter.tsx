// src/shared/components/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, Check, X, Star, CreditCard, MapPin, Calendar, 
  Car, Hotel, Users, AlertCircle, CheckCircle, Info, 
  Clock, ArrowRight, Zap, TrendingUp, Settings, Mail,
  Shield, DollarSign, MessageSquare, Gift, Award,
  Sparkles, ChevronRight
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Separator } from "@/shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { apiRequest } from "@/shared/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/shared/lib/utils";

import type { Notification } from "@shared/schema";

// Mock notifications for development
const mockNotifications: Notification[] = [
  {
    id: "1",
    userId: "user-1",
    title: "🎉 Nova Oferta Especial!",
    message: "Festival de Música de Maputo oferece 20% desconto em alojamentos parceiros. Reserve agora!",
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
    title: "🚗 Viagem Confirmada!",
    message: "Sua viagem para o Hotel Polana foi confirmada para amanhã às 14:00. Motorista: João Silva",
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
    title: "⭐ Pontos de Fidelidade",
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
    title: "💳 Pagamento Processado",
    message: "Pagamento de 2.800 MZN processado com sucesso para reserva #R001234",
    type: "payment",
    priority: "normal",
    isRead: true,
    actionUrl: "/bookings",
    relatedId: "payment-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
  },
  {
    id: "5",
    userId: "user-1",
    title: "🏨 Avaliação Pendente",
    message: "Como foi sua estadia no Hotel Marisol? Avalie e ajude outros viajantes!",
    type: "review",
    priority: "normal",
    isRead: false,
    actionUrl: "/reviews/new",
    relatedId: "review-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    readAt: null,
  },
  {
    id: "6",
    userId: "user-1",
    title: "🎁 Oferta Exclusiva",
    message: "Ganhe 500 pontos bônus ao completar 3 viagens este mês!",
    type: "promotion",
    priority: "high",
    isRead: false,
    actionUrl: "/promotions",
    relatedId: "promo-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    readAt: null,
  },
  {
    id: "7",
    userId: "user-1",
    title: "🛡️ Verificação Concluída",
    message: "Sua verificação de segurança foi aprovada! Perfil atualizado.",
    type: "security",
    priority: "normal",
    isRead: true,
    actionUrl: "/profile/verification",
    relatedId: "verification-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 36),
  },
];

interface NotificationCenterProps {
  children?: React.ReactNode;
}

export default function NotificationCenter({ children }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
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

  const clearAllMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", "/api/notifications"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      ride: <Car className="w-4 h-4" />,
      stay: <Hotel className="w-4 h-4" />,
      event: <Calendar className="w-4 h-4" />,
      payment: <CreditCard className="w-4 h-4" />,
      partnership: <Users className="w-4 h-4" />,
      loyalty: <Star className="w-4 h-4" />,
      system: <Bell className="w-4 h-4" />,
      review: <Star className="w-4 h-4" />,
      promotion: <Gift className="w-4 h-4" />,
      security: <Shield className="w-4 h-4" />,
      message: <MessageSquare className="w-4 h-4" />,
    };
    return iconMap[type] || <Bell className="w-4 h-4" />;
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "urgent") return "bg-gradient-to-br from-red-500 to-red-600";
    if (priority === "high") return "bg-gradient-to-br from-orange-500 to-orange-600";
    
    const colorMap: Record<string, string> = {
      ride: "bg-gradient-to-br from-blue-500 to-blue-600",
      stay: "bg-gradient-to-br from-green-500 to-green-600",
      event: "bg-gradient-to-br from-purple-500 to-purple-600",
      payment: "bg-gradient-to-br from-indigo-500 to-indigo-600",
      partnership: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      loyalty: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      review: "bg-gradient-to-br from-pink-500 to-pink-600",
      promotion: "bg-gradient-to-br from-rose-500 to-rose-600",
      security: "bg-gradient-to-br from-gray-500 to-gray-600",
      message: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    };
    return colorMap[type] || "bg-gradient-to-br from-gray-500 to-gray-600";
  };

  const getTypeColorClass = (type: string) => {
    const colorMap: Record<string, string> = {
      ride: "border-l-blue-500 bg-blue-50",
      stay: "border-l-green-500 bg-green-50",
      event: "border-l-purple-500 bg-purple-50",
      payment: "border-l-indigo-500 bg-indigo-50",
      loyalty: "border-l-yellow-500 bg-yellow-50",
      review: "border-l-pink-500 bg-pink-50",
      promotion: "border-l-rose-500 bg-rose-50",
      security: "border-l-gray-500 bg-gray-50",
    };
    return colorMap[type] || "border-l-gray-500 bg-gray-50";
  };

  const getPriorityIcon = (priority: string) => {
    const iconMap: Record<string, JSX.Element> = {
      urgent: <AlertCircle className="w-3 h-3 text-red-500" />,
      high: <Zap className="w-3 h-3 text-orange-500" />,
      normal: <Info className="w-3 h-3 text-blue-500" />,
    };
    return iconMap[priority] || <Info className="w-3 h-3 text-gray-500" />;
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

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'important') return notification.priority === 'high' || notification.priority === 'urgent';
    return true;
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="relative text-gray-600 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300 group"
            data-testid="notification-button"
          >
            <div className="relative">
              <Bell className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              {unreadCount > 0 && (
                <Badge 
                  className={cn(
                    "absolute -top-1 -right-1 min-w-5 h-5 px-1.5 flex items-center justify-center text-white text-xs rounded-full border-2 border-white shadow-sm animate-pulse",
                    unreadCount > 9 
                      ? "bg-gradient-to-br from-red-500 to-red-600" 
                      : "bg-gradient-to-br from-red-500 to-orange-500"
                  )}
                  data-testid="notification-count"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </div>
          </Button>
        )}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 overflow-hidden rounded-2xl shadow-2xl border border-gray-200/80 bg-white/95 backdrop-blur-sm" 
        align="end" 
        data-testid="notification-panel"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Notificações</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 ? (
                    <>
                      <Badge className="bg-primary text-white text-xs font-medium">
                        {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-xs text-gray-500">• Atualizado agora</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Você está atualizado!</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  className="text-xs text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg px-2"
                  data-testid="mark-all-read"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Marcar todas
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllMutation.mutate()}
                  className="text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-3">
            <TabsList className="grid grid-cols-3 bg-gray-100/50 p-1 rounded-lg">
              <TabsTrigger 
                value="all" 
                className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger 
                value="unread" 
                className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                Não lidas
              </TabsTrigger>
              <TabsTrigger 
                value="important" 
                className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all"
              >
                Importantes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications Content */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="font-medium text-gray-700 mb-2">Nenhuma notificação</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                {activeTab === 'all' 
                  ? "Você está atualizado com todas as notificações!" 
                  : activeTab === 'unread' 
                    ? "Nenhuma notificação não lida no momento"
                    : "Nenhuma notificação importante no momento"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100/50">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "transition-all hover:bg-gray-50/80 group",
                    !notification.isRead && "bg-gradient-to-r from-primary/5 to-transparent"
                  )}
                  data-testid={`notification-${notification.id}`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-sm font-semibold text-gray-900 line-clamp-1",
                            !notification.isRead && "font-bold"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {notification.priority === "high" && (
                              <Badge className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5">
                                <Zap className="w-2.5 h-2.5 mr-1" />
                                Importante
                              </Badge>
                            )}
                            {notification.priority === "urgent" && (
                              <Badge className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5">
                                <AlertCircle className="w-2.5 h-2.5 mr-1" />
                                Urgente
                              </Badge>
                            )}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.createdAt), { 
                                addSuffix: true 
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && (
                              <span className="text-xs text-primary font-medium group-hover:underline inline-flex items-center gap-1">
                                Ver detalhes
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {filteredNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {filteredNotifications.length} notificação{filteredNotifications.length !== 1 ? 'es' : ''}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={() => {
                    window.location.href = '/notifications';
                    setIsOpen(false);
                  }}
                >
                  Ver todas as notificações
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}