import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { Badge } from "@/shared/components/ui/badge";

interface MobileNavigationProps {
  onOfferRide?: () => void;
}

export default function MobileNavigation({ onOfferRide }: MobileNavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Mock notification count - in real app, this would come from context/store
  const unreadNotifications = 3;
  const unreadMessages = 1;

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-6 h-16">
        <button
          data-testid="mobile-nav-home"
          onClick={() => window.location.href = "/"}
          className={`flex flex-col items-center justify-center ${
            isActive("/") ? "text-orange-600" : "text-gray-500"
          }`}
        >
          <i className="fas fa-home text-lg mb-1"></i>
          <span className="text-xs">Início</span>
        </button>
        
        <button
          data-testid="mobile-nav-bookings"
          onClick={() => window.location.href = "/bookings"}
          className={`flex flex-col items-center justify-center ${
            isActive("/bookings") ? "text-orange-600" : "text-gray-500"
          }`}
        >
          <i className="fas fa-clipboard-list text-lg mb-1"></i>
          <span className="text-xs">Reservas</span>
        </button>

        <button
          data-testid="mobile-nav-chat"
          onClick={() => window.location.href = "/chat"}
          className={`flex flex-col items-center justify-center relative ${
            isActive("/chat") ? "text-orange-600" : "text-gray-500"
          }`}
        >
          <div className="relative">
            <i className="fas fa-comments text-lg mb-1"></i>
            {unreadMessages > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs bg-red-500"
                variant="destructive"
              >
                {unreadMessages}
              </Badge>
            )}
          </div>
          <span className="text-xs">Chat</span>
        </button>

        <button
          data-testid="mobile-nav-notifications"
          onClick={() => window.location.href = "/notifications"}
          className={`flex flex-col items-center justify-center relative ${
            isActive("/notifications") ? "text-orange-600" : "text-gray-500"
          }`}
        >
          <div className="relative">
            <i className="fas fa-bell text-lg mb-1"></i>
            {unreadNotifications > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 w-4 h-4 p-0 text-xs bg-red-500"
                variant="destructive"
              >
                {unreadNotifications}
              </Badge>
            )}
          </div>
          <span className="text-xs">Alertas</span>
        </button>
        
        <button
          data-testid="mobile-nav-events"
          onClick={() => window.location.href = "/events"}
          className={`flex flex-col items-center justify-center ${
            isActive("/events") ? "text-orange-600" : "text-gray-500"
          }`}
        >
          <i className="fas fa-calendar text-lg mb-1"></i>
          <span className="text-xs">Eventos</span>
        </button>
        
        <button
          data-testid="mobile-nav-profile"
          onClick={() => window.location.href = "/profile"}
          className={`flex flex-col items-center justify-center ${
            isActive("/profile") ? "text-orange-600" : "text-gray-500"
          }`}
        >
          <i className="fas fa-user text-lg mb-1"></i>
          <span className="text-xs">Perfil</span>
        </button>
      </div>
    </div>
  );
}