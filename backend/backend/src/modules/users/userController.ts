import { Router, Request, Response, NextFunction } from "express";
import { verifyFirebaseToken, type AuthenticatedRequest } from "../../../src/shared/firebaseAuth";
import { z } from "zod";
import { authService } from "../auth/services/authService.js";
import { authStorage } from "../../shared/authStorage.js";
import { storage } from "../../../storage"; // Mantido para bookings
import type { User } from "../../../shared/schema.js";

const router = Router();

// GET /api/users/profile - Obter perfil do usuário autenticado
router.get("/profile", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    const userEmail = authReq.user?.claims?.email;
    const displayName = authReq.user?.displayName;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Token inválido" });
    }

    // Verificar se usuário existe na base de dados usando authService
    let user = await authService.getUserById(userId);
    
    if (!user) {
      // Criar usuário automaticamente se não existir
      if (!userEmail) {
        return res.status(400).json({ 
          success: false,
          message: "Email é necessário para criar usuário" 
        });
      }

      // ✅ CORRIGIDO: phone como undefined em vez de null
      user = await authService.createClient({
        email: userEmail,
        firstName: displayName?.split(' ')[0] || '',
        lastName: displayName?.split(' ').slice(1).join(' ') || '',
        phone: undefined, // ✅ undefined em vez de null
        accountType: 'individual'
      });
    }

    res.json({
      success: true,
      data: { 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          
          // ✅ CAPACIDADES DO NOVO SISTEMA
          canBookServices: user.canBookServices,
          canDrive: user.canDrive,
          canManageHotels: user.canManageHotels,
          isAdmin: user.isAdmin,
          
          driverVerificationStatus: user.driverVerificationStatus,
          hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
          accountType: user.accountType || 'individual',
          companyName: user.companyName,
          
          // ✅ CAMPOS DO SISTEMA ANTIGO (para compatibilidade)
          roles: user.roles || [],
          isVerified: user.isVerified || false,
          profileImageUrl: user.profileImageUrl,
          registrationCompleted: user.registrationCompleted || false,
          userType: user.userType || 'client',
          
          // ✅ OUTROS CAMPOS
          rating: user.rating,
          totalReviews: user.totalReviews,
          verificationStatus: user.verificationStatus,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao buscar perfil do usuário"
    });
  }
});

// PUT /api/users/profile - Atualizar perfil do usuário
router.put("/profile", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Token inválido" });
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

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    // ✅ CORRIGIDO: phone pode ser string ou undefined
    if (phone !== undefined) updateData.phone = phone;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (documentNumber !== undefined) updateData.documentNumber = documentNumber;
    if (identityDocumentType !== undefined) updateData.identityDocumentType = identityDocumentType;

    // Usar authStorage para compatibilidade com upsert
    const updatedUser = await authStorage.upsertUser(updateData);

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: { 
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          fullName: updatedUser.fullName
        }
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro ao atualizar perfil do usuário"
    });
  }
});

// PUT /api/users/roles - Converter papéis antigos para capacidades
router.put("/roles", verifyFirebaseToken, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  
  try {
    const userId = authReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Token inválido" });
    }

    const { roles } = req.body;

    if (!roles || !Array.isArray(roles)) {
      return res.status(400).json({ 
        success: false,
        message: "Roles deve ser um array válido" 
      });
    }

    // ✅ CONVERTER ROLES ANTIGAS PARA CAPACIDADES
    const updateData: any = {
      id: userId,
      updatedAt: new Date()
    };

    // Mapear roles antigas para capacidades
    if (roles.includes('driver')) {
      updateData.canDrive = true;
      updateData.driverVerificationStatus = 'pending';
    }
    
    if (roles.includes('host') || roles.includes('hotel_manager')) {
      updateData.canManageHotels = true;
      updateData.hotelManagerVerificationStatus = 'pending';
    }
    
    if (roles.includes('admin')) {
      updateData.isAdmin = true;
    }

    const updatedUser = await authStorage.upsertUser(updateData);

    res.json({
      success: true,
      message: "Papéis convertidos para capacidades com sucesso",
      data: { 
        user: {
          id: updatedUser.id,
          canBookServices: updatedUser.canBookServices,
          canDrive: updatedUser.canDrive,
          canManageHotels: updatedUser.canManageHotels,
          isAdmin: updatedUser.isAdmin,
          driverVerificationStatus: updatedUser.driverVerificationStatus,
          hotelManagerVerificationStatus: updatedUser.hotelManagerVerificationStatus
        }
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar papéis:", error);
    res.status(500).json({ 
      success: false,
      message: "Erro interno do servidor"
    });
  }
});

// GET /api/users/:id - Obter perfil público de usuário
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await authService.getUserById(id);

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
      createdAt: user.createdAt,
      
      // Informações públicas de capacidades
      canDrive: user.canDrive,
      canManageHotels: user.canManageHotels,
      driverVerificationStatus: user.driverVerificationStatus === 'verified' ? 'verified' : null,
      hotelManagerVerificationStatus: user.hotelManagerVerificationStatus === 'verified' ? 'verified' : null
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

    // ✅ Tipagem explícita para users
    let users: User[] = [];

    // ✅ USAR authService para buscar usuários
    if (search) {
      // TODO: Implementar search no authService se necessário
      users = [];
    } else if (userType) {
      // Mapear userType antigo para capacidades
      if (userType === 'driver') {
        users = await authService.getUsersByCapacity('drive');
      } else if (userType === 'host') {
        users = await authService.getUsersByCapacity('hotel_manager');
      } else {
        users = [];
      }
    } else {
      // Buscar motoristas por padrão
      users = await authService.getUsersByCapacity('drive');
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
      createdAt: user.createdAt,
      
      // Informações públicas de capacidades
      canDrive: user.canDrive,
      canManageHotels: user.canManageHotels,
      driverVerificationStatus: user.driverVerificationStatus === 'verified' ? 'verified' : null,
      hotelManagerVerificationStatus: user.hotelManagerVerificationStatus === 'verified' ? 'verified' : null
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
      return res.status(401).json({ success: false, message: "Token inválido" });
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

    const updateData: any = {
      id: userId,
      identityDocumentUrl: identityDocumentUrl || null,
      profilePhotoUrl: profilePhotoUrl || null,
      identityDocumentType: identityDocumentType || null,
      documentNumber: documentNumber || null,
      fullName: fullName || null,
      verificationStatus: 'in_review',
      updatedAt: new Date()
    };

    const updatedUser = await authStorage.upsertUser(updateData);

    res.json({
      success: true,
      message: "Solicitação de verificação enviada com sucesso",
      data: { 
        user: {
          id: updatedUser.id,
          verificationStatus: updatedUser.verificationStatus
        }
      }
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
      return res.status(401).json({ success: false, message: "Token inválido" });
    }

    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado"
      });
    }

    // Buscar estatísticas básicas (mantendo storage para bookings)
    const userBookings = await storage.booking.getUserBookings(userId);
    const providerBookings = await storage.booking.getProviderBookings(userId);

    const stats = {
      profile: {
        completeness: calculateProfileCompleteness(user),
        verification: user.verificationStatus || 'pending',
        rating: user.rating || '0.00',
        totalReviews: user.totalReviews || 0,
        
        // ✅ Status de capacidades
        driverStatus: user.driverVerificationStatus,
        hotelManagerStatus: user.hotelManagerVerificationStatus
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
    user.fullName,
    // ✅ ADICIONAR CAMPOS DE CAPACIDADES SE APLICÁVEL
    user.canBookServices !== undefined ? 'capacidade_cliente' : null,
    user.canDrive !== undefined ? 'capacidade_motorista' : null,
    user.canManageHotels !== undefined ? 'capacidade_gestor' : null
  ];
  
  const completedFields = fields.filter((field): field is string => 
    field !== null && field !== undefined && field.trim() !== ''
  ).length;
  
  return Math.round((completedFields / fields.length) * 100);
}

export default router;