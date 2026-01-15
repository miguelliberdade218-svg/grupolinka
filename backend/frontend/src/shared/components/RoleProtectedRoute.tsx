import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUserRoles, type UserRole } from '../hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { 
  Shield, 
  Lock, 
  AlertTriangle,
  ArrowLeft 
} from 'lucide-react';
import RoleSwitcher from './RoleSwitcher';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles: UserRole[];
  fallbackComponent?: ReactNode;
  allowRoleSwitching?: boolean;
  feature?: string;
  strict?: boolean; // If true, requires exact role match, not just having the role
}

export function RoleProtectedRoute({
  children,
  requiredRoles,
  fallbackComponent,
  allowRoleSwitching = true,
  feature,
  strict = false
}: RoleProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { roles, currentRole, hasRole, canAccessFeature, loading: rolesLoading } = useUserRoles();

  // Show loading state
  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600">A verificar permissões...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Acesso Restrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Esta página requer autenticação. Faça login para continuar.
          </p>
          <Button onClick={() => window.location.href = '/login'} className="w-full">
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check feature-specific access if specified
  if (feature && !canAccessFeature(feature)) {
    return (
      <AccessDeniedComponent 
        reason="feature"
        feature={feature}
        currentRole={currentRole}
        userRoles={roles}
        requiredRoles={requiredRoles}
        allowRoleSwitching={allowRoleSwitching}
        fallbackComponent={fallbackComponent}
      />
    );
  }

  // Check role-based access
  const hasRequiredRole = requiredRoles.some(role => hasRole(role));
  const hasCorrectCurrentRole = strict ? requiredRoles.includes(currentRole) : hasRequiredRole;

  if (!hasCorrectCurrentRole) {
    return (
      <AccessDeniedComponent
        reason="role"
        currentRole={currentRole}
        userRoles={roles}
        requiredRoles={requiredRoles}
        allowRoleSwitching={allowRoleSwitching}
        fallbackComponent={fallbackComponent}
      />
    );
  }

  // Access granted
  return <>{children}</>;
}

interface AccessDeniedComponentProps {
  reason: 'role' | 'feature';
  feature?: string;
  currentRole: UserRole;
  userRoles: UserRole[];
  requiredRoles: UserRole[];
  allowRoleSwitching: boolean;
  fallbackComponent?: ReactNode;
}

function AccessDeniedComponent({
  reason,
  feature,
  currentRole,
  userRoles,
  requiredRoles,
  allowRoleSwitching,
  fallbackComponent
}: AccessDeniedComponentProps) {
  // Return custom fallback component if provided
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  const canSwitchToRequiredRole = allowRoleSwitching && 
    requiredRoles.some(role => userRoles.includes(role));

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {reason === 'feature' ? (
              <Lock className="w-8 h-8 text-red-600" />
            ) : (
              <Shield className="w-8 h-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl text-gray-900">
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            {reason === 'feature' ? (
              <p>
                Não tem permissão para aceder à funcionalidade <strong>{feature}</strong>.
              </p>
            ) : (
              <p>
                O seu papel atual <strong>({getRoleDisplayName(currentRole)})</strong> não 
                tem permissão para aceder a esta página.
              </p>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Papéis necessários:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  {requiredRoles.map(role => (
                    <li key={role} className="text-sm">
                      {getRoleDisplayName(role)}
                      {userRoles.includes(role) ? (
                        <span className="text-green-600 ml-2">(Você tem este papel)</span>
                      ) : (
                        <span className="text-red-600 ml-2">(Você não tem este papel)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Role Switching Options */}
          {canSwitchToRequiredRole && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Você pode alterar para um dos papéis necessários:
                </p>
                <RoleSwitcher variant="default" showBadge={false} />
              </div>
            </div>
          )}

          {/* No Available Roles */}
          {!canSwitchToRequiredRole && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não possui nenhum dos papéis necessários para aceder a esta funcionalidade. 
                Entre em contacto com o suporte se acredita que isto é um erro.
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'client': return 'Cliente';
    case 'driver': return 'Motorista';
    case 'hotel_manager': return 'Gestor de Alojamento';
    case 'admin': return 'Administrador';
    default: return 'Utilizador';
  }
}

export default RoleProtectedRoute;