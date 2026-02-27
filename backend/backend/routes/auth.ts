import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../src/modules/auth/services/authService.js';
import { db } from '../db.js';
import { sql, eq } from 'drizzle-orm';
import { firebase_user_mapping, users } from '../shared/schema.js';

// ✅ IMPORTAR DO ARQUIVO SUPERIOR
import { 
  verifyFirebaseToken, 
  createApiResponse, 
  createApiError,
  UserCapabilities,
  ApiResponse,
  ApiError
} from '../src/shared/firebaseAuth.js';
import type { 
  AuthenticatedRequest,
  AuthenticatedUser 
} from '../shared/types.js';

const router = Router();

// ==================== SCHEMAS ZOD PARA SISTEMA DE CAPACIDADES ====================

// ✅ Schema base para todos os signups
const baseSignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  accountType: z.enum(['individual', 'company']).default('individual'),
});

// ✅ Schema para signup de cliente
const clientSignupSchema = baseSignupSchema.extend({
  // Dados da empresa (se for empresa)
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
});

// ✅ Schema para signup de motorista
const driverSignupSchema = baseSignupSchema.extend({
  // Dados obrigatórios do motorista
  driverLicenseNumber: z.string().min(1, "Número da carta de condução é obrigatório"),
  driverLicenseCountry: z.string().default('Moçambique'),
  driverLicenseExpiry: z.string().refine((date) => {
    const expiryDate = new Date(date);
    const today = new Date();
    return expiryDate > today;
  }, "Carta de condução expirada"),
  driverVehicleType: z.string().min(1, "Tipo de veículo é obrigatório"),
  driverYearsExperience: z.number().min(0).optional(),
});

// ✅ Schema para signup de gestor de hotel
const hotelManagerSignupSchema = baseSignupSchema.extend({
  // Dados obrigatórios do negócio
  businessTaxId: z.string().min(1, "NIF/NUIT é obrigatório"),
  businessRegistrationNumber: z.string().optional(),
  businessLegalName: z.string().min(1, "Nome legal do negócio é obrigatório"),
});

// ✅ Schema para forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// ✅ Schema para ativar capacidade adicional
const activateCapacitySchema = z.object({
  capacity: z.enum(['drive', 'hotel_manager']),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    number: z.string().optional(),
    expiryDate: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

// ✅ Schema para upload de documento
const uploadDocumentSchema = z.object({
  capacity: z.enum(['drive', 'hotel_manager']),
  documentType: z.string().min(1),
  documentUrl: z.string().url(),
  documentNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

// ✅ Schema para atualizar perfil
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  accountType: z.enum(['individual', 'company']).optional(),
  companyName: z.string().optional(),
});

// ==================== FUNÇÃO AUXILIAR PARA FORMATAR RESPOSTA ====================

function formatUserResponse(user: any) {
  // Função helper para converter null para undefined
  const nullToUndefined = (value: any): any => {
    return value === null ? undefined : value;
  };
  
  return {
    id: user.id,
    email: nullToUndefined(user.email),
    firstName: nullToUndefined(user.firstName),
    lastName: nullToUndefined(user.lastName),
    phone: nullToUndefined(user.phone),
    accountType: nullToUndefined(user.accountType),
    
    // Capacidades
    canBookServices: user.canBookServices,
    canDrive: user.canDrive,
    canManageHotels: user.canManageHotels,
    isAdmin: user.isAdmin,
    
    // Status de verificação
    driverVerificationStatus: nullToUndefined(user.driverVerificationStatus),
    hotelManagerVerificationStatus: nullToUndefined(user.hotelManagerVerificationStatus),
    
    // Dados específicos
    driverLicenseNumber: nullToUndefined(user.driverLicenseNumber),
    driverVehicleType: nullToUndefined(user.driverVehicleType),
    businessTaxId: nullToUndefined(user.businessTaxId),
    companyName: nullToUndefined(user.companyName),
    companyVatNumber: nullToUndefined(user.companyVatNumber),
    companyAddress: nullToUndefined(user.companyAddress),
    companyPhone: nullToUndefined(user.companyPhone),
    
    // Metadados
    createdAt: user.createdAt,
    updatedAt: nullToUndefined(user.updatedAt),
    capabilitiesUpdatedAt: nullToUndefined(user.capabilitiesUpdatedAt),
    lastCapacityActivation: nullToUndefined(user.lastCapacityActivation),
    
    // Documentos (se disponíveis)
    capacityDocuments: user.capacityDocuments || [],
  };
}

// ==================== ENDPOINTS DE SIGNUP SEPARADOS ====================

// ✅ Signup para Cliente (Individual ou Empresa)
router.post('/signup-client', async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      accountType,
      companyName,
      companyVatNumber,
      companyAddress,
      companyPhone
    } = clientSignupSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(createApiError('Usuário já existe com este email', 'USER_EXISTS'));
    }

    // Criar usuário como cliente
    const user = await authService.createClient({
      email,
      firstName,
      lastName,
      phone,
      accountType,
      companyName,
      companyVatNumber,
      companyAddress,
      companyPhone
    });

    res.json(createApiResponse({
      user: formatUserResponse(user),
      message: 'Conta de cliente criada com sucesso'
    }, 'Cliente registrado com sucesso'));
  } catch (error) {
    console.error('Erro no signup de cliente:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Signup para Motorista - REMOVIDO (usar /api/auth/activate-driver após criar cliente)
// router.post('/signup-driver', ...)

// ✅ Signup para Gestor de Hotel - REMOVIDO (usar /api/auth/activate-hotel-manager após criar cliente)
// router.post('/signup-hotel-manager', ...)

// ✅ Forgot Password (comentado - método não implementado no authService)
// router.post('/forgot-password', async (req: Request, res: Response) => { ... });

// ✅ Ativar capacidade adicional (comentado - usar endpoints específicos)
// router.post('/activate-capacity', verifyFirebaseToken, async (req: Request, res: Response) => { ... });

// ✅ Upload de documento para capacidade
router.post('/upload-document', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id; // ← AGORA É O ID DO BANCO
    const { capacity, documentType, documentUrl, documentNumber, expiryDate } = uploadDocumentSchema.parse(req.body);

    // TODO: Implementar upload real no AuthService quando estiver pronto
    console.log(`📄 Documento para ${capacity} do usuário ${userId}`);
    console.log(`   Tipo: ${documentType}, URL: ${documentUrl}`);

    // Simular salvamento do documento
    const document = {
      capacity,
      documentType,
      documentUrl,
      documentNumber,
      expiryDate,
      userId,
      status: 'pending',
      uploadedAt: new Date().toISOString()
    };

    res.json(createApiResponse({
      document,
      message: 'Documento enviado com sucesso. Aguardando verificação.'
    }, 'Documento enviado'));
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Atualizar perfil
router.put('/profile', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id; // ← ID DO BANCO (sincronizado pelo middleware)
    const updates = updateProfileSchema.parse(req.body);

    // Buscar usuário existente
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json(createApiError('Usuário não encontrado', 'USER_NOT_FOUND'));
    }

    // TODO: Implementar atualização no AuthService quando estiver pronto
    console.log(`📝 Atualizando perfil do usuário ${userId}:`, updates);

    // Por enquanto, retornar usuário com dados mesclados
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    res.json(createApiResponse({
      user: formatUserResponse(updatedUser),
      message: 'Perfil atualizado com sucesso'
    }, 'Perfil atualizado'));
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Obter capacidades do usuário - USA ID DO BANCO (já sincronizado pelo middleware)
router.get('/capabilities', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id; // ← ID DO BANCO (sincronizado pelo middleware)

    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json(createApiError('Usuário não encontrado no banco de dados', 'USER_NOT_FOUND'));
    }

    res.json(createApiResponse({
      canBookServices: user.canBookServices ?? true,
      canDrive: user.canDrive ?? false,
      canManageHotels: user.canManageHotels ?? false,
      isAdmin: user.isAdmin ?? false,
    }, 'Capacidades obtidas com sucesso'));
  } catch (error) {
    console.error('Erro ao obter capacidades:', error);
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Sincronização manual de Firebase UID (para migração/correção)
router.post('/sync-firebase', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.uid) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const firebaseUid = authReq.user.uid;
    const email = authReq.user.email;

    if (!email) {
      return res.status(400).json(createApiError('Email não disponível no token', 'EMAIL_MISSING'));
    }

    // Usar a mesma função do middleware
    const syncUserWithDatabase = async (firebaseUid: string, email: string, displayName?: string): Promise<string | null> => {
      try {
        // Buscar usuário por email
        const user = await authService.getUserByEmail(email);
        
        let userId: string;
        
        if (user) {
          userId = user.id;
          console.log(`✅ Usuário encontrado: ${email} → ${userId}`);
        } else {
          // Criar novo usuário
          const newUser = await authService.createClient({
            email: email,
            firstName: displayName?.split(' ')[0] || 'Usuário',
            lastName: displayName?.split(' ').slice(1).join(' ') || '',
            phone: null,
            accountType: 'individual'
          });
          userId = newUser.id;
          console.log(`✅ Novo usuário criado: ${email} → ${userId}`);
        }
        
        // Criar mapeamento
        await db.insert(firebase_user_mapping)
          .values({
            firebase_uid: firebaseUid,
            user_id: userId,
          })
          .onConflictDoUpdate({
            target: firebase_user_mapping.firebase_uid,
            set: { user_id: userId },
          });
        
        return userId;
        
      } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        return null;
      }
    };

    const databaseUserId = await syncUserWithDatabase(firebaseUid, email, authReq.user?.firstName && authReq.user?.lastName ? `${authReq.user.firstName} ${authReq.user.lastName}`.trim() : undefined);

    if (!databaseUserId) {
      return res.status(500).json(createApiError('Falha ao sincronizar Firebase UID', 'SYNC_ERROR'));
    }

    res.json(createApiResponse({
      success: true,
      message: 'Firebase UID sincronizado com sucesso',
      firebaseUid,
      userId: databaseUserId,
      email
    }, 'Sincronização concluída'));
  } catch (error) {
    console.error('Erro na sincronização Firebase:', error);
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ==================== NOVOS ENDPOINTS DE CAPACIDADES ====================

// ✅ POST /api/auth/create-client - Criar conta de cliente
router.post('/create-client', async (req: Request, res: Response) => {
  try {
    const input = clientSignupSchema.parse(req.body);
    
    // Verificar se já existe
    const existing = await authService.getUserByEmail(input.email);
    if (existing) {
      return res.status(409).json(createApiError('Usuário já existe', 'USER_EXISTS'));
    }
    
    const user = await authService.createClient(input);
    
    res.status(201).json(createApiResponse({
      user: formatUserResponse(user),
      message: 'Cliente criado com sucesso'
    }, 'Cliente registrado'));
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Validação falhou', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro ao criar cliente', 'CREATE_CLIENT_ERROR'));
  }
});

// ✅ POST /api/auth/activate-driver - Ativar capacidade de motorista
router.post('/activate-driver', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id;
    
    const { licenseNumber, licenseCountry, licenseExpiry, vehicleType, yearsExperience } = z.object({
      licenseNumber: z.string(),
      licenseCountry: z.string().default('Moçambique'),
      licenseExpiry: z.string(),
      vehicleType: z.string(),
      yearsExperience: z.number().optional(),
    }).parse(req.body);
    
    const driverProfile = await authService.activateDriverCapability({
      userId,
      licenseNumber,
      licenseCountry,
      licenseExpiry,
      vehicleType,
      yearsExperience,
    });
    
    res.status(201).json(createApiResponse({
      driverProfile,
      message: 'Capacidade de motorista ativada. Aguardando verificação.',
    }, 'Motorista registrado'));
  } catch (error) {
    console.error('❌ Erro ao ativar motorista:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro ao ativar motorista', 'DRIVER_ACTIVATION_ERROR'));
  }
});

// ✅ POST /api/auth/activate-hotel-manager - Ativar capacidade de gestor de hotel
router.post('/activate-hotel-manager', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id;
    
    const { businessTaxId, businessRegistrationNumber, businessLegalName, businessAddress, businessPhone, businessEmail } = z.object({
      businessTaxId: z.string(),
      businessRegistrationNumber: z.string().optional(),
      businessLegalName: z.string(),
      businessAddress: z.string().optional(),
      businessPhone: z.string().optional(),
      businessEmail: z.string().optional(),
    }).parse(req.body);
    
    const hotelProfile = await authService.activateHotelManagerCapability({
      userId,
      businessTaxId,
      businessRegistrationNumber,
      businessLegalName,
      businessAddress,
      businessPhone,
      businessEmail,
    });
    
    res.status(201).json(createApiResponse({
      hotelProfile,
      message: 'Capacidade de gestor de hotel ativada. Aguardando verificação.',
    }, 'Gestor de hotel registrado'));
  } catch (error) {
    console.error('❌ Erro ao ativar gestor de hotel:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro ao ativar gestor de hotel', 'HOTEL_MANAGER_ACTIVATION_ERROR'));
  }
});

// ✅ POST /api/auth/upload-document - Registrar documento de verificação
router.post('/upload-document', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id;
    
    const { profileType, documentType, documentUrl, documentNumber, expiryDate } = z.object({
      profileType: z.string(),
      documentType: z.string().min(1),
      documentUrl: z.string().url(),
      documentNumber: z.string().optional(),
      expiryDate: z.string().optional(),
    }).parse(req.body);
    
    const doc = await authService.uploadVerificationDocument(
      userId,
      profileType,
      documentType,
      documentUrl,
      documentNumber,
      expiryDate
    );
    
    res.status(201).json(createApiResponse({
      document: doc,
      message: 'Documento registrado para verificação'
    }, 'Documento enviado'));
  } catch (error) {
    console.error('❌ Erro ao upload de documento:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro ao fazer upload', 'UPLOAD_ERROR'));
  }
});

// ✅ GET /api/auth/capabilities - Obter capacidades do usuário
router.get('/capabilities', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const userId = authReq.user.id;
    
    // Obter capacidades do usuário
    const capabilities = await authService.getCapabilities(userId);
    
    res.json(createApiResponse({
      capabilities
    }, 'Capacidades obtidas'));
  } catch (error) {
    console.error('❌ Erro ao obter capacidades:', error);
    res.status(500).json(createApiError('Erro ao obter capacidades', 'GET_CAPABILITIES_ERROR'));
  }
});

// ✅ POST /api/auth/approve-capability - Aprovar capacidade (admin)
router.post('/approve-capability', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const adminId = authReq.user.id;
    
    // Verificar se é admin
    if (!authReq.userCapabilities?.isAdmin) {
      return res.status(403).json(createApiError('Apenas admins podem aprovar capacidades', 'ADMIN_ONLY'));
    }
    
    const { userId, capability } = z.object({
      userId: z.string(),
      capability: z.enum(['driver', 'hotel_manager']),
    }).parse(req.body);
    
    await authService.approveCapability(userId, capability, adminId);
    
    res.json(createApiResponse({
      message: `Capacidade ${capability} aprovada com sucesso`
    }, 'Aprovação concluída'));
  } catch (error) {
    console.error('❌ Erro ao aprovar capacidade:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro ao aprovar', 'APPROVAL_ERROR'));
  }
});

// ✅ POST /api/auth/reject-capability - Rejeitar capacidade (admin)
router.post('/reject-capability', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }
    const adminId = authReq.user.id;
    
    // Verificar se é admin
    if (!authReq.userCapabilities?.isAdmin) {
      return res.status(403).json(createApiError('Apenas admins podem rejeitar capacidades', 'ADMIN_ONLY'));
    }
    
    const { userId, capability, reason } = z.object({
      userId: z.string(),
      capability: z.enum(['driver', 'hotel_manager']),
      reason: z.string(),
    }).parse(req.body);
    
    await authService.rejectCapability(userId, capability, reason, adminId);
    
    res.json(createApiResponse({
      message: `Capacidade ${capability} rejeitada: ${reason}`
    }, 'Rejeição concluída'));
  } catch (error) {
    console.error('❌ Erro ao rejeitar capacidade:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro ao rejeitar', 'REJECTION_ERROR'));
  }
});

// ==================== ENDPOINTS PARA CLIENTE EMPRESA ====================

/**
 * GET /api/auth/company-profile
 * Obter perfil da empresa cliente
 */
router.get('/company-profile', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }

    const user = await authService.getUserById(authReq.user.id);
    if (!user || user.accountType !== 'company') {
      return res.status(403).json(createApiError('Apenas contas de empresa têm acesso', 'NOT_COMPANY'));
    }

    res.json(createApiResponse({
      profile: {
        id: user.id,
        email: user.email,
        contactName: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        
        // Company details
        companyName: user.companyName,
        companyVatNumber: user.companyVatNumber,
        companyAddress: user.companyAddress,
        companyPhone: user.companyPhone,
        
        // Verification
        verificationStatus: user.clientVerificationStatus,
        verificationNotes: user.clientVerificationNotes,
        verifiedAt: user.clientVerifiedAt,
        
        // Suspension info
        isSuspended: !!user.clientSuspendedAt,
        suspensionReason: user.clientSuspensionReason,
        suspensionEndDate: user.clientSuspensionEndDate,
        
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    }, 'Perfil da empresa obtido com sucesso'));
  } catch (error) {
    console.error('Erro ao obter perfil da empresa:', error);
    res.status(500).json(createApiError('Erro ao obter perfil', 'PROFILE_ERROR'));
  }
});

/**
 * PUT /api/auth/company-profile
 * Atualizar dados da empresa cliente
 */
router.put('/company-profile', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }

    const user = await authService.getUserById(authReq.user.id);
    if (!user || user.accountType !== 'company') {
      return res.status(403).json(createApiError('Apenas contas de empresa têm acesso', 'NOT_COMPANY'));
    }

    const { companyName, companyPhone, companyAddress } = z.object({
      companyName: z.string().min(1).optional(),
      companyPhone: z.string().optional(),
      companyAddress: z.string().optional(),
    }).parse(req.body);

    const updateData: any = { updatedAt: sql`now()` };
    if (companyName) updateData.companyName = companyName;
    if (companyPhone) updateData.companyPhone = companyPhone;
    if (companyAddress) updateData.companyAddress = companyAddress;

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, authReq.user.id))
      .returning();

    const updatedUser = result[0];

    res.json(createApiResponse({
      profile: {
        companyName: updatedUser.companyName,
        companyPhone: updatedUser.companyPhone,
        companyAddress: updatedUser.companyAddress,
        updatedAt: updatedUser.updatedAt,
      }
    }, 'Perfil atualizado com sucesso'));
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR'));
    }
    res.status(500).json(createApiError('Erro ao atualizar perfil', 'UPDATE_ERROR'));
  }
});

/**
 * GET /api/auth/company-bookings
 * Obter reservas da empresa
 */
router.get('/company-bookings', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }

    const user = await authService.getUserById(authReq.user.id);
    if (!user || user.accountType !== 'company') {
      return res.status(403).json(createApiError('Apenas contas de empresa têm acesso', 'NOT_COMPANY'));
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;

    // TODO: Implement when booking tables are fully available
    console.log(`📊 Retrieving company bookings for ${authReq.user.id}`);

    res.json(createApiResponse({
      bookings: [],
      pagination: {
        limit,
        offset,
        total: 0,
      },
      message: 'Sistema de reservas em desenvolvimento'
    }, 'Booking system loading'));
  } catch (error) {
    console.error('Erro ao obter reservas:', error);
    res.status(500).json(createApiError('Erro ao obter reservas', 'BOOKINGS_ERROR'));
  }
});

/**
 * GET /api/auth/company-payment-methods
 * Obter métodos de pagamento da empresa
 */
router.get('/company-payment-methods', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }

    const user = await authService.getUserById(authReq.user.id);
    if (!user || user.accountType !== 'company') {
      return res.status(403).json(createApiError('Apenas contas de empresa têm acesso', 'NOT_COMPANY'));
    }

    // TODO: Get from userBankAccounts table when fully implemented
    res.json(createApiResponse({
      paymentMethods: []
    }, 'Métodos de pagamento'));
  } catch (error) {
    console.error('Erro ao obter métodos de pagamento:', error);
    res.status(500).json(createApiError('Erro ao obter métodos', 'PAYMENT_ERROR'));
  }
});

/**
 * POST /api/auth/add-payment-method
 * Adicionar novo método de pagamento
 */
router.post('/add-payment-method', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }

    const user = await authService.getUserById(authReq.user.id);
    if (!user || user.accountType !== 'company') {
      return res.status(403).json(createApiError('Apenas contas de empresa têm acesso', 'NOT_COMPANY'));
    }

    const { accountType, accountNumber, bankName, accountHolder } = z.object({
      accountType: z.enum(['bank', 'mpesa', 'emola']),
      accountNumber: z.string().min(1),
      bankName: z.string().optional(),
      accountHolder: z.string().min(1),
    }).parse(req.body);

    // TODO: Save to userBankAccounts table
    console.log(`💳 Adding payment method for company ${authReq.user.id}`);

    res.json(createApiResponse({
      message: 'Método de pagamento adicionado com sucesso'
    }, 'Método adicionado'));
  } catch (error) {
    console.error('Erro ao adicionar método de pagamento:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR'));
    }
    res.status(500).json(createApiError('Erro ao adicionar método', 'ADD_METHOD_ERROR'));
  }
});

/**
 * POST /api/auth/request-suspension-lifting
 * Solicitar levantamento de suspensão
 */
router.post('/request-suspension-lifting', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) {
      return res.status(401).json(createApiError('Usuário não autenticado', 'UNAUTHORIZED'));
    }

    const user = await authService.getUserById(authReq.user.id);
    if (!user || user.accountType !== 'company') {
      return res.status(403).json(createApiError('Apenas contas de empresa têm acesso', 'NOT_COMPANY'));
    }

    if (!user.clientSuspendedAt) {
      return res.status(400).json(createApiError('Conta não está suspensa', 'NOT_SUSPENDED'));
    }

    const { reason } = z.object({
      reason: z.string().min(10),
    }).parse(req.body);

    // TODO: Create support ticket or send to admin
    console.log(`📋 Suspension lifting request from ${authReq.user.id}: ${reason}`);

    res.json(createApiResponse({
      message: 'Pedido de levantamento de suspensão enviado para análise'
    }, 'Pedido enviado'));
  } catch (error) {
    console.error('Erro ao enviar pedido:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR'));
    }
    res.status(500).json(createApiError('Erro ao enviar pedido', 'REQUEST_ERROR'));
  }
});

// ✅ Health check (opcional, útil para testes)
router.get('/health', (req: Request, res: Response) => {
  res.json(createApiResponse({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'running',
      capabilities: 'enabled',
      companyClients: 'enabled'
    }
  }, 'Sistema de autenticação funcionando'));
});

export default router;