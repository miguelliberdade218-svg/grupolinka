
import { Router } from 'express';
import { verifyFirebaseToken, requireProviderRole } from '../../middleware/role-auth';
import { AuthenticatedUser } from '../../shared/types';

const router = Router();

// Aplicar middleware de autenticação
router.use(verifyFirebaseToken);
router.use(requireProviderRole);

// Definir interface para ActivityItem
interface ActivityItem {
  type: string;
  description: string;
  time: string;
  amount: number;
}

// Definir interface para DashboardData
interface DashboardData {
  user: {
    id: string;
    roles: string[];
  };
  stats: {
    totalRides?: number;
    completedRides?: number;
    pendingRides?: number;
    rating?: number;
    earnings?: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
    totalBookings?: number;
    activeBookings?: number;
    occupancyRate?: number;
    averageRating?: number;
    revenue?: {
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  };
  recentActivity: ActivityItem[];
}

// GET /api/provider/dashboard - Dados do dashboard do prestador
router.get('/', async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid;
    const userRoles = (req.user as AuthenticatedUser)?.roles || [];
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // ✅ CORREÇÃO: Definir tipo explicitamente para dashboardData
    const dashboardData: DashboardData = {
      user: {
        id: userId,
        roles: userRoles
      },
      stats: {},
      recentActivity: [] as ActivityItem[] // ✅ CORREÇÃO: Tipo explícito
    };
    
    // Estatísticas específicas por role
    if (userRoles.includes('driver')) {
      dashboardData.stats = {
        ...dashboardData.stats,
        totalRides: 85,
        completedRides: 78,
        pendingRides: 7,
        rating: 4.8,
        earnings: {
          today: 2500,
          thisWeek: 15000,
          thisMonth: 45000
        }
      };
      
      // ✅ CORREÇÃO: Agora o TypeScript conhece o tipo de recentActivity
      dashboardData.recentActivity.push({
        type: 'ride_completed',
        description: 'Viagem Maputo → Matola concluída',
        time: '2025-01-15 10:30',
        amount: 350
      });
    }
    
    if (userRoles.includes('hotel_manager')) {
      dashboardData.stats = {
        ...dashboardData.stats,
        totalBookings: 45,
        activeBookings: 12,
        occupancyRate: 78,
        averageRating: 4.6,
        revenue: {
          today: 8500,
          thisWeek: 45000,
          thisMonth: 180000
        }
      };
      
      // ✅ CORREÇÃO: Agora o TypeScript conhece o tipo de recentActivity
      dashboardData.recentActivity.push({
        type: 'booking_received',
        description: 'Nova reserva para 20-25 Janeiro',
        time: '2025-01-15 14:20',
        amount: 4500
      });
    }
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/provider/analytics - Análises detalhadas
router.get('/analytics', async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid;
    const { period = '30d' } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Mock data
    const analytics = {
      period,
      earnings: [
        { date: '2025-01-01', amount: 1500 },
        { date: '2025-01-02', amount: 2300 },
        { date: '2025-01-03', amount: 1800 }
      ],
      performance: {
        completionRate: 95,
        cancelationRate: 5,
        averageRating: 4.7,
        responseTime: '3 min'
      }
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;