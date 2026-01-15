import { apiRequest } from '../../shared/lib/queryClient';

export interface HealthStatus {
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  timestamp: string;
  responseTime: string;
  api: {
    version: string;
    environment: string;
  };
}

export interface DetailedHealthStatus extends HealthStatus {
  checks: {
    database: boolean;
    memory: boolean;
    disk: boolean;
  };
  system: {
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    nodeVersion: string;
    platform: string;
  };
}

// API Client para monitoramento de saúde
export const sharedHealthApi = {
  // Health check básico
  basic: async (): Promise<HealthStatus> => {
    console.log('🩺 [HEALTH API] Health check básico');
    
    const response = await apiRequest('GET', '/api/health');
    return response.json();
  },

  // Health check detalhado
  detailed: async (): Promise<DetailedHealthStatus> => {
    console.log('🩺 [HEALTH API] Health check detalhado');
    
    const response = await apiRequest('GET', '/api/health/detailed');
    return response.json();
  },

  // Verificar conectividade da base de dados
  database: async (): Promise<{ success: boolean; connected: boolean; responseTime: number }> => {
    console.log('🗄️ [HEALTH API] Verificando base de dados');
    
    const response = await apiRequest('GET', '/api/health/database');
    return response.json();
  }
};

export default sharedHealthApi;