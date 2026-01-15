import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export type UserRole = 'client' | 'driver' | 'hotel_manager' | 'admin';

interface UserRolesData {
  roles: UserRole[];
  currentRole: UserRole;
  preferences: Record<string, any>;
  permissions: Record<string, boolean>;
}

interface UseUserRolesReturn {
  roles: UserRole[];
  currentRole: UserRole;
  hasRole: (role: UserRole) => boolean;
  switchRole: (role: UserRole) => Promise<boolean>;
  canAccessFeature: (feature: string) => boolean;
  loading: boolean;
  error: string | null;
}

// Role permissions mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  client: ['booking.create', 'booking.view', 'rating.create', 'chat.participate'],
  driver: ['ride.create', 'ride.manage', 'booking.accept', 'driver.stats', 'partnership.access'],
  hotel_manager: ['accommodation.create', 'accommodation.manage', 'booking.manage', 'partnership.create'],
  admin: ['user.manage', 'system.config', 'admin.panel', 'reports.view', 'penalties.manage']
};

// Feature requirements mapping
const FEATURE_REQUIREMENTS: Record<string, UserRole[]> = {
  'offer-ride': ['driver'],
  'create-accommodation': ['hotel_manager'],
  'admin-panel': ['admin'],
  'driver-dashboard': ['driver'],
  'manager-dashboard': ['hotel_manager'],
  'partnership-management': ['hotel_manager', 'admin'],
  'user-management': ['admin'],
  'penalty-system': ['admin'],
  'driver-stats': ['driver'],
  'ride-management': ['driver'],
  'accommodation-management': ['hotel_manager']
};

export const useUserRoles = (): UseUserRolesReturn => {
  const { firebaseUser, user, isAuthenticated } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRolesData>({
    roles: ['client'], // Default role for all users
    currentRole: 'client',
    preferences: {},
    permissions: {}
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user roles from backend/Firebase custom claims
  useEffect(() => {
    if (!isAuthenticated || !firebaseUser) {
      setUserRoles({
        roles: ['client'],
        currentRole: 'client',
        preferences: {},
        permissions: {}
      });
      return;
    }

    const loadUserRoles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get user's custom claims from Firebase token
        const token = await firebaseUser.getIdTokenResult();
        const customClaims = token.claims;

        // Extract roles from custom claims or default to client
        const roles: UserRole[] = (customClaims.roles as UserRole[]) || ['client'];
        
        // Get current role from localStorage or default to first role
        const storedCurrentRole = localStorage.getItem(`currentRole_${firebaseUser.uid}`);
        const currentRole: UserRole = (storedCurrentRole && roles.includes(storedCurrentRole as UserRole))
          ? storedCurrentRole as UserRole
          : roles[0];

        // Calculate permissions based on current role
        const permissions: Record<string, boolean> = {};
        const rolePermissions = ROLE_PERMISSIONS[currentRole] || [];
        rolePermissions.forEach(permission => {
          permissions[permission] = true;
        });

        setUserRoles({
          roles,
          currentRole,
          preferences: customClaims.preferences || {},
          permissions
        });

      } catch (err) {
        console.error('Error loading user roles:', err);
        setError('Failed to load user roles');
        // Default to client role on error
        setUserRoles({
          roles: ['client'],
          currentRole: 'client',
          preferences: {},
          permissions: {}
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserRoles();
  }, [firebaseUser, isAuthenticated]);

  const hasRole = (role: UserRole): boolean => {
    return userRoles.roles.includes(role);
  };

  const switchRole = async (role: UserRole): Promise<boolean> => {
    if (!hasRole(role)) {
      setError(`You don't have permission to switch to ${role} role`);
      return false;
    }

    if (role === userRoles.currentRole) {
      return true; // Already in that role
    }

    setLoading(true);
    setError(null);

    try {
      // Update current role in localStorage
      if (firebaseUser) {
        localStorage.setItem(`currentRole_${firebaseUser.uid}`, role);
      }

      // Calculate new permissions
      const permissions: Record<string, boolean> = {};
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach(permission => {
        permissions[permission] = true;
      });

      // Update state
      setUserRoles(prev => ({
        ...prev,
        currentRole: role,
        permissions
      }));

      // Optional: Send role switch event to backend for analytics
      try {
        /* Analytics endpoint não implementado ainda
        await fetch('/api/analytics/role-switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: firebaseUser?.uid,
            previousRole: userRoles.currentRole,
            newRole: role,
            timestamp: new Date().toISOString()
          })
        });
        */
      } catch (analyticsError) {
        // Don't fail the role switch if analytics fails
        console.warn('Failed to log role switch:', analyticsError);
      }

      return true;

    } catch (err) {
      console.error('Error switching role:', err);
      setError('Failed to switch role');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    // Check if user has any of the required roles for this feature
    const requiredRoles = FEATURE_REQUIREMENTS[feature];
    if (!requiredRoles) {
      return true; // No specific role requirement
    }

    return requiredRoles.some(requiredRole => hasRole(requiredRole));
  };

  return {
    roles: userRoles.roles,
    currentRole: userRoles.currentRole,
    hasRole,
    switchRole,
    canAccessFeature,
    loading,
    error
  };
};

// Helper functions for role checking in components
export const roleUtils = {
  isClient: (role: UserRole) => role === 'client',
  isDriver: (role: UserRole) => role === 'driver',
  isHotelManager: (role: UserRole) => role === 'hotel_manager',
  isAdmin: (role: UserRole) => role === 'admin',
  
  getRoleDisplayName: (role: UserRole): string => {
    switch (role) {
      case 'client': return 'Cliente';
      case 'driver': return 'Motorista';
      case 'hotel_manager': return 'Gestor de Alojamento';
      case 'admin': return 'Administrador';
      default: return 'Utilizador';
    }
  },
  
  getRoleIcon: (role: UserRole): string => {
    switch (role) {
      case 'client': return '👤';
      case 'driver': return '🚗';
      case 'hotel_manager': return '🏨';
      case 'admin': return '👨‍💼';
      default: return '👤';
    }
  }
};

export default useUserRoles;