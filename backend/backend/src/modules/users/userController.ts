import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../../../storage";
// import { insertUserSchema } from "../../shared/storage";
import { verifyFirebaseToken, type AuthenticatedRequest } from "../../../src/shared/firebaseAuth";
import { z } from "zod";

const router = Router();

// GET /api/users/profile - Obter perfil do usuário autenticado
router.get("/profile", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    const userEmail = authReq.user?.claims?.email;
    
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    // Verificar se usuário existe na base de dados
    let user = await storage.auth.getUser(userId);
    
    if (!user) {
      // Criar usuário automaticamente se não existir
      user = await storage.auth.upsertUser({
        id: userId,
        email: userEmail || null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        userType: 'user'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao buscar perfil do usuário",
      error: "Internal server error" 
    });
  }
});

// PUT /api/users/profile - Atualizar perfil do usuário
router.put("/profile", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const {
      firstName,
      lastName,
      phone,
      fullName,
      dateOfBirth,
      documentNumber,
      identityDocumentType
    } = req.body;

    const updateData: any = {
      id: userId,
      updatedAt: new Date()
    };

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (fullName) updateData.fullName = fullName;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (documentNumber) updateData.documentNumber = documentNumber;
    if (identityDocumentType) updateData.identityDocumentType = identityDocumentType;

    const updatedUser = await storage.auth.upsertUser(updateData);

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao atualizar perfil do usuário",
      error: "Internal server error" 
    });
  }
});

// PUT /api/users/roles - Alterar papéis do usuário
router.put("/roles", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ 
        success: false,
        message: "Roles deve ser um array válido" 
      });
    }

    // Validar roles permitidos
    const allowedRoles = ['user', 'driver', 'host', 'event_organizer'];
    const invalidRoles = roles.filter(role => !allowedRoles.includes(role));
    
    if (invalidRoles.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Roles inválidos: ${invalidRoles.join(', ')}` 
      });
    }

    const updatedUser = await storage.auth.updateUserRoles(userId, roles);

    res.json({
      success: true,
      message: "Papéis atualizados com sucesso",
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error("Erro ao atualizar papéis:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao atualizar papéis",
      error: "Internal server error" 
    });
  }
});

// GET /api/users/:id - Obter perfil público de usuário
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await storage.auth.getUser(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    // Retornar apenas informações públicas
    const publicUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      profileImageUrl: user.profileImageUrl,
      rating: user.rating,
      totalReviews: user.totalReviews,
      isVerified: user.isVerified,
      verificationBadge: user.verificationBadge,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      data: { user: publicUser }
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// GET /api/users - Pesquisar usuários (público)
router.get("/", async (req, res) => {
  try {
    const { 
      search, 
      userType, 
      verified,
      page = 1, 
      limit = 20 
    } = req.query;

    let users = [];

    if (search) {
      users = await storage.auth.searchUsers(search as string);
    } else if (userType) {
      users = await storage.auth.getUsersByType(userType as string);
    } else {
      // Limitar busca geral para evitar sobrecarga
      users = await storage.auth.getUsersByType('driver'); // Default para motoristas
    }

    // Filtros adicionais
    if (verified !== undefined) {
      users = users.filter(user => user.isVerified === (verified === 'true'));
    }

    // Retornar apenas informações públicas
    const publicUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      profileImageUrl: user.profileImageUrl,
      rating: user.rating,
      totalReviews: user.totalReviews,
      isVerified: user.isVerified,
      verificationBadge: user.verificationBadge,
      createdAt: user.createdAt
    }));

    // Aplicar paginação
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedUsers = publicUsers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        total: publicUsers.length,
        page: Number(page),
        totalPages: Math.ceil(publicUsers.length / Number(limit))
      }
    });
  } catch (error) {
    console.error("Erro ao pesquisar usuários:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// POST /api/users/verification - Solicitar verificação de usuário
router.post("/verification", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const {
      identityDocumentUrl,
      profilePhotoUrl,
      identityDocumentType,
      documentNumber,
      fullName
    } = req.body;

    // Validar campos obrigatórios para verificação
    if (!identityDocumentUrl || !profilePhotoUrl) {
      return res.status(400).json({
        success: false,
        message: "Documento de identidade e foto de perfil são obrigatórios"
      });
    }

    const updateData = {
      id: userId,
      identityDocumentUrl,
      profilePhotoUrl,
      identityDocumentType,
      documentNumber,
      fullName,
      verificationStatus: 'in_review' as const,
      updatedAt: new Date()
    };

    const updatedUser = await storage.auth.upsertUser(updateData);

    res.json({
      success: true,
      message: "Solicitação de verificação enviada com sucesso",
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error("Erro ao solicitar verificação:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// GET /api/users/dashboard/stats - Estatísticas do dashboard do usuário
router.get("/dashboard/stats", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ message: "Token inválido" });
    }

    const user = await storage.auth.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    // Buscar estatísticas básicas
    const userBookings = await storage.booking.getUserBookings(userId);
    const providerBookings = await storage.booking.getProviderBookings(userId);

    const stats = {
      profile: {
        completeness: calculateProfileCompleteness(user),
        verification: user.verificationStatus || 'pending',
        rating: user.rating || '0.00',
        totalReviews: user.totalReviews || 0
      },
      bookings: {
        asCustomer: userBookings.length,
        asProvider: providerBookings.length,
        totalCompleted: [
          ...userBookings.filter(b => b.status === 'completed'),
          ...providerBookings.filter(b => b.status === 'completed')
        ].length
      },
      activity: {
        lastBooking: userBookings[0]?.createdAt || null,
        joinedDate: user.createdAt
      }
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// Função auxiliar para calcular completeness do perfil
function calculateProfileCompleteness(user: any): number {
  const fields = [
    user.firstName,
    user.lastName,
    user.phone,
    user.profileImageUrl,
    user.dateOfBirth,
    user.fullName
  ];
  
  const completedFields = fields.filter(field => field && field.trim() !== '').length;
  return Math.round((completedFields / fields.length) * 100);
}

export default router;