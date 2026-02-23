import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../src/modules/auth/services/authService.js';

// ✅ IMPORTAR DO ARQUIVO SUPERIOR
import { 
  verifyFirebaseToken, 
  createApiResponse, 
  createApiError,
  AuthenticatedRequest 
} from '../src/shared/firebaseAuth.js';

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
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    accountType: user.accountType,
    
    // Capacidades
    canBookServices: user.canBookServices,
    canDrive: user.canDrive,
    canManageHotels: user.canManageHotels,
    isAdmin: user.isAdmin,
    
    // Status de verificação
    driverVerificationStatus: user.driverVerificationStatus,
    hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
    
    // Dados específicos
    driverLicenseNumber: user.driverLicenseNumber,
    driverVehicleType: user.driverVehicleType,
    businessTaxId: user.businessTaxId,
    companyName: user.companyName,
    companyVatNumber: user.companyVatNumber,
    companyAddress: user.companyAddress,
    companyPhone: user.companyPhone,
    
    // Metadados
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    capabilitiesUpdatedAt: user.capabilitiesUpdatedAt,
    lastCapacityActivation: user.lastCapacityActivation,
    
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

// ✅ Signup para Motorista
router.post('/signup-driver', async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      accountType,
      driverLicenseNumber,
      driverLicenseCountry,
      driverLicenseExpiry,
      driverVehicleType,
      driverYearsExperience
    } = driverSignupSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(createApiError('Usuário já existe com este email', 'USER_EXISTS'));
    }

    // Criar usuário como motorista
    const user = await authService.createDriver({
      email,
      firstName,
      lastName,
      phone,
      accountType,
      driverLicenseNumber,
      driverLicenseCountry,
      driverLicenseExpiry,
      driverVehicleType,
      driverYearsExperience
    });

    res.json(createApiResponse({
      user: formatUserResponse(user),
      message: 'Conta de motorista criada com sucesso. Aguardando verificação.',
      requiresVerification: true
    }, 'Motorista registrado com sucesso'));
  } catch (error) {
    console.error('Erro no signup de motorista:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Signup para Gestor de Hotel
router.post('/signup-hotel-manager', async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      accountType,
      businessTaxId,
      businessRegistrationNumber,
      businessLegalName
    } = hotelManagerSignupSchema.parse(req.body);

    // Verificar se usuário já existe
    const existingUser = await authService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(createApiError('Usuário já existe com este email', 'USER_EXISTS'));
    }

    // Criar usuário como gestor de hotel
    const user = await authService.createHotelManager({
      email,
      firstName,
      lastName,
      phone,
      accountType,
      businessTaxId,
      businessRegistrationNumber,
      businessLegalName
    });

    res.json(createApiResponse({
      user: formatUserResponse(user),
      message: 'Conta de gestor de alojamento criada com sucesso. Aguardando verificação.',
      requiresVerification: true
    }, 'Gestor de alojamento registrado com sucesso'));
  } catch (error) {
    console.error('Erro no signup de gestor:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Get user profile - Atualizado para capacidades
router.get('/profile', verifyFirebaseToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.uid;
    
    const user = await authService.getUserWithCapabilities(userId);
    if (!user) {
      return res.status(404).json(createApiError('Usuário não encontrado', 'USER_NOT_FOUND'));
    }

    res.json(createApiResponse({
      user: formatUserResponse(user)
    }));
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Forgot Password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const result = await authService.initiatePasswordReset({ email });

    res.json(createApiResponse({
      success: result.success,
      message: result.message
    }, 'Email enviado'));
  } catch (error) {
    console.error('Erro no forgot password:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Email inválido', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Ativar capacidade adicional (para usuários existentes)
router.post('/activate-capacity', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.uid;
    const { capacity, documents, notes } = activateCapacitySchema.parse(req.body);

    const result = await authService.activateCapacity({
      userId,
      capacity,
      documents,
      notes
    });

    res.json(createApiResponse({
      user: formatUserResponse(result.user),
      documents: result.documents,
      message: `Capacidade de ${capacity === 'drive' ? 'motorista' : 'gestor de alojamento'} ativada com sucesso`,
      requiresVerification: true
    }, 'Capacidade ativada'));
  } catch (error) {
    console.error('Erro ao ativar capacidade:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json(createApiError('Dados inválidos', 'VALIDATION_ERROR', error.errors));
    }
    res.status(500).json(createApiError('Erro interno do servidor', 'INTERNAL_ERROR'));
  }
});

// ✅ Upload de documento para capacidade
router.post('/upload-document', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.uid;
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
    const userId = authReq.user.uid;
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

// ✅ Obter capacidades do usuário
router.get('/capabilities', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.uid;

    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json(createApiError('Usuário não encontrado', 'USER_NOT_FOUND'));
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

// ✅ Health check (opcional, útil para testes)
router.get('/health', (req: Request, res: Response) => {
  res.json(createApiResponse({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'running',
      capabilities: 'enabled'
    }
  }, 'Sistema de autenticação funcionando'));
});

export default router;