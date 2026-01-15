import { Link, useLocation } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { TrendingUp, Users, Home, Shield } from "lucide-react";

export default function AdminMobileNav() {
  const [location] = useLocation();

  const navItems = [
    {
      href: "/admin",
      icon: TrendingUp,
      label: "Dashboard",
      active: location === "/admin"
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "Utilizadores",
      active: location.startsWith("/admin/users")
    },
    {
      href: "/",
      icon: Home,
      label: "Voltar",
      active: false
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={`h-full w-full flex flex-col items-center justify-center space-y-1 rounded-none ${
                  item.active 
                    ? "text-red-600 bg-red-50" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}