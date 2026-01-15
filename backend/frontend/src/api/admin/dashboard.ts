import { apiRequest } from '../../shared/lib/queryClient';

export interface PlatformStats {
  totalUsers: number;
  totalRides: number;
  totalAccommodations: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersThisMonth: number;
  completedTrips: number;
  averageRating: number;
  platformGrowth: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_registration' | 'ride_created' | 'booking_made' | 'payment_completed';
  description: string;
  userId: string;
  userName: string;
  amount?: number;
  timestamp: string;
}

export interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  uptime: number;
  responseTime: number;
  errorRate: number;
}

// API Client para administradores
export const adminDashboardApi = {
  // Obter estatísticas da plataforma
  getStats: async (): Promise<{ success: boolean; stats: PlatformStats }> => {
    console.log('📊 [ADMIN API] Buscando estatísticas da plataforma');
    
    const response = await apiRequest('GET', '/api/admin/dashboard/stats');
    return response.json();
  },

  // Obter atividades recentes
  getRecentActivity: async (limit = 10): Promise<{ success: boolean; activities: RecentActivity[] }> => {
    console.log('🔍 [ADMIN API] Buscando atividades recentes');
    
    const response = await apiRequest('GET', `/api/admin/dashboard/recent-activity?limit=${limit}`);
    return response.json();
  },

  // Verificar saúde do sistema
  getSystemHealth: async (): Promise<{ success: boolean; health: SystemHealth }> => {
    console.log('🩺 [ADMIN API] Verificando saúde do sistema');
    
    const response = await apiRequest('GET', '/api/admin/dashboard/system-health');
    return response.json();
  },

  // Obter relatório completo
  getFullReport: async (): Promise<{ 
    success: boolean; 
    stats: PlatformStats; 
    activities: RecentActivity[]; 
    health: SystemHealth 
  }> => {
    console.log('📋 [ADMIN API] Buscando relatório completo');
    
    const response = await apiRequest('GET', '/api/admin/dashboard/full-report');
    return response.json();
  }
};

export default adminDashboardApi;