import { useState } from "react";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { 
  Bell, 
  Car, 
  Hotel, 
  Calendar, 
  CreditCard, 
  Star, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface Notification {
  id: string;
  type: 'ride' | 'stay' | 'event' | 'payment' | 'loyalty' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  relatedId?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'ride',
      priority: 'high',
      title: 'Viagem Confirmada',
      message: 'Sua viagem Maputo → Beira foi confirmada pelo motorista João. Partida às 08:00.',
      isRead: false,
      createdAt: '2024-08-28T10:30:00Z',
      actionUrl: '/bookings',
      relatedId: 'booking-1'
    },
    {
      id: '2',
      type: 'stay',
      priority: 'normal',
      title: 'Check-in Disponível',
      message: 'Seu quarto no Hotel Cardoso está pronto. Check-in a partir das 15:00.',
      isRead: false,
      createdAt: '2024-08-28T09:15:00Z',
      actionUrl: '/bookings',
      relatedId: 'booking-2'
    },
    {
      id: '3',
      type: 'loyalty',
      priority: 'normal',
      title: 'Pontos Ganhos',
      message: 'Você ganhou 50 pontos pela sua estadia no Hotel Polana. Total: 1,250 pontos.',
      isRead: true,
      createdAt: '2024-08-27T16:45:00Z',
      actionUrl: '/profile',
    },
    {
      id: '4',
      type: 'payment',
      priority: 'high',
      title: 'Pagamento Processado',
      message: 'Pagamento de 1,250 MZN processado com sucesso via M-Pesa.',
      isRead: true,
      createdAt: '2024-08-27T14:20:00Z',
      actionUrl: '/dashboard',
    },
    {
      id: '5',
      type: 'event',
      priority: 'normal',
      title: 'Lembrete de Evento',
      message: 'Festival da Marrabenta começa amanhã às 18:00. Não se esqueça!',
      isRead: false,
      createdAt: '2024-08-27T12:00:00Z',
      actionUrl: '/events',
      relatedId: 'event-1'
    },
    {
      id: '6',
      type: 'system',
      priority: 'low',
      title: 'Nova Funcionalidade',
      message: 'Agora você pode avaliar seus motoristas e ganhar pontos extras!',
      isRead: true,
      createdAt: '2024-08-26T08:00:00Z',
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'stay':
        return <Hotel className="w-5 h-5 text-green-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-orange-600" />;
      case 'loyalty':
        return <Star className="w-5 h-5 text-yellow-600" />;
      case 'system':
        return <Bell className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case 'high':
        return <Badge variant="default" className="text-xs bg-orange-600">Alta</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="text-xs">Normal</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `Há ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Há ${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('pt-PT');
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const filteredNotifications = notifications.filter(notification =>
    filter === 'all' || !notification.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">
                  {unreadCount} notificação{unreadCount !== 1 ? 'ões' : ''} não lida{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Não lidas ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma notificação
                  </h3>
                  <p className="text-gray-600">
                    Suas notificações aparecerão aqui quando houver novidades.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      !notification.isRead ? 'ring-2 ring-orange-100 bg-orange-50/50' : 'bg-white'
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        // TODO: Navigate to actionUrl
                        console.log('Navigate to:', notification.actionUrl);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        {/* Icon */}
                        <div className={`p-2 rounded-full ${
                          !notification.isRead ? 'bg-white shadow-sm' : 'bg-gray-100'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {getPriorityBadge(notification.priority)}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-sm ${
                            !notification.isRead ? 'text-gray-700' : 'text-gray-600'
                          } mb-2`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(notification.createdAt)}
                            </span>
                            
                            {notification.isRead && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="unread">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Tudo em dia!
                  </h3>
                  <p className="text-gray-600">
                    Você não tem notificações não lidas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id}
                    className="cursor-pointer transition-all hover:shadow-md ring-2 ring-orange-100 bg-orange-50/50"
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        console.log('Navigate to:', notification.actionUrl);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 rounded-full bg-white shadow-sm">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {getPriorityBadge(notification.priority)}
                              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">
                            {notification.message}
                          </p>
                          
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}