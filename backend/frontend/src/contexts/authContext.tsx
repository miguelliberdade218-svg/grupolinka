import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: 'driver' | 'passenger' | 'hotel' | 'organizer' | 'admin';
  verified: boolean;
  avatar?: string;
  rating?: number;
  documentStatus?: 'verified' | 'pending' | 'expired';
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

    // Recuperar sessão ao montar
  useEffect(() => {
    // Tentar primeiro pelo auth_token padrão
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    // Fallback: tentar pelo Firebase Token
    const firebaseToken = localStorage.getItem('firebaseToken');
    const userData = localStorage.getItem('user');
    
    if (firebaseToken && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const authUser: User = {
          id: parsedUser.id || parsedUser.uid || '',
          name: parsedUser.name || parsedUser.displayName || 'Motorista',
          email: parsedUser.email || '',
          userType: 'driver',
          verified: false,
        };
        setToken(firebaseToken);
        setUser(authUser);
        
        // Salvar também no formato auth_token para consistência
        localStorage.setItem('auth_token', firebaseToken);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      } catch (error) {
        console.error('Failed to restore Firebase session:', error);
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Fazer chamada para API real
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login falhou');
      }

      const data = await response.json();
      
      setToken(data.token);
      setUser(data.user);
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Cadastro falhou');
      }

      const responseData = await response.json();
      
      setToken(responseData.token);
      setUser(responseData.user);
      
      localStorage.setItem('auth_token', responseData.token);
      localStorage.setItem('auth_user', JSON.stringify(responseData.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar perfil');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
