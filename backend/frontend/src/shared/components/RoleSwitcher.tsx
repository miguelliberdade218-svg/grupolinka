import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/shared/components/ui/dropdown-menu';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  ChevronDown, 
  User, 
  Car, 
  Building, 
  Shield, 
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useUserRoles, roleUtils, type UserRole } from '../hooks/useUserRoles';
import { useToast } from '@/shared/hooks/use-toast';

interface RoleSwitcherProps {
  variant?: 'default' | 'compact';
  showBadge?: boolean;
  className?: string;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'client': return <User className="w-4 h-4" />;
    case 'driver': return <Car className="w-4 h-4" />;
    case 'hotel_manager': return <Building className="w-4 h-4" />;
    case 'admin': return <Shield className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'client': return 'bg-blue-100 text-blue-800';
    case 'driver': return 'bg-green-100 text-green-800';
    case 'hotel_manager': return 'bg-purple-100 text-purple-800';
    case 'admin': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function RoleSwitcher({ 
  variant = 'default', 
  showBadge = true, 
  className = '' 
}: RoleSwitcherProps) {
  const { roles, currentRole, switchRole, loading, error } = useUserRoles();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { toast } = useToast();

  // Don't render if user only has client role (default for all users)
  if (roles.length <= 1 && roles[0] === 'client') {
    return null;
  }

  const handleRoleSwitch = async (newRole: UserRole) => {
    if (newRole === currentRole) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    
    try {
      const success = await switchRole(newRole);
      
      if (success) {
        toast({
          title: "Papel Alterado",
          description: `Agora está a usar o papel de ${roleUtils.getRoleDisplayName(newRole)}`
        });
        
        // Force page reload to ensure UI updates with new role permissions
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Erro ao Alterar Papel",
          description: "Não foi possível alterar para este papel. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSwitching(false);
      setIsOpen(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showBadge && (
          <Badge 
            variant="secondary" 
            className={`${getRoleColor(currentRole)} text-xs font-medium`}
          >
            {roleUtils.getRoleIcon(currentRole)} {roleUtils.getRoleDisplayName(currentRole)}
          </Badge>
        )}
        
        {roles.length > 1 && (
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                disabled={loading || switching}
                data-testid="role-switcher-compact"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Alterar Papel</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  disabled={switching}
                  className="flex items-center gap-2 cursor-pointer"
                  data-testid={`role-option-${role}`}
                >
                  {getRoleIcon(role)}
                  <span className="flex-1">{roleUtils.getRoleDisplayName(role)}</span>
                  {role === currentRole && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Role Display */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {getRoleIcon(currentRole)}
          <span className="font-medium text-gray-900">
            {roleUtils.getRoleDisplayName(currentRole)}
          </span>
        </div>
        
        {showBadge && (
          <Badge 
            variant="secondary" 
            className={`${getRoleColor(currentRole)} font-medium`}
          >
            Ativo
          </Badge>
        )}
      </div>

      {/* Role Switcher */}
      {roles.length > 1 && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              disabled={loading || switching}
              data-testid="role-switcher-full"
            >
              <span className="flex items-center gap-2">
                {getRoleIcon(currentRole)}
                {roleUtils.getRoleDisplayName(currentRole)}
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full min-w-[200px]">
            <DropdownMenuLabel>Papéis Disponíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role)}
                disabled={switching}
                className="flex items-center gap-3 cursor-pointer py-3"
                data-testid={`role-option-${role}`}
              >
                <div className="flex items-center gap-2 flex-1">
                  {getRoleIcon(role)}
                  <div>
                    <div className="font-medium">
                      {roleUtils.getRoleDisplayName(role)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRoleDescription(role)}
                    </div>
                  </div>
                </div>
                {role === currentRole && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {(switching || loading) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {switching ? 'A alterar papel...' : 'A carregar papéis...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Role Information */}
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Sobre este papel:</div>
        <div>{getRoleDescription(currentRole)}</div>
      </div>
    </div>
  );
}

function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'client':
      return 'Procurar e reservar viagens e alojamentos';
    case 'driver':
      return 'Oferecer viagens e gerir reservas de passageiros';
    case 'hotel_manager':
      return 'Gerir alojamentos e parcerias com motoristas';
    case 'admin':
      return 'Administrar plataforma e gerir utilizadores';
    default:
      return 'Acesso básico à plataforma';
  }
}

export default RoleSwitcher;