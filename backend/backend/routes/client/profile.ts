import { Router } from 'express';
import { verifyFirebaseToken } from '../../src/shared/firebaseAuth';
import { requireClientRole } from '../../middleware/role-auth';
import { AuthenticatedUser } from '../../shared/types'; // ✅ Importação adicionada

const router = Router();

// Aplicar middleware de autenticação
router.use(verifyFirebaseToken);
router.use(requireClientRole);

// GET /api/client/profile - Obter perfil do cliente
router.get('/', async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    const email = (req.user as AuthenticatedUser)?.email;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Mock data - substituir por consulta real ao banco
    const profile = {
      id: userId,
      email,
      name: 'Cliente Exemplo',
      phone: '+258 84 123 4567',
      avatar: null,
      preferences: {
        language: 'pt',
        notifications: true,
        currency: 'MZN'
      },
      stats: {
        totalBookings: 12,
        completedTrips: 10,
        loyaltyPoints: 250
      }
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/client/profile - Atualizar perfil do cliente
router.put('/', async (req, res) => {
  try {
    const userId = (req.user as AuthenticatedUser)?.uid; // ✅ CORRIGIDO
    const { name, phone, preferences } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    // Mock - atualizar perfil
    const updatedProfile = {
      id: userId,
      name,
      phone,
      preferences,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedProfile);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;